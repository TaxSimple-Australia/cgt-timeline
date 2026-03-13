import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getLogoAttachment, LOGO_CID } from '@/lib/email-logo';

// Initialize Resend with API key from environment variable
const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder_key');

interface ShareLinkEmailRequest {
  email: string;
  phoneNumber?: string;
  shareLink: string;
  includesAnalysis?: boolean;
  pdfBase64?: string;
  pdfFilename?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ShareLinkEmailRequest = await request.json();
    const { email, phoneNumber, shareLink, pdfBase64 } = body;
    const includesAnalysis = body.includesAnalysis || false;
    const pdfFilename = body.pdfFilename || 'CGT-Analysis-Report.pdf';

    if (pdfBase64) {
      console.log('📎 PDF attachment received (base64):', {
        filename: pdfFilename,
        base64Length: pdfBase64.length,
        estimatedSizeKB: `${(pdfBase64.length * 0.75 / 1024).toFixed(1)} KB`,
      });
    }

    const logoCidUrl = `cid:${LOGO_CID}`;

    // Validate required fields
    if (!email || !shareLink) {
      return NextResponse.json(
        { error: 'Missing required fields: email and shareLink are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      );
    }

    // Validate phone number format if provided (optional)
    if (phoneNumber) {
      const phoneRegex = /^[\d\s\-+()]{8,20}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        );
      }
    }

    // Build the email content
    const currentDate = new Date().toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const analysisSection = includesAnalysis
      ? `
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #22C55E; font-size: 16px;">&#10003;</span>
            <span style="color: #374151; margin-left: 8px;">Complete CGT analysis results</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #22C55E; font-size: 16px;">&#10003;</span>
            <span style="color: #374151; margin-left: 8px;">Analysis notes and annotations</span>
          </td>
        </tr>
      `
      : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your CGT Timeline Link</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F3F4F6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3F4F6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px 40px 30px;">
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
                              <td style="width: 60px; height: 60px; background: rgba(255,255,255,0.15); border-radius: 12px; text-align: center; vertical-align: middle; padding: 8px;">
                                <img src="${logoCidUrl}" alt="CGT Brain Logo" style="width: 44px; height: 44px; display: block; margin: 0 auto; border: 0;" />
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
                      Your CGT Timeline is Ready to View
                    </h2>
                    <p style="margin: 0 0 24px; color: #6B7280; font-size: 15px; line-height: 1.6;">
                      Great news! A CGT Timeline has been shared with you. Click the button below to access your complete property portfolio timeline, including all events, calculations, and annotations.
                    </p>

                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                      <tr>
                        <td align="center">
                          <a href="${shareLink}"
                             style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #FFFFFF; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
                            View Your Timeline →
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- What's Included Section -->
                    <div style="background: #F9FAFB; border-radius: 12px; padding: 24px; margin: 24px 0;">
                      <h3 style="margin: 0 0 16px; color: #374151; font-size: 16px; font-weight: 600;">
                        What's Included in Your Timeline:
                      </h3>
                      <table cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 8px 0;">
                            <span style="color: #22C55E; font-size: 16px;">&#10003;</span>
                            <span style="color: #374151; margin-left: 8px;">Complete property portfolio timeline</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0;">
                            <span style="color: #22C55E; font-size: 16px;">&#10003;</span>
                            <span style="color: #374151; margin-left: 8px;">All property events and milestones</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0;">
                            <span style="color: #22C55E; font-size: 16px;">&#10003;</span>
                            <span style="color: #374151; margin-left: 8px;">Sticky notes and annotations</span>
                          </td>
                        </tr>
                        ${analysisSection}
                      </table>
                    </div>

                    <!-- Link Box -->
                    <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 16px; margin: 24px 0;">
                      <p style="margin: 0 0 8px; color: #065F46; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                        Direct Link
                      </p>
                      <p style="margin: 0; color: #10B981; font-size: 13px; word-break: break-all;">
                        ${shareLink}
                      </p>
                    </div>

                    ${pdfBase64 ? `
                    <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 16px; margin: 24px 0;">
                      <p style="margin: 0; color: #1E40AF; font-size: 14px; font-weight: 600;">
                        &#128206; CGT Analysis Report Attached
                      </p>
                      <p style="margin: 8px 0 0; color: #3B82F6; font-size: 13px;">
                        A detailed PDF report of the CGT analysis is attached to this email for your records.
                      </p>
                    </div>
                    ` : ''}

                    <p style="margin: 24px 0 0; color: #9CA3AF; font-size: 13px; line-height: 1.6;">
                      This link provides read-only access to the shared timeline. You can view all the information but modifications will not be saved.
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
                          ${phoneNumber ? `<p style="margin: 4px 0 0; color: #9CA3AF; font-size: 12px;">Contact: ${phoneNumber}</p>` : ''}
                        </td>
                        <td align="right">
                          <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                            Powered by <strong style="color: #10B981;">CGT Brain AI</strong>
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

    // Plain text version for email clients that don't support HTML
    const textContent = `
Your CGT Timeline is Ready to View

Great news! A CGT Timeline has been shared with you.

View your timeline here: ${shareLink}

What's Included:
- Complete property portfolio timeline
- All property events and milestones
- Sticky notes and annotations
${includesAnalysis ? '- Complete CGT analysis results\n- Analysis notes and annotations' : ''}
${pdfBase64 ? '\nA detailed CGT Analysis Report PDF is attached to this email.\n' : ''}
This link provides read-only access to the shared timeline.

---
Sent on ${currentDate}
${phoneNumber ? `Contact: ${phoneNumber}` : ''}

Powered by CGT Brain AI
© ${new Date().getFullYear()} CGT Brain. All rights reserved.
    `;

    // Build attachments: always include logo, optionally include PDF
    const attachments: any[] = [getLogoAttachment()];

    if (pdfBase64 && pdfBase64.length > 0) {
      // Convert base64 string to Buffer — Resend SDK requires Buffer for binary attachments
      const pdfBuffer = Buffer.from(pdfBase64, 'base64');
      attachments.push({
        filename: pdfFilename,
        content: pdfBuffer,
      });
    }

    // Send email using Resend with inline logo and optional PDF
    const { data, error } = await resend.emails.send({
      from: 'CGT Brain AI <info@cgtbrain.com.au>',
      to: [email],
      subject: 'Your CGT Timeline Link - CGT Brain AI',
      html: htmlContent,
      text: textContent,
      attachments,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    console.log('✅ Share link email sent successfully:', {
      emailId: data?.id,
      to: email,
      includesAnalysis,
      hasPdf: !!pdfBase64,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Share link sent successfully',
        emailId: data?.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending share link email:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
