'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/language-context';
import { PROGRAM_TEMPLATES, ProgramTemplate, ProgramType, ProgramBlock } from '@/lib/types';
import { HymnPickerModal } from './hymn-picker-modal';
import { getAvailableThemes, SpecialThemeType } from '@/lib/special-themes';
import { getAvailableSeriesThemes } from '@/lib/sermon-series';
import { Music, User, Save, X, ChevronDown, ChevronUp, Globe, Sparkles, Star, BookOpen, Upload, ImageIcon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

type LanguageMode = 'BILINGUAL' | 'EN' | 'ES';

// Get available themes for the dropdown
const SPECIAL_THEMES_LIST = getAvailableThemes();
const SERIES_THEMES_LIST = getAvailableSeriesThemes();

interface SermonSeries {
  id: string;
  title: string;
  titleEs: string | null;
  theme: string;
  totalWeeks: number;
  startDate: string;
}

interface HymnPair {
  id: number;
  numberEs: number;
  titleEs: string;
  numberEn: number | null;
  titleEn: string | null;
}

interface ProgramItem {
  sectionKey: string;
  block: ProgramBlock;
  order: number;
  textEn?: string | null;
  textEs?: string | null;
  hymnPairId?: number | null;
  hymnPair?: HymnPair | null;
  personName?: string | null;
}

interface ProgramEditorProps {
  programId?: string;
  initialData?: {
    date: string;
    type: ProgramType;
    languageMode?: LanguageMode;
    items: ProgramItem[];
    coverImageUrl?: string | null;
    coverVerseEn?: string | null;
    coverVerseEs?: string | null;
    announcements?: string | null;
  };
}

export function ProgramEditor({ programId, initialData }: ProgramEditorProps) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [date, setDate] = useState(initialData?.date ?? '');
  const [type, setType] = useState<ProgramType>(initialData?.type ?? 'SABBATH');
  const [languageMode, setLanguageMode] = useState<LanguageMode>(initialData?.languageMode ?? 'BILINGUAL');
  const [items, setItems] = useState<Record<string, ProgramItem>>({});
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [hymnPickerOpen, setHymnPickerOpen] = useState(false);
  const [activeHymnKey, setActiveHymnKey] = useState<string | null>(null);
  const [ssExpanded, setSsExpanded] = useState(true);
  const [dwExpanded, setDwExpanded] = useState(true);
  const [initialized, setInitialized] = useState(false);
  // Phase 3.8: Special Theme support
  const [isSpecialEvent, setIsSpecialEvent] = useState(false);
  const [specialTheme, setSpecialTheme] = useState<SpecialThemeType | ''>('');
  // Phase 4: Sermon Series support
  const [availableSeries, setAvailableSeries] = useState<SermonSeries[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
  const [seriesWeek, setSeriesWeek] = useState<number>(1);
  const [showNewSeriesForm, setShowNewSeriesForm] = useState(false);
  const [newSeriesTitle, setNewSeriesTitle] = useState('');
  const [newSeriesTitleEs, setNewSeriesTitleEs] = useState('');
  const [newSeriesTheme, setNewSeriesTheme] = useState('');
  const [newSeriesTotalWeeks, setNewSeriesTotalWeeks] = useState(4);
  // Cover customization
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.coverImageUrl ?? '');
  const [coverVerseEn, setCoverVerseEn] = useState(initialData?.coverVerseEn ?? '');
  const [coverVerseEs, setCoverVerseEs] = useState(initialData?.coverVerseEs ?? '');
  const [announcements, setAnnouncements] = useState(initialData?.announcements ?? '');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(language === 'es' ? 'Por favor selecciona una imagen' : 'Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === 'es' ? 'La imagen debe ser menor a 5MB' : 'Image must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      // Get presigned URL
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          isPublic: true,
        }),
      });

      if (!presignedRes.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, cloud_storage_path } = await presignedRes.json();

      // Check if content-disposition is in signed headers
      const urlObj = new URL(uploadUrl);
      const signedHeaders = urlObj.searchParams.get('X-Amz-SignedHeaders') || '';
      const includesContentDisposition = signedHeaders.includes('content-disposition');

      // Upload to S3
      const headers: Record<string, string> = {
        'Content-Type': file.type,
      };
      if (includesContentDisposition) {
        headers['Content-Disposition'] = 'attachment';
      }

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers,
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to upload image');
      }

      // Get the public URL
      const fileUrlRes = await fetch(`/api/upload/presigned?cloud_storage_path=${encodeURIComponent(cloud_storage_path)}&isPublic=true`);
      if (!fileUrlRes.ok) {
        throw new Error('Failed to get file URL');
      }

      const { fileUrl } = await fileUrlRes.json();
      setCoverImageUrl(fileUrl);
      toast.success(language === 'es' ? '¡Imagen subida!' : 'Image uploaded!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(language === 'es' ? 'Error al subir la imagen' : 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const template = PROGRAM_TEMPLATES[type] ?? [];
  const selectedSeries = availableSeries.find(s => s.id === selectedSeriesId);

  // Fetch available series
  useEffect(() => {
    async function fetchSeries() {
      try {
        const res = await fetch('/api/series');
        if (res.ok) {
          const data = await res.json();
          setAvailableSeries(data);
        }
      } catch (error) {
        console.error('Error fetching series:', error);
      }
    }
    fetchSeries();
  }, []);

  const initializeItemsFromTemplate = useCallback((programType: ProgramType) => {
    const templateForType = PROGRAM_TEMPLATES[programType] ?? [];
    const itemsMap: Record<string, ProgramItem> = {};
    templateForType.forEach((t, index) => {
      itemsMap[t?.key ?? ''] = {
        sectionKey: t?.key ?? '',
        block: (t?.block ?? 'MAIN') as ProgramBlock,
        order: index,
        textEn: null,
        textEs: null,
        hymnPairId: null,
        hymnPair: null,
        personName: null,
      };
    });
    return itemsMap;
  }, []);

  useEffect(() => {
    if (initialized) return;
    
    if (initialData?.items && initialData.items.length > 0) {
      const itemsMap: Record<string, ProgramItem> = {};
      for (const item of initialData.items ?? []) {
        itemsMap[item?.sectionKey ?? ''] = item;
      }
      setItems(itemsMap);
    } else {
      setItems(initializeItemsFromTemplate(type));
    }
    setInitialized(true);
  }, [initialData, type, initialized, initializeItemsFromTemplate]);

  const handleTypeChange = (newType: ProgramType) => {
    setType(newType);
    setItems(initializeItemsFromTemplate(newType));
  };

  const updateItem = (key: string, field: string, value: any) => {
    setItems(prev => ({
      ...(prev ?? {}),
      [key]: {
        ...(prev?.[key] ?? { sectionKey: key, block: 'MAIN' as ProgramBlock, order: 0 }),
        [field]: value,
      },
    }));
  };

  const handleHymnSelect = (hymn: HymnPair) => {
    if (activeHymnKey) {
      setItems(prev => ({
        ...(prev ?? {}),
        [activeHymnKey]: {
          ...(prev?.[activeHymnKey] ?? { sectionKey: activeHymnKey, block: 'MAIN' as ProgramBlock, order: 0 }),
          hymnPairId: hymn?.id ?? null,
          hymnPair: hymn,
        },
      }));
    }
    setActiveHymnKey(null);
  };

  // Handle manual hymn number input for Spanish
  const handleHymnNumberEs = (sectionKey: string, hymnNumber: string) => {
    setItems(prev => ({
      ...(prev ?? {}),
      [sectionKey]: {
        ...(prev?.[sectionKey] ?? { sectionKey, block: 'MAIN' as ProgramBlock, order: 0 }),
        textEs: hymnNumber?.trim() ? `Himno #${hymnNumber.trim()}` : null,
      },
    }));
  };

  // Handle manual hymn number input for English
  const handleHymnNumberEn = (sectionKey: string, hymnNumber: string) => {
    setItems(prev => ({
      ...(prev ?? {}),
      [sectionKey]: {
        ...(prev?.[sectionKey] ?? { sectionKey, block: 'MAIN' as ProgramBlock, order: 0 }),
        textEn: hymnNumber?.trim() ? `Hymn #${hymnNumber.trim()}` : null,
      },
    }));
  };

  // Extract hymn number from text (e.g., "Himno #22" -> "22")
  const extractHymnNumber = (text: string | null | undefined): string => {
    if (!text) return '';
    const match = text.match(/#(\d+)/);
    return match ? match[1] : '';
  };

  // Handle manual hymn number input (legacy - for searching hymns by number)
  const handleHymnNumberChange = async (sectionKey: string, hymnNumber: string) => {
    if (!hymnNumber || hymnNumber.trim() === '') {
      // Clear the hymn
      setItems(prev => ({
        ...(prev ?? {}),
        [sectionKey]: {
          ...(prev?.[sectionKey] ?? { sectionKey, block: 'MAIN' as ProgramBlock, order: 0 }),
          hymnPairId: null,
          hymnPair: null,
        },
      }));
      return;
    }

    const num = parseInt(hymnNumber, 10);
    if (isNaN(num)) return;

    try {
      // Search for hymn by number (Spanish or English)
      const res = await fetch(`/api/hymns?search=${num}`);
      if (res.ok) {
        const hymns = await res.json();
        // Find exact match by number
        const exactMatch = hymns.find((h: HymnPair) => 
          h.numberEs === num || h.numberEn === num
        );
        
        if (exactMatch) {
          setItems(prev => ({
            ...(prev ?? {}),
            [sectionKey]: {
              ...(prev?.[sectionKey] ?? { sectionKey, block: 'MAIN' as ProgramBlock, order: 0 }),
              hymnPairId: exactMatch.id,
              hymnPair: exactMatch,
            },
          }));
        } else {
          toast?.error?.(language === 'es' ? `Himno #${num} no encontrado` : `Hymn #${num} not found`);
        }
      }
    } catch (error) {
      console.error('Error searching hymn:', error);
    }
  };

  const handleSmartGenerate = async () => {
    if (!date) {
      toast?.error?.(t?.selectDateFirst ?? 'Please select a date first');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/programs/smart-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          date, 
          type, 
          languageMode,
          // Phase 3.8: Special Theme parameters
          isSpecialEvent,
          specialTheme: isSpecialEvent && specialTheme ? specialTheme : null,
          // Phase 4: Sermon Series parameters
          seriesId: selectedSeriesId || null,
          seriesTheme: selectedSeries?.theme || null,
          seriesWeek: selectedSeriesId ? seriesWeek : null,
          seriesTotal: selectedSeries?.totalWeeks || null,
        }),
      });

      if (res?.ok) {
        const data = await res.json();
        
        // Convert generated items to our items format
        const itemsMap: Record<string, ProgramItem> = {};
        for (const item of data?.items ?? []) {
          itemsMap[item?.sectionKey ?? ''] = {
            sectionKey: item?.sectionKey ?? '',
            block: item?.block ?? 'MAIN',
            order: item?.order ?? 0,
            textEn: item?.textEn ?? null,
            textEs: item?.textEs ?? null,
            hymnPairId: item?.hymnPairId ?? null,
            hymnPair: item?.hymnPair ?? null,
            personName: item?.personName ?? null,
          };
        }
        setItems(itemsMap);
        
        // Show success with stats
        const stats = data?.stats ?? {};
        const seasonInfo = data?.season ? ` (${data.season.name})` : '';
        const themeInfo = stats?.specialThemeWeighting?.themeName 
          ? ` • ${language === 'es' ? stats.specialThemeWeighting.themeNameEs : stats.specialThemeWeighting.themeName}`
          : '';
        const seriesInfo = stats?.seriesWeighting?.hasSeries 
          ? ` • Week ${stats.seriesWeighting.seriesWeek}/${stats.seriesWeighting.seriesTotal}`
          : '';
        toast?.success?.(`${t?.smartGenerateSuccess ?? 'Generated!'} ${stats.hymnsSuggested ?? 0} ${t?.hymnsSelected ?? 'hymns selected'}${seasonInfo}${themeInfo}${seriesInfo}`);
      } else {
        const errorData = await res?.json?.();
        toast?.error?.(errorData?.error ?? t?.error ?? 'Error');
      }
    } catch (error) {
      console.error('Error in smart generate:', error);
      toast?.error?.(t?.error ?? 'Error');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    console.log('[SAVE] handleSave called', { date, type, itemsCount: Object.keys(items).length });
    
    if (!date || !type) {
      console.log('[SAVE] Validation failed - missing date or type');
      toast?.error?.('Please select a date and type');
      return;
    }

    setSaving(true);
    console.log('[SAVE] Starting save...');
    console.log('[SAVE] Current items state:', items);
    try {
      const itemsArray = Object.values(items ?? {}).map((item, index) => ({
        sectionKey: item?.sectionKey ?? '',
        block: item?.block ?? 'MAIN',
        order: item?.order ?? index,
        textEn: item?.textEn ?? null,
        textEs: item?.textEs ?? null,
        hymnPairId: item?.hymnPairId ?? null,
        personName: item?.personName ?? null,
      }));
      console.log('[SAVE] Items array to send:', itemsArray);

      const url = programId ? `/api/programs/${programId}` : '/api/programs';
      const method = programId ? 'PUT' : 'POST';

      console.log('[SAVE] Fetching:', url, method);
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          date, 
          type, 
          languageMode, 
          items: itemsArray,
          // Phase 3.8: Special Theme parameters
          isSpecialEvent,
          specialTheme: isSpecialEvent && specialTheme ? specialTheme : null,
          // Phase 4: Sermon Series parameters
          seriesId: selectedSeriesId || null,
          seriesTitle: selectedSeries?.title || null,
          seriesWeek: selectedSeriesId ? seriesWeek : null,
          seriesTotal: selectedSeries?.totalWeeks || null,
          // Cover customization
          coverImageUrl: coverImageUrl || null,
          coverVerseEn: coverVerseEn || null,
          coverVerseEs: coverVerseEs || null,
          announcements: announcements || null,
        }),
      });

      console.log('[SAVE] Response status:', res?.status);
      
      if (res?.ok) {
        console.log('[SAVE] Success! Redirecting...');
        toast?.success?.(t?.success ?? 'Success!');
        router?.push?.('/');
        router?.refresh?.();
      } else {
        const data = await res?.json?.();
        console.log('[SAVE] Error response:', data);
        toast?.error?.(data?.error ?? t?.error ?? 'Error');
      }
    } catch (error) {
      console.error('Error saving program:', error);
      toast?.error?.(t?.error ?? 'Error');
    } finally {
      setSaving(false);
    }
  };

  const renderSection = (templateItem: ProgramTemplate, item: ProgramItem) => {
    const label = language === 'es' ? templateItem?.labelEs : templateItem?.labelEn;
    const hymn = item?.hymnPair;

    return (
      <div key={templateItem?.key} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
        <div className="md:col-span-2">
          <span className="text-sm font-semibold text-violet-600">{label ?? ''}</span>
        </div>

        {templateItem?.hasHymn && (
          <div className="md:col-span-2">
            <div className="flex items-end gap-3 flex-wrap">
              {/* Spanish hymn number input */}
              <div className="flex-shrink-0">
                <label className="block text-xs text-gray-500 mb-1">
                  # Español
                </label>
                <input
                  key={`hymn-es-${templateItem?.key}-${item?.textEs ?? hymn?.numberEs ?? 'empty'}`}
                  type="number"
                  min="1"
                  placeholder="#"
                  defaultValue={extractHymnNumber(item?.textEs) || hymn?.numberEs || ''}
                  onBlur={(e) => handleHymnNumberEs(templateItem?.key ?? '', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleHymnNumberEs(templateItem?.key ?? '', (e.target as HTMLInputElement).value);
                    }
                  }}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-center"
                />
              </div>
              
              {/* English hymn number input */}
              <div className="flex-shrink-0">
                <label className="block text-xs text-gray-500 mb-1">
                  # English
                </label>
                <input
                  key={`hymn-en-${templateItem?.key}-${item?.textEn ?? hymn?.numberEn ?? 'empty'}`}
                  type="number"
                  min="1"
                  placeholder="#"
                  defaultValue={extractHymnNumber(item?.textEn) || hymn?.numberEn || ''}
                  onBlur={(e) => handleHymnNumberEn(templateItem?.key ?? '', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleHymnNumberEn(templateItem?.key ?? '', (e.target as HTMLInputElement).value);
                    }
                  }}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-center"
                />
              </div>
              
              {/* Hymn display / picker button */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-gray-500 mb-1">
                  {language === 'es' ? 'Buscar Himno' : 'Search Hymn'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setActiveHymnKey(templateItem?.key ?? null);
                    setHymnPickerOpen(true);
                  }}
                  className="w-full flex items-center gap-2 p-2 border border-dashed border-gray-300 rounded-lg hover:border-violet-400 hover:bg-violet-50 transition-colors text-left"
                >
                  <Music className="w-5 h-5 text-violet-600 flex-shrink-0" />
                  {hymn ? (
                    <span className="text-gray-900 text-sm truncate">
                      {hymn.numberEn && hymn.titleEn 
                        ? `#${hymn.numberEn} ${hymn.titleEn} / #${hymn.numberEs} ${hymn.titleEs}`
                        : `#${hymn.numberEs} ${hymn.titleEs}`
                      }
                    </span>
                  ) : (item?.textEs || item?.textEn) ? (
                    <span className="text-gray-700 text-sm">
                      {item?.textEs && item?.textEn 
                        ? `${item.textEs} / ${item.textEn}`
                        : item?.textEs || item?.textEn
                      }
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">{t?.hymnPicker ?? 'Click to search hymns'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {templateItem?.hasText && (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t?.english ?? 'English'}</label>
              <input
                type="text"
                value={item?.textEn ?? ''}
                onChange={(e) => updateItem(templateItem?.key ?? '', 'textEn', e?.target?.value ?? '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                placeholder={`${label ?? ''} (EN)`}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">{t?.spanish ?? 'Spanish'}</label>
              <input
                type="text"
                value={item?.textEs ?? ''}
                onChange={(e) => updateItem(templateItem?.key ?? '', 'textEs', e?.target?.value ?? '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                placeholder={`${label ?? ''} (ES)`}
              />
            </div>
          </>
        )}

        {templateItem?.hasPerson && (
          <div className={templateItem?.hasText ? 'md:col-span-2' : ''}>
            <label className="block text-xs text-gray-500 mb-1">
              <User className="w-3 h-3 inline mr-1" />
              {t?.personAssigned ?? 'Person Assigned'}
            </label>
            <input
              type="text"
              value={item?.personName ?? ''}
              onChange={(e) => updateItem(templateItem?.key ?? '', 'personName', e?.target?.value ?? '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
              placeholder="Name"
            />
          </div>
        )}
      </div>
    );
  };

  const ssItems = template.filter(t => t?.block === 'SABBATH_SCHOOL');
  const dwItems = template.filter(t => t?.block === 'DIVINE_WORSHIP');
  const mainItems = template.filter(t => !t?.block || t?.block === 'MAIN');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t?.selectDate ?? 'Select Date'}</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e?.target?.value ?? '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t?.selectType ?? 'Select Type'}</label>
          <select
            value={type}
            onChange={(e) => handleTypeChange(e?.target?.value as ProgramType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          >
            <option value="SABBATH">{t?.sabbath ?? 'Sabbath Worship'}</option>
            <option value="FRIDAY">{t?.friday ?? 'Friday Vespers'}</option>
            <option value="WEDNESDAY">{t?.wednesday ?? 'Wednesday Prayer Meeting'}</option>
            <option value="YOUTH">{t?.youth ?? 'Youth Program'}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Globe className="w-4 h-4 text-violet-600" />
            {t?.languageMode ?? 'Language Mode'}
          </label>
          <select
            value={languageMode}
            onChange={(e) => setLanguageMode(e?.target?.value as LanguageMode)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
          >
            <option value="BILINGUAL">{t?.bilingual ?? 'Bilingual (EN + ES)'}</option>
            <option value="EN">{t?.englishOnly ?? 'English Only'}</option>
            <option value="ES">{t?.spanishOnly ?? 'Spanish Only'}</option>
          </select>
          {languageMode === 'EN' && (
            <p className="text-xs text-amber-600 mt-1">{t?.enModeHymnWarning ?? 'Spanish-only hymns will be disabled'}</p>
          )}
        </div>
      </div>

      {/* Cover Customization (SABBATH programs only) */}
      {type === 'SABBATH' && (
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="w-5 h-5 text-indigo-600" />
            <span className="font-medium text-indigo-900">
              {language === 'es' ? 'Personalización de Portada (PDF)' : 'Cover Customization (PDF)'}
            </span>
          </div>
          
          <div className="space-y-4">
            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-indigo-800 mb-2">
                {language === 'es' ? 'Imagen de Portada' : 'Cover Image'}
              </label>
              
              <div className="flex items-center gap-3">
                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                  uploadingImage 
                    ? 'bg-indigo-100 text-indigo-400 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}>
                  {uploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{language === 'es' ? 'Subiendo...' : 'Uploading...'}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>{language === 'es' ? 'Subir Imagen' : 'Upload Image'}</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
                
                {coverImageUrl && (
                  <button
                    type="button"
                    onClick={() => setCoverImageUrl('')}
                    className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    {language === 'es' ? 'Quitar' : 'Remove'}
                  </button>
                )}
              </div>
              
              <p className="text-xs text-indigo-600 mt-2">
                {language === 'es' 
                  ? '💡 Sube una imagen inspiracional para la portada del boletín (máx 5MB)'
                  : '💡 Upload an inspirational image for the bulletin cover (max 5MB)'}
              </p>
            </div>
            
            {/* Image Preview */}
            {coverImageUrl && (
              <div className="p-3 bg-white rounded-lg border border-indigo-200">
                <p className="text-xs text-gray-500 mb-2">{language === 'es' ? 'Vista previa:' : 'Preview:'}</p>
                <img 
                  src={coverImageUrl} 
                  alt="Cover preview" 
                  className="max-h-40 rounded-lg object-cover mx-auto shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {/* Cover Verse Section */}
            <div className="pt-3 border-t border-indigo-200">
              <label className="block text-sm font-medium text-indigo-800 mb-2">
                {language === 'es' ? 'Versículo de Portada' : 'Cover Verse'}
              </label>
              <p className="text-xs text-indigo-600 mb-3">
                {language === 'es' 
                  ? '📖 Este versículo aparecerá debajo de la imagen de portada'
                  : '📖 This verse will appear below the cover image'}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-indigo-700 mb-1">
                    English
                  </label>
                  <textarea
                    value={coverVerseEn}
                    onChange={(e) => setCoverVerseEn(e.target.value)}
                    placeholder="e.g., Come to me, all who labor and are heavy laden, and I will give you rest. - Matthew 11:28"
                    rows={2}
                    className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-indigo-700 mb-1">
                    Español
                  </label>
                  <textarea
                    value={coverVerseEs}
                    onChange={(e) => setCoverVerseEs(e.target.value)}
                    placeholder="ej., Vengan a mí todos los que están cansados y agobiados, y yo les daré descanso. - Mateo 11:28"
                    rows={2}
                    className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Announcements Section */}
            <div className="pt-3 border-t border-indigo-200">
              <label className="block text-sm font-medium text-indigo-800 mb-2">
                {language === 'es' ? 'Anuncios de la Semana' : 'Weekly Announcements'}
              </label>
              <p className="text-xs text-indigo-600 mb-3">
                {language === 'es' 
                  ? '📢 Escribe los anuncios que aparecerán en el boletín'
                  : '📢 Write the announcements that will appear in the bulletin'}
              </p>
              <textarea
                value={announcements}
                onChange={(e) => setAnnouncements(e.target.value)}
                placeholder={language === 'es' 
                  ? "• Estudio bíblico el miércoles a las 7pm\n• Almuerzo de confraternidad el próximo sábado\n• Reunión de junta el domingo"
                  : "• Bible study Wednesday at 7pm\n• Fellowship lunch next Sabbath\n• Board meeting on Sunday"}
                rows={5}
                className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Phase 3.8: Special Event / Thematic Program Selection */}
      <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
        <div className="flex items-start gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isSpecialEvent}
              onChange={(e) => {
                setIsSpecialEvent(e.target.checked);
                if (!e.target.checked) {
                  setSpecialTheme('');
                }
              }}
              className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
            />
            <span className="flex items-center gap-1.5 font-medium text-amber-900">
              <Star className="w-4 h-4 text-amber-600" />
              {language === 'es' ? 'Evento Especial' : 'Special Event'}
            </span>
          </label>
          
          {isSpecialEvent && (
            <div className="flex-1">
              <select
                value={specialTheme}
                onChange={(e) => setSpecialTheme(e.target.value as SpecialThemeType | '')}
                className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
              >
                <option value="">{language === 'es' ? '— Seleccionar Tema —' : '— Select Theme —'}</option>
                {SPECIAL_THEMES_LIST.map((theme) => (
                  <option key={theme.key} value={theme.key}>
                    {language === 'es' ? theme.nameEs : theme.nameEn}
                  </option>
                ))}
              </select>
              {specialTheme && (
                <p className="text-xs text-amber-700 mt-1.5">
                  {language === 'es' 
                    ? '✨ La selección de himnos priorizará categorías temáticas (+20 puntos)'
                    : '✨ Hymn selection will prioritize thematic categories (+20 boost)'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Phase 4: Sermon Series Selection */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-900">
            {language === 'es' ? 'Serie de Sermones' : 'Sermon Series'}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <select
              value={selectedSeriesId}
              onChange={(e) => {
                setSelectedSeriesId(e.target.value);
                setSeriesWeek(1);
              }}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">{language === 'es' ? '— Sin Serie —' : '— No Series —'}</option>
              {availableSeries.map((series) => (
                <option key={series.id} value={series.id}>
                  {language === 'es' && series.titleEs ? series.titleEs : series.title} ({series.totalWeeks} {language === 'es' ? 'semanas' : 'weeks'})
                </option>
              ))}
            </select>
          </div>
          
          {selectedSeriesId && selectedSeries && (
            <div>
              <select
                value={seriesWeek}
                onChange={(e) => setSeriesWeek(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {Array.from({ length: selectedSeries.totalWeeks }, (_, i) => i + 1).map((week) => (
                  <option key={week} value={week}>
                    {language === 'es' ? `Semana ${week}` : `Week ${week}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        {selectedSeriesId && selectedSeries && (
          <p className="text-xs text-blue-700 mt-2">
            {language === 'es' 
              ? `📚 Tema: ${selectedSeries.theme} • Los himnos seguirán la progresión temática de la serie`
              : `📚 Theme: ${selectedSeries.theme} • Hymns will follow series thematic progression`}
          </p>
        )}
        
        <button
          type="button"
          onClick={() => setShowNewSeriesForm(!showNewSeriesForm)}
          className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
        >
          {showNewSeriesForm 
            ? (language === 'es' ? 'Cancelar' : 'Cancel')
            : (language === 'es' ? '+ Crear Nueva Serie' : '+ Create New Series')}
        </button>
        
        {showNewSeriesForm && (
          <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={newSeriesTitle}
                onChange={(e) => setNewSeriesTitle(e.target.value)}
                placeholder={language === 'es' ? 'Título (EN)' : 'Title (EN)'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="text"
                value={newSeriesTitleEs}
                onChange={(e) => setNewSeriesTitleEs(e.target.value)}
                placeholder={language === 'es' ? 'Título (ES)' : 'Title (ES)'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={newSeriesTheme}
                onChange={(e) => setNewSeriesTheme(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">{language === 'es' ? '— Tema —' : '— Theme —'}</option>
                {SERIES_THEMES_LIST.map((theme) => (
                  <option key={theme.key} value={theme.key}>
                    {language === 'es' ? theme.labelEs : theme.label}
                  </option>
                ))}
              </select>
              <select
                value={newSeriesTotalWeeks}
                onChange={(e) => setNewSeriesTotalWeeks(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {[2, 3, 4, 5, 6, 8, 10, 12].map((weeks) => (
                  <option key={weeks} value={weeks}>
                    {weeks} {language === 'es' ? 'semanas' : 'weeks'}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (!newSeriesTitle || !newSeriesTheme) {
                  toast.error(language === 'es' ? 'Título y tema requeridos' : 'Title and theme required');
                  return;
                }
                try {
                  const res = await fetch('/api/series', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      title: newSeriesTitle,
                      titleEs: newSeriesTitleEs || null,
                      theme: newSeriesTheme,
                      totalWeeks: newSeriesTotalWeeks,
                      startDate: date || new Date().toISOString().split('T')[0],
                    }),
                  });
                  if (res.ok) {
                    const newSeries = await res.json();
                    setAvailableSeries([newSeries, ...availableSeries]);
                    setSelectedSeriesId(newSeries.id);
                    setSeriesWeek(1);
                    setShowNewSeriesForm(false);
                    setNewSeriesTitle('');
                    setNewSeriesTitleEs('');
                    setNewSeriesTheme('');
                    setNewSeriesTotalWeeks(4);
                    toast.success(language === 'es' ? 'Serie creada' : 'Series created');
                  }
                } catch (error) {
                  toast.error(language === 'es' ? 'Error al crear serie' : 'Error creating series');
                }
              }}
              className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              {language === 'es' ? 'Crear Serie' : 'Create Series'}
            </button>
          </div>
        )}
      </div>

      {/* Smart Generate Button - Only show for new programs */}
      {!programId && (
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl border border-violet-200">
          <div className="flex-1">
            <h4 className="font-medium text-violet-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              {t?.smartGenerate ?? 'Smart Generate'}
            </h4>
            <p className="text-sm text-violet-700 mt-1">
              {t?.smartGenerateDesc ?? 'Auto-select hymns based on season, avoiding recently used ones'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSmartGenerate}
            disabled={generating || !date}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            {generating ? (t?.generating ?? 'Generating...') : (t?.smartGenerate ?? 'Smart Generate')}
          </button>
        </div>
      )}

      {type === 'SABBATH' ? (
        <>
          {/* Sabbath School Block */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setSsExpanded(!ssExpanded)}
              className="w-full flex items-center justify-between p-4 bg-violet-100 hover:bg-violet-200 transition-colors"
            >
              <span className="font-semibold text-violet-800">{t?.sabbathSchool ?? 'Sabbath School'}</span>
              {ssExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {ssExpanded && (
              <div className="p-4 space-y-4 bg-gray-50">
                {ssItems?.map?.((templateItem) => renderSection(templateItem, items?.[templateItem?.key ?? ''] ?? { sectionKey: templateItem?.key ?? '', block: 'SABBATH_SCHOOL' as ProgramBlock, order: 0 })) ?? null}
              </div>
            )}
          </div>

          {/* Divine Worship Block */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setDwExpanded(!dwExpanded)}
              className="w-full flex items-center justify-between p-4 bg-amber-100 hover:bg-amber-200 transition-colors"
            >
              <span className="font-semibold text-amber-800">{t?.divineWorship ?? 'Divine Worship'}</span>
              {dwExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {dwExpanded && (
              <div className="p-4 space-y-4 bg-gray-50">
                {dwItems?.map?.((templateItem) => renderSection(templateItem, items?.[templateItem?.key ?? ''] ?? { sectionKey: templateItem?.key ?? '', block: 'DIVINE_WORSHIP' as ProgramBlock, order: 0 })) ?? null}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {mainItems?.map?.((templateItem) => renderSection(templateItem, items?.[templateItem?.key ?? ''] ?? { sectionKey: templateItem?.key ?? '', block: 'MAIN' as ProgramBlock, order: 0 })) ?? null}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router?.push?.('/')}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4" />
          {t?.cancel ?? 'Cancel'}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? (t?.loading ?? 'Loading...') : (t?.save ?? 'Save')}
        </button>
      </div>

      <HymnPickerModal
        isOpen={hymnPickerOpen}
        onClose={() => {
          setHymnPickerOpen(false);
          setActiveHymnKey(null);
        }}
        onSelect={handleHymnSelect}
        languageMode={languageMode}
      />
    </div>
  );
}
