import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with API key from environment variable
const resend = new Resend(process.env.RESEND_API_KEY);

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
      subject: 'Your CGT Analysis Report',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your CGT Analysis Report is Ready</h2>
          <p style="color: #666; line-height: 1.6;">
            Thank you for using our Capital Gains Tax analysis service. Your detailed report is attached to this email.
          </p>
          <p style="color: #666; line-height: 1.6;">
            The report includes:
          </p>
          <ul style="color: #666; line-height: 1.8;">
            <li>Property lifecycle flowchart visualization</li>
            <li>Comprehensive property timeline analysis</li>
            <li>Tax calculations and recommendations</li>
            <li>Key dates and events</li>
            <li>Detailed financial breakdown</li>
          </ul>
          <p style="color: #666; line-height: 1.6;">
            If you have any questions about your report, please don't hesitate to reach out.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">
            This is an automated email. Please do not reply to this message.
          </p>
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
