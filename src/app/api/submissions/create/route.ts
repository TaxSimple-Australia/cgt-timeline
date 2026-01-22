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

// Helper to format current date
function getCurrentDate() {
  return new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Beautiful email template for Tax Agent notification
function getTaxAgentEmailHtml(agent: TaxAgent, userEmail: string, userPhone: string | undefined, propertiesCount: number, eventsCount: number, hasAnalysis: boolean, analysisProvider: string | undefined, timelineLink: string) {
  const currentDate = getCurrentDate();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New CGT Timeline Submission</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F3F4F6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3F4F6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 40px 30px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                          CGT Brain AI
                        </h1>
                        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">
                          Tax Agent Portal
                        </p>
                      </td>
                      <td align="right" style="vertical-align: middle;">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="width: 60px; height: 60px; background: rgba(255,255,255,0.15); border-radius: 12px; text-align: center; vertical-align: middle;">
                              <span style="font-size: 28px; line-height: 60px;">&#128203;</span>
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
                    New Timeline Submission Received
                  </h2>
                  <p style="margin: 0 0 24px; color: #6B7280; font-size: 15px; line-height: 1.6;">
                    Hello ${agent.name}, you have received a new CGT Timeline submission for review. A client is requesting your professional assessment of their property portfolio.
                  </p>

                  <!-- Client Details Section -->
                  <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 24px; margin: 24px 0;">
                    <h3 style="margin: 0 0 16px; color: #166534; font-size: 16px; font-weight: 600;">
                      Client Contact Information:
                    </h3>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <table cellpadding="0" cellspacing="0" border="0" style="display: inline-table; vertical-align: middle;">
                            <tr>
                              <td style="width: 24px; text-align: center; vertical-align: middle;">
                                <span style="color: #166534; font-size: 16px;">&#128231;</span>
                              </td>
                              <td style="padding-left: 8px; vertical-align: middle;">
                                <span style="color: #374151;"><strong>Email:</strong> ${userEmail}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ${userPhone ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <table cellpadding="0" cellspacing="0" border="0" style="display: inline-table; vertical-align: middle;">
                            <tr>
                              <td style="width: 24px; text-align: center; vertical-align: middle;">
                                <span style="color: #166534; font-size: 16px;">&#128241;</span>
                              </td>
                              <td style="padding-left: 8px; vertical-align: middle;">
                                <span style="color: #374151;"><strong>Phone:</strong> ${userPhone}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </div>

                  <!-- Submission Details Section -->
                  <div style="background: #F9FAFB; border-radius: 12px; padding: 24px; margin: 24px 0;">
                    <h3 style="margin: 0 0 16px; color: #374151; font-size: 16px; font-weight: 600;">
                      Submission Details:
                    </h3>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #22C55E; font-size: 16px;">&#10003;</span>
                          <span style="color: #374151; margin-left: 8px;">${propertiesCount} ${propertiesCount === 1 ? 'Property' : 'Properties'} in portfolio</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #22C55E; font-size: 16px;">&#10003;</span>
                          <span style="color: #374151; margin-left: 8px;">${eventsCount} Timeline events</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #22C55E; font-size: 16px;">&#10003;</span>
                          <span style="color: #374151; margin-left: 8px;">AI Analysis: ${hasAnalysis ? `Included (${analysisProvider || 'AI'})` : 'Not included'}</span>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                    <tr>
                      <td align="center">
                        <a href="${timelineLink}"
                           style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #FFFFFF; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(5, 150, 105, 0.4);">
                          View Client's Timeline →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Link Box -->
                  <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 16px; margin: 24px 0;">
                    <p style="margin: 0 0 8px; color: #047857; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Direct Timeline Link
                    </p>
                    <p style="margin: 0; color: #059669; font-size: 13px; word-break: break-all;">
                      ${timelineLink}
                    </p>
                  </div>

                  <p style="margin: 24px 0 0; color: #9CA3AF; font-size: 13px; line-height: 1.6;">
                    Log in to your Tax Agent Dashboard to manage this submission, update its status, and send feedback to the client.
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
                          Powered by <strong style="color: #059669;">CGT Brain AI</strong>
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
                    This notification was sent from CGT Brain AI Tax Agent Portal.
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

// Beautiful email template for User confirmation
function getUserConfirmationEmailHtml(agentName: string, userEmail: string, propertiesCount: number, eventsCount: number, hasAnalysis: boolean, timelineLink: string) {
  const currentDate = getCurrentDate();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your CGT Timeline Has Been Sent</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F3F4F6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3F4F6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); padding: 40px 40px 30px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                          CGT Brain AI
                        </h1>
                        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">
                          Your Capital Gains Tax Analysis Platform
                        </p>
                      </td>
                      <td align="right" style="vertical-align: middle;">
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="width: 60px; height: 60px; background: rgba(255,255,255,0.15); border-radius: 12px; text-align: center; vertical-align: middle;">
                              <span style="font-size: 28px; line-height: 60px;">&#9989;</span>
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
                    Your Timeline Has Been Sent for Review
                  </h2>
                  <p style="margin: 0 0 24px; color: #6B7280; font-size: 15px; line-height: 1.6;">
                    Great news! Your CGT Timeline has been successfully sent to <strong style="color: #1F2937;">${agentName}</strong> for professional review. They will analyze your property portfolio and provide expert feedback.
                  </p>

                  <!-- What Was Sent Section -->
                  <div style="background: #F9FAFB; border-radius: 12px; padding: 24px; margin: 24px 0;">
                    <h3 style="margin: 0 0 16px; color: #374151; font-size: 16px; font-weight: 600;">
                      What You Sent:
                    </h3>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #22C55E; font-size: 16px;">&#10003;</span>
                          <span style="color: #374151; margin-left: 8px;">${propertiesCount} ${propertiesCount === 1 ? 'Property' : 'Properties'} in your portfolio</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #22C55E; font-size: 16px;">&#10003;</span>
                          <span style="color: #374151; margin-left: 8px;">${eventsCount} Timeline events and milestones</span>
                        </td>
                      </tr>
                      ${hasAnalysis ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #22C55E; font-size: 16px;">&#10003;</span>
                          <span style="color: #374151; margin-left: 8px;">Complete AI CGT analysis</span>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </div>

                  <!-- What Happens Next Section -->
                  <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 24px; margin: 24px 0;">
                    <h3 style="margin: 0 0 16px; color: #1E40AF; font-size: 16px; font-weight: 600;">
                      What Happens Next:
                    </h3>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #3B82F6; font-size: 14px; font-weight: 600;">1.</span>
                          <span style="color: #374151; margin-left: 8px;">The Tax Agent has been notified of your submission</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #3B82F6; font-size: 14px; font-weight: 600;">2.</span>
                          <span style="color: #374151; margin-left: 8px;">They will review your timeline and CGT calculations</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #3B82F6; font-size: 14px; font-weight: 600;">3.</span>
                          <span style="color: #374151; margin-left: 8px;">You'll receive feedback at <strong>${userEmail}</strong></span>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                    <tr>
                      <td align="center">
                        <a href="${timelineLink}"
                           style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: #FFFFFF; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
                          View Your Timeline →
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Link Box -->
                  <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 16px; margin: 24px 0;">
                    <p style="margin: 0 0 8px; color: #1E40AF; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      Your Timeline Link
                    </p>
                    <p style="margin: 0; color: #3B82F6; font-size: 13px; word-break: break-all;">
                      ${timelineLink}
                    </p>
                  </div>

                  <p style="margin: 24px 0 0; color: #9CA3AF; font-size: 13px; line-height: 1.6;">
                    Keep this email for your records. You can access your timeline anytime using the link above.
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
                          Sent on ${currentDate}
                        </p>
                      </td>
                      <td align="right">
                        <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                          Powered by <strong style="color: #3B82F6;">CGT Brain AI</strong>
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
                    This email was sent from CGT Brain AI. If you didn't expect this email, you can safely ignore it.
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
          from: 'CGT Brain AI <info@cgtbrain.com.au>',
          to: agent.email,
          subject: `New CGT Timeline Submission - ${propertiesCount} ${propertiesCount === 1 ? 'Property' : 'Properties'}`,
          html: getTaxAgentEmailHtml(agent, userEmail, userPhone, propertiesCount || 0, eventsCount || 0, hasAnalysis || false, analysisProvider, timelineLink),
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
          from: 'CGT Brain AI <info@cgtbrain.com.au>',
          to: userEmail,
          subject: `Your CGT Timeline Has Been Sent to ${agent.name}`,
          html: getUserConfirmationEmailHtml(agent.name, userEmail, propertiesCount || 0, eventsCount || 0, hasAnalysis || false, timelineLink),
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
