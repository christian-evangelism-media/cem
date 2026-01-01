import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { message, Modal, Button, Form, Input, Textarea, Alert } from 'asterui'
import { api } from '../services/api'

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const sendMessageMutation = useMutation({
    mutationFn: (data: { subject: string; body: string }) =>
      api.post('/messages', data),
    onSuccess: () => {
      message.success(t('contact.messageSent'))
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      setSubject('')
      setBody('')
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (subject.trim() && body.trim()) {
      sendMessageMutation.mutate({ subject: subject.trim(), body: body.trim() })
    }
  }

  const handleClose = () => {
    setSubject('')
    setBody('')
    onClose()
  }

  return (
    <Modal
      open={isOpen}
      onCancel={handleClose}
      title={t('contact.title')}
      width={768}
      footer={[
        <Button
          key="cancel"
          onClick={handleClose}
          disabled={sendMessageMutation.isPending}
        >
          {t('common.cancel')}
        </Button>,
        <Button
          key="submit"
          type="primary"
          htmlType="submit"
          form="contact-form"
          disabled={!subject.trim() || !body.trim() || sendMessageMutation.isPending}
          loading={sendMessageMutation.isPending}
        >
          {t('contact.send')}
        </Button>,
      ]}
    >
      <Alert type="info" className="mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-current shrink-0 w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{t('contact.responseTime')}</span>
      </Alert>

      <form id="contact-form" onSubmit={handleSubmit} className="space-y-4">
        <Form.Item label={<span className="font-medium">{t('contact.subject')}</span>}>
          <Input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('contact.subjectPlaceholder')}
            maxLength={200}
            required
          />
        </Form.Item>

        <Form.Item label={<span className="font-medium">{t('contact.message')}</span>}>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('contact.messagePlaceholder')}
            required
            rows={10}
            className="resize-none"
          />
        </Form.Item>

        {sendMessageMutation.isError && (
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
            <span>
              {sendMessageMutation.error instanceof Error
                ? sendMessageMutation.error.message
                : t('contact.messageError')}
            </span>
          </Alert>
        )}
      </form>
    </Modal>
  )
}
