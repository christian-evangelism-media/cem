import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useCart, useUpdateCartItem, useRemoveCartItem } from '../hooks/useCartQueries'
import { useCreateOrder } from '../hooks/useMediaQueries'
import { useAddresses } from '../hooks/useAddressQueries'

export default function Cart() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { data: cartItems = [], isLoading } = useCart()
  const { data: addresses = [] } = useAddresses()
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const updateCartItem = useUpdateCartItem()
  const removeCartItem = useRemoveCartItem()
  const createOrder = useCreateOrder()

  // Set default address when addresses load
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0]
      setSelectedAddressId(defaultAddress.id)
    }
  }, [addresses, selectedAddressId])

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
      alert(t('cart.noAddress'))
      navigate('/profile')
      return
    }

    if (!selectedAddressId) {
      alert(t('cart.selectAddress'))
      return
    }

    const items = cartItems.map((item) => ({
      mediaId: item.mediaId,
      quantity: item.quantity,
    }))

    createOrder.mutate({ addressId: selectedAddressId, items }, {
      onSuccess: () => {
        navigate('/orders')
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">{t('cart.title')}</h1>

      {cartItems.length === 0 ? (
        <div className="alert alert-info">
          <span>{t('cart.empty')}</span>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">
                        {item.media.nameI18n?.[i18n.language] || item.media.nameI18n?.en || item.media.name}
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <div className="badge badge-secondary">
                          {item.media.typeI18n?.[i18n.language] || item.media.typeI18n?.en || item.media.type}
                        </div>
                        {item.media.languages?.map((lang) => (
                          <div key={lang} className="badge badge-accent">
                            {t(`languages.${lang}`, lang)}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">{t('media.quantity')}</span>
                        </label>
                        <select
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                          className="select select-bordered w-32"
                        >
                          {item.media.allowedQuantities.map((qty) => (
                            <option key={qty} value={qty}>
                              {qty}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="btn btn-ghost btn-circle text-error"
                        disabled={removeCartItem.isPending}
                        aria-label="Remove item"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            {addresses.length > 0 ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                {/* Address Selector */}
                <select
                  className="select select-bordered w-full sm:w-auto sm:min-w-96"
                  value={selectedAddressId || ''}
                  onChange={(e) => setSelectedAddressId(Number(e.target.value))}
                >
                  {addresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.label ? `${address.label} - ` : ''}{address.name} - {address.streetAddress}, {address.city}
                      {address.isDefault ? ` (${t('cart.default')})` : ''}
                    </option>
                  ))}
                </select>

                {/* Place Order Button */}
                <button
                  onClick={placeOrder}
                  className="btn btn-primary btn-lg w-full sm:w-auto"
                  disabled={createOrder.isPending || cartItems.length === 0 || !selectedAddressId}
                >
                  {createOrder.isPending ? (
                    <span className="loading loading-spinner"></span>
                  ) : (
                    t('cart.placeOrder')
                  )}
                </button>
              </div>
            ) : (
              <div className="alert alert-warning">
                <span>{t('cart.noAddress')}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
