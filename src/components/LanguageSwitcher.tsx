import { useI18n } from '../contexts/I18nContext';
import { supportedLanguages, languageNames, Language } from '../translations';
import { labelStyle, selectStyle } from '../styles/formStyles';

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div style={{ marginBottom: '24px' }}>
      <label htmlFor="language-select" style={labelStyle}>
        {t.settings.selectLanguage}
      </label>
      <select
        id="language-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        style={selectStyle}
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
