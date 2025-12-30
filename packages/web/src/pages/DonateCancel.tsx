import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from 'asterui'

export default function DonateCancel() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <div className="flex justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-warning"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="card-title justify-center text-2xl">
              {t('donate.cancelled') || 'Donation Cancelled'}
            </h2>
            <p className="text-lg">
              {t('donate.cancelMessage') ||
                'Your donation was cancelled. No charges were made.'}
            </p>
            <p className="mt-4 text-sm opacity-70">
              {t('donate.cancelHelp') ||
                'If you experienced any issues, please contact us.'}
            </p>
            <div className="card-actions justify-center mt-4">
              <Button onClick={() => navigate('/')} type="primary">
                {t('common.returnHome') || 'Return Home'}
              </Button>
              <Button onClick={() => navigate('/media')} ghost>
                {t('nav.media') || 'Browse Media'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
