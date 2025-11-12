import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
        <span className="loading loading-spinner loading-lg"></span>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">{t('messagesQueue.unread')}</div>
            <div className="stat-value text-warning">{unreadMessages}</div>
          </div>
        </div>
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">{t('messagesQueue.contact')}</div>
            <div className="stat-value text-info">{contactMessages}</div>
          </div>
        </div>
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">{t('messagesQueue.feedback')}</div>
            <div className="stat-value text-secondary">{feedbackMessages}</div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
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
                          <span className={`badge ${
                            message.type === 'contact' ? 'badge-info' :
                            message.type === 'order_feedback' ? 'badge-secondary' :
                            'badge-neutral'
                          }`}>
                            {t(`messagesQueue.types.${message.type}`)}
                          </span>
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
                            <span className="badge badge-ghost">#{message.orderId}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td>
                          {message.responseBody ? (
                            <div>
                              <span className="badge badge-success">
                                {t('messagesQueue.responded')}
                              </span>
                              {message.respondedBy && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {message.respondedBy.firstName} {message.respondedBy.lastName}
                                </div>
                              )}
                            </div>
                          ) : message.isRead ? (
                            <span className="badge badge-info">{t('messagesQueue.read')}</span>
                          ) : (
                            <span className="badge badge-warning">{t('messagesQueue.unread')}</span>
                          )}
                        </td>
                        <td>
                          {DateTime.fromISO(message.createdAt)
                            .setLocale(i18n.language)
                            .toLocaleString(DateTime.DATETIME_SHORT)}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => {
                                setSelectedMessage(message)
                                setResponseBody(message.responseBody || '')
                              }}
                            >
                              {t('messagesQueue.view')}
                            </button>
                            {!message.isRead && (
                              <button
                                className="btn btn-sm btn-ghost"
                                onClick={() => toggleReadMutation.mutate(message.id)}
                                disabled={toggleReadMutation.isPending}
                              >
                                {t('messagesQueue.markRead')}
                              </button>
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
        </div>
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <h3 className="font-bold text-lg mb-4">
              {selectedMessage.subject}
              <span className={`badge ml-2 ${
                selectedMessage.type === 'contact' ? 'badge-info' :
                selectedMessage.type === 'order_feedback' ? 'badge-secondary' :
                'badge-neutral'
              }`}>
                {t(`messagesQueue.types.${selectedMessage.type}`)}
              </span>
            </h3>

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
                <label className="label">
                  <span className="label-text font-bold">{t('messagesQueue.yourResponse')}</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full h-32"
                  value={responseBody}
                  onChange={(e) => setResponseBody(e.target.value)}
                  placeholder={t('messagesQueue.responsePlaceholder')}
                />
              </div>
            )}

            <div className="modal-action">
              {!selectedMessage.responseBody && (
                <button
                  className="btn btn-primary"
                  onClick={handleRespond}
                  disabled={!responseBody.trim() || respondMutation.isPending}
                >
                  {respondMutation.isPending ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    t('messagesQueue.sendResponse')
                  )}
                </button>
              )}
              <button
                className="btn"
                onClick={() => {
                  setSelectedMessage(null)
                  setResponseBody('')
                }}
              >
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
