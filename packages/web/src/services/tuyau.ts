import { createTuyau } from '@tuyau/client'
import { api } from 'api/api'

export const $api = createTuyau({
  api,
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3333',
})
