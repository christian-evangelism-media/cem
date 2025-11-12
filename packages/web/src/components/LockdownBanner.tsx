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
    <div className="alert alert-error shadow-lg mb-6">
      <div className="flex-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="stroke-current flex-shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <div>
          <h3 className="font-bold">{t('lockdown.active')}</h3>
          <div className="text-sm">{t('lockdown.message')}</div>
        </div>
      </div>
      <div className="flex-none">
        <button
          onClick={handleCheckStatus}
          disabled={isChecking}
          className="btn btn-sm"
        >
          {isChecking ? t('lockdown.checking') : t('lockdown.checkStatus')}
        </button>
      </div>
    </div>
  )
}
