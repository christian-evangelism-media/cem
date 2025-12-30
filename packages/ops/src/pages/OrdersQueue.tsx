import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { DateTime } from 'luxon'
import { Card, Badge, Button, Loading } from 'asterui'
import { api } from '../services/api'
import type { DashboardStats } from '../types'

export default function OrdersQueue() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.stats.dashboard(),
    refetchInterval: 10000, // Poll every 10 seconds for new orders
  })

  const grabOrderMutation = useMutation({
    mutationFn: (orderId: number) => api.orders.grab(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      navigate('/current-orders')
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading size="lg" />
      </div>
    )
  }

  // Filter to only show actionable orders (pending or cancelling)
  const actionableOrders = stats?.recentOrders.filter(order =>
    order.status === 'pending' || order.status === 'cancelling'
  ) || []

  const pendingOrders = actionableOrders.filter(order => order.status === 'pending').length
  const cancellingOrders = actionableOrders.filter(order => order.status === 'cancelling').length

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">{t('ordersQueue.title')}</h1>

      <Card className="shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-6">
            <span className="text-lg text-base-content/70">
              {pendingOrders} {t('dashboard.pending')}
            </span>
            <span className="text-lg text-base-content/70">
              {cancellingOrders} {t('dashboard.cancelling')}
            </span>
          </div>
          {cancellingOrders > 0 && (
            <Badge color="warning" size="lg">
              {cancellingOrders} {t('dashboard.cancellingBadge')}
            </Badge>
          )}
        </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-16">{t('orders.id')}</th>
                  <th>{t('orders.user')}</th>
                  <th className="w-40">{t('orders.status')}</th>
                  <th>{t('orders.orderItems')}</th>
                  <th className="w-44">{t('orders.ordered')}</th>
                  <th className="w-32">{t('orders.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {actionableOrders.length > 0 ? (
                  actionableOrders.map((order) => (
                    <tr
                      key={order.id}
                      className={order.status === 'cancelling' ? 'bg-warning bg-opacity-20' : ''}
                    >
                      <td>{order.id}</td>
                      <td>
                        {order.user ? (
                          <div className="font-medium">
                            {order.user.firstName} {order.user.lastName}
                          </div>
                        ) : (
                          t('common.userNumber', { id: order.userId })
                        )}
                      </td>
                      <td>
                        <Badge color={
                          order.status === 'pending' ? 'warning' :
                          order.status === 'processing' ? 'info' :
                          order.status === 'packing' ? 'info' :
                          order.status === 'ready' ? 'default' :
                          order.status === 'shipping' ? 'primary' :
                          order.status === 'shipped' ? 'success' :
                          order.status === 'cancelling' ? 'warning' :
                          'error'
                        }>
                          {t(`orders.statuses.${order.status}`)}
                        </Badge>
                      </td>
                      <td>
                        <div className="space-y-1">
                          {order.items?.map((item) => (
                            <div key={item.id} className="text-sm">
                              <span className="font-medium">{item.quantity}×</span>{' '}
                              <span>{item.media?.nameI18n?.[i18n.language] || item.media?.nameI18n?.en || item.media?.name || 'Unknown'}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td>
                        {DateTime.fromISO(order.createdAt).setLocale(i18n.language).toLocaleString(DateTime.DATETIME_SHORT)}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {(order.status === 'pending' || order.status === 'cancelling') && (
                            <Button
                              size="sm"
                              color="success"
                              onClick={() => grabOrderMutation.mutate(order.id)}
                              loading={grabOrderMutation.isPending}
                            >
                              {t('orders.grab')}
                            </Button>
                          )}
                          <Button size="sm" color="info">{t('orders.view')}</Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-500">{t('dashboard.noOrders')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </Card>
    </div>
  )
}
