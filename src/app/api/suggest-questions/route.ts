import { NextRequest, NextResponse } from 'next/server';

// Base API URL for suggest questions endpoint
const SUGGEST_QUESTIONS_BASE_URL = 'https://cgtbrain.com.au/suggest-questions/';

// Default number of questions to request
const DEFAULT_NUM_QUESTIONS = 5;

export interface SuggestedQuestion {
  question: string;
  category: string;
  relevance_reason: string;
  priority: number;
}

export interface SuggestQuestionsResponse {
  suggested_questions?: SuggestedQuestion[];
  context_summary?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract llmProvider from request (default to 'claude')
    const llmProvider: string = body.llmProvider || 'claude';

    // Extract numQuestions from request (default to 5)
    const numQuestions: number = body.numQuestions || DEFAULT_NUM_QUESTIONS;

    // Remove internal fields from payload before sending to external API
    const { llmProvider: _, numQuestions: __, ...apiPayload } = body;

    // Add llm_provider to the payload
    const finalPayload = {
      ...apiPayload,
      llm_provider: llmProvider,
    };

    // Build URL with query parameter
    const apiUrl = `${SUGGEST_QUESTIONS_BASE_URL}?num_questions=${numQuestions}`;

    console.log(`🔗 Calling Suggest Questions API: ${apiUrl}`);
    console.log(`🤖 LLM Provider: ${llmProvider}`);
    console.log('📤 Request payload:', JSON.stringify(finalPayload, null, 2));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(finalPayload),
    });

    console.log(`📥 Suggest Questions API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Suggest Questions API Error Response:', errorText);
      throw new Error(`API responded with status ${response.status}: ${errorText}`);
    }

    const data: SuggestQuestionsResponse = await response.json();
    console.log('✅ Suggest Questions API Response:', JSON.stringify(data, null, 2));

    // Check if response contains an error
    if (data.error) {
      console.error('❌ Suggest Questions API returned error:', data.error);
      return NextResponse.json(
        {
          success: false,
          error: data.error || 'Failed to generate suggested questions',
        },
        { status: 200 }
      );
    }

    // Return the suggested questions
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
