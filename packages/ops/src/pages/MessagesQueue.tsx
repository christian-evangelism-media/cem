import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { DateTime } from 'luxon'
import { Card, Badge, Button, Loading, Textarea, Modal, Typography, Grid } from 'asterui'
import { api } from '../services/api'

const { Text, Title } = Typography
const { Row, Col } = Grid

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

export default function MessagesQueue() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [responseBody, setResponseBody] = useState('')

  const { data, isLoading } = useQuery<MessagesResponse>({
    queryKey: ['messages'],
    queryFn: () => api.messages.list(),
    refetchInterval: 10000, // Poll every 10 seconds
  })

  const toggleReadMutation = useMutation({
    mutationFn: (id: number) => api.messages.toggleRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
  })

  const respondMutation = useMutation({
    mutationFn: ({ id, responseBody }: { id: number; responseBody: string }) =>
      api.messages.respond(id, responseBody),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      setSelectedMessage(null)
      setResponseBody('')
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading size="lg" />
      </div>
    )
  }

  const unreadMessages = data?.messages.filter(msg => !msg.isRead && !msg.isBroadcast).length || 0
  const contactMessages = data?.messages.filter(msg => msg.type === 'contact').length || 0
  const feedbackMessages = data?.messages.filter(msg => msg.type === 'order_feedback').length || 0

  const handleRespond = () => {
    if (selectedMessage && responseBody.trim()) {
      respondMutation.mutate({ id: selectedMessage.id, responseBody: responseBody.trim() })
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">{t('messagesQueue.title')}</h1>

      <Row gutter={16} className="mb-6">
        <Col xs={24} md={8}>
          <Card className="shadow p-4">
            <Text className="text-xs opacity-70">{t('messagesQueue.unread')}</Text>
            <Title level={2} className="text-2xl text-warning">{unreadMessages}</Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="shadow p-4">
            <Text className="text-xs opacity-70">{t('messagesQueue.contact')}</Text>
            <Title level={2} className="text-2xl text-info">{contactMessages}</Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="shadow p-4">
            <Text className="text-xs opacity-70">{t('messagesQueue.feedback')}</Text>
            <Title level={2} className="text-2xl text-secondary">{feedbackMessages}</Title>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-xl">
        <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-16">{t('messagesQueue.id')}</th>
                  <th className="w-32">{t('messagesQueue.type')}</th>
                  <th>{t('messagesQueue.from')}</th>
                  <th>{t('messagesQueue.subject')}</th>
                  <th className="w-24">{t('messagesQueue.order')}</th>
                  <th className="w-32">{t('messagesQueue.status')}</th>
                  <th className="w-44">{t('messagesQueue.received')}</th>
                  <th className="w-32">{t('messagesQueue.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data?.messages && data.messages.length > 0 ? (
                  data.messages
                    .filter(msg => !msg.isBroadcast) // Don't show broadcasts in queue
                    .map((message) => (
                      <tr
                        key={message.id}
                        className={!message.isRead ? 'bg-warning bg-opacity-10' : ''}
                      >
                        <td>{message.id}</td>
                        <td>
                          <Badge color={
                            message.type === 'contact' ? 'info' :
                            message.type === 'order_feedback' ? 'secondary' :
                            'default'
                          }>
                            {t(`messagesQueue.types.${message.type}`)}
                          </Badge>
                        </td>
                        <td>
                          <div>
                            <div className="font-medium">
                              {message.user.firstName} {message.user.lastName}
                            </div>
                            <div className="text-xs text-gray-500">{message.user.email}</div>
                          </div>
                        </td>
                        <td>
                          <div className="max-w-md">
                            <div className="font-medium truncate">{message.subject}</div>
                            <div className="text-sm text-gray-500 truncate">{message.body}</div>
                          </div>
                        </td>
                        <td>
                          {message.orderId ? (
                            <Badge color="default">#{message.orderId}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td>
                          {message.responseBody ? (
                            <div>
                              <Badge color="success">
                                {t('messagesQueue.responded')}
                              </Badge>
                              {message.respondedBy && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {message.respondedBy.firstName} {message.respondedBy.lastName}
                                </div>
                              )}
                            </div>
                          ) : message.isRead ? (
                            <Badge color="info">{t('messagesQueue.read')}</Badge>
                          ) : (
                            <Badge color="warning">{t('messagesQueue.unread')}</Badge>
                          )}
                        </td>
                        <td>
                          {DateTime.fromISO(message.createdAt)
                            .setLocale(i18n.language)
                            .toLocaleString(DateTime.DATETIME_SHORT)}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              color="info"
                              onClick={() => {
                                setSelectedMessage(message)
                                setResponseBody(message.responseBody || '')
                              }}
                            >
                              {t('messagesQueue.view')}
                            </Button>
                            {!message.isRead && (
                              <Button
                                size="sm"
                                ghost
                                onClick={() => toggleReadMutation.mutate(message.id)}
                                disabled={toggleReadMutation.isPending}
                              >
                                {t('messagesQueue.markRead')}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center text-gray-500">
                      {t('messagesQueue.noMessages')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>
      </Card>

      {/* Message Detail Modal */}
      <Modal
        open={selectedMessage !== null}
        onCancel={() => {
          setSelectedMessage(null)
          setResponseBody('')
        }}
        title={
          <div>
            {selectedMessage?.subject}
            <Badge
              color={
                selectedMessage?.type === 'contact' ? 'info' :
                selectedMessage?.type === 'order_feedback' ? 'secondary' :
                'default'
              }
              className="ml-2"
            >
              {selectedMessage && t(`messagesQueue.types.${selectedMessage.type}`)}
            </Badge>
          </div>
        }
        width={768}
        footer={[
          !selectedMessage?.responseBody && (
            <Button
              key="respond"
              type="primary"
              onClick={handleRespond}
              disabled={!responseBody.trim() || respondMutation.isPending}
              loading={respondMutation.isPending}
            >
              {t('messagesQueue.sendResponse')}
            </Button>
          ),
          <Button
            key="close"
            onClick={() => {
              setSelectedMessage(null)
              setResponseBody('')
            }}
          >
            {t('common.close')}
          </Button>
        ]}
      >
        {selectedMessage && (
          <div>

            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-2">
                <strong>{t('messagesQueue.from')}:</strong> {selectedMessage.user.firstName}{' '}
                {selectedMessage.user.lastName} ({selectedMessage.user.email})
              </div>
              {selectedMessage.orderId && (
                <div className="text-sm text-gray-500 mb-2">
                  <strong>{t('messagesQueue.order')}:</strong> #{selectedMessage.orderId}
                </div>
              )}
              <div className="text-sm text-gray-500 mb-2">
                <strong>{t('messagesQueue.received')}:</strong>{' '}
                {DateTime.fromISO(selectedMessage.createdAt)
                  .setLocale(i18n.language)
                  .toLocaleString(DateTime.DATETIME_FULL)}
              </div>
            </div>

            <div className="mb-4 p-4 bg-base-200 rounded">
              <p className="whitespace-pre-wrap">{selectedMessage.body}</p>
            </div>

            {selectedMessage.responseBody && (
              <div className="mb-4">
                <h4 className="font-bold mb-2">{t('messagesQueue.response')}</h4>
                <div className="p-4 bg-success bg-opacity-10 rounded border border-success">
                  <p className="whitespace-pre-wrap">{selectedMessage.responseBody}</p>
                  {selectedMessage.respondedBy && selectedMessage.respondedAt && (
                    <div className="text-xs text-gray-500 mt-2">
                      {t('messagesQueue.respondedBy')}{' '}
                      {selectedMessage.respondedBy.firstName} {selectedMessage.respondedBy.lastName}{' '}
                      {t('messagesQueue.on')}{' '}
                      {DateTime.fromISO(selectedMessage.respondedAt)
                        .setLocale(i18n.language)
                        .toLocaleString(DateTime.DATETIME_FULL)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!selectedMessage.responseBody && (
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">
                  {t('messagesQueue.yourResponse')}
                </label>
                <Textarea
                  rows={4}
                  className="w-full"
                  value={responseBody}
                  onChange={(e) => setResponseBody(e.target.value)}
                  placeholder={t('messagesQueue.responsePlaceholder')}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
