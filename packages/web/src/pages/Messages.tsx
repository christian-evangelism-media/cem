import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { DateTime } from 'luxon'
import { api } from '../services/api'
import { Badge, Button, Card, Container, Loading, Modal, Typography } from 'asterui'

const { Title, Paragraph, Text } = Typography

interface Message {
  id: number
  userId: number
  orderId: number | null
  type: 'contact' | 'announcement' | 'order_feedback'
  isBroadcast: boolean
  subject: string
  body: string
  isRead: boolean
  respondedById: number | null
  responseBody: string | null
  respondedAt: string | null
  createdAt: string
  user: {
    id: number
    email: string
    firstName: string
    lastName: string
  }
  respondedBy?: {
    id: number
    email: string
    firstName: string
    lastName: string
  }
  order?: {
    id: number
  }
}

interface MessagesResponse {
  messages: Message[]
  unreadCount: number
}

export default function Messages() {
  const { t, i18n } = useTranslation()
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

  const { data, isLoading } = useQuery<MessagesResponse>({
    queryKey: ['messages'],
    queryFn: () => api.get('/messages'),
    refetchInterval: 900000, // Poll every 15 minutes
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading size="lg" />
      </div>
    )
  }

  // Filter to only show messages that have responses or are broadcasts (announcements)
  const receivedMessages = data?.messages.filter(msg => msg.isBroadcast || msg.responseBody) || []
  const announcements = receivedMessages.filter(msg => msg.isBroadcast)
  const responses = receivedMessages.filter(msg => !msg.isBroadcast && msg.responseBody)

  return (
    <Container size="2xl" className="p-4">
      <Title level={1} className="text-3xl mb-6">{t('messages.title')}</Title>

      {receivedMessages.length === 0 ? (
        <Card className="shadow-xl">
          <div className="text-center text-base-content/70">
            {t('messages.noMessages')}
          </div>
        </Card>
      ) : (
        <>
          {/* Announcements Section */}
          {announcements.length > 0 && (
            <div className="mb-8">
              <Title level={2} className="text-2xl mb-4">{t('messages.announcements')}</Title>
              <div className="space-y-4">
                {announcements.map((message) => (
                  <Card
                    key={message.id}
                    className="shadow-xl cursor-pointer hover:shadow-2xl transition-shadow"
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="flex justify-between items-start">
                      <Title level={3} className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-primary"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                          />
                        </svg>
                        {message.subject}
                      </Title>
                      <Text className="text-sm text-base-content/70">
                        {DateTime.fromISO(message.createdAt)
                          .setLocale(i18n.language)
                          .toLocaleString(DateTime.DATETIME_SHORT)}
                      </Text>
                    </div>
                    <Paragraph className="text-base-content/70 line-clamp-2">{message.body}</Paragraph>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Responses Section */}
          {responses.length > 0 && (
            <div>
              <div className="space-y-4">
                {responses.map((message) => (
                  <Card
                    key={message.id}
                    className="shadow-xl cursor-pointer hover:shadow-2xl transition-shadow border-l-4 border-success"
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <Title level={3}>{message.subject}</Title>
                        {message.orderId && (
                          <Badge>
                            {t('messages.orderBadge', { id: message.orderId })}
                          </Badge>
                        )}
                        <Badge color="success">{t('messages.responded')}</Badge>
                      </div>
                      <Text className="text-sm text-base-content/70">
                        {message.respondedAt
                          ? DateTime.fromISO(message.respondedAt)
                              .setLocale(i18n.language)
                              .toLocaleString(DateTime.DATETIME_SHORT)
                          : DateTime.fromISO(message.createdAt)
                              .setLocale(i18n.language)
                              .toLocaleString(DateTime.DATETIME_SHORT)}
                      </Text>
                    </div>
                    <Paragraph className="text-base-content/70 line-clamp-2">{message.responseBody}</Paragraph>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Message Detail Modal */}
      <Modal
        open={!!selectedMessage}
        onClose={() => setSelectedMessage(null)}
        title={
          selectedMessage && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {selectedMessage.isBroadcast && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                    />
                  </svg>
                )}
                <span>{selectedMessage.subject}</span>
              </div>
              {selectedMessage.orderId && (
                <Badge>
                  {t('messages.orderBadge', { id: selectedMessage.orderId })}
                </Badge>
              )}
            </div>
          )
        }
        width="48rem"
        footer={
          <Button onClick={() => setSelectedMessage(null)}>
            {t('common.close')}
          </Button>
        }
      >
        {selectedMessage && (
          <>
            {/* Show announcement body for broadcasts */}
            {selectedMessage.isBroadcast && (
              <>
                <Text className="text-sm mb-4 text-base-content/70">
                  {DateTime.fromISO(selectedMessage.createdAt)
                    .setLocale(i18n.language)
                    .toLocaleString(DateTime.DATETIME_FULL)}
                </Text>
                <div className="mb-6 p-4 bg-base-200 rounded">
                  <Paragraph className="whitespace-pre-wrap">{selectedMessage.body}</Paragraph>
                </div>
              </>
            )}

            {/* Show original message and response for non-broadcasts */}
            {!selectedMessage.isBroadcast && (
              <>
                <div className="mb-4">
                  <Title level={4} className="mb-2">{t('messages.yourMessage')}</Title>
                  <div className="p-4 bg-base-200 rounded">
                    <Text className="text-xs text-base-content/70 mb-2">
                      {DateTime.fromISO(selectedMessage.createdAt)
                        .setLocale(i18n.language)
                        .toLocaleString(DateTime.DATETIME_FULL)}
                    </Text>
                    <Paragraph className="whitespace-pre-wrap">{selectedMessage.body}</Paragraph>
                  </div>
                </div>

                {selectedMessage.responseBody && (
                  <div className="mb-4">
                    <Title level={4} className="mb-2 flex items-center gap-2">
                      {t('messages.response')}
                      <Badge color="success" size="sm">{t('messages.responded')}</Badge>
                    </Title>
                    <div className="p-4 bg-success bg-opacity-10 rounded border border-success">
                      <Paragraph className="whitespace-pre-wrap">{selectedMessage.responseBody}</Paragraph>
                      {selectedMessage.respondedBy && selectedMessage.respondedAt && (
                        <Text className="text-xs text-base-content/70 mt-3 pt-3 border-t border-success/30">
                          {t('messages.respondedBy')}{' '}
                          {selectedMessage.respondedBy.firstName} {selectedMessage.respondedBy.lastName}{' '}
                          {t('messages.on')}{' '}
                          {DateTime.fromISO(selectedMessage.respondedAt)
                            .setLocale(i18n.language)
                            .toLocaleString(DateTime.DATETIME_FULL)}
                        </Text>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Modal>
    </Container>
  )
}
