export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333'

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  language?: string
}

interface LoginData {
  email: string
  password: string
}

interface OrderItem {
  mediaId: number
  quantity: number
}

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  // Handle lockdown (423 Locked)
  if (response.status === 423) {
    const error = await response.json().catch(() => ({ message: 'System is locked down' }))

    // Logout the user by calling the logout endpoint
    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (e) {
      // Ignore errors - lockdown is more important
    }

    // Store lockdown state in sessionStorage
    sessionStorage.setItem('isLockedDown', 'true')
    // Trigger a custom event to notify the app
    window.dispatchEvent(new CustomEvent('lockdown-detected'))
    throw new Error(error.message || 'System is in lockdown mode')
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message || 'An error occurred')
  }

  return response.json()
}

export const api = {
  get: (endpoint: string) => fetchApi(endpoint),
  post: (endpoint: string, data?: any) => fetchApi(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  }),
  put: (endpoint: string, data?: any) => fetchApi(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  }),
  delete: (endpoint: string) => fetchApi(endpoint, {
    method: 'DELETE',
  }),

  auth: {
    register: (data: RegisterData) => fetchApi('/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    login: (data: LoginData) => fetchApi('/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    logout: () => fetchApi('/logout', { method: 'POST' }),
    me: () => fetchApi('/me'),
    updatePreferences: (preferredLanguages: string[] | null) => fetchApi('/me/preferences', {
      method: 'PUT',
      body: JSON.stringify({ preferredLanguages }),
    }),
    updateProfile: (data: { firstName: string; lastName: string; email: string }) => fetchApi('/me/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    changePassword: (data: { currentPassword: string; newPassword: string }) => fetchApi('/me/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  },

  media: {
    list: (params?: { type?: string; page?: number; limit?: number; languages?: string[]; lang?: string; isManualFilter?: boolean }) => {
      const searchParams = new URLSearchParams()
      if (params?.type) searchParams.append('type', params.type)
      if (params?.page) searchParams.append('page', params.page.toString())
      if (params?.limit) searchParams.append('limit', params.limit.toString())
      if (params?.languages && params.languages.length > 0) {
        searchParams.append('languages', params.languages.join(','))
      }
      if (params?.lang) searchParams.append('lang', params.lang)
      if (params?.isManualFilter !== undefined) {
        searchParams.append('isManualFilter', params.isManualFilter.toString())
      }
      const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
      return fetchApi(`/media${query}`)
    },
    get: (id: number) => fetchApi(`/media/${id}`),
  },

  orders: {
    list: () => fetchApi('/orders'),
    get: (id: number) => fetchApi(`/orders/${id}`),
    create: (addressId: number, items: OrderItem[]) => fetchApi('/orders', {
      method: 'POST',
      body: JSON.stringify({ addressId, items }),
    }),
    cancel: (id: number) => fetchApi(`/orders/${id}/cancel`, {
      method: 'PUT',
    }),
  },

  addresses: {
    list: () => fetchApi('/addresses'),
    get: (id: number) => fetchApi(`/addresses/${id}`),
    create: (data: any) => fetchApi('/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: any) => fetchApi(`/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: number) => fetchApi(`/addresses/${id}`, {
      method: 'DELETE',
    }),
  },

  lockdown: {
    status: () => fetchApi('/lockdown/status'),
  },
}
