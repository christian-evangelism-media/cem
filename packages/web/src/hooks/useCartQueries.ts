import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

export interface CartItem {
  id: number
  userId: number
  mediaId: number
  quantity: number
  createdAt: string
  updatedAt: string
  media: {
    id: number
    name: string
    nameI18n: Record<string, string> | null
    description: string | null
    descriptionI18n: Record<string, string> | null
    type: string
    typeI18n: Record<string, string> | null
    languages: string[]
    allowedQuantities: number[]
    digitalPdfUrl: string | null
    pressPdfUrl: string | null
    isActive: boolean
  }
}

// Query keys for cache management
export const cartKeys = {
  all: ['cart'] as const,
  items: () => [...cartKeys.all, 'items'] as const,
}

// Fetch cart items
export function useCart(enabled: boolean = true) {
  return useQuery({
    queryKey: cartKeys.items(),
    queryFn: async () => {
      const response = await api.get('/cart')
      return response.cartItems as CartItem[]
    },
    enabled,
  })
}

// Add or update cart item
export function useAddToCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ mediaId, quantity }: { mediaId: number; quantity: number }) => {
      const response = await api.post('/cart/items', { mediaId, quantity })
      return response.cartItem as CartItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.items() })
    },
  })
}

// Update cart item quantity
export function useUpdateCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const response = await api.put(`/cart/items/${id}`, { quantity })
      return response.cartItem as CartItem
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.items() })
    },
  })
}

// Remove cart item
export function useRemoveCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/cart/items/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.items() })
    },
  })
}

// Clear entire cart
export function useClearCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await api.delete('/cart')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.items() })
    },
  })
}
