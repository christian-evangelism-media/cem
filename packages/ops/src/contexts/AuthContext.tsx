import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { api } from '../services/api'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const response = await api.auth.me()
      setUser(response.user)
    } catch (error) {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  async function login(email: string, password: string) {
    const response = await api.auth.login(email, password)

    // Check if user has staff privileges
    const allowedRoles = ['super_admin', 'admin', 'support', 'help']
    if (!allowedRoles.includes(response.user.role)) {
      throw new Error('Access denied. Staff privileges required.')
    }

    setUser(response.user)
  }

  async function logout() {
    await api.auth.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
