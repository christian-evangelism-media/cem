export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
  isBlocked: boolean
  emailVerifiedAt: string | null
  preferredLanguages: string[] | null
  allowPickup: boolean
  notes: string | null
  createdAt: string
  updatedAt: string | null
}

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

export interface Media {
  id: number
  name: string
  nameI18n: Record<string, string> | null
  description: string | null
  descriptionI18n: Record<string, string> | null
  type: string
  typeI18n: Record<string, string> | null
  languages: string[]
  allowedQuantities: number[]
  bundleSizes: number[] | null
  digitalPdfUrl: string | null
  pressPdfUrl: string | null
  isVisible: boolean
  trackInventory: boolean
  inventoryStock: Record<string, number> | null
  lowStockThreshold: number | null
  createdBy: number | null
  createdAt: string
  updatedAt: string | null
}

export interface OrderStatusChange {
  id: number
  orderId: number
  status: string
  changedBy: number | null
  changedByUser?: User
  createdAt: string
}

export interface Message {
  id: number
  userId: number
  orderId: number | null
  subject: string
  body: string
  isRead: boolean
  respondedById: number | null
  responseBody: string | null
  respondedAt: string | null
  createdAt: string
  updatedAt: string
  user?: User
}

export interface Order {
  id: number
  userId: number
  addressId: number | null
  deliveryMethod: 'shipping' | 'pickup'
  status: string
  trackingNumber: string | null
  notes: string | null
  createdAt: string
  updatedAt: string | null
  user?: User
  address?: Address
  statusChanges?: OrderStatusChange[]
  items?: OrderItem[]
  messages?: Message[]
}

export interface OrderItem {
  id: number
  orderId: number
  mediaId: number
  quantity: number
  media?: Media
}

export interface PaginatedResponse<T> {
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

export interface DashboardStats {
  totalUsers: number
  ordersShipped: number
  totalMedia: number
  uniqueCountries: number
  uniqueCities: number
  totalTractsShipped: number
  ordersReadyToShip: number
  ordersAwaitingPickup: number
  lowStockMedia: number
  ordersPerMonth: Array<{ month: string; month_sort: string; count: string }>
  tractsByCountry: Array<{ country: string; count: string }>
  recentOrders: Order[]
}
