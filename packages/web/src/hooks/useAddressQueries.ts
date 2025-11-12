import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'

export interface Address {
  id: number
  name: string
  label?: string
  streetAddress: string
  streetAddress2?: string
  city: string
  province?: string
  postalCode?: string
  country: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// Query keys for cache management
export const addressKeys = {
  all: ['addresses'] as const,
  lists: () => [...addressKeys.all] as const,
}

// Fetch addresses
export function useAddresses(enabled: boolean = true) {
  return useQuery<Address[]>({
    queryKey: addressKeys.lists(),
    queryFn: async () => {
      const response = await api.addresses.list()
      return response.addresses || []
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Create address mutation
export function useCreateAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => api.addresses.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.lists() })
    },
  })
}

// Update address mutation
export function useUpdateAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.addresses.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.lists() })
    },
  })
}

// Delete address mutation
export function useDeleteAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.addresses.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.lists() })
    },
  })
}

// Set default address mutation
export function useSetDefaultAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.addresses.update(id, { isDefault: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.lists() })
    },
  })
}
