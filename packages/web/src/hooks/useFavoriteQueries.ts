import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

export interface Favorite {
  id: number
  userId: number
  mediaId: number
  createdAt: string
  updatedAt: string
  media: {
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
}

// Query keys for cache management
export const favoriteKeys = {
  all: ['favorites'] as const,
  items: () => [...favoriteKeys.all, 'items'] as const,
}

// Fetch favorites
export function useFavorites(enabled: boolean = true) {
  return useQuery({
    queryKey: favoriteKeys.items(),
    queryFn: async () => {
      const response = await api.get('/favorites')
      return response.favorites as Favorite[]
    },
    enabled,
  })
}

// Toggle favorite (add or remove)
export function useToggleFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (mediaId: number) => {
      const response = await api.post('/favorites', { mediaId })
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.items() })
    },
  })
}

// Remove favorite
export function useRemoveFavorite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (mediaId: number) => {
      await api.delete(`/favorites/${mediaId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favoriteKeys.items() })
    },
  })
}
