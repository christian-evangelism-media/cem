import app from '@adonisjs/core/services/app'
import { defineConfig, formatters, loaders } from '@adonisjs/i18n'

const i18nConfig = defineConfig({
  defaultLocale: 'en',
  formatter: formatters.icu(),

  loaders: [
    /**
     * The fs loader will read translations from the
     * "resources/lang" directory.
     *
     * Supporting 30 languages for CEM project:
     * English, Spanish, French, German, Portuguese, Chinese (Simplified),
     * Arabic, Russian, Japanese, Korean, Italian, Dutch, Polish, Turkish,
     * Vietnamese, Thai, Indonesian, Hebrew, Czech, Greek, Romanian,
     * Hungarian, Swedish, Finnish, Danish, Norwegian, Ukrainian, Hindi,
     * Bengali, Urdu
     */
    loaders.fs({
      location: app.languageFilesPath()
    }),
  ],

  /**
   * Supported locales for the CEM project
   */
  supportedLocales: [
    'en', 'es', 'fr', 'de', 'pt', 'zh', 'ar', 'ru', 'ja', 'ko',
    'it', 'nl', 'pl', 'tr', 'vi', 'th', 'id', 'he', 'cs', 'el',
    'ro', 'hu', 'sv', 'fi', 'da', 'no', 'uk', 'hi', 'bn', 'ur'
  ],
})

export default i18nConfig