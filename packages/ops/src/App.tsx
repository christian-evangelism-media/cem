import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LockdownBanner from './components/LockdownBanner'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import OrdersQueue from './pages/OrdersQueue'
import MessagesQueue from './pages/MessagesQueue'
import MyOrders from './pages/MyOrders'
import Media from './pages/Media'
import Orders from './pages/Orders'
import Users from './pages/Users'
import { api } from './services/api'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  const [isLockedDown, setIsLockedDown] = useState(false)

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

    // Listen for lockdown detection
    const handleLockdown = () => {
      setIsLockedDown(true)
    }

    window.addEventListener('lockdown-detected', handleLockdown)

    return () => {
      window.removeEventListener('lockdown-detected', handleLockdown)
    }
  }, [])

  // If system is locked down, show lockdown banner instead of normal app
  if (isLockedDown) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <LockdownBanner />
        </BrowserRouter>
      </QueryClientProvider>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders-queue"
              element={
                <ProtectedRoute>
                  <Layout>
                    <OrdersQueue />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages-queue"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MessagesQueue />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/current-orders"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MyOrders />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/media"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Media />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Orders />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Users />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
