import { NextRequest, NextResponse } from 'next/server';

const SUGGEST_QUESTIONS_API_URL = 'https://cgtbrain.com.au/api/v1/suggest-questions';

export interface SuggestedQuestion {
  question: string;
  category: string;
  relevance_reason: string;
  priority: number;
}

export interface SuggestQuestionsResponse {
  status: 'success' | 'error';
  suggested_questions?: SuggestedQuestion[];
  context_summary?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log(`🔗 Calling Suggest Questions API: ${SUGGEST_QUESTIONS_API_URL}`);
    console.log('📤 Request payload:', JSON.stringify(body, null, 2));

    const response = await fetch(SUGGEST_QUESTIONS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log(`📥 Suggest Questions API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Suggest Questions API Error Response:', errorText);
      throw new Error(`API responded with status ${response.status}: ${errorText}`);
    }

    const data: SuggestQuestionsResponse = await response.json();
    console.log('✅ Suggest Questions API Response:', JSON.stringify(data, null, 2));

    if (data.status === 'error') {
      console.error('❌ Suggest Questions API returned error:', data.error);
      return NextResponse.json(
        {
          success: false,
          error: data.error || 'Failed to generate suggested questions',
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        suggested_questions: data.suggested_questions || [],
        context_summary: data.context_summary || '',
      },
    });
  } catch (error) {
    console.error('❌ Error calling suggest questions API:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
