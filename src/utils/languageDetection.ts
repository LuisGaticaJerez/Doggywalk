import { Language } from '../translations';

// Map of country codes to their primary languages
const countryLanguageMap: Record<string, Language> = {
  // Spanish-speaking countries
  AR: 'es', // Argentina
  BO: 'es', // Bolivia
  CL: 'es', // Chile
  CO: 'es', // Colombia
  CR: 'es', // Costa Rica
  CU: 'es', // Cuba
  DO: 'es', // Dominican Republic
  EC: 'es', // Ecuador
  SV: 'es', // El Salvador
  GT: 'es', // Guatemala
  HN: 'es', // Honduras
  MX: 'es', // Mexico
  NI: 'es', // Nicaragua
  PA: 'es', // Panama
  PY: 'es', // Paraguay
  PE: 'es', // Peru
  ES: 'es', // Spain
  UY: 'es', // Uruguay
  VE: 'es', // Venezuela

  // Portuguese-speaking countries
  BR: 'pt', // Brazil
  PT: 'pt', // Portugal
  AO: 'pt', // Angola
  MZ: 'pt', // Mozambique

  // French-speaking countries
  FR: 'fr', // France
  BE: 'fr', // Belgium
  CH: 'fr', // Switzerland
  CA: 'fr', // Canada
  LU: 'fr', // Luxembourg
  MC: 'fr', // Monaco

  // Chinese-speaking countries/regions
  CN: 'zh', // China
  TW: 'zh', // Taiwan
  HK: 'zh', // Hong Kong
  SG: 'zh', // Singapore
  MO: 'zh', // Macau
};

/**
 * Detect language based on user's geolocation
 * Returns detected language or 'en' as fallback
 */
export async function detectLanguageFromGeolocation(): Promise<Language> {
  try {
    // First check browser language
    const browserLang = navigator.language.split('-')[0] as Language;

    // Try to get user's position
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 5000,
        maximumAge: 300000, // 5 minutes cache
      });
    });

    // Use reverse geocoding to get country
    const { latitude, longitude } = position.coords;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
    );

    if (response.ok) {
      const data = await response.json();
      const countryCode = data.address?.country_code?.toUpperCase();

      if (countryCode && countryLanguageMap[countryCode]) {
        return countryLanguageMap[countryCode];
      }
    }

    // Fallback to browser language if supported
    if (['en', 'es', 'zh', 'pt', 'fr'].includes(browserLang)) {
      return browserLang;
    }

    // Default to English
    return 'en';
  } catch (error) {
    console.log('Could not detect language from geolocation:', error);

    // Fallback to browser language
    const browserLang = navigator.language.split('-')[0] as Language;
    if (['en', 'es', 'zh', 'pt', 'fr'].includes(browserLang)) {
      return browserLang;
    }

    // Final fallback to English
    return 'en';
  }
}

/**
 * Get language from browser settings
 */
export function getBrowserLanguage(): Language {
  const browserLang = navigator.language.split('-')[0];
  if (['en', 'es', 'zh', 'pt', 'fr'].includes(browserLang)) {
    return browserLang as Language;
  }
  return 'en';
}
