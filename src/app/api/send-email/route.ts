import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getLogoAttachment, LOGO_CID } from '@/lib/email-logo';

// Initialize Resend with API key from environment variable (use placeholder for build)
const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder_key');

function getEmailHtml(): string {
  const logoCidUrl = `cid:${LOGO_CID}`;
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 32px 24px; border-radius: 8px 8px 0 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <h1 style="color: #ffffff; margin: 0 0 4px 0; font-size: 22px; font-weight: 700;">
                CGT Analysis Report
              </h1>
              <p style="color: #bfdbfe; margin: 0; font-size: 14px;">
                Capital Gains Tax Portfolio Analysis
              </p>
            </td>
            <td align="right" style="vertical-align: middle;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="width: 60px; height: 60px; background: rgba(255,255,255,0.15); border-radius: 12px; text-align: center; vertical-align: middle; padding: 8px;">
                    <img src="${logoCidUrl}" alt="CGT Brain Logo" width="44" height="44" style="width: 44px; height: 44px; display: block; margin: 0 auto; border: 0;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>

      <!-- Body -->
      <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
          Your detailed CGT analysis report is attached to this email as a PDF document.
        </p>

        <!-- Report Contents Card -->
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="color: #1e3a8a; font-weight: 600; font-size: 14px; margin: 0 0 12px 0;">
            Your report includes:
          </p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #475569; font-size: 13px; vertical-align: top; width: 24px;">
                <span style="color: #3b82f6; font-weight: bold;">&#10003;</span>
              </td>
              <td style="padding: 6px 0; color: #475569; font-size: 13px;">
                <strong>Portfolio Summary</strong> &mdash; Total CGT liability, capital gains, and exemptions
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #475569; font-size: 13px; vertical-align: top;">
                <span style="color: #3b82f6; font-weight: bold;">&#10003;</span>
              </td>
              <td style="padding: 6px 0; color: #475569; font-size: 13px;">
                <strong>Property-by-Property Analysis</strong> &mdash; Financial summaries, timelines, and cost base breakdowns
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #475569; font-size: 13px; vertical-align: top;">
                <span style="color: #3b82f6; font-weight: bold;">&#10003;</span>
              </td>
              <td style="padding: 6px 0; color: #475569; font-size: 13px;">
                <strong>Step-by-Step CGT Calculations</strong> &mdash; Detailed formulas and results
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #475569; font-size: 13px; vertical-align: top;">
                <span style="color: #3b82f6; font-weight: bold;">&#10003;</span>
              </td>
              <td style="padding: 6px 0; color: #475569; font-size: 13px;">
                <strong>Verification &amp; Audit Trail</strong> &mdash; ATO citations, validation results, and applicable tax rules
              </td>
            </tr>
          </table>
        </div>

        <!-- Disclaimer -->
        <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 12px; margin-bottom: 20px;">
          <p style="color: #92400e; font-size: 11px; line-height: 1.5; margin: 0;">
            <strong>Disclaimer:</strong> This report is for informational purposes only and does not constitute professional tax advice. Always consult with a qualified tax professional before making decisions based on this analysis.
          </p>
        </div>

        <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0;">
          If you have any questions about your report, please don't hesitate to reach out.
        </p>
      </div>

      <!-- Footer -->
      <div style="padding: 20px 24px; text-align: center;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px 0;">
          CGT Brain AI
        </p>
        <p style="color: #cbd5e1; font-size: 11px; margin: 0;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    </div>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, pdfBase64, filename } = body as {
      email: string;
      pdfBase64: string;
      filename: string;
    };

    // Validate inputs
    if (!email || !filename) {
      return NextResponse.json(
        { error: 'Missing required fields: email or filename' },
        { status: 400 }
      );
    }

    if (!pdfBase64) {
      return NextResponse.json(
        { error: 'Missing PDF attachment. The report must be generated before sending.' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    console.log('📎 PDF attachment received (base64):', {
      filename,
      base64Length: pdfBase64.length,
      estimatedSizeKB: `${(pdfBase64.length * 0.75 / 1024).toFixed(1)} KB`,
    });

    // Minimum sanity check
    if (pdfBase64.length < 100) {
      console.warn('⚠️ PDF base64 suspiciously small:', pdfBase64.length, 'chars');
    }

    // Convert base64 string to Buffer — Resend SDK requires Buffer for binary attachments
    // (JSON.stringify serializes Buffer as {"type":"Buffer","data":[...]} which Resend API recognizes)
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // Send email with PDF attachment and inline logo using Resend
    const { data, error } = await resend.emails.send({
      from: 'CGT Brain Analysis <info@cgtbrain.com.au>',
      to: [email],
      subject: 'Your CGT Analysis Report - CGT Brain AI',
      html: getEmailHtml(),
      attachments: [
        {
          filename: filename,
          content: pdfBuffer,
        },
        getLogoAttachment(),
      ],
    });

    if (error) {
      console.error('❌ Resend API error:', JSON.stringify(error));
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    console.log('✅ Email sent successfully:', {
      emailId: data?.id,
      to: email,
      attachmentSize: `${(pdfBase64.length * 0.75 / 1024).toFixed(1)} KB`,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Email sent successfully',
        emailId: data?.id
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
