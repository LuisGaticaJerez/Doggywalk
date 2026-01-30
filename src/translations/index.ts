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
};

export type Language = keyof typeof translations;

export const supportedLanguages: Language[] = ['en', 'es', 'zh', 'pt', 'fr'];

export const languageNames: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  zh: '中文',
  pt: 'Português',
  fr: 'Français',
};
