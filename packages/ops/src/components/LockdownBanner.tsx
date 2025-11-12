import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../services/api'

export default function LockdownBanner() {
  const { t } = useTranslation()
  const [isChecking, setIsChecking] = useState(false)

  const handleCheckStatus = async () => {
    setIsChecking(true)
    try {
      const { isLockedDown } = await api.lockdown.status()
      if (!isLockedDown) {
        // Lockdown has been lifted, clear the flag and reload
        sessionStorage.removeItem('isLockedDown')
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to check lockdown status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-error mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h2 className="card-title text-2xl text-error">{t('lockdown.active')}</h2>
          <p className="text-base-content/70">{t('lockdown.message')}</p>
          <div className="card-actions mt-6">
            <button
              onClick={handleCheckStatus}
              disabled={isChecking}
              className="btn btn-primary"
            >
              {isChecking ? t('lockdown.checking') : t('lockdown.checkStatus')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
