import { createTuyau } from '@tuyau/client'
import type { api } from 'cem-api/api'

export const tuyau = createTuyau({
  api,
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3333',
})

// Export the API client with type safety
export const $api = tuyau.api
