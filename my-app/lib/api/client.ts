// API Client Configuration

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export interface ApiResponse<T> {
  Success: boolean
  Message: string
  data?: T
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public response?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

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
    console.log('[API Request]', {
      url,
      method: config.method || 'GET',
      body: config.body,
    })

    const response = await fetch(url, config)

    console.log('[API Response]', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
    })

    // Get response text first
    const responseText = await response.text()
    console.log('[API Response Text]', responseText)

    // Check for empty response
    if (!responseText || responseText.trim() === '') {
      console.error('[Empty Response] OutSystems API returned empty body')
      throw new ApiError(
        response.status,
        'Backend API returned an empty response. Please check your OutSystems REST API action to ensure it returns a JSON response with Success, Message, Token, and User fields.',
        {
          rawResponse: responseText,
          hint: 'Your OutSystems API endpoint needs to return JSON. Check the REST API action output structure.'
        }
      )
    }

    // Check if response is HTML (error page)
    if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
      console.error('[HTML Response] OutSystems returned HTML instead of JSON')

      // Check if it's a CORS error
      if (response.status === 0 || !response.ok) {
        throw new ApiError(
          response.status || 500,
          'CORS Error: Your OutSystems API is not allowing requests from this domain. Please enable CORS in your OutSystems REST API settings for localhost:3000',
          {
            rawResponse: responseText.substring(0, 200),
            hint: 'Enable CORS in OutSystems Service Center or add your domain to allowed origins'
          }
        )
      }

      // Check for common OutSystems error pages
      if (responseText.includes('404') || responseText.includes('Not Found')) {
        throw new ApiError(
          404,
          'API endpoint not found. Please verify the API URL in your .env.local file matches your OutSystems REST API endpoint exactly.',
          { rawResponse: responseText.substring(0, 200) }
        )
      }

      if (responseText.includes('500') || responseText.includes('Internal Server Error')) {
        throw new ApiError(
          500,
          'OutSystems server error. Please check your OutSystems error logs in Service Center.',
          { rawResponse: responseText.substring(0, 200) }
        )
      }

      // Generic HTML error
      throw new ApiError(
        response.status,
        'OutSystems returned an HTML error page instead of JSON. This usually means CORS is not enabled or the endpoint URL is incorrect.',
        {
          rawResponse: responseText.substring(0, 200),
          hint: 'Check: 1) CORS is enabled in OutSystems, 2) API URL is correct, 3) OutSystems error logs'
        }
      )
    }

    // Try to parse as JSON
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error('[JSON Parse Error]', parseError)
      throw new ApiError(
        response.status,
        `Backend returned invalid response. Expected JSON but got: ${responseText.substring(0, 100)}`,
        { rawResponse: responseText }
      )
    }

    // Check if the API returned success: false
    if (!response.ok || data.Success === false) {
      throw new ApiError(
        response.status,
        data.Message || 'An error occurred',
        data
      )
    }

    return data as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    // Network or parsing errors
    throw new ApiError(
      500,
      error instanceof Error ? error.message : 'Network error occurred'
    )
  }
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(endpoint: string, data?: any, options?: RequestInit) =>
    apiClient<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiClient<T>(endpoint, { ...options, method: 'DELETE' }),
}
