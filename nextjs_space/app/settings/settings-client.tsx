'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/language-context';
import { Settings, Save, Users, Building, FileText, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface User {
  id: string;
  email: string;
  name?: string | null;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
}

type SettingsMap = Record<string, { valueEn: string; valueEs: string }>;

export function SettingsClient() {
  const { t, language } = useLanguage();
  const [settings, setSettings] = useState<SettingsMap>({});
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'users'>('general');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, usersRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/users'),
      ]);

      if (settingsRes?.ok) {
        const data = await settingsRes.json();
        setSettings(data ?? {});
      }

      if (usersRes?.ok) {
        const data = await usersRes.json();
        setUsers(data ?? []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, field: 'valueEn' | 'valueEs', value: string) => {
    setSettings(prev => ({
      ...(prev ?? {}),
      [key]: {
        ...(prev?.[key] ?? { valueEn: '', valueEs: '' }),
        [field]: value,
      },
    }));
  };

  const saveSetting = async (key: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          valueEn: settings?.[key]?.valueEn ?? '',
          valueEs: settings?.[key]?.valueEs ?? '',
        }),
      });

      if (res?.ok) {
        toast?.success?.(t?.success ?? 'Saved!');
      } else {
        toast?.error?.(t?.error ?? 'Error');
      }
    } catch (error) {
      console.error('Error saving setting:', error);
      toast?.error?.(t?.error ?? 'Error');
    } finally {
      setSaving(false);
    }
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (res?.ok) {
        toast?.success?.(t?.success ?? 'Updated!');
        fetchData();
      } else {
        toast?.error?.(t?.error ?? 'Error');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast?.error?.(t?.error ?? 'Error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <Settings className="w-8 h-8 text-violet-600" />
          {t?.settings ?? 'Settings'}
        </h1>
        <p className="text-gray-600">
          {language === 'es' ? 'Configura la aplicación y gestiona usuarios' : 'Configure the app and manage users'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'border-violet-600 text-violet-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building className="w-4 h-4" />
          {language === 'es' ? 'General' : 'General'}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-violet-600 text-violet-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          {t?.users ?? 'Users'}
        </button>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Church Name */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-violet-600" />
              {t?.churchName ?? 'Church Name'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t?.english ?? 'English'}</label>
                <input
                  type="text"
                  value={settings?.['church_name']?.valueEn ?? ''}
                  onChange={(e) => updateSetting('church_name', 'valueEn', e?.target?.value ?? '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t?.spanish ?? 'Spanish'}</label>
                <input
                  type="text"
                  value={settings?.['church_name']?.valueEs ?? ''}
                  onChange={(e) => updateSetting('church_name', 'valueEs', e?.target?.value ?? '')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => saveSetting('church_name')}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {t?.save ?? 'Save'}
              </button>
            </div>
          </div>

          {/* PDF Footer Quote EN */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-600" />
              {t?.pdfFooter ?? 'PDF Footer Quote'} ({t?.english ?? 'English'})
            </h3>
            <textarea
              value={settings?.['pdf_footer_quote_en']?.valueEn ?? ''}
              onChange={(e) => updateSetting('pdf_footer_quote_en', 'valueEn', e?.target?.value ?? '')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
              placeholder={language === 'es' ? 'Cita opcional para el pie de página...' : 'Optional footer quote...'}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => saveSetting('pdf_footer_quote_en')}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {t?.save ?? 'Save'}
              </button>
            </div>
          </div>

          {/* PDF Footer Quote ES */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              {t?.pdfFooter ?? 'PDF Footer Quote'} ({t?.spanish ?? 'Spanish'})
            </h3>
            <textarea
              value={settings?.['pdf_footer_quote_es']?.valueEs ?? ''}
              onChange={(e) => updateSetting('pdf_footer_quote_es', 'valueEs', e?.target?.value ?? '')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
              placeholder={language === 'es' ? 'Cita opcional para el pie de página...' : 'Optional footer quote...'}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => saveSetting('pdf_footer_quote_es')}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {t?.save ?? 'Save'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-md overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-violet-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t?.name ?? 'Name'}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t?.email ?? 'Email'}</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t?.role ?? 'Role'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users?.map?.((user) => (
                  <tr key={user?.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900">{user?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user?.email ?? ''}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user?.role ?? 'VIEWER'}
                        onChange={(e) => updateUserRole(user?.id ?? '', e?.target?.value ?? 'VIEWER')}
                        className="px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500"
                      >
                        <option value="ADMIN">{t?.admin ?? 'Admin'}</option>
                        <option value="EDITOR">{t?.editor ?? 'Editor'}</option>
                        <option value="VIEWER">{t?.viewer ?? 'Viewer'}</option>
                      </select>
                    </td>
                  </tr>
                )) ?? null}
              </tbody>
            </table>
          </div>
          {(users?.length ?? 0) === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{language === 'es' ? 'No hay usuarios' : 'No users'}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Role Legend */}
      {activeTab === 'users' && (
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {language === 'es' ? 'Permisos de Roles' : 'Role Permissions'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg p-3">
              <span className="font-medium text-violet-600">{t?.admin ?? 'Admin'}</span>
              <p className="text-gray-600 mt-1">
                {language === 'es' ? 'Acceso completo a himnos y todos los programas' : 'Full access to hymns and all programs'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <span className="font-medium text-blue-600">{t?.editor ?? 'Editor'}</span>
              <p className="text-gray-600 mt-1">
                {language === 'es' ? 'Puede crear y editar programas' : 'Can create and edit programs'}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <span className="font-medium text-gray-600">{t?.viewer ?? 'Viewer'}</span>
              <p className="text-gray-600 mt-1">
                {language === 'es' ? 'Solo lectura y descarga' : 'Read-only access and download'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
