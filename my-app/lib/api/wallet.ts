// Wallet API Service

import { apiClient } from './client'
import type {
  CreateWalletRequest,
  CreateWalletResponse,
  GetWalletResponse,
  GetAllWalletsResponse,
  UpdateWalletRequest,
  UpdateWalletResponse,
  Wallet,
  CurrencyCode,
  SUPPORTED_CURRENCIES,
} from '@/types/wallet'

// Wallet API uses a different base URL
const WALLET_API_BASE_URL = process.env.NEXT_PUBLIC_WALLET_API_BASE_URL || ''

// Create a custom apiClient for wallet API with different base URL
async function walletApiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${WALLET_API_BASE_URL}${endpoint}`

  const config: RequestInit = {
    ...options,
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  }

  // Add auth token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      }
    }
  }

  try {
    console.log('[Wallet API Request]', {
      url,
      method: config.method || 'GET',
      body: config.body,
    })

    const response = await fetch(url, config)

    console.log('[Wallet API Response]', {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'content-type': response.headers.get('content-type'),
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      }
    })

    const responseText = await response.text()
    console.log('[Wallet API Response Text]', responseText)

    if (!responseText || responseText.trim() === '') {
      throw new Error('Wallet API returned an empty response')
    }

    const jsonData = JSON.parse(responseText)

    if (!response.ok || jsonData.Success === false) {
      throw new Error(jsonData.Message || 'Wallet API error occurred')
    }

    return jsonData as T
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Network error occurred')
  }
}

// Create wallet-specific API client
const walletApi = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    walletApiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    walletApiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    walletApiClient<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),
}

export const walletService = {
  /**
   * Create a new wallet for a user with a specific currency
   */
  createWallet: async (userId: string, currencyCode: CurrencyCode): Promise<CreateWalletResponse> => {
    const requestData: CreateWalletRequest = {
      UserId: userId,
      CurrencyCode: currencyCode,
    }

    console.log(`[Wallet API] Creating ${currencyCode} wallet for user:`, userId)

    // Send raw data - NOT wrapped in RequestData
    // Endpoint is /wallets (not /CreateWallet)
    const response = await walletApi.post<CreateWalletResponse>('/wallets', requestData)

    return response
  },

  /**
   * Create all 5 currency wallets for a new user
   * Creates wallets for: SGD, USD, MYR, KRW, JPY
   */
  createAllWallets: async (userId: string): Promise<{
    success: number
    failed: number
    results: Array<{ currency: CurrencyCode; success: boolean; walletId?: string; error?: string }>
  }> => {
    const currencies: CurrencyCode[] = ['SGD', 'USD', 'MYR', 'KRW', 'JPY']
    const results: Array<{ currency: CurrencyCode; success: boolean; walletId?: string; error?: string }> = []

    let successCount = 0
    let failedCount = 0

    console.log(`[Wallet API] Creating 5 wallets for user: ${userId}`)

    // Create all wallets sequentially
    for (const currency of currencies) {
      try {
        const response = await walletService.createWallet(userId, currency)

        if (response.Success && response.WalletId) {
          successCount++
          results.push({
            currency,
            success: true,
            walletId: response.WalletId,
          })
          console.log(`✓ ${currency} wallet created:`, response.WalletId)
        } else {
          failedCount++
          results.push({
            currency,
            success: false,
            error: response.Message,
          })
          console.error(`✗ ${currency} wallet failed:`, response.Message)
        }
      } catch (error) {
        failedCount++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.push({
          currency,
          success: false,
          error: errorMessage,
        })
        console.error(`✗ ${currency} wallet error:`, errorMessage)
      }
    }

    console.log(`[Wallet API] Wallet creation complete: ${successCount} succeeded, ${failedCount} failed`)

    return {
      success: successCount,
      failed: failedCount,
      results,
    }
  },

  /**
   * Get wallet by user ID
   */
  getWalletByUserId: async (userId: string): Promise<Wallet | null> => {
    const response = await walletApi.get<GetWalletResponse>(`/GetWallet?UserId=${userId}`)

    if (response.Success && response.Wallet) {
      return response.Wallet
    }

    return null
  },

  /**
   * Get wallet by wallet ID
   */
  getWallet: async (walletId: string): Promise<Wallet | null> => {
    const response = await walletApi.get<GetWalletResponse>(`/GetWallet?WalletId=${walletId}`)

    if (response.Success && response.Wallet) {
      return response.Wallet
    }

    return null
  },

  /**
   * Update wallet balance (deposit/withdrawal)
   * Amount can be positive (deposit) or negative (withdrawal)
   */
  updateWallet: async (userId: string, currencyCode: CurrencyCode, amount: number): Promise<UpdateWalletResponse> => {
    const requestData: UpdateWalletRequest = {
      UserId: userId,
      CurrencyCode: currencyCode,
      Amount: amount,
    }

    console.log(`[Wallet API] Updating ${currencyCode} wallet for user ${userId} by ${amount}`)

    // Endpoint is /UpdateWallet - uses PUT method
    const response = await walletApi.put<UpdateWalletResponse>('/UpdateWallet', requestData)

    return response
  },

  /**
   * Get all wallets for a user (all 5 currencies)
   * Uses the GetAllWalletByUserId endpoint for efficiency
   */
  getAllWallets: async (userId: string): Promise<Wallet[]> => {
    console.log(`[Wallet API] Fetching all wallets for user: ${userId}`)

    try {
      const response = await walletApi.get<GetAllWalletsResponse>(`/GetAllWalletByUserId?UserId=${userId}`)

      if (response.Success && response.Wallets) {
        console.log(`✓ Fetched ${response.Wallets.length} wallets for user`)
        response.Wallets.forEach(wallet => {
          console.log(`  - ${wallet.CurrencyCode}: Balance = ${wallet.Balance}`)
        })
        return response.Wallets
      } else {
        console.warn(`⚠ No wallets found for user: ${response.Message}`)
        return []
      }
    } catch (error) {
      console.error(`✗ Error fetching wallets:`, error)
      return []
    }
  },

  /**
   * Get a specific wallet by userId and currencyCode
   * Uses the direct endpoint: /wallets/{UserId}/{CurrencyCode}
   */
  getWalletByCurrency: async (userId: string, currencyCode: CurrencyCode): Promise<Wallet | null> => {
    console.log(`[Wallet API] Fetching ${currencyCode} wallet for user: ${userId}`)

    try {
      const response = await walletApi.get<GetWalletResponse>(`/wallets/${userId}/${currencyCode}`)

      if (response.Success && response.Wallet) {
        console.log(`✓ ${currencyCode} wallet fetched: Balance = ${response.Wallet.Balance}`)
        return response.Wallet
      } else {
        console.warn(`⚠ ${currencyCode} wallet not found`)
        return null
      }
    } catch (error) {
      console.error(`✗ Error fetching ${currencyCode} wallet:`, error)
      return null
    }
  },
}
