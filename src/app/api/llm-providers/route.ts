import { NextResponse } from 'next/server';

// LLM Providers endpoint
const LLM_PROVIDERS_URL = 'https://cgtbrain.com.au/llm-providers/';

export async function GET() {
  try {
    console.log('🔗 Fetching LLM providers from:', LLM_PROVIDERS_URL);

    const response = await fetch(LLM_PROVIDERS_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Cache for 5 minutes
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error('❌ LLM providers API error:', response.status);
      // Return default providers if API fails
      return NextResponse.json({
        providers: {
          claude: 'CGT Brain AI (C)',
        },
        default: 'claude',
      });
    }

    const data = await response.json();
    console.log('✅ LLM providers fetched:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error fetching LLM providers:', error);

    // Return default providers on error
    return NextResponse.json({
      providers: {
        claude: 'CGT Brain AI (C)',
      },
      default: 'claude',
    });
  }
}
