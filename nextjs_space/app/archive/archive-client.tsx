'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/language-context';
import { Program, ProgramType } from '@/lib/types';
import { Calendar, Edit, FileText, Presentation, Filter, Search, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const PROGRAM_TYPE_NAMES: Record<string, { en: string; es: string }> = {
  FRIDAY: { en: 'Friday Vespers', es: 'Culto de Viernes' },
  WEDNESDAY: { en: 'Wednesday Prayer Meeting', es: 'Culto de Oración' },
  SABBATH: { en: 'Sabbath Worship', es: 'Culto Sabático' },
  YOUTH: { en: 'Youth Program', es: 'Programa Juvenil' },
};

export function ArchiveClient() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const { t, language } = useLanguage();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<ProgramType | 'ALL'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState<string | null>(null);

  const role = (session?.user as any)?.role;
  const canEdit = role === 'ADMIN' || role === 'EDITOR';

  useEffect(() => {
    fetchPrograms();
  }, [filterType, startDate, endDate]);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      let url = '/api/programs?';
      if (filterType !== 'ALL') url += `type=${filterType}&`;
      if (startDate) url += `startDate=${startDate}&`;
      if (endDate) url += `endDate=${endDate}&`;

      const res = await fetch(url);
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

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return d.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', options);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t?.archive ?? 'Archive'}
        </h1>
        <p className="text-gray-600">
          {language === 'es' ? 'Busca y descarga programas anteriores' : 'Search and download past programs'}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-violet-600" />
          <span className="font-semibold text-gray-700">
            {language === 'es' ? 'Filtros' : 'Filters'}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              {language === 'es' ? 'Tipo de Programa' : 'Program Type'}
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e?.target?.value as ProgramType | 'ALL')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
            >
              <option value="ALL">{language === 'es' ? 'Todos' : 'All'}</option>
              <option value="SABBATH">{t?.sabbath ?? 'Sabbath'}</option>
              <option value="FRIDAY">{t?.friday ?? 'Friday'}</option>
              <option value="WEDNESDAY">{t?.wednesday ?? 'Wednesday'}</option>
              <option value="YOUTH">{t?.youth ?? 'Youth'}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              {language === 'es' ? 'Desde' : 'From'}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e?.target?.value ?? '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              {language === 'es' ? 'Hasta' : 'To'}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e?.target?.value ?? '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterType('ALL');
                setStartDate('');
                setEndDate('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {language === 'es' ? 'Limpiar' : 'Clear'}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
        </div>
      ) : (programs?.length ?? 0) === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t?.noPrograms ?? 'No programs found'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programs?.map?.((program, index) => {
            const typeNames = PROGRAM_TYPE_NAMES[program?.type ?? ''] ?? { en: program?.type, es: program?.type };
            return (
              <motion.div
                key={program?.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-lg font-semibold text-gray-900">
                      {language === 'es' ? typeNames?.es : typeNames?.en}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {formatDate(program?.date)}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full">
                    {program?.type}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport(program?.id ?? '', 'pdf', true)}
                    className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                    title={language === 'es' ? 'Vista previa' : 'Preview'}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleExport(program?.id ?? '', 'pdf')}
                    disabled={exporting === `${program?.id}-pdf`}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <FileText className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    onClick={() => handleExport(program?.id ?? '', 'pptx')}
                    disabled={exporting === `${program?.id}-pptx`}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
                  >
                    <Presentation className="w-4 h-4" />
                    PPTX
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => router?.push?.(`/program/${program?.id}`)}
                      className="flex items-center justify-center gap-1 px-3 py-2 text-sm bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          }) ?? null}
        </div>
      )}
    </div>
  );
}
