import { useMutation } from '@tanstack/react-query'
import { api } from '../services/api'

interface SendMessageParams {
  subject: string
  body: string
  orderId?: number
}

export function useSendMessage() {
  return useMutation({
    mutationFn: async (data: SendMessageParams) => {
      const response = await api.post('/messages', data)
      return response.data
    },
  })
}
