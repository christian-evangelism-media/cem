import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { DateTime } from 'luxon'
import { api } from '../services/api'

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
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  // Filter to only show messages that have responses or are broadcasts (announcements)
  const receivedMessages = data?.messages.filter(msg => msg.isBroadcast || msg.responseBody) || []
  const announcements = receivedMessages.filter(msg => msg.isBroadcast)
  const responses = receivedMessages.filter(msg => !msg.isBroadcast && msg.responseBody)

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">{t('messages.title')}</h1>

      {receivedMessages.length === 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center text-base-content/70">
            {t('messages.noMessages')}
          </div>
        </div>
      ) : (
        <>
          {/* Announcements Section */}
          {announcements.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{t('messages.announcements')}</h2>
              <div className="space-y-4">
                {announcements.map((message) => (
                  <div
                    key={message.id}
                    className="card bg-base-100 shadow-xl cursor-pointer hover:shadow-2xl transition-shadow"
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="card-body">
                      <div className="flex justify-between items-start">
                        <h3 className="card-title">
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
                        </h3>
                        <span className="text-sm text-base-content/70">
                          {DateTime.fromISO(message.createdAt)
                            .setLocale(i18n.language)
                            .toLocaleString(DateTime.DATETIME_SHORT)}
                        </span>
                      </div>
                      <p className="text-base-content/70 line-clamp-2">{message.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Responses Section */}
          {responses.length > 0 && (
            <div>
              <div className="space-y-4">
                {responses.map((message) => (
                  <div
                    key={message.id}
                    className="card bg-base-100 shadow-xl cursor-pointer hover:shadow-2xl transition-shadow border-l-4 border-success"
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="card-body">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <h3 className="card-title">{message.subject}</h3>
                          {message.orderId && (
                            <span className="badge badge-ghost">
                              {t('messages.orderBadge', { id: message.orderId })}
                            </span>
                          )}
                          <span className="badge badge-success">{t('messages.responded')}</span>
                        </div>
                        <span className="text-sm text-base-content/70">
                          {message.respondedAt
                            ? DateTime.fromISO(message.respondedAt)
                                .setLocale(i18n.language)
                                .toLocaleString(DateTime.DATETIME_SHORT)
                            : DateTime.fromISO(message.createdAt)
                                .setLocale(i18n.language)
                                .toLocaleString(DateTime.DATETIME_SHORT)}
                        </span>
                      </div>
                      <p className="text-base-content/70 line-clamp-2">{message.responseBody}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-xl">
                {selectedMessage.isBroadcast && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-primary inline mr-2"
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
                {selectedMessage.subject}
              </h3>
              {selectedMessage.orderId && (
                <span className="badge badge-ghost">
                  {t('messages.orderBadge', { id: selectedMessage.orderId })}
                </span>
              )}
            </div>

            {/* Show announcement body for broadcasts */}
            {selectedMessage.isBroadcast && (
              <>
                <div className="mb-4 text-sm text-base-content/70">
                  {DateTime.fromISO(selectedMessage.createdAt)
                    .setLocale(i18n.language)
                    .toLocaleString(DateTime.DATETIME_FULL)}
                </div>
                <div className="mb-6 p-4 bg-base-200 rounded">
                  <p className="whitespace-pre-wrap">{selectedMessage.body}</p>
                </div>
              </>
            )}

            {/* Show original message and response for non-broadcasts */}
            {!selectedMessage.isBroadcast && (
              <>
                <div className="mb-4">
                  <h4 className="font-bold mb-2">{t('messages.yourMessage')}</h4>
                  <div className="p-4 bg-base-200 rounded">
                    <div className="text-xs text-base-content/70 mb-2">
                      {DateTime.fromISO(selectedMessage.createdAt)
                        .setLocale(i18n.language)
                        .toLocaleString(DateTime.DATETIME_FULL)}
                    </div>
                    <p className="whitespace-pre-wrap">{selectedMessage.body}</p>
                  </div>
                </div>

                {selectedMessage.responseBody && (
                  <div className="mb-4">
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                      {t('messages.response')}
                      <span className="badge badge-success badge-sm">{t('messages.responded')}</span>
                    </h4>
                    <div className="p-4 bg-success bg-opacity-10 rounded border border-success">
                      <p className="whitespace-pre-wrap">{selectedMessage.responseBody}</p>
                      {selectedMessage.respondedBy && selectedMessage.respondedAt && (
                        <div className="text-xs text-base-content/70 mt-3 pt-3 border-t border-success/30">
                          {t('messages.respondedBy')}{' '}
                          {selectedMessage.respondedBy.firstName} {selectedMessage.respondedBy.lastName}{' '}
                          {t('messages.on')}{' '}
                          {DateTime.fromISO(selectedMessage.respondedAt)
                            .setLocale(i18n.language)
                            .toLocaleString(DateTime.DATETIME_FULL)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="modal-action">
              <button className="btn" onClick={() => setSelectedMessage(null)}>
                {t('common.close')}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setSelectedMessage(null)}></div>
        </div>
      )}
    </div>
  )
}
