import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useFavorites, useRemoveFavorite } from '../hooks/useFavoriteQueries'
import { useCart, useAddToCart, useRemoveCartItem } from '../hooks/useCartQueries'
import { useCreateOrder } from '../hooks/useMediaQueries'
import { useAddresses } from '../hooks/useAddressQueries'
import { useUser } from '../contexts/UserContext'
import { API_URL } from '../services/api'
import { Alert, Badge, Button, Card, Loading, Modal, Select, Typography } from 'asterui'

const { Title } = Typography

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
      Modal.warning({
        title: t('common.notice'),
        content: t('cart.noAddress'),
        onOk: () => navigate('/addresses'),
      })
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
        <Loading size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="m-8">
        <Alert type="error">
          {error instanceof Error ? error.message : t('favorites.loadError')}
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <Title level={1} className="text-3xl md:text-4xl">{t('favorites.title')}</Title>

        {/* Quick Place Order Button - only show if favorited items are in cart */}
        {hasFavoritesInCart && (
          <Button
            color="primary"
            size="sm"
            onClick={quickPlaceOrder}
            loading={createOrder.isPending}
          >
            {t('media.quickOrder')}
          </Button>
        )}
      </div>

      {favorites.length === 0 ? (
        <Alert type="info">{t('favorites.noFavorites')}</Alert>
      ) : (
        <div className="grid gap-2">
          {favorites.map((favorite) => (
            <Card key={favorite.id} className="shadow p-3 md:p-4">
              <div className="flex flex-col md:flex-row justify-between items-start gap-3 md:gap-4">
                <div className="flex items-start gap-2 flex-wrap flex-1 w-full">
                  <Title level={2} className="text-base md:text-lg w-full md:w-auto">{favorite.media.name}</Title>
                  <Badge color="secondary" size="sm">{favorite.media.type}</Badge>
                  {favorite.media.languages.map(lang => (
                    <Badge key={lang} color="accent" size="sm">
                      {t(`languages.${lang}`)}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 items-center w-full md:w-auto md:flex-shrink-0">
                  {favorite.media.digitalPdfUrl && (
                    <a
                      href={`${API_URL}${favorite.media.digitalPdfUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="xs" variant="outline" className="flex-1 md:flex-initial">
                        {t('media.viewDigital')}
                      </Button>
                    </a>
                  )}
                  {favorite.media.pressPdfUrl && (
                    <a
                      href={`${API_URL}${favorite.media.pressPdfUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="xs" variant="outline" color="secondary" className="flex-1 md:flex-initial">
                        {t('media.viewPress')}
                      </Button>
                    </a>
                  )}

                  {user && !isInCart(favorite.media.id) && (
                    <Button
                      size="xs"
                      color="primary"
                      onClick={() => handleAddToCart(favorite.media.id)}
                      loading={addToCart.isPending}
                      className="flex-1 md:flex-initial"
                    >
                      {t('media.addToCart')}
                    </Button>
                  )}

                  {user && isInCart(favorite.media.id) && (
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <Select
                        size="xs"
                        value={getCartQuantity(favorite.media.id, favorite.media.allowedQuantities)}
                        onChange={(value) => updateQuantity(favorite.media.id, Number(value))}
                        className="flex-1 md:w-20"
                      >
                        {favorite.media.allowedQuantities.map((qty) => (
                          <option key={qty} value={qty}>{qty}</option>
                        ))}
                      </Select>
                      <Button
                        size="xs"
                        shape="circle"
                        variant="ghost"
                        className="text-error"
                        onClick={() => removeFromCart(favorite.media.id)}
                        loading={removeCartItem.isPending}
                        title={t('cart.removeFromCart')}
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
                      </Button>
                    </div>
                  )}

                  <Button
                    size="xs"
                    variant="ghost"
                    className="text-error flex-1 md:flex-initial"
                    onClick={() => handleRemoveFavorite(favorite.mediaId)}
                    loading={removeFavorite.isPending}
                  >
                    {t('favorites.remove')}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
