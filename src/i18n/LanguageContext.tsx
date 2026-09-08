import React, { createContext, useContext, useState, useEffect } from 'react';
import type { SupportedLanguage } from '../types/index.ts';
import { translations, getTranslation, SUPPORTED_LANGUAGES, type TranslationDict, type LanguageOption } from './translations.ts';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: keyof TranslationDict) => string;
  supportedLanguages: LanguageOption[];
  currentLanguageOption: LanguageOption;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'indic_statistical_portal_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode; defaultLang?: SupportedLanguage }> = ({ 
  children,
  defaultLang = 'en' 
}) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && translations[saved as SupportedLanguage]) {
        return saved as SupportedLanguage;
      }
    } catch {
      // Storage unavailable
    }
    return defaultLang;
  });

  const setLanguage = (lang: SupportedLanguage) => {
    if (translations[lang]) {
      setLanguageState(lang);
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        // Storage unavailable
      }
    }
  };

  const t = (key: keyof TranslationDict): string => {
    return getTranslation(language, key);
  };

  const currentLanguageOption = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, supportedLanguages: SUPPORTED_LANGUAGES, currentLanguageOption }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
