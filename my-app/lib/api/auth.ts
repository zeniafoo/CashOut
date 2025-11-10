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
    // Send credentials directly, not wrapped in RequestData
    const response = await api.post<LoginResponse>('/Login', credentials)

    // Store user data if login successful
    if (response.Success && response.UserId) {
      localStorage.setItem('authToken', response.UserId)

      const user: User = {
        UserId: response.UserId,
        Name: response.Name,
        Email: credentials.Email,
        PhoneNumber: '',
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
    // Send userData directly, not wrapped in RequestData
    const response = await api.post<RegisterResponse>('/Register', userData)

    // Store user data if registration successful
    if (response.Success && response.UserId) {
      localStorage.setItem('authToken', response.UserId)

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