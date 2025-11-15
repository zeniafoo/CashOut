import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_EXCHANGE_API_URL;
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_EXCHANGE_API_URL environment variable is not set');
    }
    
    const body = await request.json();
    const response = await fetch(
      `${baseUrl}/ExchangeCurrency`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );
    const responseText = await response.text();
    if (!response.ok) {
      return NextResponse.json({ error: responseText }, { status: response.status });
    }
    return NextResponse.json(JSON.parse(responseText));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
