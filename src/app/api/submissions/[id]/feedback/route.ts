import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { Resend } from 'resend';
import type { TaxAgent, TaxAgentSubmission, TaxAgentSession } from '@/types/tax-agent';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

export async function POST(
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
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
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

    // Get agent info for email
    const agentData = await redis.get<string>(`tax_agent:${agentId}`);
    if (!agentData) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    const agent: TaxAgent = typeof agentData === 'string' ? JSON.parse(agentData) : agentData;

    // Send feedback email to user
    if (!resend) {
      return NextResponse.json(
        { success: false, error: 'Email service not configured' },
        { status: 500 }
      );
    }

    try {
      await resend.emails.send({
        from: 'CGT Brain AI <info@cgtbrain.com.au>',
        to: submission.userEmail,
        subject: `Feedback on Your CGT Timeline from ${agent.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Feedback from Your Tax Agent</h2>

            <div style="margin-bottom: 24px;">
              <p style="color: #6b7280; margin: 0 0 4px;">From:</p>
              <p style="margin: 0; font-weight: bold;">${agent.name}</p>
              ${agent.role === 'senior_tax_agent' ? '<p style="color: #7c3aed; font-size: 12px; margin: 4px 0 0;">Senior Tax Agent</p>' : ''}
            </div>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 16px 0; white-space: pre-wrap;">
${message}
            </div>

            <p>
              <a href="${submission.timelineLink}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                View Your Timeline
              </a>
            </p>

            <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">
              This feedback was sent via CGT Timeline by Tax Simple Australia.
            </p>
          </div>
        `,
      });

      console.log(`📧 Feedback email sent to: ${submission.userEmail}`);
    } catch (emailError) {
      console.error('❌ Failed to send feedback email:', emailError);
      return NextResponse.json(
        { success: false, error: 'Failed to send email. Please try again.' },
        { status: 500 }
      );
    }

    // Update submission with feedback info
    const now = new Date().toISOString();
    submission.feedbackSentAt = now;
    submission.feedbackMessage = message;

    // Save updated submission
    await redis.set(`submission:${id}`, JSON.stringify(submission));

    console.log(`✅ Feedback sent for submission: ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error sending feedback:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to send feedback' },
      { status: 500 }
    );
  }
}
