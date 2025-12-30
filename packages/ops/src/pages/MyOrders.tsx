import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { DateTime } from 'luxon'
import { Loading, Card, Select, Input, Textarea, Button, Grid } from 'asterui'
import { api } from '../services/api'
import type { Order } from '../types'

const { Row, Col } = Grid

const statusOptions = ['pending', 'processing', 'packing', 'ready', 'shipping', 'shipped', 'cancelled']

export default function MyOrders() {
  const [editingTrackingId, setEditingTrackingId] = useState<number | null>(null)
  const [trackingValue, setTrackingValue] = useState('')
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null)
  const [notesValue, setNotesValue] = useState('')
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation()

  const { data, isLoading } = useQuery<{ orders: Order[] }>({
    queryKey: ['my-orders'],
    queryFn: () => api.orders.myOrders(),
    refetchInterval: 10000, // Poll every 10 seconds
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.orders.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
    },
  })

  const updateTrackingMutation = useMutation({
    mutationFn: ({ id, trackingNumber }: { id: number; trackingNumber: string }) =>
      api.orders.updateTrackingNumber(id, trackingNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
      setEditingTrackingId(null)
      setTrackingValue('')
    },
  })

  const updateNotesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) =>
      api.orders.updateNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading size="lg" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">{t('orders.currentOrdersTitle')}</h1>

      <Row gutter={24}>
        {data?.orders && data.orders.length > 0 ? (
          data.orders.map((order) => (
            <Col xs={24} lg={12} key={order.id}>
            <Card className="shadow-xl">
                {/* Header with Order ID and Status */}
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-bold">
                    {t('orders.orderNumber')}{order.id}
                  </h2>
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

                {/* Customer Info */}
                <div className="mb-4">
                  <h3 className="font-semibold text-sm text-gray-500 mb-2">
                    {t('orders.orderedBy')}
                  </h3>
                  <div className="font-medium">
                    {order.user ? (
                      `${order.user.firstName} ${order.user.lastName}`
                    ) : (
                      t('common.userNumber', { id: order.userId })
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {t('orders.ordered')}: {DateTime.fromISO(order.createdAt).setLocale(i18n.language).toLocaleString(DateTime.DATETIME_SHORT)}
                  </div>
                </div>

                {/* Shipping Address */}
                {order.address && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-sm text-gray-500 mb-2">
                      {t('orders.shippingAddress')}
                    </h3>
                    <div className="text-sm">
                      <div className="font-medium">{order.address.name}</div>
                      <div>{order.address.streetAddress}</div>
                      {order.address.streetAddress2 && <div>{order.address.streetAddress2}</div>}
                      <div>
                        {order.address.city}{order.address.province && `, ${order.address.province}`} {order.address.postalCode}
                      </div>
                      <div>{order.address.country}</div>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div className="mb-4">
                  <h3 className="font-semibold text-sm text-gray-500 mb-2">
                    {t('orders.orderItems')}
                  </h3>
                  <div className="space-y-2">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.media?.nameI18n?.[i18n.language] || item.media?.nameI18n?.en || item.media?.name || 'Unknown'}
                        </span>
                        <span className="font-medium">
                          {t('orders.quantity')}: {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tracking Number */}
                <div className="mb-4">
                  <h3 className="font-semibold text-sm text-gray-500 mb-2">
                    {t('orders.trackingNumber')}
                  </h3>
                  {editingTrackingId === order.id ? (
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        size="sm"
                        value={trackingValue}
                        onChange={(e) => setTrackingValue(e.target.value)}
                        className="flex-1"
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
                      className="w-full justify-start text-left"
                      onClick={() => startEditTracking(order)}
                    >
                      {order.trackingNumber ? (
                        <span className="font-mono">{order.trackingNumber}</span>
                      ) : (
                        <span className="text-gray-400 italic">{t('orders.noTracking')}</span>
                      )}
                    </Button>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <h3 className="font-semibold text-sm text-gray-500 mb-2">
                    {t('orders.notes')}
                  </h3>
                  {editingNotesId === order.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        className="w-full"
                        placeholder={t('orders.notes')}
                        autoFocus
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          color="success"
                          onClick={() => saveNotes(order.id)}
                          disabled={updateNotesMutation.isPending}
                        >
                          {t('users.save')}
                        </Button>
                        <Button
                          size="sm"
                          ghost
                          onClick={cancelEditNotes}
                        >
                          {t('users.cancel')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      ghost
                      className="w-full justify-start text-left h-auto whitespace-normal py-2"
                      onClick={() => startEditNotes(order)}
                    >
                      {order.notes ? (
                        <span className="text-sm">{order.notes}</span>
                      ) : (
                        <span className="text-gray-400 italic text-sm">{t('orders.noNotes')}</span>
                      )}
                    </Button>
                  )}
                </div>
            </Card>
            </Col>
          ))
        ) : (
          <Col span={24}>
            <div className="text-center text-gray-500 py-12">
              {t('common.noData')}
            </div>
          </Col>
        )}
      </Row>
    </div>
  )
}
