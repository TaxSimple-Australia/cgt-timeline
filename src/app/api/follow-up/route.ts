import { NextRequest, NextResponse } from 'next/server';

// Follow-up API endpoint
const FOLLOW_UP_API_URL = 'https://cgtbrain.com.au/follow-up/';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { session_id, question, llm_provider = 'deepseek' } = body;

    if (!session_id) {
      return NextResponse.json(
        { success: false, error: 'session_id is required' },
        { status: 400 }
      );
    }

    if (!question || question.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'question is required' },
        { status: 400 }
      );
    }

    console.log(`🔗 Calling Follow-up API: ${FOLLOW_UP_API_URL}`);
    console.log(`📝 Session ID: ${session_id}`);
    console.log(`❓ Question: ${question}`);
    console.log(`🤖 LLM Provider: ${llm_provider}`);

    const response = await fetch(FOLLOW_UP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        session_id,
        question,
        llm_provider,
      }),
    });

    console.log(`📥 Follow-up API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Follow-up API Error Response:', errorText);
      throw new Error(`API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Follow-up API Response received');

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('❌ Error calling follow-up API:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
