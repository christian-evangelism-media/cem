import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Container } from 'asterui'
import { ExclamationTriangleIcon } from '@aster-ui/icons'

export default function DonateCancel() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <Container size="md" className="py-8">
      <Card
        variant="shadow"
        bodyClassName="text-center"
        title={
          <>
            <div className="flex justify-center mb-4">
              <ExclamationTriangleIcon size={64} className="text-warning" />
            </div>
            <span className="block text-center text-2xl">
              {t('donate.cancelled') || 'Donation Cancelled'}
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
          {t('donate.cancelMessage') ||
            'Your donation was cancelled. No charges were made.'}
        </p>
        <p className="mt-4 text-sm opacity-70">
          {t('donate.cancelHelp') ||
            'If you experienced any issues, please contact us.'}
        </p>
      </Card>
    </Container>
  )
}
