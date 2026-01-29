import { useI18n } from '../contexts/I18nContext';
import { supportedLanguages, languageNames, Language } from '../translations';

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="language-switcher">
      <label htmlFor="language-select" className="label">
        {t.settings.selectLanguage}
      </label>
      <select
        id="language-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="select"
      >
        {supportedLanguages.map((lang) => (
          <option key={lang} value={lang}>
            {languageNames[lang]}
          </option>
        ))}
      </select>
    </div>
  );
}
