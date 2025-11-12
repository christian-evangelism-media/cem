import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useTranslation } from 'react-i18next'
import { UserProvider, useUser } from './contexts/UserContext'
import { ToastProvider, useToast } from './contexts/ToastContext'
import { useTheme } from './hooks/useTheme'
import { useState, useEffect } from 'react'
import { api } from './services/api'
import { useCart } from './hooks/useCartQueries'
import ThemeToggle from './components/ThemeToggle'
import LanguageSwitcher from './components/LanguageSwitcher'
import LanguagePreferences from './components/LanguagePreferences'
import ContactModal from './components/ContactModal'
import LockdownBanner from './components/LockdownBanner'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Register from './pages/Register'
import Login from './pages/Login'
import Media from './pages/Media'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import Addresses from './pages/Addresses'
import Favorites from './pages/Favorites'
import Messages from './pages/Messages'
import Account from './pages/Account'
import VerifyEmail from './pages/VerifyEmail'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

function AppContent() {
  const { user, logout } = useUser()
  const { toasts, removeToast } = useToast()
  const { theme, toggleTheme } = useTheme()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [resendingVerification, setResendingVerification] = useState(false)
  const [verificationMessage, setVerificationMessage] = useState('')
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [isLockedDown, setIsLockedDown] = useState(false)
  const { data: cartItems = [] } = useCart(!!user)

  // Check for lockdown on mount and listen for lockdown events
  useEffect(() => {
    const checkLockdown = async () => {
      const lockdownState = sessionStorage.getItem('isLockedDown')
      if (lockdownState === 'true') {
        // Verify lockdown is still active
        try {
          const { isLockedDown } = await api.lockdown.status()
          if (isLockedDown) {
            setIsLockedDown(true)
          } else {
            // Lockdown was lifted, clear session storage
            sessionStorage.removeItem('isLockedDown')
            setIsLockedDown(false)
          }
        } catch (error) {
          console.error('Failed to check lockdown status:', error)
          // Keep showing lockdown if we can't verify
          setIsLockedDown(true)
        }
      }
    }

    checkLockdown()

    const handleLockdown = () => {
      setIsLockedDown(true)
    }

    window.addEventListener('lockdown-detected', handleLockdown)

    return () => {
      window.removeEventListener('lockdown-detected', handleLockdown)
    }
  }, [])

  // Set HTML dir attribute based on language (RTL for Arabic, Hebrew, Persian, Punjabi, and Urdu)
  useEffect(() => {
    const rtlLanguages = ['ar', 'fa', 'he', 'pa', 'ur']
    const direction = rtlLanguages.includes(i18n.language) ? 'rtl' : 'ltr'
    document.documentElement.dir = direction
  }, [i18n.language])

  // Determine if lockdown banner should be shown (only on login/register/account pages, not on home or media)
  const showLockdownBanner = isLockedDown && ['/login', '/register', '/account'].includes(location.pathname)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleResendVerification = async () => {
    if (!user) return

    setResendingVerification(true)
    setVerificationMessage('')

    try {
      const response = await api.post('/resend-verification', { email: user.email })
      setVerificationMessage(response.data.message)
    } catch (error: any) {
      setVerificationMessage(error.response?.data?.message || 'Failed to send verification email')
    } finally {
      setResendingVerification(false)
    }
  }

  return (
    <div className="min-h-screen bg-base-200">
      {/* Lockdown Banner - shown on login/register/account pages only */}
      {showLockdownBanner && (
        <div className="p-4">
          <LockdownBanner />
        </div>
      )}

      {user && !user.emailVerifiedAt && (
        <div className="alert alert-warning">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>Please verify your email address. Check your inbox for the verification link.</span>
          <div>
            <button
              className="btn btn-sm btn-ghost"
              onClick={handleResendVerification}
              disabled={resendingVerification}
            >
              {resendingVerification ? 'Sending...' : 'Resend Email'}
            </button>
          </div>
        </div>
      )}
      {verificationMessage && (
        <div className="alert alert-info">
          <span>{verificationMessage}</span>
          <button className="btn btn-sm btn-ghost" onClick={() => setVerificationMessage('')}>
            ×
          </button>
        </div>
      )}
      <nav className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost gap-2">
            <img src="/cem-logo.png" alt="CEM Logo" className="w-12 h-12" />
            <span className="hidden sm:inline text-xl">{t('nav.home')}</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex flex-none gap-2">
          <Link to="/media" className="btn btn-ghost">{t('nav.media')}</Link>
          {user && <Link to="/favorites" className="btn btn-ghost">{t('nav.myFavorites')}</Link>}
          {user && <Link to="/orders" className="btn btn-ghost">{t('nav.myOrders')}</Link>}
          {user && <Link to="/addresses" className="btn btn-ghost">{t('nav.myAddresses')}</Link>}
          {user && <Link to="/messages" className="btn btn-ghost">{t('nav.messages')}</Link>}
          {user && (
            <button onClick={() => setContactModalOpen(true)} className="btn btn-ghost">
              {t('nav.contact')}
            </button>
          )}
          <LanguageSwitcher />
          <LanguagePreferences />
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          {user && (
            <Link to="/cart" className="btn btn-ghost">
              <div className="indicator">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {cartItems.length > 0 && (
                  <span className="badge badge-sm badge-primary indicator-item">{cartItems.length}</span>
                )}
              </div>
            </Link>
          )}
          {user ? (
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost">
                {t('nav.hello', { name: user.firstName })}
              </div>
              <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
                <li><Link to="/account" onClick={() => (document.activeElement as HTMLElement)?.blur()}>{t('nav.account')}</Link></li>
                <li><button onClick={handleLogout}>{t('nav.logout')}</button></li>
              </ul>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-sm btn-primary">{t('nav.login')}</Link>
              <Link to="/register" className="btn btn-sm btn-secondary">{t('nav.register')}</Link>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="flex lg:hidden gap-2 ml-auto">
          <LanguageSwitcher />
          <LanguagePreferences />
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
              <li><Link to="/media" onClick={() => (document.activeElement as HTMLElement)?.blur()}>{t('nav.media')}</Link></li>
              {user && (
                <>
                  <li>
                    <Link to="/cart" onClick={() => (document.activeElement as HTMLElement)?.blur()}>
                      {t('media.cart', { count: cartItems.length })}
                    </Link>
                  </li>
                  <li><Link to="/favorites" onClick={() => (document.activeElement as HTMLElement)?.blur()}>{t('nav.myFavorites')}</Link></li>
                  <li><Link to="/orders" onClick={() => (document.activeElement as HTMLElement)?.blur()}>{t('nav.myOrders')}</Link></li>
                  <li><Link to="/addresses" onClick={() => (document.activeElement as HTMLElement)?.blur()}>{t('nav.myAddresses')}</Link></li>
                  <li><Link to="/messages" onClick={() => (document.activeElement as HTMLElement)?.blur()}>{t('nav.messages')}</Link></li>
                  <li>
                    <button onClick={() => { setContactModalOpen(true); (document.activeElement as HTMLElement)?.blur(); }}>
                      {t('nav.contact')}
                    </button>
                  </li>
                  <li className="menu-title">
                    <span>{t('nav.hello', { name: user.firstName })}</span>
                  </li>
                  <li><Link to="/account" onClick={() => (document.activeElement as HTMLElement)?.blur()}>{t('nav.account')}</Link></li>
                  <li><button onClick={() => { handleLogout(); (document.activeElement as HTMLElement)?.blur(); }}>{t('nav.logout')}</button></li>
                </>
              )}
              {!user && (
                <>
                  <li><Link to="/login" onClick={() => (document.activeElement as HTMLElement)?.blur()}>{t('nav.login')}</Link></li>
                  <li><Link to="/register" onClick={() => (document.activeElement as HTMLElement)?.blur()}>{t('nav.register')}</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/media" element={<Media />} />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/addresses"
            element={
              <ProtectedRoute>
                <Addresses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      {/* Toast notifications */}
      {toasts.length > 0 && (
        <div className="toast toast-bottom toast-end">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`alert ${
                toast.type === 'success'
                  ? 'alert-success'
                  : toast.type === 'error'
                  ? 'alert-error'
                  : 'alert-info'
              }`}
            >
              <span>{toast.message}</span>
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => removeToast(toast.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Contact Modal */}
      {user && <ContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />}
    </div>
  )
}

function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </UserProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Router>
  )
}

export default App