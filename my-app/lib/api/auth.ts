// Authentication API Service

import { api } from './client'
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  GetUserResponse,
  User,
} from '@/types/auth'

export const authService = {
  /**
   * Login user with email and password
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    // Wrap credentials in RequestData as expected by OutSystems API
    const response = await api.post<LoginResponse>('/Login', {
      RequestData: credentials
    })

    // Store user data if login successful
    // Note: OutSystems API returns UserId instead of Token
    if (response.Success && response.UserId) {
      // Use UserId as the authentication token since there's no separate token
      localStorage.setItem('authToken', response.UserId)

      // Store user data
      const user: User = {
        UserId: response.UserId,
        Name: response.Name,
        Email: credentials.Email, // Email not returned by API, use from request
        PhoneNumber: '', // Not returned by Login API
        ReferralCode: response.ReferralCode
      }
      localStorage.setItem('user', JSON.stringify(user))
    }

    return response
  },

  /**
   * Register a new user
   */
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    // Wrap userData in RequestData as expected by OutSystems API
    const response = await api.post<RegisterResponse>('/Register', {
      RequestData: userData
    })

    // Store user data if registration successful
    if (response.Success && response.UserId) {
      // Use UserId as the authentication token
      localStorage.setItem('authToken', response.UserId)

      // Store user data
      const user: User = {
        UserId: response.UserId,
        Name: userData.Name,
        Email: userData.Email,
        PhoneNumber: userData.PhoneNumber,
        ReferralCode: response.ReferralCode
      }
      localStorage.setItem('user', JSON.stringify(user))
    }

    return response
  },

  /**
   * Get user by ID
   */
  getUser: async (userId: string): Promise<User | null> => {
    const response = await api.get<GetUserResponse>(`/GetUser?UserId=${userId}`)

    if (response.Found) {
      return {
        UserId: userId,
        Name: response.Name,
        Email: response.Email,
        PhoneNumber: response.PhoneNumber,
        ReferralCode: response.ReferralCode
      }
    }

    return null
  },

  /**
   * Logout user (clear local storage)
   */
  logout: () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
  },

  /**
   * Get current user from local storage
   */
  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null

    const userStr = localStorage.getItem('user')
    if (!userStr) return null

    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false
    return !!localStorage.getItem('authToken')
  },

  /**
   * Get auth token
   */
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('authToken')
  },
}
