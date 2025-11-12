import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../types/user'
import { api } from '../services/api'

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  isLoading: boolean
  logout: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await api.auth.me()
      setUser(response.user)
    } catch (error) {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await api.auth.logout()
      setUser(null)
    } catch (error) {
      console.error('Logout failed', error)
    }
  }

  return (
    <UserContext.Provider value={{ user, setUser, isLoading, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

// Hook for protected routes - guarantees user exists
export function useAuthenticatedUser(): User {
  const { user } = useUser()
  if (!user) {
    throw new Error('useAuthenticatedUser can only be used in protected routes')
  }
  return user
}
