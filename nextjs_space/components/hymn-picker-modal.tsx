'use client';

import { useState, useEffect } from 'react';
import { X, Search, Music, Globe, Ban } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';

type LanguageMode = 'BILINGUAL' | 'EN' | 'ES';

interface HymnPair {
  id: number;
  numberEs: number;
  titleEs: string;
  numberEn: number | null;
  titleEn: string | null;
}

interface HymnPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (hymn: HymnPair) => void;
  languageMode?: LanguageMode;
}

export function HymnPickerModal({ isOpen, onClose, onSelect, languageMode = 'BILINGUAL' }: HymnPickerModalProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [bilingualOnly, setBilingualOnly] = useState(false);
  const [hymns, setHymns] = useState<HymnPair[]>([]);
  const [loading, setLoading] = useState(false);

  // Check if hymn has English mapping
  const hasEnglish = (hymn: HymnPair) => hymn?.numberEn !== null && hymn?.titleEn !== null;
  // Hymn is disabled in EN mode if it lacks English
  const isHymnDisabled = (hymn: HymnPair) => languageMode === 'EN' && !hasEnglish(hymn);

  useEffect(() => {
    if (isOpen) {
      fetchHymns();
    }
  }, [isOpen, search, bilingualOnly]);

  const fetchHymns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (bilingualOnly) params.set('bilingualOnly', 'true');
      const queryString = params.toString();
      const res = await fetch(`/api/hymns${queryString ? `?${queryString}` : ''}`);
      if (res?.ok) {
        const data = await res.json();
        setHymns(data ?? []);
      }
    } catch (error) {
      console.error('Error fetching hymns:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Music className="w-5 h-5 text-violet-600" />
            {t?.hymnPicker ?? 'Select Hymn'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e?.target?.value ?? '')}
              placeholder={`${t?.search ?? 'Search'} (# ES, # EN, título)...`}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={bilingualOnly}
              onChange={(e) => setBilingualOnly(e.target.checked)}
              className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
            />
            <Globe className="w-4 h-4 text-violet-600" />
            <span className="text-gray-700">{t?.bilingualOnly ?? 'Bilingual only (EN + ES)'}</span>
          </label>
          {languageMode === 'EN' && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
              <Ban className="w-4 h-4" />
              <span>{t?.enModeHymnWarning ?? 'Spanish-only hymns are disabled in English-Only mode'}</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
            </div>
          ) : (hymns?.length ?? 0) === 0 ? (
            <p className="text-center text-gray-500 py-8">{t?.noHymnsFound ?? 'No hymns found'}</p>
          ) : (
            <div className="space-y-2">
              {hymns?.map?.((hymn) => {
                const disabled = isHymnDisabled(hymn);
                return (
                <button
                  key={hymn?.id}
                  onClick={() => {
                    if (!disabled) {
                      onSelect(hymn);
                      onClose();
                    }
                  }}
                  disabled={disabled}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    disabled 
                      ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed' 
                      : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50'
                  }`}
                >
                  {/* Spanish (primary) */}
                  <div className="font-medium text-gray-900">
                    <span className="text-violet-600">#{hymn?.numberEs}</span> {hymn?.titleEs}
                  </div>
                  {/* English (if available) */}
                  {hymn?.numberEn && hymn?.titleEn ? (
                    <>
                      <div className="text-sm text-blue-600 mt-1">
                        <span>#{hymn.numberEn}</span> {hymn.titleEn}
                      </div>
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        <Globe className="w-3 h-3" /> Bilingual
                      </span>
                    </>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1 italic">
                      {disabled && <Ban className="w-3 h-3 text-amber-500" />}
                      <span>{t?.noEnglish ?? 'No English equivalent'}</span>
                      {disabled && <span className="text-amber-500 ml-1">({t?.disabled ?? 'Disabled'})</span>}
                    </div>
                  )}
                </button>
              );}) ?? null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
