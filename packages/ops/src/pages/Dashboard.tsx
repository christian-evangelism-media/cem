import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, Loading, Typography, Grid, Stats } from 'asterui'
import { api } from '../services/api'
import type { DashboardStats } from '../types'

const { Title } = Typography
const { Row, Col } = Grid

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
        <Loading size="lg" />
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">{t('dashboard.title')}</h1>

      <Stats className="mb-4 shadow">
        <Stats.Stat
          title={t('dashboard.totalUsers')}
          value={<span className="text-primary">{stats?.totalUsers || 0}</span>}
        />
        <Stats.Stat
          title={t('dashboard.ordersShipped')}
          value={<span className="text-secondary">{stats?.ordersShipped || 0}</span>}
        />
        <Stats.Stat
          title={t('dashboard.totalMedia')}
          value={<span className="text-accent">{stats?.totalMedia || 0}</span>}
        />
        <Stats.Stat
          title={t('dashboard.uniqueCountries')}
          value={<span className="text-success">{stats?.uniqueCountries || 0}</span>}
        />
        <Stats.Stat
          title={t('dashboard.uniqueCities')}
          value={<span className="text-info">{stats?.uniqueCities || 0}</span>}
        />
        <Stats.Stat
          title={t('dashboard.tractsShipped')}
          value={<span className="text-warning">{stats?.totalTractsShipped?.toLocaleString() || 0}</span>}
        />
      </Stats>

      {/* Charts */}
      <Row gutter={16} className="mb-4">
        {/* Orders Shipped Over Time */}
        <Col xs={24} lg={12}>
        <Card className="shadow-xl">
          <Title level={3} className="text-lg mb-4">{t('dashboard.ordersOverTime')}</Title>
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
        </Card>
        </Col>

        {/* Tracts Shipped by Country */}
        <Col xs={24} lg={12}>
        <Card className="shadow-xl">
          <Title level={3} className="text-lg mb-4">{t('dashboard.tractsByCountry')}</Title>
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
        </Card>
        </Col>
      </Row>

      {/* Actionable Metrics */}
      <Stats className="mb-4 shadow">
        <Stats.Stat
          title={t('dashboard.ordersReadyToShip')}
          value={<span className="text-primary">{stats?.ordersReadyToShip || 0}</span>}
        />
        <Stats.Stat
          title={t('dashboard.ordersAwaitingPickup')}
          value={<span className="text-secondary">{stats?.ordersAwaitingPickup || 0}</span>}
        />
        <Stats.Stat
          title={t('dashboard.lowStockMedia')}
          value={<span className="text-warning">{stats?.lowStockMedia || 0}</span>}
        />
      </Stats>
    </div>
  )
}
