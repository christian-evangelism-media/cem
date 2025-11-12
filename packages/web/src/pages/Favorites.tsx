import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useFavorites, useRemoveFavorite } from '../hooks/useFavoriteQueries'
import { useCart, useAddToCart, useRemoveCartItem } from '../hooks/useCartQueries'
import { useCreateOrder } from '../hooks/useMediaQueries'
import { useAddresses } from '../hooks/useAddressQueries'
import { useUser } from '../contexts/UserContext'
import { API_URL } from '../services/api'

export default function Favorites() {
  const { t } = useTranslation()
  const { user } = useUser()
  const navigate = useNavigate()
  const { data: favorites = [], isLoading, error } = useFavorites()
  const { data: cartItems = [] } = useCart(!!user)
  const removeFavorite = useRemoveFavorite()
  const addToCart = useAddToCart()
  const removeCartItem = useRemoveCartItem()
  const createOrder = useCreateOrder()
  const { data: addresses = [] } = useAddresses(!!user)

  const handleRemoveFavorite = (mediaId: number) => {
    removeFavorite.mutate(mediaId)
  }

  const handleAddToCart = (mediaId: number) => {
    addToCart.mutate({ mediaId, quantity: 1 })
  }

  const isInCart = (mediaId: number) => {
    return cartItems.some((item) => item.mediaId === mediaId)
  }

  const getCartQuantity = (mediaId: number, allowedQuantities: number[]) => {
    const item = cartItems.find((item) => item.mediaId === mediaId)
    const currentQty = item?.quantity || 0

    // If current quantity is not in allowed quantities, return first allowed quantity
    if (currentQty > 0 && !allowedQuantities.includes(currentQty)) {
      return allowedQuantities[0]
    }

    return currentQty
  }

  const getCartItemId = (mediaId: number) => {
    const item = cartItems.find((item) => item.mediaId === mediaId)
    return item?.id
  }

  const removeFromCart = (mediaId: number) => {
    const cartItemId = getCartItemId(mediaId)
    if (cartItemId) {
      removeCartItem.mutate(cartItemId)
    }
  }

  // Check if there are any favorited items in the cart
  const hasFavoritesInCart = favorites.some(fav => isInCart(fav.mediaId))

  const quickPlaceOrder = () => {
    if (addresses.length === 0) {
      alert(t('cart.noAddress'))
      navigate('/profile')
      return
    }

    if (cartItems.length === 0) {
      return
    }

    const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0]
    const items = cartItems.map((item) => ({
      mediaId: item.mediaId,
      quantity: item.quantity,
    }))

    createOrder.mutate({ addressId: defaultAddress.id, items }, {
      onSuccess: () => {
        navigate('/orders')
      },
    })
  }

  const updateQuantity = (mediaId: number, quantity: number) => {
    if (quantity > 0) {
      addToCart.mutate({ mediaId, quantity })
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
        <span>{error instanceof Error ? error.message : t('favorites.loadError')}</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl md:text-4xl font-bold">{t('favorites.title')}</h1>

        {/* Quick Place Order Button - only show if favorited items are in cart */}
        {hasFavoritesInCart && (
          <button
            onClick={quickPlaceOrder}
            className="btn btn-primary btn-sm"
            disabled={createOrder.isPending}
          >
            {createOrder.isPending ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              t('media.quickOrder')
            )}
          </button>
        )}
      </div>

      {favorites.length === 0 ? (
        <div className="alert alert-info">
          <span>{t('favorites.noFavorites')}</span>
        </div>
      ) : (
        <div className="grid gap-2">
          {favorites.map((favorite) => (
            <div key={favorite.id} className="card bg-base-100 shadow">
              <div className="card-body p-3 md:p-4">
                <div className="flex flex-col md:flex-row justify-between items-start gap-3 md:gap-4">
                  <div className="flex items-start gap-2 flex-wrap flex-1 w-full">
                    <h2 className="card-title text-base md:text-lg w-full md:w-auto">{favorite.media.name}</h2>
                    <div className="badge badge-sm badge-secondary">{favorite.media.type}</div>
                    {favorite.media.languages.map(lang => (
                      <div key={lang} className="badge badge-sm badge-accent">
                        {t(`languages.${lang}`)}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 items-center w-full md:w-auto md:flex-shrink-0">
                    {favorite.media.digitalPdfUrl && (
                      <a
                        href={`${API_URL}${favorite.media.digitalPdfUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-xs btn-outline flex-1 md:flex-initial"
                      >
                        {t('media.viewDigital')}
                      </a>
                    )}
                    {favorite.media.pressPdfUrl && (
                      <a
                        href={`${API_URL}${favorite.media.pressPdfUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-xs btn-outline btn-secondary flex-1 md:flex-initial"
                      >
                        {t('media.viewPress')}
                      </a>
                    )}

                    {user && !isInCart(favorite.media.id) && (
                      <button
                        onClick={() => handleAddToCart(favorite.media.id)}
                        className="btn btn-xs btn-primary flex-1 md:flex-initial"
                        disabled={addToCart.isPending}
                      >
                        {t('media.addToCart')}
                      </button>
                    )}

                    {user && isInCart(favorite.media.id) && (
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <select
                          value={getCartQuantity(favorite.media.id, favorite.media.allowedQuantities)}
                          onChange={(e) => updateQuantity(favorite.media.id, parseInt(e.target.value))}
                          className="select select-bordered select-xs flex-1 md:w-20"
                        >
                          {favorite.media.allowedQuantities.map((qty) => (
                            <option key={qty} value={qty}>{qty}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeFromCart(favorite.media.id)}
                          className="btn btn-xs btn-circle btn-ghost text-error"
                          disabled={removeCartItem.isPending}
                          title="Remove from cart"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => handleRemoveFavorite(favorite.mediaId)}
                      className="btn btn-xs btn-ghost text-error flex-1 md:flex-initial"
                      disabled={removeFavorite.isPending}
                    >
                      {t('favorites.remove')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
