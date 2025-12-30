import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, Loading, Typography, Grid } from 'asterui'
import { api } from '../services/api'
import type { DashboardStats } from '../types'

const { Title, Text } = Typography
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

      <Row gutter={16} className="mb-4">
        <Col xs={12} md={8} lg={4}>
          <Card className="shadow p-4">
            <Text className="text-xs opacity-70">{t('dashboard.totalUsers')}</Text>
            <Title level={2} className="text-2xl text-primary">{stats?.totalUsers || 0}</Title>
          </Card>
        </Col>

        <Col xs={12} md={8} lg={4}>
          <Card className="shadow p-4">
            <Text className="text-xs opacity-70">{t('dashboard.ordersShipped')}</Text>
            <Title level={2} className="text-2xl text-secondary">{stats?.ordersShipped || 0}</Title>
          </Card>
        </Col>

        <Col xs={12} md={8} lg={4}>
          <Card className="shadow p-4">
            <Text className="text-xs opacity-70">{t('dashboard.totalMedia')}</Text>
            <Title level={2} className="text-2xl text-accent">{stats?.totalMedia || 0}</Title>
          </Card>
        </Col>

        <Col xs={12} md={8} lg={4}>
          <Card className="shadow p-4">
            <Text className="text-xs opacity-70">{t('dashboard.uniqueCountries')}</Text>
            <Title level={2} className="text-2xl text-success">{stats?.uniqueCountries || 0}</Title>
          </Card>
        </Col>

        <Col xs={12} md={8} lg={4}>
          <Card className="shadow p-4">
            <Text className="text-xs opacity-70">{t('dashboard.uniqueCities')}</Text>
            <Title level={2} className="text-2xl text-info">{stats?.uniqueCities || 0}</Title>
          </Card>
        </Col>

        <Col xs={12} md={8} lg={4}>
          <Card className="shadow p-4">
            <Text className="text-xs opacity-70">{t('dashboard.tractsShipped')}</Text>
            <Title level={2} className="text-2xl text-warning">{stats?.totalTractsShipped?.toLocaleString() || 0}</Title>
          </Card>
        </Col>
      </Row>

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
      <Row gutter={16} className="mb-4">
        <Col xs={24} md={8}>
          <Card className="shadow p-4">
            <Text className="text-xs opacity-70">{t('dashboard.ordersReadyToShip')}</Text>
            <Title level={2} className="text-2xl text-primary">{stats?.ordersReadyToShip || 0}</Title>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="shadow p-4">
            <Text className="text-xs opacity-70">{t('dashboard.ordersAwaitingPickup')}</Text>
            <Title level={2} className="text-2xl text-secondary">{stats?.ordersAwaitingPickup || 0}</Title>
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card className="shadow p-4">
            <Text className="text-xs opacity-70">{t('dashboard.lowStockMedia')}</Text>
            <Title level={2} className="text-2xl text-warning">{stats?.lowStockMedia || 0}</Title>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
