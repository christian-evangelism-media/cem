import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSendMessage } from '../hooks/useMessageQueries'
import { Alert, Button, Form, Input, Modal, Space, Textarea } from 'asterui'

interface FeedbackModalProps {
  orderId: number
  orderNumber: number
  onClose: () => void
}

export default function FeedbackModal({ orderId, orderNumber, onClose }: FeedbackModalProps) {
  const { t } = useTranslation()
  const sendMessage = useSendMessage()

  const handleSubmit = (values: any) => {
    sendMessage.mutate(
      {
        subject: values.subject,
        body: values.feedback,
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
    <Modal
      open={true}
      onClose={onClose}
      title={t('feedback.title', { orderNumber })}
      width="48rem"
      footer={null}
    >
      <Form
        onFinish={handleSubmit}
        initialValues={{
          subject: t('feedback.defaultSubject', { orderNumber }),
          feedback: '',
        }}
      >
        <Form.Item name="subject" label={t('feedback.subjectLabel')} rules={{ required: true, max: 200 }}>
          <Input className="w-full" maxLength={200} />
        </Form.Item>

        <Form.Item name="feedback" label={t('feedback.feedbackLabel')} rules={{ required: true }}>
          <Textarea
            className="w-full h-40 resize-none"
            placeholder={t('feedback.placeholder')}
          />
        </Form.Item>

        {sendMessage.isError && (
          <Alert color="error">
            {sendMessage.error instanceof Error
              ? sendMessage.error.message
              : t('feedback.error')}
          </Alert>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button
            ghost
            onClick={onClose}
            disabled={sendMessage.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button
            htmlType="submit"
            color="primary"
            loading={sendMessage.isPending}
          >
            {t('feedback.submit')}
          </Button>
        </div>
      </Form>
    </Modal>
  )
}
