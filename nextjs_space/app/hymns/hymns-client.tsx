'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/language-context';
import { Music, Plus, Edit, Trash2, Search, Save, X, Upload, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface HymnPair {
  id: number;
  numberEs: number;
  titleEs: string;
  numberEn: number | null;
  titleEn: string | null;
  lyricsEn?: string | null;
  lyricsEs?: string | null;
}

export function HymnsClient() {
  const { t, language } = useLanguage();
  const [hymns, setHymns] = useState<HymnPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bilingualOnly, setBilingualOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    titleEn: '',
    numberEn: '',
    titleEs: '',
    numberEs: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchHymns();
  }, [search, bilingualOnly]);

  const fetchHymns = async () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e?.preventDefault?.();
    setSaving(true);

    try {
      const url = editingId ? `/api/hymns/${editingId}` : '/api/hymns';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res?.ok) {
        toast?.success?.(t?.success ?? 'Success!');
        setShowForm(false);
        setEditingId(null);
        setFormData({ titleEn: '', numberEn: '', titleEs: '', numberEs: '' });
        fetchHymns();
      } else {
        const data = await res?.json?.();
        toast?.error?.(data?.error ?? t?.error ?? 'Error');
      }
    } catch (error) {
      console.error('Error saving hymn:', error);
      toast?.error?.(t?.error ?? 'Error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (hymn: HymnPair) => {
    setFormData({
      titleEn: hymn?.titleEn ?? '',
      numberEn: hymn?.numberEn ? String(hymn.numberEn) : '',
      titleEs: hymn?.titleEs ?? '',
      numberEs: String(hymn?.numberEs ?? ''),
    });
    setEditingId(hymn?.id ?? null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t?.confirmDelete ?? 'Are you sure?')) return;

    try {
      const res = await fetch(`/api/hymns/${id}`, { method: 'DELETE' });
      if (res?.ok) {
        toast?.success?.(t?.success ?? 'Deleted!');
        fetchHymns();
      } else {
        const data = await res?.json?.();
        toast?.error?.(data?.error ?? t?.error ?? 'Error');
      }
    } catch (error) {
      console.error('Error deleting hymn:', error);
      toast?.error?.(t?.error ?? 'Error');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ titleEn: '', numberEn: '', titleEs: '', numberEs: '' });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <Music className="w-8 h-8 text-violet-600" />
          {t?.manageHymns ?? 'Manage Hymns'}
        </h1>
        <p className="text-gray-600">
          {language === 'es' ? 'Agregar, editar y eliminar pares de himnos' : 'Add, edit, and delete hymn pairs'}
        </p>
      </div>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e?.target?.value ?? '')}
              placeholder={`${t?.search ?? 'Search'} (# ES, # EN, título)...`}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
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
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ titleEn: '', numberEn: '', titleEs: '', numberEs: '' });
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors h-fit"
        >
          <Plus className="w-5 h-5" />
          {t?.addHymn ?? 'Add Hymn'}
        </button>
      </div>

      {/* Bulk Import Placeholder */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
        <Upload className="w-5 h-5 text-amber-600" />
        <span className="text-amber-800 text-sm">
          {language === 'es'
            ? 'La importación masiva desde CSV estará disponible en una futura actualización'
            : 'Bulk import from CSV will be available in a future update'}
        </span>
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl shadow-md p-6"
          >
            <h3 className="text-lg font-semibold mb-4">
              {editingId ? (t?.editHymn ?? 'Edit Hymn') : (t?.addHymn ?? 'Add Hymn')}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Spanish is PRIMARY - required */}
                <div className="space-y-4 order-1 md:order-2">
                  <h4 className="font-medium text-amber-600">{t?.spanish ?? 'Spanish'} <span className="text-red-500">*</span></h4>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{t?.hymnNumber ?? 'Number'} <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      value={formData?.numberEs ?? ''}
                      onChange={(e) => setFormData(prev => ({ ...(prev ?? {}), numberEs: e?.target?.value ?? '' }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{t?.hymnTitle ?? 'Title'} <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={formData?.titleEs ?? ''}
                      onChange={(e) => setFormData(prev => ({ ...(prev ?? {}), titleEs: e?.target?.value ?? '' }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
                {/* English is OPTIONAL */}
                <div className="space-y-4 order-2 md:order-1">
                  <h4 className="font-medium text-violet-600">{t?.english ?? 'English'} <span className="text-gray-400 text-sm font-normal">(optional)</span></h4>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{t?.hymnNumber ?? 'Number'}</label>
                    <input
                      type="number"
                      value={formData?.numberEn ?? ''}
                      onChange={(e) => setFormData(prev => ({ ...(prev ?? {}), numberEn: e?.target?.value ?? '' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{t?.hymnTitle ?? 'Title'}</label>
                    <input
                      type="text"
                      value={formData?.titleEn ?? ''}
                      onChange={(e) => setFormData(prev => ({ ...(prev ?? {}), titleEn: e?.target?.value ?? '' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  {t?.cancel ?? 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? (t?.loading ?? 'Loading...') : (t?.save ?? 'Save')}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hymns List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
        </div>
      ) : (hymns?.length ?? 0) === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <Music className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t?.noHymnsFound ?? 'No hymns found'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-violet-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-amber-700">#ES</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-amber-700">{t?.spanish ?? 'Spanish'}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-violet-800">#EN</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-violet-800">{t?.english ?? 'English'}</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Bilingual</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {hymns?.map?.((hymn) => (
                  <tr key={hymn?.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-amber-600">{hymn?.numberEs}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{hymn?.titleEs}</td>
                    <td className="px-4 py-3 text-sm font-medium text-violet-600">
                      {hymn?.numberEn ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {hymn?.titleEn ?? <span className="text-gray-300 italic">No English</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {hymn?.numberEn && hymn?.titleEn ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                          <Globe className="w-3 h-3" /> Yes
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(hymn)}
                          className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(hymn?.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) ?? null}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
