export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
  emailVerifiedAt: string | null
  preferredLanguages: string[] | null
  allowPickup: boolean
  createdAt: string
  updatedAt: string | null
}
