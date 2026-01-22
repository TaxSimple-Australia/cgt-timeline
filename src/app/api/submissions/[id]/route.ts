import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import type { TaxAgentSubmission, TaxAgentSession } from '@/types/tax-agent';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

async function verifyTaxAgentSession(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const sessionData = await redis.get<string>(`tax_agent_session:${token}`);
  if (!sessionData) {
    return null;
  }

  const session: TaxAgentSession = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;

  if (new Date(session.expiresAt) < new Date()) {
    await redis.del(`tax_agent_session:${token}`);
    return null;
  }

  return session.agentId;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify Tax Agent session
    const agentId = await verifyTaxAgentSession(request);
    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get submission
    const submissionData = await redis.get<string>(`submission:${id}`);
    if (!submissionData) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      );
    }

    const submission: TaxAgentSubmission = typeof submissionData === 'string'
      ? JSON.parse(submissionData)
      : submissionData;

    // Verify this submission belongs to the authenticated agent
    if (submission.taxAgentId !== agentId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - This submission belongs to another agent' },
        { status: 403 }
      );
    }

    // Mark as viewed if not already
    if (!submission.viewedAt) {
      submission.viewedAt = new Date().toISOString();
      await redis.set(`submission:${id}`, JSON.stringify(submission));
    }

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error('❌ Error getting submission:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get submission' },
      { status: 500 }
    );
  }
}
