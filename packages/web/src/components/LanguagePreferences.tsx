import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useUser } from '../contexts/UserContext'
import { api } from '../services/api'
import { Grid } from 'asterui'

const { Row, Col } = Grid

const languageCodes = [
  'ar', 'bn', 'de', 'el', 'en', 'es', 'fa', 'ff', 'fr', 'he', 'hi', 'ht',
  'id', 'ilo', 'it', 'ja', 'ko', 'mr', 'pa', 'pt', 'ro', 'ru', 'sw', 'ta', 'te', 'tl', 'tr', 'ur', 'vi', 'zh'
]

export default function LanguagePreferences() {
  const { t } = useTranslation()
  const { user, setUser } = useUser()
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])

  useEffect(() => {
    if (user?.preferredLanguages) {
      setSelectedLanguages(user.preferredLanguages)
    } else {
      setSelectedLanguages([])
    }
  }, [user])

  const toggleLanguage = async (code: string) => {
    const newLanguages = selectedLanguages.includes(code)
      ? selectedLanguages.filter(c => c !== code)
      : [...selectedLanguages, code]

    setSelectedLanguages(newLanguages)

    try {
      const response = await api.auth.updatePreferences(newLanguages.length > 0 ? newLanguages : null)
      setUser(response.user)
    } catch (error) {
      console.error('Failed to update preferences', error)
      // Revert on error
      setSelectedLanguages(selectedLanguages)
    }
  }

  if (!user) return null

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
        <div className="indicator">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
          </svg>
          {selectedLanguages.length > 0 && (
            <span className="badge badge-xs badge-primary indicator-item">{selectedLanguages.length}</span>
          )}
        </div>
      </div>
      <div tabIndex={0} className="dropdown-content z-[1] shadow bg-base-100 rounded-box w-64 sm:w-[36rem] max-h-[32rem] overflow-y-auto mt-2 p-2">
        <div className="px-2 py-3">
          <h3 className="font-bold text-sm mb-1">Preferred Languages</h3>
          <p className="text-xs text-base-content/70">
            Select languages you commonly work with. Media matching your preferences will appear first.
          </p>
        </div>
        <div className="divider my-0"></div>
        <Row gutter={4}>
          {languageCodes.map((code) => (
            <Col xs={24} sm={8} key={code}>
              <label className="label cursor-pointer justify-start gap-2 p-2">
                <input
                  type="checkbox"
                  checked={selectedLanguages.includes(code)}
                  onChange={() => toggleLanguage(code)}
                  className="checkbox checkbox-sm"
                />
                <span className="label-text text-sm">{t(`languages.${code}`)}</span>
              </label>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  )
}
