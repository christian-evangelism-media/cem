import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { useMedia, useCreateOrder } from '../hooks/useMediaQueries'
import { useCart, useAddToCart, useRemoveCartItem } from '../hooks/useCartQueries'
import { useFavorites, useToggleFavorite } from '../hooks/useFavoriteQueries'
import { useAddresses } from '../hooks/useAddressQueries'
import { API_URL } from '../services/api'
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Divider,
  Dropdown,
  Loading,
  Modal,
  Pagination,
  Select,
  Typography
} from 'asterui'

const { Title, Paragraph } = Typography

// Map UI language codes to media language values
const languageMap: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'zh': 'Chinese',
  'hi': 'Hindi',
  'ar': 'Arabic',
  'bn': 'Bengali',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'fr': 'French',
  'pa': 'Punjabi',
  'ja': 'Japanese',
  'ko': 'Korean',
  'vi': 'Vietnamese',
  'ta': 'Tamil',
  'it': 'Italian',
  'tl': 'Tagalog',
  'fa': 'Persian',
  'ro': 'Romanian',
  'el': 'Greek',
  'ht': 'Haitian Creole',
  'ilo': 'Ilocano',
  'ff': 'Fulah',
  'ur': 'Urdu',
  'he': 'Hebrew',
  'de': 'German',
  'id': 'Indonesian',
  'mr': 'Marathi',
  'sw': 'Swahili',
  'te': 'Telugu',
  'tr': 'Turkish',
}

