import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, supportedLanguages } from '../translations';
import { Translations } from '../translations/en';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { detectLanguageFromGeolocation, getBrowserLanguage } from '../utils/languageDetection';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('language');
    if (stored && supportedLanguages.includes(stored as Language)) {
      return stored as Language;
    }
    // Return browser language as initial fallback
    return getBrowserLanguage();
  });

  const [languageDetected, setLanguageDetected] = useState(false);

  // Auto-detect language on first load if not previously set
  useEffect(() => {
    const stored = localStorage.getItem('language');
    if (!stored && !languageDetected) {
      detectLanguageFromGeolocation().then((detectedLang) => {
        setLanguageState(detectedLang);
        localStorage.setItem('language', detectedLang);
        setLanguageDetected(true);
      });
    }
  }, [languageDetected]);

  // Load user's saved language preference
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('language')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.language && supportedLanguages.includes(data.language as Language)) {
            setLanguageState(data.language as Language);
            localStorage.setItem('language', data.language);
          }
        });
    }
  }, [user]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);

    if (user) {
      await supabase
        .from('profiles')
        .update({ language: lang })
        .eq('id', user.id);
    }
  };

  const t = translations[language];

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
