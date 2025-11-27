import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function GET(
  request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const { shareId } = params;

    if (!shareId) {
      return NextResponse.json(
        { success: false, error: 'Share ID is required' },
        { status: 400 }
      );
    }

    // Retrieve from Upstash Redis
    const data = await redis.get(`timeline:${shareId}`);

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Timeline not found' },
        { status: 404 }
      );
    }

    // Parse if stored as string
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;

    console.log(`✅ Timeline loaded with ID: ${shareId}`);

    return NextResponse.json({
      success: true,
      data: {
        properties: parsed.properties,
        events: parsed.events,
      },
    });
  } catch (error) {
    console.error('❌ Error loading timeline:', error);

    // Check if it's a Redis configuration error
    if (error instanceof Error && (error.message.includes('KV') || error.message.includes('Redis') || error.message.includes('UPSTASH'))) {
      return NextResponse.json(
        {
          success: false,
          error: 'Storage service not configured. Please set up Upstash Redis.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load timeline',
      },
      { status: 500 }
    );
  }
}
