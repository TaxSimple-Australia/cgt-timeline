import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with API key from environment variable (use placeholder for build)
const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder_key');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const pdfBlob = formData.get('pdf') as Blob;
    const filename = formData.get('filename') as string;

    // Validate inputs
    if (!email || !pdfBlob || !filename) {
      return NextResponse.json(
        { error: 'Missing required fields: email, pdf, or filename' },
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

    // Convert blob to buffer for Resend
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Send email with PDF attachment using Resend
    const { data, error } = await resend.emails.send({
      from: 'CGT Brain Analysis <info@cgtbrain.com.au>', // Change this to your verified domain  onboarding@resend.dev
      to: [email],
      subject: 'Your CGT Analysis Report - Tax Simple Australia',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 32px 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0 0 4px 0; font-size: 22px; font-weight: 700;">
              CGT Analysis Report
            </h1>
            <p style="color: #bfdbfe; margin: 0; font-size: 14px;">
              Capital Gains Tax Portfolio Analysis
            </p>
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
                    <strong>Portfolio Summary</strong> — Total CGT liability, capital gains, and exemptions
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #475569; font-size: 13px; vertical-align: top;">
                    <span style="color: #3b82f6; font-weight: bold;">&#10003;</span>
                  </td>
                  <td style="padding: 6px 0; color: #475569; font-size: 13px;">
                    <strong>Property-by-Property Analysis</strong> — Financial summaries, timelines, and cost base breakdowns
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #475569; font-size: 13px; vertical-align: top;">
                    <span style="color: #3b82f6; font-weight: bold;">&#10003;</span>
                  </td>
                  <td style="padding: 6px 0; color: #475569; font-size: 13px;">
                    <strong>Step-by-Step CGT Calculations</strong> — Detailed formulas and results
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #475569; font-size: 13px; vertical-align: top;">
                    <span style="color: #3b82f6; font-weight: bold;">&#10003;</span>
                  </td>
                  <td style="padding: 6px 0; color: #475569; font-size: 13px;">
                    <strong>Verification & Audit Trail</strong> — ATO citations, validation results, and applicable tax rules
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
              Tax Simple Australia | CGT Brain
            </p>
            <p style="color: #cbd5e1; font-size: 11px; margin: 0;">
              This is an automated email. Please do not reply to this message.
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: filename,
          content: buffer,
        },
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Email sent successfully',
        emailId: data?.id
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
