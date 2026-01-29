import { en } from './en';
import { es } from './es';
import { zh } from './zh';
import { pt } from './pt';
import { fr } from './fr';

export const translations = {
  en,
  es,
  zh,
  pt,
  fr,
  hi: en,
  ar: en,
  de: en,
  ja: en,
  ru: en,
};

export type Language = keyof typeof translations;

export const supportedLanguages: Language[] = ['en', 'es', 'zh', 'hi', 'ar', 'pt', 'fr', 'de', 'ja', 'ru'];

export const languageNames: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  zh: '中文',
  hi: 'हिन्दी',
  ar: 'العربية',
  pt: 'Português',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  ru: 'Русский',
};
