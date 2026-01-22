import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import type { TaxAgentSubmission, TaxAgentSession, SubmissionStatus } from '@/types/tax-agent';

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

const VALID_STATUSES: SubmissionStatus[] = ['pending', 'in_progress', 'reviewed', 'completed'];

export async function PUT(
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

    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be: pending, in_progress, reviewed, or completed' },
        { status: 400 }
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

    const now = new Date().toISOString();

    // Update status and set timestamp
    submission.status = status;

    if (status === 'reviewed' && !submission.reviewedAt) {
      submission.reviewedAt = now;
    }

    if (status === 'completed' && !submission.completedAt) {
      submission.completedAt = now;
    }

    // Save updated submission
    await redis.set(`submission:${id}`, JSON.stringify(submission));

    console.log(`✅ Submission ${id} status updated to: ${status}`);

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error('❌ Error updating submission status:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update status' },
      { status: 500 }
    );
  }
}
