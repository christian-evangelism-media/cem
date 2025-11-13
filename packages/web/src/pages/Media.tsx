import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'
import { useMedia, useCreateOrder } from '../hooks/useMediaQueries'
import { useCart, useAddToCart, useRemoveCartItem } from '../hooks/useCartQueries'
import { useFavorites, useToggleFavorite } from '../hooks/useFavoriteQueries'
import { useAddresses } from '../hooks/useAddressQueries'
import { API_URL } from '../services/api'
import AlertModal from '../components/AlertModal'

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
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string } | null>(null)

  // Calculate items per page based on screen height
  useEffect(() => {
    const calculateLimit = () => {
      // Approximate card height: 85px for compact cards (including gap)
      // Header + filter: ~150px, Pagination: ~50px, Padding: ~100px
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

  // Determine which languages to filter by:
  // If user has manually selected languages, use those
  // Otherwise, default to current UI language
  const currentUiLang = languageMap[i18n.language]
  const languagesToFilter = manualLanguageSelection.length > 0
    ? manualLanguageSelection
    : (currentUiLang ? [currentUiLang] : [])

  // Include user preferences in query key to trigger refetch when preferences change
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

    // If current quantity is not in allowed quantities, return first allowed quantity
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
    // Add with default quantity of 1
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
      setAlertModal({ isOpen: true, message: t('cart.noAddress') })
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

  if (isLoading) return <div className="flex justify-center items-center min-h-screen"><span className="loading loading-spinner loading-lg"></span></div>
  if (error) return <div className="alert alert-error m-8"><span>{error instanceof Error ? error.message : t('media.loadError')}</span></div>

  // Get unique languages from media data, sorted by language code
  const availableLanguageCodes = Object.keys(languageMap).sort((a, b) => a.localeCompare(b))

  const toggleLanguage = (code: string) => {
    const langName = languageMap[code]
    setManualLanguageSelection(prev =>
      prev.includes(langName)
        ? prev.filter(l => l !== langName)
        : [...prev, langName]
    )
    setPage(1) // Reset to first page when filter changes
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl md:text-4xl font-bold">{t('media.title')}</h1>

        <div className="flex gap-2 w-full sm:w-auto">
          {/* Quick Place Order Button */}
          {cartItems.length > 0 && (
            <button
              onClick={quickPlaceOrder}
              className="btn btn-primary btn-sm flex-1 sm:flex-initial"
              disabled={createOrder.isPending}
            >
              {createOrder.isPending ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                t('media.quickOrder')
              )}
            </button>
          )}

          {/* Language Filter */}
          <div className="dropdown dropdown-end flex-1 sm:flex-initial">
          <div tabIndex={0} role="button" className="btn btn-outline btn-sm w-full sm:w-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="truncate">
              {t('media.filterLanguages') || 'Filter Languages'} ({manualLanguageSelection.length})
            </span>
          </div>
          <div tabIndex={0} className="dropdown-content z-[1] shadow bg-base-100 rounded-box w-[90vw] sm:w-[36rem] max-h-[32rem] overflow-y-auto mt-2 p-2">
            <div className="px-2 py-3">
              <h3 className="font-bold text-sm mb-1">Filter Languages</h3>
              <p className="text-xs text-base-content/70">
                Select languages to filter. Only media where all languages are in your selection will be shown.
              </p>
            </div>
            <div className="divider my-0"></div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {availableLanguageCodes.map((code) => (
                <label key={code} className="label cursor-pointer justify-start gap-2 p-2">
                  <input
                    type="checkbox"
                    checked={manualLanguageSelection.includes(languageMap[code])}
                    onChange={() => toggleLanguage(code)}
                    className="checkbox checkbox-sm"
                  />
                  <span className="label-text text-sm">{t(`languages.${code}`)}</span>
                </label>
              ))}
            </div>
          </div>
          </div>
        </div>
      </div>

      <div>
        {media.length === 0 ? (
          <div className="alert alert-info">
            <span>{t('media.noMedia')}</span>
          </div>
        ) : (
          <div className="grid gap-2">
            {media.map((item) => (
              <div key={item.id} className="card bg-base-100 shadow">
                <div className="card-body p-3 md:p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-3 md:gap-4">
                    <div className="flex items-start gap-2 flex-wrap flex-1 w-full">
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <h2 className="card-title text-base md:text-lg flex-1">{item.name}</h2>
                        {user && (
                          <button
                            onClick={() => handleToggleFavorite(item.id)}
                            className="btn btn-xs btn-ghost btn-circle"
                            disabled={toggleFavorite.isPending}
                            title={isFavorited(item.id) ? 'Remove from favorites' : 'Add to favorites'}
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
                          </button>
                        )}
                      </div>
                      <div className="badge badge-sm badge-secondary">{item.type}</div>
                      {item.languages.map(lang => (
                        <div key={lang} className="badge badge-sm badge-accent">
                          {t(`languages.${lang}`)}
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 items-center w-full md:w-auto md:flex-shrink-0">
                      {item.digitalPdfUrl && (
                        <a href={`${API_URL}${item.digitalPdfUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-xs btn-outline flex-1 md:flex-initial">
                          {t('media.viewDigital') || 'View Digital'}
                        </a>
                      )}
                      {item.pressPdfUrl && (
                        <a href={`${API_URL}${item.pressPdfUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-xs btn-outline btn-secondary flex-1 md:flex-initial">
                          {t('media.viewPress') || 'View Press'}
                        </a>
                      )}

                      {user && !isInCart(item.id) && (
                        <button
                          onClick={() => addToCartHandler(item.id)}
                          className="btn btn-xs btn-primary flex-1 md:flex-initial"
                          disabled={addToCart.isPending}
                        >
                          {t('media.addToCart') || 'Add to Cart'}
                        </button>
                      )}

                      {user && isInCart(item.id) && (
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <select
                            value={getCartQuantity(item.id, item.allowedQuantities)}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                            className="select select-bordered select-xs flex-1 md:w-20"
                          >
                            {item.allowedQuantities.map((qty) => (
                              <option key={qty} value={qty}>{qty}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => removeFromCart(item.id)}
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
                    </div>
                  </div>
                  {item.description && <p className="text-sm mt-2">{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {meta && meta.lastPage > 1 && (
          <div className="flex justify-center mt-8">
            <div className="join">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="join-item btn btn-sm"
              >
                «
              </button>
              <button className="join-item btn btn-sm">
                {t('pagination.pageOf', { current: page, total: meta.lastPage })}
              </button>
              <button
                onClick={() => setPage(p => Math.min(meta.lastPage, p + 1))}
                disabled={page === meta.lastPage}
                className="join-item btn btn-sm"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {alertModal && (
        <AlertModal
          isOpen={alertModal.isOpen}
          title={t('common.notice')}
          message={alertModal.message}
          type="warning"
          onClose={() => {
            setAlertModal(null)
            if (alertModal.message === t('cart.noAddress')) {
              navigate('/addresses')
            }
          }}
        />
      )}
    </div>
  )
}
