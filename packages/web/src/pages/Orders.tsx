import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOrders, useCancelOrder, usePlaceOrder } from '../hooks/useOrderQueries'
import FeedbackModal from '../components/FeedbackModal'

export default function Orders() {
  const { t } = useTranslation()
  const { data: orders = [], isLoading, error } = useOrders()
  const cancelOrder = useCancelOrder()
  const placeOrder = usePlaceOrder()
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [reorderingOrderId, setReorderingOrderId] = useState<number | null>(null)
  const [reorderSuccess, setReorderSuccess] = useState<string | null>(null)
  const [feedbackOrderId, setFeedbackOrderId] = useState<number | null>(null)

  const handleCancelOrder = () => {
    if (cancellingOrderId) {
      setCancelError(null)
      cancelOrder.mutate(cancellingOrderId, {
        onSuccess: () => {
          setCancellingOrderId(null)
        },
        onError: (error: Error) => {
          setCancelError(error.message)
          setCancellingOrderId(null)
        },
      })
    }
  }

  const canCancelOrder = (status: string) => {
    return !['shipped', 'cancelled', 'cancelling'].includes(status)
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
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-error m-8">
        <span>{error instanceof Error ? error.message : t('orders.loadError')}</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">{t('orders.title')}</h1>

      {cancelError && (
        <div className="alert alert-error mb-4">
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
          <span>{cancelError}</span>
          <button className="btn btn-sm btn-ghost" onClick={() => setCancelError(null)}>
            ✕
          </button>
        </div>
      )}

      {reorderSuccess && (
        <div className="alert alert-success mb-4">
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{reorderSuccess}</span>
          <button className="btn btn-sm btn-ghost" onClick={() => setReorderSuccess(null)}>
            ✕
          </button>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="alert alert-info">
          <span>{t('orders.noOrders')}</span>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="card-title">{t('orders.orderNumber', { number: order.id })}</h2>
                    <p className="text-sm text-base-content/70">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="badge badge-primary">{t(`orders.statuses.${order.status}`)}</div>
                </div>

                <div className="divider"></div>

                {order.address && (
                  <div className="mb-4 p-3 bg-base-200 rounded-lg">
                    <h3 className="font-semibold text-sm mb-2">{t('orders.shippingAddress')}</h3>
                    <p className="text-sm">{order.address.name}</p>
                    <p className="text-sm">{order.address.street}</p>
                    <p className="text-sm">
                      {order.address.city}, {order.address.state} {order.address.postalCode}
                    </p>
                    <p className="text-sm">{order.address.country}</p>
                  </div>
                )}

                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.media.name}</p>
                        <p className="text-sm text-base-content/70">{item.media.type}</p>
                      </div>
                      <div className="badge badge-ghost">{t('orders.quantity', { qty: item.quantity })}</div>
                    </div>
                  ))}
                </div>

                <div className="card-actions justify-end mt-4">
                  {order.status === 'shipped' && (
                    <button
                      className="btn btn-accent btn-sm"
                      onClick={() => setFeedbackOrderId(order.id)}
                    >
                      {t('orders.giveFeedback')}
                    </button>
                  )}
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleReorder(order.id)}
                    disabled={reorderingOrderId === order.id}
                  >
                    {reorderingOrderId === order.id ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        {t('orders.reordering')}
                      </>
                    ) : (
                      t('orders.reorder')
                    )}
                  </button>
                  {canCancelOrder(order.status) && (
                    <button
                      className="btn btn-error btn-sm"
                      onClick={() => setCancellingOrderId(order.id)}
                    >
                      {t('orders.cancelOrder')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingOrderId && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">{t('orders.cancelConfirmTitle')}</h3>
            <p className="py-4">{t('orders.cancelConfirmMessage')}</p>
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => setCancellingOrderId(null)}
                disabled={cancelOrder.isPending}
              >
                {t('common.cancel')}
              </button>
              <button
                className="btn btn-error"
                onClick={handleCancelOrder}
                disabled={cancelOrder.isPending}
              >
                {cancelOrder.isPending ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  t('orders.confirmCancel')
                )}
              </button>
            </div>
          </div>
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
