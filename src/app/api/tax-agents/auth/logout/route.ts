import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No session token provided' },
        { status: 400 }
      );
    }

    const token = authHeader.substring(7);

    // Delete session
    await redis.del(`tax_agent_session:${token}`);

    console.log(`✅ Tax Agent session invalidated`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error during Tax Agent logout:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      },
      { status: 500 }
    );
  }
}
