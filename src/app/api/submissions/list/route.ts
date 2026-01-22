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

  // Check if session is expired
  if (new Date(session.expiresAt) < new Date()) {
    await redis.del(`tax_agent_session:${token}`);
    return null;
  }

  return session.agentId;
}

export async function GET(request: NextRequest) {
  try {
    // Verify Tax Agent session
    const agentId = await verifyTaxAgentSession(request);
    if (!agentId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get agent's submissions list
    const submissionIds = await redis.get<string[]>(`submissions_by_agent:${agentId}`) || [];

    if (submissionIds.length === 0) {
      return NextResponse.json({ success: true, submissions: [] });
    }

    // Fetch all submissions
    const submissions: TaxAgentSubmission[] = [];
    for (const submissionId of submissionIds) {
      const submissionData = await redis.get<string>(`submission:${submissionId}`);
      if (submissionData) {
        const submission: TaxAgentSubmission = typeof submissionData === 'string'
          ? JSON.parse(submissionData)
          : submissionData;
        submissions.push(submission);
      }
    }

    // Sort by submission date (newest first)
    submissions.sort((a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    console.log(`📋 Listed ${submissions.length} submissions for agent: ${agentId}`);

    return NextResponse.json({ success: true, submissions });
  } catch (error) {
    console.error('❌ Error listing submissions:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list submissions',
      },
      { status: 500 }
    );
  }
}
