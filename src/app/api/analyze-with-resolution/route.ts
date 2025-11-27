import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get the API URL from environment variables
    const BASE_API_URL = process.env.NEXT_PUBLIC_CGT_MODEL_API_URL;

    // If API URL is not configured, return error
    if (!BASE_API_URL || BASE_API_URL === 'YOUR_MODEL_API_URL_HERE') {
      console.error('❌ CGT Model API URL not configured!');
      return NextResponse.json(
        {
          success: false,
          error: 'API URL not configured. Please set NEXT_PUBLIC_CGT_MODEL_API_URL in your .env.local file.',
        },
        { status: 500 }
      );
    }

    // Construct the full URL for the analyze-with-resolution endpoint
    // Extract base URL (remove any existing endpoint paths)
    let baseUrl = BASE_API_URL;

    // Remove common endpoint patterns to get the base URL
    if (baseUrl.includes('/api/v1/analyze-portfolio')) {
      baseUrl = baseUrl.replace('/api/v1/analyze-portfolio', '');
    } else if (baseUrl.includes('/analyze')) {
      baseUrl = baseUrl.replace('/analyze', '');
    }

    // Construct the analyze-with-resolution endpoint URL
    const API_URL = `${baseUrl}/api/v1/analyze-with-resolution`;

    // Add response_format query parameter
    const urlWithParams = `${API_URL}?response_format=streamlined`;

    console.log(`🔗 Calling CGT Model API (with resolution): ${urlWithParams}`);
    console.log('📤 Request payload:', JSON.stringify(body, null, 2));

    // Call the analyze-with-resolution endpoint
    const response = await fetch(urlWithParams, {
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

    // Check if the API returned an error response
    if (data.status === 'error') {
      console.error('❌ API returned error status:', data.error);
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
    console.error('❌ Error calling CGT model API (with resolution):', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
