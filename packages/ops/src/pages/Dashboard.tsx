import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '../services/api'
import type { DashboardStats } from '../types'

export default function Dashboard() {
  const { t } = useTranslation()

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.stats.dashboard(),
    placeholderData: (previousData) => previousData, // Keep previous data while refetching
  })

  // Only show spinner on initial load
  if (isLoading && !stats) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">{t('dashboard.title')}</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
        <div className="stats shadow">
          <div className="stat p-4">
            <div className="stat-title text-xs">{t('dashboard.totalUsers')}</div>
            <div className="stat-value text-2xl text-primary">{stats?.totalUsers || 0}</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat p-4">
            <div className="stat-title text-xs">{t('dashboard.ordersShipped')}</div>
            <div className="stat-value text-2xl text-secondary">{stats?.ordersShipped || 0}</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat p-4">
            <div className="stat-title text-xs">{t('dashboard.totalMedia')}</div>
            <div className="stat-value text-2xl text-accent">{stats?.totalMedia || 0}</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat p-4">
            <div className="stat-title text-xs">{t('dashboard.uniqueCountries')}</div>
            <div className="stat-value text-2xl text-success">{stats?.uniqueCountries || 0}</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat p-4">
            <div className="stat-title text-xs">{t('dashboard.uniqueCities')}</div>
            <div className="stat-value text-2xl text-info">{stats?.uniqueCities || 0}</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat p-4">
            <div className="stat-title text-xs">{t('dashboard.tractsShipped')}</div>
            <div className="stat-value text-2xl text-warning">{stats?.totalTractsShipped?.toLocaleString() || 0}</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Orders Shipped Over Time */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-lg">{t('dashboard.ordersOverTime')}</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats?.ordersPerMonth?.map(item => ({
                month: item.month,
                count: parseInt(item.count)
              })) || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--s))" strokeWidth={2} name={t('dashboard.orders')} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tracts Shipped by Country */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-lg">{t('dashboard.tractsByCountry')}</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats?.tractsByCountry?.map(item => ({
                country: item.country,
                count: parseInt(item.count)
              })) || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="country" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--wa))" name={t('dashboard.tracts')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Actionable Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="stats shadow">
          <div className="stat p-4">
            <div className="stat-title text-xs">{t('dashboard.ordersReadyToShip')}</div>
            <div className="stat-value text-2xl text-primary">{stats?.ordersReadyToShip || 0}</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat p-4">
            <div className="stat-title text-xs">{t('dashboard.ordersAwaitingPickup')}</div>
            <div className="stat-value text-2xl text-secondary">{stats?.ordersAwaitingPickup || 0}</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat p-4">
            <div className="stat-title text-xs">{t('dashboard.lowStockMedia')}</div>
            <div className="stat-value text-2xl text-warning">{stats?.lowStockMedia || 0}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
