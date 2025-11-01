import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get the API URL from environment variables
    const API_URL = process.env.NEXT_PUBLIC_CGT_MODEL_API_URL;

    // If API URL is not configured, return error
    if (!API_URL || API_URL === 'YOUR_MODEL_API_URL_HERE') {
      console.error('❌ CGT Model API URL not configured!');
      return NextResponse.json(
        {
          success: false,
          error: 'API URL not configured. Please set NEXT_PUBLIC_CGT_MODEL_API_URL in your .env.local file.',
        },
        { status: 500 }
      );
    }

    console.log(`🔗 Calling CGT Model API: ${API_URL}`);
    console.log('📤 Request payload:', JSON.stringify(body, null, 2));

    // Call your actual model API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any authentication headers here if needed
        // 'Authorization': `Bearer ${process.env.CGT_MODEL_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    console.log(`📥 API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ API Response Data:', JSON.stringify(data, null, 2));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('❌ Error calling CGT model API:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
