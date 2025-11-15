// Referral API Service

import type {
  UseReferralCodeRequest,
  UseReferralCodeResponse,
  CompleteReferralRequest,
  CompleteReferralResponse,
  GetReferralInfoResponse,
} from '@/types/referral'

const REFERRAL_API_BASE_URL = process.env.NEXT_PUBLIC_REFERRAL_API_BASE_URL || ''

// Create a custom API client for referral API
async function referralApiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${REFERRAL_API_BASE_URL}${endpoint}`

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
    console.log('[Referral API Request]', {
      url,
      method: config.method || 'GET',
      body: config.body,
    })

    const response = await fetch(url, config)

    console.log('[Referral API Response]', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
    })

    const responseText = await response.text()
    console.log('[Referral API Response Text]', responseText)

    // Check for empty response
    if (!responseText || responseText.trim() === '') {
      throw new Error('Referral API returned an empty response')
    }

    // Check if response is HTML (CORS or error page)
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      console.error('[Referral API HTML Response] OutSystems returned HTML instead of JSON')
      throw new Error(
        'Referral API returned an HTML error page. Please ensure CORS is enabled on your Referral API for localhost:3000'
      )
    }

    // Try to parse as JSON
    let jsonData
    try {
      jsonData = JSON.parse(responseText)
    } catch (parseError) {
      console.error('[Referral API JSON Parse Error]', parseError)
      throw new Error(
        `Referral API returned invalid response. Expected JSON but got: ${responseText.substring(0, 100)}`
      )
    }

    // Check for API errors
    if (!response.ok || jsonData.Success === false) {
      throw new Error(jsonData.Message || 'Referral API error occurred')
    }

    return jsonData as T
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Network error occurred')
  }
}

// Referral API methods
const referralApi = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    referralApiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    referralApiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),
}

export const referralService = {
  /**
   * Use a referral code when a new user signs up
   * This creates the referral relationship
   */
  useReferralCode: async (newUserId: string, referralCode: string): Promise<UseReferralCodeResponse> => {
    console.log(`[Referral API] New user ${newUserId} using referral code: ${referralCode}`)

    const requestData: UseReferralCodeRequest = {
      NewUserId: newUserId,
      ReferralCode: referralCode,
    }

    try {
      const response = await referralApi.post<UseReferralCodeResponse>('/referrals/use', requestData)

      if (response.Success) {
        console.log(`✓ Referral code applied successfully. Referrer ID: ${response.ReferrerId}`)
      } else {
        console.warn(`⚠ Failed to apply referral code: ${response.Message}`)
      }

      return response
    } catch (error) {
      console.error('✗ Error using referral code:', error)
      throw error
    }
  },

  /**
   * Complete a referral after user's first transaction
   * This triggers the $5 bonus for both referrer and referee
   */
  completeReferral: async (userId: string): Promise<CompleteReferralResponse> => {
    console.log(`[Referral API] Completing referral for user: ${userId}`)

    const requestData: CompleteReferralRequest = {
      UserId: userId,
    }

    try {
      const response = await referralApi.post<CompleteReferralResponse>('/referrals/complete', requestData)

      if (response.Success) {
        console.log(`✓ Referral completed! $5 bonus awarded to referrer ${response.ReferrerId} and referee ${response.RefereeId}`)
      } else {
        console.warn(`⚠ Referral completion message: ${response.Message}`)
      }

      return response
    } catch (error) {
      console.error('✗ Error completing referral:', error)
      throw error
    }
  },

  /**
   * Get referral information for a user
   * Shows their referral code, total referrals, completed referrals, etc.
   */
  getReferralInfo: async (userId: string): Promise<GetReferralInfoResponse> => {
    console.log(`[Referral API] Fetching referral info for user: ${userId}`)

    try {
      const response = await referralApi.get<GetReferralInfoResponse>(
        `/GetReferralInfo?UserId=${userId}`
      )

      console.log(`✓ Referral info fetched:`, {
        code: response.ReferralCode,
        total: response.TotalReferrals,
        completed: response.CompletedReferrals,
        pending: response.PendingReferrals,
        earnings: response.TotalEarnings,
      })

      return response
    } catch (error) {
      console.error('✗ Error fetching referral info:', error)
      throw error
    }
  },
}
