/**
 * Admin Verification Review API
 *
 * PUT - Save or update a review for a specific verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReport, getVerification, updateVerificationReview } from '@/lib/report-storage';
import type { CGTReport, VerificationReview, ReviewCorrectness, ReviewStatus } from '@/types/cgt-report';

const EXTERNAL_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'https://cgtbrain.com.au';
const FORWARD_TIMEOUT_MS = 15000;

/**
 * Forward a CCH review to the external backend so it appears in the Accuracy Dashboard.
 * Maps CCH review fields to the annotation submit/update format used by AnnotationPanel.
 */
async function forwardReviewToBackend(
  report: CGTReport,
  review: VerificationReview,
  isEdit: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    // Extract session_id: prefer explicit field, then dig through analysisResponse
    const analysisResponse = report.analysisResponse;
    const sessionId = report.sessionId
      || analysisResponse?.session_id
      || analysisResponse?.data?.session_id
      || analysisResponse?.data?.data?.session_id
      || analysisResponse?.id
      || analysisResponse?.data?.id
      || null;

    console.log('🔍 CCH review forward — session_id extraction:', {
      reportId: report.id,
      explicitSessionId: report.sessionId ?? 'not set',
      extractedSessionId: sessionId,
      analysisResponseKeys: analysisResponse ? Object.keys(analysisResponse) : 'null',
    });

    if (!sessionId) {
      console.error('❌ Cannot forward CCH review: No session_id found in report', {
        reportId: report.id,
        analysisResponseKeys: analysisResponse ? Object.keys(analysisResponse) : 'null',
      });
      return { success: false, error: 'No session_id found in report — cannot map to backend annotation item' };
    }

    // Map correctness: 'unsure' → 'na' for the external backend
    const mappedCorrectness = review.correctness === 'unsure' ? 'na' : review.correctness;

    const payload = {
      item_id: sessionId,
      correctness: mappedCorrectness,
      correct_answer: review.correctAnswer || null,
      doc_annotations: [],
      faithfulness_notes: null,
      general_notes: review.reviewNotes || null,
      annotator: `cch_reviewer:${review.reviewedBy || 'admin'}`,
    };

    console.log('📤 CCH review forward payload:', JSON.stringify(payload, null, 2));

    const endpoint = isEdit ? '/annotation/update/' : '/annotation/submit/';
    const method = isEdit ? 'PUT' : 'POST';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FORWARD_TIMEOUT_MS);

    const response = await fetch(`${EXTERNAL_API_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text().catch(() => 'No response body');
      return { success: false, error: `Backend responded ${response.status}: ${text}` };
    }

    console.log(`✅ CCH review forwarded to backend (${endpoint})`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`❌ Failed to forward CCH review to backend:`, message);
    return { success: false, error: message };
  }
}

// Admin authentication check
function isAdminAuthenticated(request: NextRequest): boolean {
  const adminUser = request.headers.get('x-admin-user');
  const adminPass = request.headers.get('x-admin-pass');
  return !!(adminUser && adminPass);
}

const VALID_CORRECTNESS: ReviewCorrectness[] = ['correct', 'partial', 'incorrect', 'unsure'];
const VALID_REVIEW_STATUS: ReviewStatus[] = ['pending', 'reviewed', 'skipped'];

interface RouteParams {
  params: Promise<{ id: string; verifId: string }>;
}

/**
 * PUT /api/admin/reports/[id]/verifications/[verifId]/review
 *
 * Save or update a review for a verification record.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { id: reportId, verifId } = await params;

    // Validate report exists
    const report = await getReport(reportId);
    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      );
    }

    // Validate verification exists and belongs to this report
    const verification = await getVerification(verifId);
    if (!verification) {
      return NextResponse.json(
        { success: false, error: 'Verification not found' },
        { status: 404 }
      );
    }

    if (verification.reportId !== reportId) {
      return NextResponse.json(
        { success: false, error: 'Verification does not belong to this report' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { reviewStatus, correctness, correctAnswer, reviewNotes, reviewedBy } = body;

    // Validate reviewStatus
    if (!reviewStatus || !VALID_REVIEW_STATUS.includes(reviewStatus)) {
      return NextResponse.json(
        { success: false, error: `Invalid reviewStatus. Must be one of: ${VALID_REVIEW_STATUS.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate correctness if provided
    if (correctness && !VALID_CORRECTNESS.includes(correctness)) {
      return NextResponse.json(
        { success: false, error: `Invalid correctness. Must be one of: ${VALID_CORRECTNESS.join(', ')}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const existingReview = verification.review;

    const review: VerificationReview = {
      reviewStatus,
      correctness: correctness || undefined,
      correctAnswer: correctAnswer || undefined,
      reviewNotes: reviewNotes || undefined,
      reviewedAt: existingReview?.reviewedAt || now,
      reviewedBy: reviewedBy || existingReview?.reviewedBy || 'admin',
      editedAt: existingReview?.reviewedAt ? now : undefined,
    };

    const updatedVerification = await updateVerificationReview(verifId, review);

    if (!updatedVerification) {
      return NextResponse.json(
        { success: false, error: 'Failed to update verification review' },
        { status: 500 }
      );
    }

    // Forward to external backend (non-blocking — KV save already succeeded)
    const isEdit = !!existingReview?.reviewedAt;
    const forwardResult = await forwardReviewToBackend(report, review, isEdit);

    // Update the review with forwarding status
    if (forwardResult.success) {
      await updateVerificationReview(verifId, { ...review, forwardedToBackend: true });
    }

    return NextResponse.json({
      success: true,
      verification: updatedVerification,
      forwardedToBackend: forwardResult.success,
      forwardError: forwardResult.error || undefined,
    });
  } catch (error) {
    console.error('❌ Error saving verification review:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save review',
      },
      { status: 500 }
    );
  }
}
