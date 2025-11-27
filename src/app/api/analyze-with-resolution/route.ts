import { NextRequest, NextResponse } from 'next/server';

const RESOLUTION_API_URL = 'https://cgtbrain.com.au/api/v1/analyze-with-resolution';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log(`🔗 Calling CGT Resolution API: ${RESOLUTION_API_URL}`);
    console.log('📤 Request payload with resolutions:', JSON.stringify(body, null, 2));

    // Call the resolution API endpoint
    const response = await fetch(RESOLUTION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log(`📥 Resolution API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Resolution API Error Response:', errorText);
      throw new Error(`API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Resolution API Response Data:', JSON.stringify(data, null, 2));

    // Check if the API returned an error response
    if (data.status === 'error') {
      console.error('❌ Resolution API returned error status:', data.error);
      return NextResponse.json(
        {
          success: false,
          error: data.error || 'Analysis with resolution failed',
          errorDetails: data,
        },
        { status: 200 } // Still return 200 since the API call itself succeeded
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('❌ Error calling CGT resolution API:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
