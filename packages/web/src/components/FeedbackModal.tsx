import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSendMessage } from '../hooks/useMessageQueries'
import { Alert, Button, Input, Typography } from 'asterui'

const { Title } = Typography
const { TextArea } = Input

interface FeedbackModalProps {
  orderId: number
  orderNumber: number
  onClose: () => void
}

export default function FeedbackModal({ orderId, orderNumber, onClose }: FeedbackModalProps) {
  const { t } = useTranslation()
  const sendMessage = useSendMessage()
  const [feedback, setFeedback] = useState('')
  const [subject, setSubject] = useState(t('feedback.defaultSubject', { orderNumber }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    sendMessage.mutate(
      {
        subject,
        body: feedback,
        orderId,
      },
      {
        onSuccess: () => {
          onClose()
        },
      }
    )
  }

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <Title level={3} className="text-xl mb-6">
          {t('feedback.title', { orderNumber })}
        </Title>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('feedback.subjectLabel')}</span>
            </label>
            <Input
              className="w-full"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              maxLength={200}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">{t('feedback.feedbackLabel')}</span>
            </label>
            <TextArea
              className="w-full h-40 resize-none"
              placeholder={t('feedback.placeholder')}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              required
            />
          </div>

          {sendMessage.isError && (
            <Alert type="error">
              {sendMessage.error instanceof Error
                ? sendMessage.error.message
                : t('feedback.error')}
            </Alert>
          )}

          <div className="modal-action mt-6">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={sendMessage.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              htmlType="submit"
              color="primary"
              loading={sendMessage.isPending}
              disabled={!feedback.trim()}
            >
              {t('feedback.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
