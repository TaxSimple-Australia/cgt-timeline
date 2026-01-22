import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { Resend } from 'resend';
import type { TaxAgent, TaxAgentSubmission, TaxAgentSession } from '@/types/tax-agent';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Helper to format current date
function getCurrentDate() {
  return new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Beautiful email template for feedback
function getFeedbackEmailHtml(agent: TaxAgent, message: string, timelineLink: string) {
  const currentDate = getCurrentDate();
  // Escape HTML in message and preserve line breaks
  const escapedMessage = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Feedback on Your CGT Timeline</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F3F4F6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3F4F6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); padding: 40px 40px 30px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                          CGT Brain AI
                        </h1>
                        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">
                          Tax Agent Feedback
                        </p>
                      </td>
                      <td align="right" style="vertical-align: middle;">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="width: 60px; height: 60px; background: rgba(255,255,255,0.15); border-radius: 12px; text-align: center; vertical-align: middle;">
                              <span style="font-size: 28px; line-height: 60px;">&#128172;</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Main Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 16px; color: #1F2937; font-size: 22px; font-weight: 600;">
                    You've Received Feedback on Your Timeline
                  </h2>
                  <p style="margin: 0 0 24px; color: #6B7280; font-size: 15px; line-height: 1.6;">
                    Great news! A Tax Agent has reviewed your CGT Timeline and provided their professional feedback.
                  </p>

                  <!-- From Section -->
                  <div style="background: #F5F3FF; border: 1px solid #DDD6FE; border-radius: 12px; padding: 20px; margin: 24px 0;">
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="vertical-align: middle; width: 56px;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="width: 44px; height: 44px; background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); border-radius: 22px; text-align: center; vertical-align: middle; mso-line-height-rule: exactly; line-height: 44px;">
                                <span style="font-size: 16px; color: white; font-weight: bold; font-family: Arial, sans-serif;">${agent.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td style="padding-left: 12px; vertical-align: middle;">
                          <p style="margin: 0; font-size: 16px; font-weight: 600; color: #1F2937;">${agent.name}</p>
                          <p style="margin: 4px 0 0; font-size: 13px; color: ${agent.role === 'senior_tax_agent' ? '#7C3AED' : '#6B7280'};">
                            ${agent.role === 'senior_tax_agent' ? '&#11088; Senior Tax Agent' : 'Tax Agent'}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Feedback Message Section -->
                  <div style="background: #F9FAFB; border-radius: 12px; padding: 24px; margin: 24px 0; border-left: 4px solid #8B5CF6;">
                    <h3 style="margin: 0 0 16px; color: #374151; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Feedback Message:
                    </h3>
                    <div style="color: #374151; font-size: 15px; line-height: 1.7;">
                      ${escapedMessage}
                    </div>
                  </div>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                    <tr>
                      <td align="center">
                        <a href="${timelineLink}"
                           style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); color: #FFFFFF; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);">
                          View Your Timeline →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Link Box -->
                  <div style="background: #F5F3FF; border: 1px solid #DDD6FE; border-radius: 8px; padding: 16px; margin: 24px 0;">
                    <p style="margin: 0 0 8px; color: #6D28D9; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Your Timeline Link
                    </p>
                    <p style="margin: 0; color: #8B5CF6; font-size: 13px; word-break: break-all;">
                      ${timelineLink}
                    </p>
                  </div>

                  <p style="margin: 24px 0 0; color: #9CA3AF; font-size: 13px; line-height: 1.6;">
                    If you have any questions about this feedback, you can reply to the Tax Agent using the contact information in your original submission.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: #F9FAFB; padding: 24px 40px; border-top: 1px solid #E5E7EB;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <p style="margin: 0; color: #6B7280; font-size: 13px;">
                          Received on ${currentDate}
                        </p>
                      </td>
                      <td align="right">
                        <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                          Powered by <strong style="color: #8B5CF6;">CGT Brain AI</strong>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Bottom Text -->
            <table width="600" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding: 24px 20px; text-align: center;">
                  <p style="margin: 0; color: #9CA3AF; font-size: 11px; line-height: 1.6;">
                    This feedback was sent via CGT Brain AI Tax Agent Portal.
                    <br>
                    © ${new Date().getFullYear()} CGT Brain. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

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
        html: getFeedbackEmailHtml(agent, message, submission.timelineLink),
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