export default function Media() {
  const { t, i18n } = useTranslation()
  const { user } = useUser()
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [manualLanguageSelection, setManualLanguageSelection] = useState<string[]>([])
  const [limit, setLimit] = useState(7)
  const createOrder = useCreateOrder()
  const { data: addresses = [] } = useAddresses(!!user)

  // Calculate items per page based on screen height
  useEffect(() => {
    const calculateLimit = () => {
      const availableHeight = window.innerHeight - 390
      const cardHeight = 85
      const calculatedLimit = Math.max(3, Math.floor(availableHeight / cardHeight))
      setLimit(calculatedLimit)
    }

    calculateLimit()
    window.addEventListener('resize', calculateLimit)
    return () => window.removeEventListener('resize', calculateLimit)
  }, [])

  // Clear manual selection when UI language changes
  useEffect(() => {
    setManualLanguageSelection([])
    setPage(1)
  }, [i18n.language])

  // Determine which languages to filter by
  const currentUiLang = languageMap[i18n.language]
  const languagesToFilter = manualLanguageSelection.length > 0
    ? manualLanguageSelection
    : (currentUiLang ? [currentUiLang] : [])

  const userPreferences = user?.preferredLanguages || null

  const { data: mediaResponse, isLoading, error } = useMedia({
    page,
    limit,
    languages: languagesToFilter.length > 0 ? languagesToFilter : undefined,
    lang: i18n.language,
    isManualFilter: manualLanguageSelection.length > 0,
    userPreferences
  })
  const { data: cartItems = [] } = useCart(!!user)
  const addToCart = useAddToCart()
  const removeCartItem = useRemoveCartItem()
  const { data: favorites = [] } = useFavorites(!!user)
  const toggleFavorite = useToggleFavorite()

  const media = mediaResponse?.data || []
  const meta = mediaResponse?.meta

  const getCartQuantity = (mediaId: number, allowedQuantities: number[]) => {
    const item = cartItems.find((item) => item.mediaId === mediaId)
    const currentQty = item?.quantity || 0

    if (currentQty > 0 && !allowedQuantities.includes(currentQty)) {
      return allowedQuantities[0]
    }

    return currentQty
  }

  const isInCart = (mediaId: number) => {
    return cartItems.some((item) => item.mediaId === mediaId)
  }

  const getCartItemId = (mediaId: number) => {
    const item = cartItems.find((item) => item.mediaId === mediaId)
    return item?.id
  }

  const addToCartHandler = (mediaId: number) => {
    addToCart.mutate({ mediaId, quantity: 1 })
  }

  const removeFromCart = (mediaId: number) => {
    const cartItemId = getCartItemId(mediaId)
    if (cartItemId) {
      removeCartItem.mutate(cartItemId)
    }
  }

  const updateQuantity = (mediaId: number, quantity: number) => {
    if (quantity > 0) {
      addToCart.mutate({ mediaId, quantity })
    }
  }

  const isFavorited = (mediaId: number) => {
    return favorites.some((fav) => fav.mediaId === mediaId)
  }

  const handleToggleFavorite = (mediaId: number) => {
    toggleFavorite.mutate(mediaId)
  }

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
          {error instanceof Error ? error.message : t('media.loadError')}
        </Alert>
      </div>
    )
  }

  const availableLanguageCodes = Object.keys(languageMap).sort((a, b) => a.localeCompare(b))

  const toggleLanguage = (code: string) => {
    const langName = languageMap[code]
    setManualLanguageSelection(prev =>
      prev.includes(langName)
        ? prev.filter(l => l !== langName)
        : [...prev, langName]
    )
    setPage(1)
  }

  const languageFilterMenu = (
    <div className="px-2 py-3 w-[90vw] sm:w-[36rem] max-h-[32rem] overflow-y-auto">
      <div className="mb-2">
        <Title level={5} className="mb-1">{t('media.filterLanguagesTitle')}</Title>
        <Paragraph size="sm" className="text-base-content/70">
          {t('media.filterLanguagesDescription')}
        </Paragraph>
      </div>
      <Divider className="my-2" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
        {availableLanguageCodes.map((code) => (
          <label key={code} className="label cursor-pointer justify-start gap-2 p-2">
            <Checkbox
              size="sm"
              checked={manualLanguageSelection.includes(languageMap[code])}
              onChange={() => toggleLanguage(code)}
            />
            <span className="label-text text-sm">{t(`languages.${code}`)}</span>
          </label>
        ))}
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Title level={1} className="text-3xl md:text-4xl">{t('media.title')}</Title>

        <div className="flex gap-2 w-full sm:w-auto">
          {cartItems.length > 0 && (
            <Button
              color="primary"
              size="sm"
              onClick={quickPlaceOrder}
              loading={createOrder.isPending}
              className="flex-1 sm:flex-initial"
            >
              {t('media.quickOrder')}
            </Button>
          )}

          <Dropdown
            trigger={['click']}
            overlay={languageFilterMenu}
            placement="bottomRight"
          >
            <Button variant="outline" size="sm" className="flex-1 sm:flex-initial">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="truncate">
                {t('media.filterLanguages')} ({manualLanguageSelection.length})
              </span>
            </Button>
          </Dropdown>
        </div>
      </div>

      <div>
        {media.length === 0 ? (
          <Alert type="info">{t('media.noMedia')}</Alert>
        ) : (
          <div className="grid gap-2">
            {media.map((item) => (
              <Card key={item.id} className="shadow">
                <div className="flex flex-col md:flex-row justify-between items-start gap-3 md:gap-4">
                  <div className="flex items-start gap-2 flex-wrap flex-1 w-full">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <Title level={4} className="text-base md:text-lg flex-1">{item.name}</Title>
                      {user && (
                        <Button
                          size="xs"
                          variant="ghost"
                          shape="circle"
                          onClick={() => handleToggleFavorite(item.id)}
                          loading={toggleFavorite.isPending}
                          title={isFavorited(item.id) ? t('favorites.removeFromFavorites') : t('favorites.addToFavorites')}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill={isFavorited(item.id) ? 'currentColor' : 'none'}
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </Button>
                      )}
                    </div>
                    <Badge color="secondary" size="sm">{item.type}</Badge>
                    {item.languages.map(lang => (
                      <Badge key={lang} color="accent" size="sm">
                        {t(`languages.${lang}`)}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 items-center w-full md:w-auto md:flex-shrink-0">
                    {item.digitalPdfUrl && (
                      <a href={`${API_URL}${item.digitalPdfUrl}`} target="_blank" rel="noopener noreferrer">
                        <Button size="xs" variant="outline" className="flex-1 md:flex-initial">
                          {t('media.viewDigital')}
                        </Button>
                      </a>
                    )}
                    {item.pressPdfUrl && (
                      <a href={`${API_URL}${item.pressPdfUrl}`} target="_blank" rel="noopener noreferrer">
                        <Button size="xs" variant="outline" color="secondary" className="flex-1 md:flex-initial">
                          {t('media.viewPress')}
                        </Button>
                      </a>
                    )}

                    {user && !isInCart(item.id) && (
                      <Button
                        size="xs"
                        color="primary"
                        onClick={() => addToCartHandler(item.id)}
                        loading={addToCart.isPending}
                        className="flex-1 md:flex-initial"
                      >
                        {t('media.addToCart')}
                      </Button>
                    )}

                    {user && isInCart(item.id) && (
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <Select
                          size="xs"
                          value={getCartQuantity(item.id, item.allowedQuantities)}
                          onChange={(value) => updateQuantity(item.id, Number(value))}
                          className="flex-1 md:w-20"
                        >
                          {item.allowedQuantities.map((qty) => (
                            <Select.Option key={qty} value={qty}>{qty}</Select.Option>
                          ))}
                        </Select>
                        <Button
                          size="xs"
                          shape="circle"
                          variant="ghost"
                          className="text-error"
                          onClick={() => removeFromCart(item.id)}
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
                  </div>
                </div>
                {item.description && <Paragraph size="sm" className="mt-2">{item.description}</Paragraph>}
              </Card>
            ))}
          </div>
        )}

        {meta && meta.lastPage > 1 && (
          <div className="flex justify-center mt-8">
            <Pagination
              current={page}
              total={meta.total}
              pageSize={limit}
              onChange={setPage}
              showSizeChanger={false}
            />
          </div>
        )}
      </div>
    </div>
  )
}
