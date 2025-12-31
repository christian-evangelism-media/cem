import { } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { $api } from '../services/tuyau'
import { Alert, Button, Card, Container } from 'asterui'
import { CheckCircleIcon } from '@aster-ui/icons'

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
      <Container size="md" className="py-8">
        <Alert type="error">
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
        </Alert>
        <Button onClick={() => navigate('/')} type="primary" block className="mt-4">
          {t('common.returnHome') || 'Return Home'}
        </Button>
      </Container>
    )
  }

  if (isLoading) {
    return (
      <Container size="md" className="py-8">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4">{t('donate.verifying') || 'Verifying your donation...'}</p>
        </div>
      </Container>
    )
  }

  return (
    <Container size="md" className="py-8">
      <Card
        variant="shadow"
        bodyClassName="text-center"
        title={
          <>
            <div className="flex justify-center mb-4">
              <CheckCircleIcon size={64} className="text-success" />
            </div>
            <span className="block text-center text-2xl">
              {t('donate.thankYou') || 'Thank You!'}
            </span>
          </>
        }
        actions={
          <>
            <Button onClick={() => navigate('/')} type="primary">
              {t('common.returnHome') || 'Return Home'}
            </Button>
            <Button onClick={() => navigate('/media')} ghost>
              {t('nav.media') || 'Browse Media'}
            </Button>
          </>
        }
        actionsJustify="center"
      >
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
      </Card>
    </Container>
  )
}
