import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import fr from './locales/fr.json'

i18n
  .use(LanguageDetector) // Detects browser language
  .use(initReactI18next) // Passes i18n to React
  .init({
    resources: {
      en: { translation: en },
      'fr-CA': { translation: fr },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'], // Check localStorage first, then browser
      caches: ['localStorage'], // Save preference to localStorage
    },
  })

export default i18n
