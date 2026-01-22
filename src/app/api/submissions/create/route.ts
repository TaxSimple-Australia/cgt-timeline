import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { nanoid } from 'nanoid';
import { Resend } from 'resend';
import type { TaxAgent, TaxAgentSubmission, CreateSubmissionRequest, CreateSubmissionResponse } from '@/types/tax-agent';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    const body: CreateSubmissionRequest = await request.json();
    const {
      taxAgentId,
      shareId,
      userEmail,
      userPhone,
      propertiesCount,
      eventsCount,
      hasAnalysis,
      analysisProvider,
    } = body;

    // Validate required fields
    if (!taxAgentId || !shareId || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: taxAgentId, shareId, userEmail' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Verify Tax Agent exists and is active
    const agentData = await redis.get<string>(`tax_agent:${taxAgentId}`);
    if (!agentData) {
      return NextResponse.json(
        { success: false, error: 'Tax Agent not found' },
        { status: 404 }
      );
    }

    const agent: TaxAgent = typeof agentData === 'string' ? JSON.parse(agentData) : agentData;
    if (!agent.isActive) {
      return NextResponse.json(
        { success: false, error: 'Tax Agent is no longer active' },
        { status: 400 }
      );
    }

    // Verify timeline exists
    const timelineData = await redis.get(`timeline:${shareId}`);
    if (!timelineData) {
      return NextResponse.json(
        { success: false, error: 'Timeline not found. Please save your timeline first.' },
        { status: 404 }
      );
    }

    // Generate submission ID and timeline link
    const submissionId = nanoid(12);
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://cgtbrain.com.au';
    const timelineLink = `${origin}?share=${shareId}`;
    const now = new Date().toISOString();

    // Create submission
    const submission: TaxAgentSubmission = {
      id: submissionId,
      taxAgentId,
      shareId,
      timelineLink,
      userEmail,
      userPhone,
      status: 'pending',
      submittedAt: now,
      propertiesCount: propertiesCount || 0,
      eventsCount: eventsCount || 0,
      hasAnalysis: hasAnalysis || false,
      analysisProvider,
    };

    // Store submission
    await redis.set(`submission:${submissionId}`, JSON.stringify(submission));

    // Add to Tax Agent's submissions list
    const agentSubmissions = await redis.get<string[]>(`submissions_by_agent:${taxAgentId}`) || [];
    agentSubmissions.push(submissionId);
    await redis.set(`submissions_by_agent:${taxAgentId}`, JSON.stringify(agentSubmissions));

    // Add to all submissions list
    const allSubmissions = await redis.get<string[]>('submissions_all') || [];
    allSubmissions.push(submissionId);
    await redis.set('submissions_all', JSON.stringify(allSubmissions));

    console.log(`✅ Submission created: ${submissionId} -> Tax Agent: ${agent.name}`);

    // Send notification email to Tax Agent
    if (resend && agent.email) {
      try {
        await resend.emails.send({
          from: 'CGT Timeline <noreply@taxsimple.com.au>',
          to: agent.email,
          subject: 'New CGT Timeline Submission',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #059669;">New Timeline Submission</h2>
              <p>Hello ${agent.name},</p>
              <p>You have received a new CGT Timeline submission for review.</p>

              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                <p style="margin: 0 0 8px;"><strong>User Email:</strong> ${userEmail}</p>
                ${userPhone ? `<p style="margin: 0 0 8px;"><strong>User Phone:</strong> ${userPhone}</p>` : ''}
                <p style="margin: 0 0 8px;"><strong>Properties:</strong> ${propertiesCount}</p>
                <p style="margin: 0 0 8px;"><strong>Events:</strong> ${eventsCount}</p>
                <p style="margin: 0;"><strong>Has Analysis:</strong> ${hasAnalysis ? 'Yes' : 'No'}</p>
              </div>

              <p>
                <a href="${timelineLink}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  View Timeline
                </a>
              </p>

              <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">
                Log in to your Tax Agent Dashboard to manage this submission.
              </p>
            </div>
          `,
        });
        console.log(`📧 Notification email sent to Tax Agent: ${agent.email}`);
      } catch (emailError) {
        console.error('❌ Failed to send notification to Tax Agent:', emailError);
      }
    }

    // Send confirmation email to user
    if (resend) {
      try {
        await resend.emails.send({
          from: 'CGT Timeline <noreply@taxsimple.com.au>',
          to: userEmail,
          subject: 'Your CGT Timeline Has Been Sent',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #059669;">Timeline Sent Successfully</h2>
              <p>Hello,</p>
              <p>Your CGT Timeline has been sent to <strong>${agent.name}</strong> for review.</p>

              <p>You can view your timeline at any time:</p>
              <p>
                <a href="${timelineLink}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  View Your Timeline
                </a>
              </p>

              <p>The Tax Agent will contact you at this email address (${userEmail}) with their review and feedback.</p>

              <p style="color: #6b7280; font-size: 12px; margin-top: 32px;">
                Thank you for using CGT Timeline by Tax Simple Australia.
              </p>
            </div>
          `,
        });
        console.log(`📧 Confirmation email sent to user: ${userEmail}`);
      } catch (emailError) {
        console.error('❌ Failed to send confirmation to user:', emailError);
      }
    }

    const response: CreateSubmissionResponse = {
      success: true,
      submission,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Error creating submission:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create submission',
      },
      { status: 500 }
    );
  }
}
