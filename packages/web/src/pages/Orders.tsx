import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOrders, useCancelOrder, usePlaceOrder } from '../hooks/useOrderQueries'
import FeedbackModal from '../components/FeedbackModal'
import { Alert, Badge, Button, Card, Divider, Loading, Modal, Typography } from 'asterui'

const { Title, Paragraph, Text } = Typography

export default function Orders() {
  const { t } = useTranslation()
  const { data: orders = [], isLoading, error } = useOrders()
  const cancelOrder = useCancelOrder()
  const placeOrder = usePlaceOrder()
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [reorderingOrderId, setReorderingOrderId] = useState<number | null>(null)
  const [reorderSuccess, setReorderSuccess] = useState<string | null>(null)
  const [feedbackOrderId, setFeedbackOrderId] = useState<number | null>(null)

  const handleCancelOrder = (orderId: number) => {
    Modal.confirm({
      title: t('orders.cancelConfirmTitle'),
      content: t('orders.cancelConfirmMessage'),
      okText: t('orders.confirmCancel'),
      type: 'error',
      cancelText: t('common.cancel'),
      onOk: () => {
        setCancelError(null)
        cancelOrder.mutate(orderId, {
          onError: (error: Error) => {
            setCancelError(error.message)
          },
        })
      },
    })
  }

  const canCancelOrder = (status: string) => {
    return !['shipped', 'collected', 'cancelled', 'cancelling'].includes(status)
  }

  const getStatusBadgeColor = (status: string): 'warning' | 'info' | 'primary' | 'accent' | 'success' | 'error' | undefined => {
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
        return undefined
    }
  }

  const getDeliveryMethodBadge = (deliveryMethod: 'shipping' | 'pickup'): 'secondary' | 'neutral' => {
    if (deliveryMethod === 'pickup') {
      return 'secondary'
    }
    return 'neutral'
  }

  const handleReorder = async (orderId: number) => {
    setReorderingOrderId(orderId)
    setReorderSuccess(null)
    setCancelError(null)

    const order = orders.find((o) => o.id === orderId)
    if (!order || !order.addressId) {
      setCancelError(t('orders.reorderNoAddress'))
      setReorderingOrderId(null)
      return
    }

    try {
      // Place a new order with the same items and address
      await placeOrder.mutateAsync({
        addressId: order.addressId,
        items: order.items.map((item) => ({
          mediaId: item.mediaId,
          quantity: item.quantity,
        })),
      })
      setReorderSuccess(t('orders.reorderSuccess'))
      setReorderingOrderId(null)
    } catch (error) {
      setCancelError(error instanceof Error ? error.message : t('orders.reorderError'))
      setReorderingOrderId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="m-8">
        <Alert color="error">
          {error instanceof Error ? error.message : t('orders.loadError')}
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <Title level={1} className="text-3xl md:text-4xl mb-6">{t('orders.title')}</Title>

      {cancelError && (
        <Alert
          type="error"
          closable={{ onClose: () => setCancelError(null) }}
          className="mb-4"
        >
          {cancelError}
        </Alert>
      )}

      {reorderSuccess && (
        <Alert
          type="success"
          closable={{ onClose: () => setReorderSuccess(null) }}
          className="mb-4"
        >
          {reorderSuccess}
        </Alert>
      )}

      {orders.length === 0 ? (
        <Alert color="info">{t('orders.noOrders')}</Alert>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="shadow-xl">
              <div className="flex justify-between items-start">
                <div>
                  <Title level={2}>{t('orders.orderNumber', { number: order.id })}</Title>
                  <Text className="text-sm text-base-content/70">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </Text>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Badge color={getStatusBadgeColor(order.status)}>
                    {t(`orders.statuses.${order.status}`)}
                  </Badge>
                  <Badge color={getDeliveryMethodBadge(order.deliveryMethod)}>
                    {t(`orders.${order.deliveryMethod}`)}
                  </Badge>
                </div>
              </div>

              <Divider />

              {order.address && (
                <div className="mb-4 p-3 bg-base-200 rounded-lg">
                  <Title level={3} className="font-semibold text-sm mb-2">{t('orders.shippingAddress')}</Title>
                  <Paragraph size="sm">{order.address.name}</Paragraph>
                  <Paragraph size="sm">{order.address.street}</Paragraph>
                  <Paragraph size="sm">
                    {order.address.city}, {order.address.state} {order.address.postalCode}
                  </Paragraph>
                  <Paragraph size="sm">{order.address.country}</Paragraph>
                </div>
              )}

              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <Paragraph className="font-medium">{item.media.name}</Paragraph>
                      <Text className="text-sm text-base-content/70">{item.media.type}</Text>
                    </div>
                    <Badge>{t('orders.quantity', { qty: item.quantity })}</Badge>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                {(order.status === 'shipped' || order.status === 'collected') && (
                  <Button
                    color="accent"
                    size="sm"
                    onClick={() => setFeedbackOrderId(order.id)}
                  >
                    {t('orders.giveFeedback')}
                  </Button>
                )}
                <Button
                  type="primary"
                  size="sm"
                  onClick={() => handleReorder(order.id)}
                  loading={reorderingOrderId === order.id}
                >
                  {t('orders.reorder')}
                </Button>
                {canCancelOrder(order.status) && (
                  <Button
                    color="error"
                    size="sm"
                    onClick={() => handleCancelOrder(order.id)}
                  >
                    {t('orders.cancelOrder')}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackOrderId && (
        <FeedbackModal
          orderId={feedbackOrderId}
          orderNumber={feedbackOrderId}
          onClose={() => setFeedbackOrderId(null)}
        />
      )}
    </div>
  )
}
