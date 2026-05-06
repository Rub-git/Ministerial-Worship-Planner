'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UI_TRANSLATIONS } from './types';

type Language = 'en' | 'es';
type Translations = typeof UI_TRANSLATIONS.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage?.getItem?.('language') as Language;
    if (saved && (saved === 'en' || saved === 'es')) {
      setLanguage(saved);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage?.setItem?.('language', language);
    }
  }, [language, mounted]);

  const t = UI_TRANSLATIONS[language];

  if (!mounted) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
