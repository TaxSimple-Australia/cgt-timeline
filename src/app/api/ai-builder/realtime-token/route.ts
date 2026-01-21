// OpenAI Realtime API Token Generator
// Generates ephemeral tokens for secure WebRTC connections from the browser

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const { model = 'gpt-4o-realtime-preview-2024-12-17' } = await request.json().catch(() => ({}));

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error('OpenAI API key not configured');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Add OPENAI_API_KEY to your .env.local file.' },
        { status: 500 }
      );
    }

    console.log('Requesting OpenAI Realtime session with model:', model);

    const openai = new OpenAI({
      apiKey,
      timeout: 60000, // 60 second timeout
    });

    // Create a realtime session using the SDK
    // The SDK's beta.realtime.sessions.create method handles this
    const response = await openai.beta.realtime.sessions.create({
      model,
      voice: 'shimmer',
    });

    console.log('OpenAI Realtime session created successfully');

    return NextResponse.json({
      client_secret: response.client_secret, // Contains { value, expires_at }
      modalities: response.modalities,
      voice: response.voice,
    });
  } catch (error: unknown) {
    console.error('Realtime token error:', error);

    // Handle OpenAI API errors
    if (error instanceof OpenAI.APIError) {
      const status = error.status || 500;
      let message = error.message;

      if (status === 401) {
        message = 'Invalid OpenAI API key. Please check your OPENAI_API_KEY.';
      } else if (status === 403) {
        message = 'Your OpenAI account does not have access to the Realtime API. Please check your OpenAI plan.';
      } else if (status === 404) {
        message = 'Realtime API not found. Your account may not have access to this feature.';
      } else if (status === 429) {
        message = 'Rate limit exceeded. Please try again in a moment.';
      }

      return NextResponse.json(
        { error: message, details: error.message },
        { status }
      );
    }

    // Handle timeout errors
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        return NextResponse.json(
          { error: 'Request to OpenAI timed out. Please check your network connection.' },
          { status: 504 }
        );
      }
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        return NextResponse.json(
          { error: 'Could not connect to OpenAI. Please check your network connection.' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate realtime token', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      available: false,
      error: 'OpenAI API key not configured',
      model: 'gpt-4o-realtime-preview-2024-12-17',
    });
  }

  // Test the API key
  try {
    const openai = new OpenAI({
      apiKey,
      timeout: 15000,
    });

    // Simple API call to verify the key works
    await openai.models.list();

    return NextResponse.json({
      available: true,
      model: 'gpt-4o-realtime-preview-2024-12-17',
    });
  } catch (error) {
    console.error('Error validating OpenAI API key:', error);
    return NextResponse.json({
      available: false,
      error: error instanceof Error ? error.message : 'Could not validate API key',
      model: 'gpt-4o-realtime-preview-2024-12-17',
    });
  }
}
