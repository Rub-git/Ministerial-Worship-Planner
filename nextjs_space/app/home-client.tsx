'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/language-context';
import { useSubscription } from '@/lib/subscription-context';
import { Program, ProgramType } from '@/lib/types';
import { Plus, Calendar, Edit, Trash2, FileText, Presentation, Copy, Eye, Lock, Church, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const PROGRAM_TYPE_NAMES: Record<string, { en: string; es: string }> = {
  FRIDAY: { en: 'Friday Vespers', es: 'Culto de Viernes' },
  WEDNESDAY: { en: 'Wednesday Prayer Meeting', es: 'Culto de Oración' },
  SABBATH: { en: 'Sabbath Worship', es: 'Culto Sabático' },
  YOUTH: { en: 'Youth Program', es: 'Programa Juvenil' },
};

interface OrganizationInfo {
  nameEn: string;
  nameEs?: string | null;
  denomination?: string | null;
  customDenomination?: string | null;
}

export function HomeClient() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const { t, language } = useLanguage();
  const { canCreate, isViewOnly } = useSubscription();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newType, setNewType] = useState<ProgramType>('SABBATH');
  const [exporting, setExporting] = useState<string | null>(null);

  const role = (session?.user as any)?.role;
  const canEditRole = role === 'ADMIN' || role === 'EDITOR' || role === 'SUPER_ADMIN';
  const canEdit = canEditRole && canCreate; // Must have role AND active subscription

  useEffect(() => {
    fetchPrograms();
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      const res = await fetch('/api/organization');
      if (res?.ok) {
        const data = await res.json();
        setOrganization(data);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
    }
  };

  const fetchPrograms = async () => {
    try {
      const res = await fetch('/api/programs');
      if (res?.ok) {
        const data = await res.json();
        setPrograms(data ?? []);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!newDate) {
      toast?.error?.('Please select a date');
      return;
    }
    router?.push?.(`/program/new?date=${newDate}&type=${newType}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t?.confirmDelete ?? 'Are you sure?')) return;

    try {
      const res = await fetch(`/api/programs/${id}`, { method: 'DELETE' });
      if (res?.ok) {
        toast?.success?.(t?.success ?? 'Deleted!');
        fetchPrograms();
      } else {
        const data = await res?.json?.();
        toast?.error?.(data?.error ?? t?.error ?? 'Error');
      }
    } catch (error) {
      console.error('Error deleting program:', error);
      toast?.error?.(t?.error ?? 'Error');
    }
  };

  const handleExport = async (programId: string, format: 'pdf' | 'pptx', preview = false) => {
    if (preview && format === 'pdf') {
      // Open PDF in new tab - direct API call with cache-busting timestamp
      window.open(`/api/export/pdf/preview/${programId}?t=${Date.now()}`, '_blank');
      return;
    }
    
    setExporting(`${programId}-${format}`);
    try {
      const res = await fetch(`/api/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId }),
      });

      if (res?.ok) {
        const blob = await res.blob();
        const url = window?.URL?.createObjectURL?.(blob);
        const a = document?.createElement?.('a');
        a.href = url ?? '';
        a.download = `program.${format}`;
        document?.body?.appendChild?.(a);
        a?.click?.();
        window?.URL?.revokeObjectURL?.(url ?? '');
        document?.body?.removeChild?.(a);
        toast?.success?.(`${format?.toUpperCase?.()} downloaded!`);
      } else {
        toast?.error?.(language === 'es' ? 'Exportación fallida' : 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast?.error?.(language === 'es' ? 'Exportación fallida' : 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  const handleDuplicate = async (program: Program) => {
    const nextWeek = new Date(program?.date);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const newDateStr = nextWeek?.toISOString?.()?.split?.('T')?.[0];

    try {
      const res = await fetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: newDateStr,
          type: program?.type,
          languageMode: program?.languageMode,
          items: (program?.items ?? []).map(item => ({
            sectionKey: item?.sectionKey,
            block: item?.block,
            order: item?.order,
            textEn: item?.textEn,
            textEs: item?.textEs,
            hymnPairId: item?.hymnPairId,
            personName: null, // Clear person names for new week
          })),
        }),
      });

      if (res?.ok) {
        toast?.success?.('Program duplicated!');
        fetchPrograms();
      } else {
        toast?.error?.('Failed to duplicate');
      }
    } catch (error) {
      console.error('Duplicate error:', error);
      toast?.error?.('Failed to duplicate');
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return d.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', options);
  };

  // Get organization display name
  const orgName = organization 
    ? (language === 'es' && organization.nameEs ? organization.nameEs : organization.nameEn)
    : '';

  // Check if this is a first-time organization (no programs yet)
  const isFirstTime = !loading && (programs?.length ?? 0) === 0;

  // Welcome state for first-time organizations
  if (isFirstTime) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-xl mx-auto px-4"
        >
          {/* Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#1E3A8A] to-[#2563eb] rounded-2xl flex items-center justify-center shadow-lg">
              <Church className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1E3A8A] mb-4">
            {language === 'es' 
              ? 'Bienvenido a Ministerial Worship Planner'
              : 'Welcome to Ministerial Worship Planner'
            }
          </h1>

          {/* Subtitle with Organization Name */}
          {orgName && (
            <p className="text-lg text-gray-600 mb-8">
              {language === 'es' 
                ? `Está gestionando: ${orgName}`
                : `You are managing: ${orgName}`
              }
            </p>
          )}

          {/* Primary CTA */}
          {canEdit ? (
            <button
              onClick={() => router.push('/program/new')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#C9A227] hover:bg-[#B8911F] text-[#1E3A8A] font-semibold text-lg rounded-lg transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" />
              {language === 'es' ? 'Crear Primer Programa' : 'Create First Program'}
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-8 py-4 bg-gray-100 text-gray-500 font-semibold text-lg rounded-lg">
              <Lock className="w-5 h-5" />
              {language === 'es' ? 'Modo Solo Lectura' : 'View Only Mode'}
            </div>
          )}

          {/* Helper Text */}
          <p className="mt-6 text-gray-500 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C9A227]" />
            {language === 'es' 
              ? 'Las plantillas están preconfiguradas según la tradición de su iglesia.'
              : 'Templates are pre-configured based on your church tradition.'
            }
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {language === 'es' ? 'Programas de Culto' : 'Worship Programs'}
        </h1>
        <p className="text-gray-600">
          {language === 'es' ? 'Gestiona los programas de tu iglesia' : 'Manage your church worship programs'}
        </p>
      </div>

      {/* Create New Program */}
      {canEdit && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 text-lg font-semibold text-[#1E3A8A] hover:text-[#152d6b]"
          >
            <Plus className="w-5 h-5" />
            {t?.createProgram ?? 'Create Program'}
          </button>

          <AnimatePresence>
            {showCreate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {t?.selectDate ?? 'Select Date'}
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e?.target?.value ?? '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t?.selectType ?? 'Select Type'}
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e?.target?.value as ProgramType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="SABBATH">{t?.sabbath ?? 'Sabbath Worship'}</option>
                    <option value="FRIDAY">{t?.friday ?? 'Friday Vespers'}</option>
                    <option value="WEDNESDAY">{t?.wednesday ?? 'Wednesday Prayer'}</option>
                    <option value="YOUTH">{t?.youth ?? 'Youth Program'}</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleCreate}
                    className="w-full px-4 py-2 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#152d6b] transition-colors font-medium"
                  >
                    {t?.createProgram ?? 'Create'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Programs List */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t?.recentPrograms ?? 'Recent Programs'}
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1E3A8A]" />
          </div>
        ) : (
          <div className="space-y-4">
            {programs?.map?.((program, index) => {
              const typeNames = PROGRAM_TYPE_NAMES[program?.type ?? ''] ?? { en: program?.type, es: program?.type };
              return (
                <motion.div
                  key={program?.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-semibold text-gray-900">
                          {language === 'es' ? typeNames?.es : typeNames?.en}
                        </span>
                        <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full">
                          {program?.type}
                        </span>
                      </div>
                      <p className="text-gray-600">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {formatDate(program?.date)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleExport(program?.id ?? '', 'pdf', true)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                        title={language === 'es' ? 'Vista previa' : 'Preview'}
                      >
                        <Eye className="w-4 h-4" />
                        {language === 'es' ? 'Ver' : 'View'}
                      </button>
                      <button
                        onClick={() => handleExport(program?.id ?? '', 'pdf')}
                        disabled={exporting === `${program?.id}-pdf`}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <FileText className="w-4 h-4" />
                        PDF
                      </button>
                      <button
                        onClick={() => handleExport(program?.id ?? '', 'pptx')}
                        disabled={exporting === `${program?.id}-pptx`}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
                      >
                        <Presentation className="w-4 h-4" />
                        PPTX
                      </button>
                      {canEdit && (
                        <>
                          <button
                            onClick={() => handleDuplicate(program)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            title={t?.duplicate ?? 'Duplicate'}
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => router?.push?.(`/program/${program?.id}`)}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            {t?.editProgram ?? 'Edit'}
                          </button>
                          <button
                            onClick={() => handleDelete(program?.id ?? '')}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            }) ?? null}
          </div>
        )}
      </div>
    </div>
  );
}
