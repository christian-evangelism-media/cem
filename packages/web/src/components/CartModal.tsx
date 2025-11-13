import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useCart, useUpdateCartItem, useRemoveCartItem } from '../hooks/useCartQueries'
import { useCreateOrder } from '../hooks/useMediaQueries'
import { useAddresses } from '../hooks/useAddressQueries'
import { useUser } from '../contexts/UserContext'
import AlertModal from './AlertModal'

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartModal({ isOpen, onClose }: CartModalProps) {
  const { t, i18n } = useTranslation()
  const { user } = useUser()
  const navigate = useNavigate()
  const { data: cartItems = [], isLoading } = useCart()
  const { data: addresses = [] } = useAddresses(!!user)
  const updateCartItem = useUpdateCartItem()
  const removeCartItem = useRemoveCartItem()
  const createOrder = useCreateOrder()
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string } | null>(null)

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity > 0) {
      updateCartItem.mutate({ id, quantity })
    }
  }

  const removeItem = (id: number) => {
    removeCartItem.mutate(id)
  }

  const placeOrder = async () => {
    if (addresses.length === 0) {
      setAlertModal({ isOpen: true, message: t('cart.noAddress') })
      return
    }

    const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0]
    const items = cartItems.map((item) => ({
      mediaId: item.mediaId,
      quantity: item.quantity,
    }))

    createOrder.mutate({ addressId: defaultAddress.id, items }, {
      onSuccess: () => {
        onClose()
        navigate('/orders')
      },
    })
  }

  if (!isOpen) return null

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">{t('cart.title') || 'Shopping Cart'}</h3>
          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="alert alert-info">
            <span>{t('cart.empty') || 'Your cart is empty'}</span>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.id} className="card bg-base-200">
                  <div className="card-body py-3 px-4">
                    <div className="flex justify-between items-center gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium">
                          {item.media.nameI18n?.[i18n.language] || item.media.nameI18n?.en || item.media.name}
                        </h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <div className="badge badge-sm badge-secondary">
                            {item.media.typeI18n?.[i18n.language] || item.media.typeI18n?.en || item.media.type}
                          </div>
                          {item.media.languages?.map((lang) => (
                            <div key={lang} className="badge badge-sm badge-accent">
                              {t(`languages.${lang}`, lang)}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="form-control">
                          <label className="label py-0">
                            <span className="label-text text-xs">{t('media.quantity')}</span>
                          </label>
                          <select
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                            className="select select-bordered select-sm w-24"
                          >
                            {item.media.allowedQuantities.map((qty) => (
                              <option key={qty} value={qty}>{qty}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="btn btn-sm btn-ghost btn-circle text-error"
                          disabled={removeCartItem.isPending}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-action">
              <button type="button" className="btn" onClick={onClose}>
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                onClick={placeOrder}
                className="btn btn-primary"
                disabled={createOrder.isPending || cartItems.length === 0}
              >
                {createOrder.isPending ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  t('cart.placeOrder') || 'Place Order'
                )}
              </button>
            </div>
          </>
        )}

        {alertModal && (
          <AlertModal
            isOpen={alertModal.isOpen}
            title={t('common.notice')}
            message={alertModal.message}
            type="warning"
            onClose={() => {
              setAlertModal(null)
              if (alertModal.message === t('cart.noAddress')) {
                onClose()
                navigate('/addresses')
              }
            }}
          />
        )}
      </div>
    </div>
  )
}
