import { authService } from './auth'

const API_EXCHANGE_URL = process.env.NEXT_PUBLIC_EXCHANGE_API_URL;

export interface ExchangeRequest {
  UserId: string;
  FromCurrency: string;
  ToCurrency: string;
  Amount: number;
}

export interface ExchangeResponse {
  Success: boolean;
  ErrorMessage: string;
  ConvertedAmount: number;
  TransactionId: number;
}

export interface ExchangeRateResponse {
  rate: number;
}

// Exchange Currency API Call
export async function exchangeCurrency(
  userId: string,
  fromCurrency: string,
  toCurrency: string,
  amount: number
): Promise<{ Success: boolean; TransactionId: string; [key: string]: any }> {
  const response = await fetch('/api/exchange-currency', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      UserId: userId,
      FromCurrency: fromCurrency,
      ToCurrency: toCurrency,
      Amount: amount,
    })
  });

  // Parse the actual data here
  const data = await response.json();
  return data;
}

export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  try {
    const response = await fetch(
      `/api/exchange-rate?fromCurrency=${fromCurrency}&toCurrency=${toCurrency}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Frontend received full response:', data)
    
    // Handle different possible response structures
    let rate = 1;
    if (data.Success && typeof data.Rate === 'number') {
      rate = data.Rate;
    } else if (data.Response && typeof data.Response.rate === 'number') {
      rate = data.Response.rate;
    } else if (data.Response && typeof data.Response.ExchangeRate === 'number') {
      rate = data.Response.ExchangeRate;
    } else if (typeof data.rate === 'number') {
      rate = data.rate;
    } else if (typeof data.ExchangeRate === 'number') {
      rate = data.ExchangeRate;
    } else {
      console.warn('Could not find valid rate in response, using fallback of 1')
    }
    
    console.log('Parsed rate:', rate)
    return rate;

  } catch (error) {
    console.error('Exchange Rate API Error:', error);
    return 1;
  }
}

export function getCurrentUserId(): string {
  const user = authService.getCurrentUser()
  if (!user || !user.UserId) {
    throw new Error('User not authenticated')
  }
  return user.UserId
}

export function getAuthToken(): string | null {
  return authService.getToken()
}