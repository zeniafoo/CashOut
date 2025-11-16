// Authentication API Types - Matching OutSystems API Structure

export interface User {
  UserId: string
  Name: string
  Email: string
  PhoneNumber: string
  ReferralCode?: string
}

export interface LoginRequest {
  Email: string
  Password: string
}

export interface LoginResponse {
  Success: boolean
  Message: string
  UserId: string
  Name: string
  ReferralCode: string
}

export interface RegisterRequest {
  Name: string
  Email: string
  PhoneNumber: string
  Password: string
}

export interface RegisterResponse {
  Success: boolean
  Message: string
  UserId: string
  ReferralCode: string
}

export interface GetUserResponse {
  Found: boolean
  Name: string
  Email: string
  PhoneNumber: string
  ReferralCode: string
}

export interface GetUserByPhoneResponse {
  Found: boolean
  UserId: string
}

export interface ApiError {
  Success: false
  Message: string
  Error?: string
}
