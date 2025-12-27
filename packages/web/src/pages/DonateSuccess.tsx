import { } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { $api } from '../services/tuyau'

export default function DonateSuccess() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const { data: donation, isLoading } = useQuery({
    queryKey: ['donation', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('No session ID')
      const response = await $api.donations.session({ sessionId }).$get()
      return response.data && 'donation' in response.data ? response.data.donation : null
    },
    enabled: !!sessionId,
  })

  if (!sessionId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="alert alert-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{t('donate.invalidSession') || 'Invalid donation session'}</span>
          </div>
          <button onClick={() => navigate('/')} className="btn btn-primary mt-4 w-full">
            {t('common.returnHome') || 'Return Home'}
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4">{t('donate.verifying') || 'Verifying your donation...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <div className="flex justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="card-title justify-center text-2xl">
              {t('donate.thankYou') || 'Thank You!'}
            </h2>
            <p className="text-lg">
              {t('donate.successMessage') ||
                'Your donation has been received successfully.'}
            </p>
            {donation && (
              <div className="stats stats-vertical shadow mt-4">
                <div className="stat">
                  <div className="stat-title">{t('donate.amount') || 'Amount'}</div>
                  <div className="stat-value text-primary">
                    ${donation.amount.toFixed(2)}
                  </div>
                  <div className="stat-desc">{donation.currency}</div>
                </div>
                {donation.message && (
                  <div className="stat">
                    <div className="stat-title">{t('donate.yourMessage') || 'Your Message'}</div>
                    <div className="stat-desc text-left">{donation.message}</div>
                  </div>
                )}
              </div>
            )}
            <p className="mt-4 text-sm opacity-70">
              {t('donate.receiptEmail') ||
                'A receipt has been sent to your email address.'}
            </p>
            <div className="card-actions justify-center mt-4">
              <button onClick={() => navigate('/')} className="btn btn-primary">
                {t('common.returnHome') || 'Return Home'}
              </button>
              <button onClick={() => navigate('/media')} className="btn btn-ghost">
                {t('nav.media') || 'Browse Media'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
