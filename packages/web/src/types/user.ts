export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  emailVerifiedAt: string | null
  preferredLanguages: string[] | null
  createdAt: string
  updatedAt: string | null
}
