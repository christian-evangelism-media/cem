import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

interface OrderItem {
  id: number
  mediaId: number
  quantity: number
  media: {
    id: number
    name: string
    type: string
  }
}

interface Address {
  id: number
  name: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface Order {
  id: number
  userId: number
  addressId: number | null
  deliveryMethod: 'shipping' | 'pickup'
  status: string
  createdAt: string
  items: OrderItem[]
  address?: Address
}

// Query keys
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: () => [...orderKeys.lists()] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: number) => [...orderKeys.details(), id] as const,
}

// Fetch all orders for current user
export function useOrders() {
  return useQuery({
    queryKey: orderKeys.list(),
    queryFn: async () => {
      const response = await api.orders.list()
      return response.orders as Order[]
    },
    refetchInterval: 900000, // Poll every 15 minutes for status updates
  })
}

// Fetch single order
export function useOrder(id: number) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: async () => {
      const response = await api.orders.get(id)
      return response.order as Order
    },
    enabled: !!id,
  })
}

// Cancel order mutation
export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: number) => api.orders.cancel(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.list() })
    },
    onError: () => {
      // Refresh orders to get latest status if cancellation fails
      queryClient.invalidateQueries({ queryKey: orderKeys.list() })
    },
  })
}

// Place order mutation
export function usePlaceOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { addressId: number; items: { mediaId: number; quantity: number }[] }) =>
      api.orders.create(data.addressId, data.items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.list() })
    },
  })
}
