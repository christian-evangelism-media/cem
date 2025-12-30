import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { DateTime } from 'luxon'
import { Modal, Button, Card, Badge, Alert } from 'asterui'
import type { Message } from '../types'
import { api } from '../services/api'

interface FeedbackModalProps {
  messages: Message[]
  orderNumber: number
  onClose: () => void
}

export default function FeedbackModal({ messages, orderNumber, onClose }: FeedbackModalProps) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()

  const toggleReadMutation = useMutation({
    mutationFn: (messageId: number) => api.messages.toggleRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })

  return (
    <Modal
      open={true}
      onCancel={onClose}
      title={t('orders.feedbackForOrder', { orderNumber })}
      width={768}
      footer={[
        <Button key="close" onClick={onClose}>
          {t('common.close')}
        </Button>
      ]}
    >
      <div className="space-y-4">
        {messages.length === 0 ? (
          <Alert color="info">
            {t('orders.noFeedback')}
          </Alert>
        ) : (
          messages.map((message) => (
            <Card key={message.id} className="bg-base-200">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-lg">{message.subject}</h4>
                  <p className="text-sm text-base-content/70">
                    {message.user && `${message.user.firstName} ${message.user.lastName}`}
                    {' • '}
                    {DateTime.fromISO(message.createdAt)
                      .setLocale(i18n.language)
                      .toLocaleString(DateTime.DATETIME_MED)}
                  </p>
                </div>
                <Badge
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  color={message.isRead ? 'success' : 'primary'}
                  onClick={() => toggleReadMutation.mutate(message.id)}
                  title={message.isRead ? 'Click to mark as unread' : 'Click to mark as read'}
                >
                  {message.isRead ? t('orders.read') : t('orders.unread')}
                </Badge>
              </div>
              <p className="whitespace-pre-wrap">{message.body}</p>

              {message.responseBody && (
                <div className="mt-4 p-3 bg-base-100 rounded-lg border-l-4 border-primary">
                  <p className="text-sm font-semibold mb-1">{t('orders.response')}</p>
                  <p className="text-sm whitespace-pre-wrap">{message.responseBody}</p>
                  {message.respondedAt && (
                    <p className="text-xs text-base-content/60 mt-2">
                      {DateTime.fromISO(message.respondedAt)
                        .setLocale(i18n.language)
                        .toLocaleString(DateTime.DATETIME_MED)}
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </Modal>
  )
}
