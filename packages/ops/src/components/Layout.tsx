import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge, Button } from 'asterui'
import {
  Bars3Icon,
  HomeIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  LockClosedIcon,
  ArrowRightOnRectangleIcon,
} from '@aster-ui/icons'
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
              <Bars3Icon size={24} />
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
                <HomeIcon size={20} />
                {t('nav.dashboard')}
              </Link>
            </li>

            {/* Orders Queue - for all staff including help */}
            <li>
              <Link to="/orders-queue" className={isActive('/orders-queue') ? 'active' : ''}>
                <ClipboardDocumentCheckIcon size={20} />
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
                  <ChatBubbleLeftRightIcon size={20} />
                  {t('nav.messagesQueue')}
                  {showMessagesQueueBadge && (
                    <Badge size="sm" color="error">{newMessagesCount}</Badge>
                  )}
                </Link>
              </li>
            )}

            <li>
              <Link to="/current-orders" className={isActive('/current-orders') ? 'active' : ''}>
                <DocumentTextIcon size={20} />
                {t('nav.currentOrders')}
              </Link>
            </li>

            <li>
              <Link to="/media" className={isActive('/media') ? 'active' : ''}>
                <ArchiveBoxIcon size={20} />
                {t('nav.media')}
              </Link>
            </li>

            {user?.role !== 'help' && (
              <li>
                <Link to="/orders" className={isActive('/orders') ? 'active' : ''}>
                  <ClipboardDocumentCheckIcon size={20} />
                  {t('nav.orders')}
                </Link>
              </li>
            )}

            {user?.role !== 'help' && (
              <li>
                <Link to="/users" className={isActive('/users') ? 'active' : ''}>
                  <UsersIcon size={20} />
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
                      <ExclamationTriangleIcon size={20} className="text-error" />
                      <span className="text-sm font-medium text-error">{t('nav.systemUnhealthy')}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon size={20} className="text-success" />
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
                <Cog6ToothIcon size={20} />
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
              <LockClosedIcon size={32} />
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
              <ArrowRightOnRectangleIcon size={16} />
              {t('nav.logout')}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
