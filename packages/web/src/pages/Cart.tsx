import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useCart, useUpdateCartItem, useRemoveCartItem } from '../hooks/useCartQueries'
import { useCreateOrder } from '../hooks/useMediaQueries'
import { useAddresses } from '../hooks/useAddressQueries'
import { useUser } from '../contexts/UserContext'
import { Alert, Badge, Button, Card, Form, Loading, Modal, Select, Typography } from 'asterui'

const { Title } = Typography

export default function Cart() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useUser()
  const { data: cartItems = [], isLoading } = useCart()
  const { data: addresses = [] } = useAddresses()
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [deliveryMethod, setDeliveryMethod] = useState<'shipping' | 'pickup'>('shipping')
  const updateCartItem = useUpdateCartItem()
  const removeCartItem = useRemoveCartItem()
  const createOrder = useCreateOrder()

  // Check if user can use pickup
  const canPickup = user && (user.allowPickup || ['super_admin', 'admin', 'support', 'help'].includes(user.role))

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
    // For shipping orders, require address
    if (deliveryMethod === 'shipping') {
      if (addresses.length === 0) {
        Modal.warning({
          title: t('common.notice'),
          content: t('cart.noAddress'),
          onOk: () => navigate('/addresses'),
        })
        return
      }

      if (!selectedAddressId) {
        Modal.warning({
          title: t('common.notice'),
          content: t('cart.selectAddress'),
        })
        return
      }
    }

    const items = cartItems.map((item) => ({
      mediaId: item.mediaId,
      quantity: item.quantity,
    }))

    createOrder.mutate({
      addressId: deliveryMethod === 'shipping' ? selectedAddressId : null,
      items,
      deliveryMethod
    }, {
      onSuccess: () => {
        navigate('/orders')
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <Title level={1} className="text-3xl md:text-4xl mb-6">{t('cart.title')}</Title>

      {cartItems.length === 0 ? (
        <Alert color="info">{t('cart.empty')}</Alert>
      ) : (
        <>
          <div className="space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className="shadow-xl">
                <div className="flex justify-between items-center gap-4">
                  <div className="flex-1">
                    <Title level={4} className="font-medium text-lg">
                      {item.media.nameI18n?.[i18n.language] || item.media.nameI18n?.en || item.media.name}
                    </Title>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge color="secondary">
                        {item.media.typeI18n?.[i18n.language] || item.media.typeI18n?.en || item.media.type}
                      </Badge>
                      {item.media.languages?.map((lang) => (
                        <Badge key={lang} color="accent">
                          {t(`languages.${lang}`, lang)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Form.Item label={t('media.quantity')}>
                      <Select
                        value={item.quantity}
                        onChange={(value) => updateQuantity(item.id, Number(value))}
                        className="w-32"
                      >
                        {item.media.allowedQuantities.map((qty) => (
                          <option key={qty} value={qty}>
                            {qty}
                          </option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Button
                      shape="circle"
                      ghost
                      className="text-error"
                      onClick={() => removeItem(item.id)}
                      loading={removeCartItem.isPending}
                      title={t('cart.removeFromCart')}
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
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {/* Delivery Method Selector */}
            {canPickup && (
              <div className="flex justify-end">
                <div className="join">
                  <Button
                    className="join-item"
                    color={deliveryMethod === 'shipping' ? 'primary' : undefined}
                    variant={deliveryMethod === 'shipping' ? undefined : 'outline'}
                    onClick={() => setDeliveryMethod('shipping')}
                  >
                    {t('cart.shipping')}
                  </Button>
                  <Button
                    className="join-item"
                    color={deliveryMethod === 'pickup' ? 'primary' : undefined}
                    variant={deliveryMethod === 'pickup' ? undefined : 'outline'}
                    onClick={() => setDeliveryMethod('pickup')}
                  >
                    {t('cart.pickup')}
                  </Button>
                </div>
              </div>
            )}

            {/* Address and Order Button */}
            {deliveryMethod === 'shipping' ? (
              addresses.length > 0 ? (
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                  {/* Address Selector */}
                  <Select
                    className="w-full sm:w-auto sm:min-w-96"
                    value={selectedAddressId || undefined}
                    onChange={(value) => setSelectedAddressId(Number(value))}
                  >
                    {addresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.label ? `${address.label} - ` : ''}{address.name} - {address.streetAddress}, {address.city}
                        {address.isDefault ? ` (${t('cart.default')})` : ''}
                      </option>
                    ))}
                  </Select>

                  {/* Place Order Button */}
                  <Button
                    type="primary"
                    size="lg"
                    onClick={placeOrder}
                    loading={createOrder.isPending}
                    disabled={cartItems.length === 0 || !selectedAddressId}
                    className="w-full sm:w-auto"
                  >
                    {t('cart.placeOrder')}
                  </Button>
                </div>
              ) : (
                <Alert color="warning">{t('cart.noAddress')}</Alert>
              )
            ) : (
              <div className="flex justify-end">
                <Button
                  type="primary"
                  size="lg"
                  onClick={placeOrder}
                  loading={createOrder.isPending}
                  disabled={cartItems.length === 0}
                >
                  {t('cart.placeOrderPickup')}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
