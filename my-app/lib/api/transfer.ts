// Transfer API Service

import type { Transfer, GetTransfersResponse } from '@/types/transfer'

const TRANSFER_API_BASE_URL = process.env.NEXT_PUBLIC_TRANSFER_API_BASE_URL || 'https://personal-pbshdii3.outsystemscloud.com/TransferService/rest/TransferAPI'

export interface SendFundRequest {
  FromUserId: string
  ToUserId: string
  CurrencyCode: string
  Amount: number
}

export interface SendFundResponse {
  Success: boolean
  Message: string
}

// Create a custom apiClient for transfer API
async function transferApiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${TRANSFER_API_BASE_URL}${endpoint}`

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
    console.log('[Transfer API Request]', {
      url,
      method: config.method || 'GET',
      body: config.body,
    })

    const response = await fetch(url, config)

    console.log('[Transfer API Response]', {
      status: response.status,
      statusText: response.statusText,
    })

    const responseText = await response.text()
    console.log('[Transfer API Response Text]', responseText)

    if (!responseText || responseText.trim() === '') {
      throw new Error('Transfer API returned an empty response')
    }

    // Try to parse as JSON
    let jsonData
    try {
      jsonData = JSON.parse(responseText)
    } catch (parseError) {
      console.error('[Transfer API] JSON parse error:', parseError)
      throw new Error(`Invalid response format: ${responseText.substring(0, 100)}`)
    }

    // Handle error responses - check both HTTP status and Success field
    if (!response.ok) {
      throw new Error(jsonData.Message || `HTTP ${response.status}: ${response.statusText}`)
    }

    if (jsonData.Success === false) {
      throw new Error(jsonData.Message || 'Transfer failed')
    }

    return jsonData as T
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Network error occurred')
  }
}

export const transferService = {
  /**
   * Send funds from one user to another
   * 
   * @param request - Transfer request with FromUserId, ToUserId, CurrencyCode, and Amount
   * @returns Promise with Success and Message
   */
  sendFund: async (request: SendFundRequest): Promise<SendFundResponse> => {
    console.log('[Transfer Service] Sending fund transfer:', request)

    // // Validate request
    // if (!request.FromUserId || !request.ToUserId || !request.CurrencyCode || !request.Amount) {
    //   throw new Error('Missing required transfer fields')
    // }

    // if (request.Amount <= 0) {
    //   throw new Error('Transfer amount must be greater than 0')
    // }

    // Call the transfer API
    const response = await transferApiClient<SendFundResponse>('/send_fund', {
      method: 'POST',
      body: JSON.stringify(request),
    })

    return response
  },

  /**
   * Get recent transfers for a user
   * 
   * @param userId - User ID to fetch transfers for
   * @param limit - Maximum number of transfers to return (default: 10)
   * @returns Promise with list of transfers
   */
  getRecentTransfers: async (userId: string, limit: number = 10): Promise<Transfer[]> => {
    if (!userId || !userId.trim()) {
      throw new Error('UserId is required')
    }

    console.log('[Transfer Service] Fetching recent transfers for user:', userId)

    try {
      const response = await transferApiClient<GetTransfersResponse>(
        `/GetTransfers?UserId=${encodeURIComponent(userId.trim())}`,
        {
          method: 'GET',
        }
      )

      console.log('[Transfer Service] GetTransfers response:', response)

      if (!response.Success) {
        throw new Error(response.Message || 'Failed to fetch transfers')
      }

      // Return transfers, limited to the specified limit
      return (response.Transfers || []).slice(0, limit)
    } catch (error) {
      console.error('[Transfer Service] Error fetching transfers:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Failed to fetch transfers')
    }
  },
}

