const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333'

interface FetchOptions extends RequestInit {
  body?: any
}

async function fetchApi(endpoint: string, options: FetchOptions = {}) {
  const { body, ...otherOptions } = options

  const config: RequestInit = {
    ...otherOptions,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...otherOptions.headers,
    },
  }

  if (body) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body)
  }

  const response = await fetch(`${API_URL}${endpoint}`, config)

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
    throw new Error(error.message || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export const api = {
  health: {
    check: async () => {
      // Health endpoint returns JSON even on 503, so handle it specially
      const response = await fetch(`${API_URL}/health`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      return response.json()
    },
  },

  auth: {
    login: (email: string, password: string) =>
      fetchApi('/login', { method: 'POST', body: { email, password } }),
    logout: () => fetchApi('/logout', { method: 'POST' }),
    me: () => fetchApi('/me'),
  },

  media: {
    list: (params?: { page?: number; limit?: number; search?: string; languages?: string; isManualFilter?: boolean; sortByPopularity?: boolean }) => {
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.append('page', params.page.toString())
      if (params?.limit) searchParams.append('limit', params.limit.toString())
      if (params?.search) searchParams.append('search', params.search)
      if (params?.languages) searchParams.append('languages', params.languages)
      if (params?.isManualFilter) searchParams.append('isManualFilter', 'true')
      if (params?.sortByPopularity) searchParams.append('sortByPopularity', 'true')
      return fetchApi(`/media?${searchParams}`)
    },
    get: (id: number) => fetchApi(`/media/${id}`),
    create: (data: any) => fetchApi('/admin/media', { method: 'POST', body: data }),
    update: (id: number, data: any) => fetchApi(`/admin/media/${id}`, { method: 'PUT', body: data }),
    delete: (id: number) => fetchApi(`/admin/media/${id}`, { method: 'DELETE' }),
  },

  orders: {
    list: (params?: { page?: number; limit?: number }) => {
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.append('page', params.page.toString())
      if (params?.limit) searchParams.append('limit', params.limit.toString())
      return fetchApi(`/admin/orders?${searchParams}`)
    },
    get: (id: number) => fetchApi(`/admin/orders/${id}`),
    updateStatus: (id: number, status: string) =>
      fetchApi(`/admin/orders/${id}`, { method: 'PUT', body: { status } }),
    updateTrackingNumber: (id: number, trackingNumber: string) =>
      fetchApi(`/admin/orders/${id}`, { method: 'PUT', body: { trackingNumber } }),
    updateNotes: (id: number, notes: string) =>
      fetchApi(`/admin/orders/${id}`, { method: 'PUT', body: { notes } }),
    grab: (id: number) => fetchApi(`/admin/orders/${id}/grab`, { method: 'PUT' }),
    myOrders: () => fetchApi('/admin/my-orders'),
  },

  users: {
    list: (params?: { page?: number; limit?: number; search?: string }) => {
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.append('page', params.page.toString())
      if (params?.limit) searchParams.append('limit', params.limit.toString())
      if (params?.search) searchParams.append('search', params.search)
      return fetchApi(`/admin/users?${searchParams}`)
    },
    get: (id: number) => fetchApi(`/admin/users/${id}`),
    create: (data: any) => fetchApi('/admin/users', { method: 'POST', body: data }),
    update: (id: number, data: any) => fetchApi(`/admin/users/${id}`, { method: 'PUT', body: data }),
    updateRole: (id: number, role: string) => fetchApi(`/admin/users/${id}/role`, { method: 'PUT', body: { role } }),
    toggleBlock: (id: number) => fetchApi(`/admin/users/${id}/block`, { method: 'PUT' }),
    updateNotes: (id: number, notes: string) => fetchApi(`/admin/users/${id}`, { method: 'PUT', body: { notes } }),
    delete: (id: number) => fetchApi(`/admin/users/${id}`, { method: 'DELETE' }),
  },

  stats: {
    dashboard: () => fetchApi('/admin/stats'),
  },

  messages: {
    list: () => fetchApi('/messages'),
    toggleRead: (id: number) => fetchApi(`/messages/${id}/toggle-read`, { method: 'PUT' }),
    respond: (id: number, responseBody: string) =>
      fetchApi(`/messages/${id}/respond`, { method: 'PUT', body: { responseBody } }),
  },

  lockdown: {
    status: () => fetchApi('/lockdown/status'),
    activate: () => fetchApi('/lockdown/activate', { method: 'POST' }),
  },

  maintenance: {
    status: () => fetchApi('/maintenance/status'),
    activate: (reason?: string) => fetchApi('/maintenance/activate', { method: 'POST', body: { reason } }),
    deactivate: () => fetchApi('/maintenance/deactivate', { method: 'POST' }),
  },

  inventory: {
    adjust: (id: number, bundleSize: number, quantity: number) =>
      fetchApi(`/admin/inventory/${id}/adjust`, {
        method: 'PUT',
        body: { bundleSize, quantity },
      }),
    enableTracking: (id: number, trackInventory: boolean, bundleSizes?: number[], lowStockThreshold?: number) =>
      fetchApi(`/admin/inventory/${id}/tracking`, {
        method: 'PUT',
        body: { trackInventory, bundleSizes, lowStockThreshold },
      }),
  },
}

export { API_URL }
