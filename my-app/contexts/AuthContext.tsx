'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/api/auth'
import { walletService } from '@/lib/api/wallet'
import { referralService } from '@/lib/api/referral'
import { resetReferralCache } from '@/lib/referral-helper'
import type { User, LoginRequest, RegisterRequest } from '@/types/auth'
import { ApiError } from '@/lib/api/client'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest, referralCode?: string) => Promise<void>
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

  const register = async (userData: RegisterRequest, referralCode?: string) => {
    try {
      // Step 1: Register the user
      const response = await authService.register(userData)

      if (response.Success && response.UserId) {
        // Step 2: Apply referral code if provided
        if (referralCode) {
          try {
            await referralService.useReferralCode(response.UserId, referralCode)
            console.log(`✓ Referral code "${referralCode}" applied successfully`)
          } catch (referralError) {
            // Referral code application failed, but user registration succeeded
            console.error('Error applying referral code:', referralError)
            // User can still proceed - referral code might be invalid
          }
        }

        // Step 3: Create 5 wallets for the newly registered user (SGD, USD, MYR, KRW, JPY)
        try {
          const walletResults = await walletService.createAllWallets(response.UserId)

          if (walletResults.success > 0) {
            console.log(`✓ Successfully created ${walletResults.success} wallets`)
          }

          if (walletResults.failed > 0) {
            console.warn(`⚠ Failed to create ${walletResults.failed} wallets`)
            // User can still proceed, failed wallets can be created later
          }
        } catch (walletError) {
          // Wallet API call failed, but user registration succeeded
          console.error('Error creating wallets:', walletError)
          // User can still proceed, wallets can be created later
        }

        // Step 4: Load user data and redirect to dashboard
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
    resetReferralCache() // Clear referral cache on logout
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
