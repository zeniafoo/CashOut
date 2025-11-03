'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/api/auth'
import type { User, LoginRequest, RegisterRequest } from '@/types/auth'
import { ApiError } from '@/lib/api/client'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      const currentUser = authService.getCurrentUser()
      setUser(currentUser)
      setIsLoading(false)
    }

    loadUser()
  }, [])

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authService.login(credentials)

      if (response.Success && response.UserId) {
        // Get the user data from localStorage that was set by authService
        const currentUser = authService.getCurrentUser()
        setUser(currentUser)
        router.push('/dashboard')
      } else {
        throw new Error(response.Message || 'Login failed')
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message)
      }
      throw error
    }
  }

  const register = async (userData: RegisterRequest) => {
    try {
      const response = await authService.register(userData)

      if (response.Success && response.UserId) {
        // Get the user data from localStorage that was set by authService
        const currentUser = authService.getCurrentUser()
        setUser(currentUser)
        router.push('/dashboard')
      } else {
        throw new Error(response.Message || 'Registration failed')
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message)
      }
      throw error
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    router.push('/')
  }

  const refreshUser = async () => {
    if (!user?.UserId) return

    try {
      const userData = await authService.getUser(user.UserId)
      if (userData) {
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
