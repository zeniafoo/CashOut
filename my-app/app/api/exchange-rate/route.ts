import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const fromCurrency = searchParams.get('fromCurrency')
  const toCurrency = searchParams.get('toCurrency')

  if (!fromCurrency || !toCurrency) {
    return NextResponse.json(
      { error: 'Missing currency parameters' },
      { status: 400 }
    )
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_EXCHANGE_API_URL
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_EXCHANGE_API_URL environment variable is not set')
    }
    
    const apiUrl = `${baseUrl}/ExchangeRate?FromCurrency=${fromCurrency}&ToCurrency=${toCurrency}`
    
    console.log('Calling API:', apiUrl)
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    console.log('Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API error:', response.status, errorText)
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Response data:', data)

    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Exchange rate API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { error: 'Failed to fetch exchange rate', details: errorMessage },
      { status: 500 }
    )
  }
}