import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { nanoid } from 'nanoid';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate data structure
    if (!data.properties || !data.events) {
      return NextResponse.json(
        { success: false, error: 'Invalid timeline data structure' },
        { status: 400 }
      );
    }

    // Generate unique short ID (10 characters)
    const shareId = nanoid(10);

    // Store in Vercel KV with metadata - v2.2.0 format includes sticky notes and analysis
    const timelineData = {
      version: data.version || '2.2.0',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      properties: data.properties,
      events: data.events,
      notes: data.notes || undefined,
      // Sticky notes
      timelineStickyNotes: data.timelineStickyNotes || [],
      // Saved analysis with analysis sticky notes
      savedAnalysis: data.savedAnalysis ? {
        response: data.savedAnalysis.response,
        analyzedAt: data.savedAnalysis.analyzedAt,
        analysisStickyNotes: data.savedAnalysis.analysisStickyNotes || [],
        provider: data.savedAnalysis.provider,
      } : undefined,
      // Optional metadata
      title: data.title,
      description: data.description,
    };

    // Set with 90-day expiration (7776000 seconds)
    await redis.set(`timeline:${shareId}`, JSON.stringify(timelineData), {
      ex: 7776000,
    });

    console.log(`✅ Timeline saved with ID: ${shareId}`, {
      properties: timelineData.properties.length,
      events: timelineData.events.length,
      timelineStickyNotes: timelineData.timelineStickyNotes.length,
      hasAnalysis: !!timelineData.savedAnalysis,
      analysisStickyNotes: timelineData.savedAnalysis?.analysisStickyNotes?.length || 0,
    });

    return NextResponse.json({ success: true, shareId });
  } catch (error) {
    console.error('❌ Error saving timeline:', error);

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
        error: error instanceof Error ? error.message : 'Failed to save timeline',
      },
      { status: 500 }
    );
  }
}
