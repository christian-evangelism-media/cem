import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button, Container, Result } from 'asterui'

export default function DonateCancel() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Container size="md" className="py-8">
      <Result
        status="warning"
        title={t('donate.cancelled') || 'Donation Cancelled'}
        subTitle={t('donate.cancelMessage') || 'Your donation was cancelled. No charges were made.'}
        extra={
          <>
            <Button onClick={() => navigate('/')} type="primary">
              {t('common.returnHome') || 'Return Home'}
            </Button>
            <Button onClick={() => navigate('/media')} ghost>
              {t('nav.media') || 'Browse Media'}
            </Button>
          </>
        }
      >
        <p className="text-sm opacity-70">
          {t('donate.cancelHelp') || 'If you experienced any issues, please contact us.'}
        </p>
      </Result>
    </Container>
  )
}
