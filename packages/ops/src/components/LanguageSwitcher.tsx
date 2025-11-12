import { useTranslation } from 'react-i18next'

const languages = [
  { code: 'en', name: 'English', short: 'EN' },
  { code: 'fr-CA', name: 'Français', short: 'FR' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    // Close the dropdown by removing focus
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0]

  return (
    <div className="dropdown dropdown-top dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm min-w-0 px-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        <span className="text-xs ml-1">{currentLanguage.short}</span>
      </div>
      <ul
        tabIndex={0}
        className="mb-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-36"
      >
        {languages.map((lang) => (
          <li key={lang.code}>
            <button
              onClick={() => changeLanguage(lang.code)}
              className={i18n.language === lang.code ? 'active' : ''}
            >
              <span className="flex-1">{lang.name}</span>
              {i18n.language === lang.code && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
