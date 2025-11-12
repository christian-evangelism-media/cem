const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333'

export interface LoginResponse {
  user: {
    id: number
    email: string
    firstName: string
    lastName: string
    role: string
  }
}

export interface Order {
  id: number
  userId: number
  status: string
  trackingNumber: string | null
  notes: string | null
  createdAt: string
  user?: {
    firstName: string
    lastName: string
    email: string
  }
  items?: Array<{
    id: number
    quantity: number
    media: {
      name: string
    }
  }>
}

class ApiService {
  private authCredentials: string | null = null

  setCredentials(email: string, password: string) {
    // Store Base64 encoded credentials for Basic Auth
    this.authCredentials = btoa(`${email}:${password}`)
  }

  clearCredentials() {
    this.authCredentials = null
  }

  private async fetch(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.authCredentials) {
      headers['Authorization'] = `Basic ${this.authCredentials}`
    }

    const url = `${API_URL}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    // Set credentials for Basic Auth
    this.setCredentials(email, password)

    // Validate credentials with the server
    try {
      const response = await this.fetch('/scanner/login', {
        method: 'POST',
      })
      return response
    } catch (error) {
      this.clearCredentials()
      throw error
    }
  }

  async logout() {
    this.clearCredentials()
  }

  async shipOrder(orderId: number) {
    return this.fetch(`/scanner/orders/${orderId}/ship`, {
      method: 'PUT',
    })
  }

  async unshipOrder(orderId: number) {
    return this.fetch(`/scanner/orders/${orderId}/unship`, {
      method: 'PUT',
    })
  }

  async batchShipOrders(orderIds: number[]) {
    return this.fetch('/scanner/orders/batch-ship', {
      method: 'PUT',
      body: JSON.stringify({ orderIds }),
    })
  }

  async batchUnshipOrders(orderIds: number[]) {
    return this.fetch('/scanner/orders/batch-unship', {
      method: 'PUT',
      body: JSON.stringify({ orderIds }),
    })
  }
}

export const api = new ApiService()
