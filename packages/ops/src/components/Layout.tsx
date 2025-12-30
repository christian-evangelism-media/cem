import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge, Button } from 'asterui'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { api } from '../services/api'
import type { Message, DashboardStats } from '../types'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeToggle from './ThemeToggle'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const [isActivatingLockdown, setIsActivatingLockdown] = useState(false)
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false)
  const [seenOrderIds, setSeenOrderIds] = useState<Set<number>>(new Set())
  const [seenMessageIds, setSeenMessageIds] = useState<Set<number>>(new Set())

  const isActive = (path: string) => {
    return location.pathname === path
  }

  // Query for unread messages count (for Messages Queue badge)
  const { data: messages } = useQuery<{ messages: Message[] }>({
    queryKey: ['messages'],
    queryFn: () => api.messages.list(),
    refetchInterval: 10000, // Poll every 10 seconds
    enabled: user?.role !== 'help', // Only fetch if user can see messages
  })

  // Query for actionable orders count (for Orders Queue badge)
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.stats.dashboard(),
    refetchInterval: 10000, // Poll every 10 seconds
  })

  // Health check query (admin+ only)
  const { data: healthData, isError: healthError } = useQuery<{
    isHealthy: boolean
    status: string
    checks: Array<{ name: string; status: string; message: string }>
  }>({
    queryKey: ['health'],
    queryFn: () => api.health.check(),
    refetchInterval: 10000, // Poll every 10 seconds
    enabled: user?.role === 'admin' || user?.role === 'super_admin', // Only for admin+
    retry: 1, // Retry once if it fails
  })

  // Maintenance mode status query (admin+ only)
  const { data: maintenanceData, refetch: refetchMaintenance } = useQuery<{
    isActive: boolean
    reason: string | null
    activatedAt: string | null
    activatedBy: { firstName: string; lastName: string } | null
  }>({
    queryKey: ['maintenance-status'],
    queryFn: () => api.maintenance.status(),
    refetchInterval: 10000, // Poll every 10 seconds
    enabled: user?.role === 'admin' || user?.role === 'super_admin', // Only for admin+
  })

  // Get actionable orders and unread messages
  const actionableOrders = stats?.recentOrders.filter(o => o.status === 'pending' || o.status === 'cancelling') || []
  const unreadMessages = messages?.messages.filter(m => !m.isRead) || []

  // Mark items as seen when entering a queue
  useEffect(() => {
    if (location.pathname === '/orders-queue' && actionableOrders.length > 0) {
      setSeenOrderIds(new Set(actionableOrders.map(o => o.id)))
    } else if (location.pathname === '/messages-queue' && unreadMessages.length > 0) {
      setSeenMessageIds(new Set(unreadMessages.map(m => m.id)))
    }
  }, [location.pathname, actionableOrders.length, unreadMessages.length])

  // Count only NEW items (not previously seen)
  const newOrdersCount = actionableOrders.filter(o => !seenOrderIds.has(o.id)).length
  const newMessagesCount = unreadMessages.filter(m => !seenMessageIds.has(m.id)).length

  // Show badge if there are new items and user is not currently in that view
  const showOrdersQueueBadge = !isActive('/orders-queue') && newOrdersCount > 0
  const showMessagesQueueBadge = !isActive('/messages-queue') && newMessagesCount > 0

  const handleEmergencyLockdown = async () => {
    setIsActivatingLockdown(true)

    // Immediately show lockdown screen to prevent seeing sensitive info
    sessionStorage.setItem('isLockedDown', 'true')
    window.dispatchEvent(new CustomEvent('lockdown-detected'))

    try {
      await api.lockdown.activate()
      // The user will be logged out by the API, so no need to manually logout
      // The auth context will handle the redirect
    } catch (error) {
      console.error('Failed to activate lockdown:', error)
      // Keep lockdown screen even if API call fails (safer)
    }
  }

  const handleToggleMaintenance = async () => {
    setIsTogglingMaintenance(true)

    try {
      if (maintenanceData?.isActive) {
        await api.maintenance.deactivate()
      } else {
        // Optional: prompt for reason
        await api.maintenance.activate()
      }

      // Refetch maintenance status
      await refetchMaintenance()
    } catch (error) {
      console.error('Failed to toggle maintenance mode:', error)
      alert('Failed to toggle maintenance mode. Please try again.')
    } finally {
      setIsTogglingMaintenance(false)
    }
  }

  return (
    <div className="drawer lg:drawer-open">
      <input id="my-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col">
        {/* Navbar */}
        <div className="navbar bg-base-100 shadow-lg lg:hidden">
          <div className="flex-none">
            <label htmlFor="my-drawer" className="cursor-pointer p-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </label>
          </div>
          <div className="flex-1">
            <span className="text-xl font-bold">{t('nav.appName')}</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <div className="drawer-side">
        <label htmlFor="my-drawer" className="drawer-overlay"></label>
        <aside className="bg-base-200 w-64 min-h-screen flex flex-col">
          <div className="p-4">
            <h1 className="text-2xl font-bold">{t('nav.appName')}</h1>
          </div>

          <ul className="menu p-4 text-base-content flex-1">
            <li>
              <Link to="/" className={isActive('/') ? 'active' : ''}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {t('nav.dashboard')}
              </Link>
            </li>

            {/* Orders Queue - for all staff including help */}
            <li>
              <Link to="/orders-queue" className={isActive('/orders-queue') ? 'active' : ''}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                {t('nav.ordersQueue')}
                {showOrdersQueueBadge && (
                  <Badge size="sm" color="warning">{newOrdersCount}</Badge>
                )}
              </Link>
            </li>

            {/* Messages Queue - for support/admin/super_admin only */}
            {user?.role !== 'help' && (
              <li>
                <Link to="/messages-queue" className={isActive('/messages-queue') ? 'active' : ''}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {t('nav.messagesQueue')}
                  {showMessagesQueueBadge && (
                    <Badge size="sm" color="error">{newMessagesCount}</Badge>
                  )}
                </Link>
              </li>
            )}

            <li>
              <Link to="/current-orders" className={isActive('/current-orders') ? 'active' : ''}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t('nav.currentOrders')}
              </Link>
            </li>

            <li>
              <Link to="/media" className={isActive('/media') ? 'active' : ''}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {t('nav.media')}
              </Link>
            </li>

            {user?.role !== 'help' && (
              <li>
                <Link to="/orders" className={isActive('/orders') ? 'active' : ''}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  {t('nav.orders')}
                </Link>
              </li>
            )}

            {user?.role !== 'help' && (
              <li>
                <Link to="/users" className={isActive('/users') ? 'active' : ''}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {t('nav.users')}
                </Link>
              </li>
            )}
          </ul>

          <div className="p-4 border-t border-base-300 mt-auto">
            {/* Health Status Indicator - Admin+ only */}
            {(user?.role === 'admin' || user?.role === 'super_admin') && (
              <div className="mb-4 p-3 rounded-lg bg-base-300">
                <div className="flex items-center gap-2 mb-2">
                  {healthError || healthData?.isHealthy === false ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-sm font-medium text-error">{t('nav.systemUnhealthy')}</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium text-success">{t('nav.systemHealthy')}</span>
                    </>
                  )}
                </div>
                {healthData?.checks && (
                  <div className="space-y-2 text-sm">
                    {healthData.checks.map((check, index) => {
                      const isError = check.status !== 'ok' && check.status !== 'warning'
                      return (
                        <div key={index}>
                          <div className="flex items-center gap-2">
                            {check.status === 'ok' || check.status === 'warning' ? (
                              <div className="w-2 h-2 rounded-full bg-success"></div>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-error"></div>
                            )}
                            <span className="opacity-70">{t(`nav.healthChecks.${check.name}`)}</span>
                          </div>
                          {isError && check.message && (
                            <div className="ml-4 text-xs text-error opacity-80 mt-1">
                              {check.message}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Maintenance Mode Toggle - Admin+ only */}
            {(user?.role === 'admin' || user?.role === 'super_admin') && (
              <Button
                onClick={handleToggleMaintenance}
                disabled={isTogglingMaintenance}
                color={maintenanceData?.isActive ? 'success' : 'warning'}
                className="w-full mb-4"
                title={maintenanceData?.isActive ? t('nav.deactivateMaintenanceTitle') : t('nav.activateMaintenanceTitle')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>
                  {isTogglingMaintenance
                    ? t('nav.togglingMaintenance')
                    : maintenanceData?.isActive
                    ? t('nav.deactivateMaintenance')
                    : t('nav.activateMaintenance')}
                </span>
              </Button>
            )}

            {/* Emergency Lockdown Button - Large, prominent, easy to click in emergency */}
            <Button
              onClick={handleEmergencyLockdown}
              disabled={isActivatingLockdown}
              color="error"
              className="w-full mb-8 h-20 text-lg"
              title={t('nav.emergencyLockdownTitle')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="font-bold">{isActivatingLockdown ? t('nav.activatingLockdown') : t('nav.emergencyLockdown')}</span>
            </Button>

            <div className="flex items-center justify-between mb-2">
              <div className="text-sm">
                <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </div>
              <div className="flex gap-2 items-center">
                <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
                <LanguageSwitcher />
              </div>
            </div>

            <Button onClick={logout} size="sm" ghost className="w-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t('nav.logout')}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
