import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { DateTime } from 'luxon'
import { Loading, Badge, Select, Button, Input, Textarea, Card, Form } from 'asterui'
import { api } from '../services/api'
import type { Order, PaginatedResponse } from '../types'
import FeedbackModal from '../components/FeedbackModal'

const statusOptions = ['pending', 'processing', 'packing', 'ready', 'shipping', 'shipped', 'awaiting', 'collected', 'cancelling', 'cancelled']

export default function Orders() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [editingTrackingId, setEditingTrackingId] = useState<number | null>(null)
  const [trackingValue, setTrackingValue] = useState('')
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null)
  const [notesValue, setNotesValue] = useState('')
  const [feedbackOrderId, setFeedbackOrderId] = useState<number | null>(null)
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation()

  const { data, isLoading } = useQuery<PaginatedResponse<Order>>({
    queryKey: ['orders', page],
    queryFn: () => api.orders.list({ page, limit: 20 }),
    refetchInterval: 10000, // Poll every 10 seconds for new orders
  })

  const getProcessor = (order: Order) => {
    if (!order.statusChanges) return null
    const firstNonPending = order.statusChanges.find(change => change.status !== 'pending')
    return firstNonPending?.changedByUser || null
  }

  const getStatusBadgeColor = (status: string): 'warning' | 'info' | 'primary' | 'accent' | 'success' | 'error' | 'default' => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'processing':
      case 'packing':
        return 'info'
      case 'ready':
      case 'awaiting':
        return 'primary'
      case 'shipping':
        return 'accent'
      case 'shipped':
      case 'collected':
        return 'success'
      case 'cancelling':
      case 'cancelled':
        return 'error'
      default:
        return 'default'
    }
  }

  const getDeliveryMethodBadge = (deliveryMethod: 'shipping' | 'pickup'): 'secondary' | 'default' => {
    if (deliveryMethod === 'pickup') {
      return 'secondary'
    }
    return 'default'
  }

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.orders.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  const updateTrackingMutation = useMutation({
    mutationFn: ({ id, trackingNumber }: { id: number; trackingNumber: string }) =>
      api.orders.updateTrackingNumber(id, trackingNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setEditingTrackingId(null)
      setTrackingValue('')
    },
  })

  const updateNotesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) =>
      api.orders.updateNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setEditingNotesId(null)
      setNotesValue('')
    },
  })

  const startEditTracking = (order: Order) => {
    setEditingTrackingId(order.id)
    setTrackingValue(order.trackingNumber || '')
  }

  const saveTracking = (orderId: number) => {
    updateTrackingMutation.mutate({ id: orderId, trackingNumber: trackingValue })
  }

  const cancelEditTracking = () => {
    setEditingTrackingId(null)
    setTrackingValue('')
  }

  const startEditNotes = (order: Order) => {
    setEditingNotesId(order.id)
    setNotesValue(order.notes || '')
  }

  const saveNotes = (orderId: number) => {
    updateNotesMutation.mutate({ id: orderId, notes: notesValue })
  }

  const cancelEditNotes = () => {
    setEditingNotesId(null)
    setNotesValue('')
  }

  const filteredOrders = statusFilter === 'all'
    ? data?.data
    : data?.data.filter(order => order.status === statusFilter)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading size="lg" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">{t('orders.title')}</h1>

      <Card className="shadow-xl">
          <div className="mb-4">
            <Form.Item label={t('orders.filterByStatus')}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">{t('orders.allOrders')}</option>
                <option value="cancelling">{t('orders.statuses.cancelling')}</option>
                <option value="cancelled">{t('orders.statuses.cancelled')}</option>
                {statusOptions.filter(s => s !== 'cancelled' && s !== 'cancelling').map((status) => (
                  <option key={status} value={status}>
                    {t(`orders.statuses.${status}`)}
                  </option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-16">{t('orders.id')}</th>
                  <th>{t('orders.user')}</th>
                  <th className="w-32">{t('orders.deliveryMethod')}</th>
                  <th className="w-40">{t('orders.status')}</th>
                  <th>{t('dashboard.processor')}</th>
                  <th className="w-24">{t('orders.items')}</th>
                  <th className="w-24">{t('orders.feedback')}</th>
                  <th className="w-48">{t('orders.trackingNumber')}</th>
                  <th className="w-64">{t('orders.notes')}</th>
                  <th className="w-44">{t('orders.ordered')}</th>
                  <th className="w-32">{t('orders.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders?.map((order) => (
                  <tr
                    key={order.id}
                    className={order.status === 'cancelling' ? 'bg-warning bg-opacity-20' : ''}
                  >
                    <td>{order.id}</td>
                    <td>
                      {order.user ? (
                        <div className="font-medium">
                          {order.user.firstName} {order.user.lastName}
                        </div>
                      ) : (
                        t('common.userNumber', { id: order.userId })
                      )}
                    </td>
                    <td>
                      <Badge color={getDeliveryMethodBadge(order.deliveryMethod)}>
                        {t(`orders.${order.deliveryMethod}`)}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex flex-col gap-2">
                        <Badge color={getStatusBadgeColor(order.status)}>
                          {t(`orders.statuses.${order.status}`)}
                        </Badge>
                        <Select
                          size="sm"
                          value={order.status}
                          onChange={(e) =>
                            updateStatusMutation.mutate({
                              id: order.id,
                              status: e.target.value,
                            })
                          }
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {t(`orders.statuses.${status}`)}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </td>
                    <td>
                      {(() => {
                        const processor = getProcessor(order)
                        return processor ? (
                          <div>
                            <div className="font-medium text-sm">
                              {processor.firstName} {processor.lastName}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )
                      })()}
                    </td>
                    <td>{t('orders.itemCount', { count: order.items?.length || 0 })}</td>
                    <td>
                      {order.messages && order.messages.length > 0 ? (
                        <Badge
                          color="info"
                          className="gap-2 cursor-pointer hover:bg-primary transition-colors"
                          onClick={() => setFeedbackOrderId(order.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-4 h-4 stroke-current">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                          </svg>
                          {order.messages.length}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td>
                      {editingTrackingId === order.id ? (
                        <div className="flex gap-1">
                          <Input
                            type="text"
                            size="sm"
                            value={trackingValue}
                            onChange={(e) => setTrackingValue(e.target.value)}
                            className="w-32"
                            placeholder={t('orders.trackingNumber')}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            color="success"
                            onClick={() => saveTracking(order.id)}
                            disabled={updateTrackingMutation.isPending}
                          >
                            ✓
                          </Button>
                          <Button
                            size="sm"
                            ghost
                            onClick={cancelEditTracking}
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          ghost
                          className="text-left justify-start w-full"
                          onClick={() => startEditTracking(order)}
                          title={order.trackingNumber ? t('orders.editTracking') : t('orders.addTracking')}
                        >
                          {order.trackingNumber || (
                            <span className="text-gray-400 italic">{t('orders.noTracking')}</span>
                          )}
                        </Button>
                      )}
                    </td>
                    <td>
                      {editingNotesId === order.id ? (
                        <div className="flex gap-1">
                          <Textarea
                            value={notesValue}
                            onChange={(e) => setNotesValue(e.target.value)}
                            className="w-48 min-h-16"
                            placeholder={t('orders.notes')}
                            autoFocus
                            rows={2}
                          />
                          <div className="flex flex-col gap-1">
                            <Button
                              size="sm"
                              color="success"
                              onClick={() => saveNotes(order.id)}
                              disabled={updateNotesMutation.isPending}
                            >
                              ✓
                            </Button>
                            <Button
                              size="sm"
                              ghost
                              onClick={cancelEditNotes}
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          ghost
                          className="text-left justify-start w-full h-auto whitespace-normal py-2"
                          onClick={() => startEditNotes(order)}
                          title={order.notes ? t('orders.editNotes') : t('orders.addNotes')}
                        >
                          {order.notes ? (
                            <span className="text-sm line-clamp-2">{order.notes}</span>
                          ) : (
                            <span className="text-gray-400 italic text-sm">{t('orders.noNotes')}</span>
                          )}
                        </Button>
                      )}
                    </td>
                    <td>
                      {DateTime.fromISO(order.createdAt).setLocale(i18n.language).toLocaleString(
                        DateTime.DATETIME_SHORT
                      )}
                    </td>
                    <td>
                      <Button size="sm" color="info">{t('orders.viewDetails')}</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.meta.lastPage > 1 && (
            <div className="flex justify-center mt-4">
              <div className="join">
                <Button
                  className="join-item"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  {t('common.previous')}
                </Button>
                <Button className="join-item">
                  {t('common.page', { current: page, total: data.meta.lastPage })}
                </Button>
                <Button
                  className="join-item"
                  onClick={() => setPage(page + 1)}
                  disabled={page === data.meta.lastPage}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          )}
      </Card>

      {/* Feedback Modal */}
      {feedbackOrderId && (() => {
        const order = filteredOrders?.find(o => o.id === feedbackOrderId)
        return order && order.messages ? (
          <FeedbackModal
            messages={order.messages}
            orderNumber={order.id}
            onClose={() => setFeedbackOrderId(null)}
          />
        ) : null
      })()}
    </div>
  )
}
