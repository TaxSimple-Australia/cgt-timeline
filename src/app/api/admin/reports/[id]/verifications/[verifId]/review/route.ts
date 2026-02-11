/**
 * Admin Verification Review API
 *
 * PUT - Save or update a review for a specific verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReport, getVerification, updateVerificationReview } from '@/lib/report-storage';
import type { VerificationReview, ReviewCorrectness, ReviewStatus } from '@/types/cgt-report';

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

    return NextResponse.json({
      success: true,
      verification: updatedVerification,
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
