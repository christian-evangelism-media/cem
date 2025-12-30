import { useTranslation } from 'react-i18next'
import { Dropdown, Button } from 'asterui'

const languages = [
  { code: 'ar', name: 'العربية', short: 'AR' },
  { code: 'bn', name: 'বাংলা', short: 'BN' },
  { code: 'de', name: 'Deutsch', short: 'DE' },
  { code: 'el', name: 'Ελληνικά', short: 'EL' },
  { code: 'en', name: 'English', short: 'EN' },
  { code: 'es', name: 'Español', short: 'ES' },
  { code: 'fa', name: 'فارسی', short: 'FA' },
  { code: 'ff', name: 'Fulfulde', short: 'FF' },
  { code: 'fr', name: 'Français', short: 'FR' },
  { code: 'he', name: 'עברית', short: 'HE' },
  { code: 'hi', name: 'हिन्दी', short: 'HI' },
  { code: 'ht', name: 'Kreyòl', short: 'HT' },
  { code: 'id', name: 'Bahasa Indonesia', short: 'ID' },
  { code: 'ilo', name: 'Ilocano', short: 'ILO' },
  { code: 'it', name: 'Italiano', short: 'IT' },
  { code: 'ja', name: '日本語', short: 'JA' },
  { code: 'ko', name: '한국어', short: 'KO' },
  { code: 'mr', name: 'मराठी', short: 'MR' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', short: 'PA' },
  { code: 'pt', name: 'Português', short: 'PT' },
  { code: 'ro', name: 'Română', short: 'RO' },
  { code: 'ru', name: 'Русский', short: 'RU' },
  { code: 'sw', name: 'Kiswahili', short: 'SW' },
  { code: 'ta', name: 'தமிழ்', short: 'TA' },
  { code: 'te', name: 'తెలుగు', short: 'TE' },
  { code: 'tl', name: 'Tagalog', short: 'TL' },
  { code: 'tr', name: 'Türkçe', short: 'TR' },
  { code: 'ur', name: 'اردو', short: 'UR' },
  { code: 'vi', name: 'Tiếng Việt', short: 'VI' },
  { code: 'zh', name: '中文', short: 'ZH' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0]

  return (
    <Dropdown placement="bottomRight" trigger={['click']}>
      <Dropdown.Trigger>
        <Button ghost className="min-w-0 px-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span className="text-xs ml-1">{currentLanguage.short}</span>
        </Button>
      </Dropdown.Trigger>
      <Dropdown.Menu className="w-36 p-2">
        {languages.map((lang) => (
          <Dropdown.Item
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            active={i18n.language === lang.code}
          >
            <span className="flex-1">{lang.name}</span>
            {i18n.language === lang.code && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  )
}
