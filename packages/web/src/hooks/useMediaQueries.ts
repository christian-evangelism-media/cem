import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { cartKeys } from './useCartQueries'

interface MediaItem {
  id: number
  name: string
  description: string | null
  type: string
  languages: string[]
  allowedQuantities: number[]
  digitalPdfUrl: string | null
  pressPdfUrl: string | null
  isActive: boolean
}

interface OrderItem {
  mediaId: number
  quantity: number
}

interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
    firstPage: number
    firstPageUrl: string
    lastPageUrl: string
    nextPageUrl: string | null
    previousPageUrl: string | null
  }
}

// Query keys for cache management
export const mediaKeys = {
  all: ['media'] as const,
  lists: () => [...mediaKeys.all, 'list'] as const,
  list: (params?: { type?: string; page?: number; limit?: number; languages?: string[]; lang?: string; isManualFilter?: boolean; userPreferences?: string[] | null }) => [...mediaKeys.lists(), params] as const,
  details: () => [...mediaKeys.all, 'detail'] as const,
  detail: (id: number) => [...mediaKeys.details(), id] as const,
}

// Fetch all media
export function useMedia(params?: { type?: string; page?: number; limit?: number; languages?: string[]; lang?: string; isManualFilter?: boolean; userPreferences?: string[] | null }) {
  // Remove userPreferences from the params sent to the API
  const { userPreferences, ...apiParams } = params || {}

  return useQuery({
    queryKey: mediaKeys.list(params),
    queryFn: async () => {
      const response = await api.media.list(apiParams)
      return response as PaginatedResponse<MediaItem>
    },
  })
}

// Fetch single media item
export function useMediaItem(id: number) {
  return useQuery({
    queryKey: mediaKeys.detail(id),
    queryFn: async () => {
      const response = await api.media.get(id)
      return response.media as MediaItem
    },
    enabled: !!id,
  })
}

// Create order mutation
export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ addressId, items, deliveryMethod }: { addressId: number | null; items: OrderItem[]; deliveryMethod?: 'shipping' | 'pickup' }) => {
      const response = await api.orders.create(addressId, items, deliveryMethod)
      return response.order
    },
    onSuccess: () => {
      // Invalidate and refetch orders
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      // Invalidate cart since backend clears it after order placement
      queryClient.invalidateQueries({ queryKey: cartKeys.items() })
    },
  })
}
