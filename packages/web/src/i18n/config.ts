import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import ar from './locales/ar.json'
import zh from './locales/zh.json'
import hi from './locales/hi.json'
import he from './locales/he.json'
import it from './locales/it.json'
import ht from './locales/ht.json'
import tl from './locales/tl.json'
import ilo from './locales/ilo.json'
import pt from './locales/pt.json'
import vi from './locales/vi.json'
import ta from './locales/ta.json'
import fa from './locales/fa.json'
import pa from './locales/pa.json'
import ru from './locales/ru.json'
import ko from './locales/ko.json'
import bn from './locales/bn.json'
import de from './locales/de.json'
import el from './locales/el.json'
import id from './locales/id.json'
import ro from './locales/ro.json'
import ja from './locales/ja.json'
import ha from './locales/ha.json'
import ur from './locales/ur.json'
import mr from './locales/mr.json'
import sw from './locales/sw.json'
import te from './locales/te.json'
import tr from './locales/tr.json'

i18n
  .use(LanguageDetector) // Detects browser language
  .use(initReactI18next) // Passes i18n to React
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      ar: { translation: ar },
      zh: { translation: zh },
      hi: { translation: hi },
      he: { translation: he },
      it: { translation: it },
      ht: { translation: ht },
      tl: { translation: tl },
      ilo: { translation: ilo },
      pt: { translation: pt },
      vi: { translation: vi },
      ta: { translation: ta },
      fa: { translation: fa },
      pa: { translation: pa },
      ru: { translation: ru },
      ko: { translation: ko },
      bn: { translation: bn },
      de: { translation: de },
      el: { translation: el },
      id: { translation: id },
      ro: { translation: ro },
      ja: { translation: ja },
      ha: { translation: ha },
      ur: { translation: ur },
      mr: { translation: mr },
      sw: { translation: sw },
      te: { translation: te },
      tr: { translation: tr },
    },
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'], // Check localStorage first, then browser
      caches: ['localStorage'], // Save preference to localStorage
    },
  })

export default i18n
