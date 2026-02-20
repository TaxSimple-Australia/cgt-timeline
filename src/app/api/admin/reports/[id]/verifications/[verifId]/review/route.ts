/**
 * Admin Verification Review API
 *
 * PUT - Save or update a review for a specific verification
 */

import { NextRequest, NextResponse } from 'next/server';
import { getReport, getVerification, updateVerificationReview, updateReport } from '@/lib/report-storage';
import type { CGTReport, VerificationRecord, VerificationReview, ReviewCorrectness, ReviewStatus } from '@/types/cgt-report';

const EXTERNAL_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'https://cgtbrain.com.au';
const FORWARD_TIMEOUT_MS = 15000;

/**
 * Helper to make a fetch with timeout.
 */
async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FORWARD_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Ensure the report has an annotation queue item in the external backend.
 * If `report.annotationItemId` already exists, returns it.
 * Otherwise, calls `/annotation/add/` to create one and persists the ID.
 */
async function ensureAnnotationItem(
  report: CGTReport,
  verification: VerificationRecord
): Promise<{ itemId: string | null; error?: string }> {
  // Already have a cached ID — verify it still exists
  if (report.annotationItemId) {
    console.log(`🔍 Using cached annotationItemId: ${report.annotationItemId}`);
    return { itemId: report.annotationItemId };
  }

  // Build the payload for /annotation/add/ using data from report + verification
  const analysisResponse = report.analysisResponse;
  const analysisData = analysisResponse?.data || analysisResponse || {};

  // Extract properties_data in the format the backend expects
  const propertiesData = report.timelineData?.properties?.map((p: any) => ({
    address: p.address || p.name || 'Unknown',
    property_history: (report.timelineData?.events || [])
      .filter((e: any) => e.propertyId === p.id)
      .map((e: any) => ({
        date: e.date,
        event: e.type || e.eventType,
        price: e.amount || e.price || undefined,
      })),
    notes: p.notes || undefined,
  })) || [];

  // Use the verification prompt as the query (same text the AnnotationPanel would show)
  const query = report.verificationPrompt
    || verification.scenario
    || analysisData.query
    || 'CGT analysis';

  // Use the AI's answer text
  const generatedAnswer = verification.ourAnswer
    || analysisData.answer
    || JSON.stringify(analysisData).substring(0, 5000);

  const addPayload = {
    query,
    properties_data: propertiesData,
    generated_answer: generatedAnswer,
    retrieved_docs: analysisData.sources?.documents || [],
    sources: analysisData.sources || {},
    llm_used: report.llmProvider || 'unknown',
  };

  console.log('📤 Creating annotation queue item via /annotation/add/', {
    query: query.substring(0, 100) + '...',
    propertiesCount: propertiesData.length,
    llm: addPayload.llm_used,
  });

  try {
    const response = await fetchWithTimeout(`${EXTERNAL_API_URL}/annotation/add/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addPayload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => 'No response body');
      return { itemId: null, error: `/annotation/add/ failed (${response.status}): ${text}` };
    }

    const result = await response.json();
    const itemId = result.id || result.item_id || result.data?.id || null;

    if (!itemId) {
      console.error('❌ /annotation/add/ returned no item ID:', result);
      return { itemId: null, error: 'Backend did not return an item ID from /annotation/add/' };
    }

    console.log(`✅ Annotation queue item created: ${itemId}`);

    // Persist the ID on the report for future use
    await updateReport(report.id, { annotationItemId: itemId });

    return { itemId };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { itemId: null, error: `Failed to create annotation item: ${message}` };
  }
}

/**
 * Forward a CCH review to the external backend so it appears in the Accuracy Dashboard.
 *
 * Flow:
 * 1. Ensure the report has an annotation queue item (creates one via /annotation/add/ if needed)
 * 2. Submit/update the review via /annotation/submit/ or /annotation/update/
 */
async function forwardReviewToBackend(
  report: CGTReport,
  verification: VerificationRecord,
  review: VerificationReview,
  isEdit: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    // Step 1: Ensure we have an annotation queue item
    const { itemId, error: addError } = await ensureAnnotationItem(report, verification);

    if (!itemId) {
      return { success: false, error: addError || 'Could not create annotation queue item' };
    }

    // Step 2: Submit/update the review
    const mappedCorrectness = review.correctness === 'unsure' ? 'na' : review.correctness;

    const payload = {
      item_id: itemId,
      correctness: mappedCorrectness,
      correct_answer: review.correctAnswer || null,
      doc_annotations: [],
      faithfulness_notes: null,
      general_notes: review.reviewNotes || null,
      annotator: `cch_reviewer:${review.reviewedBy || 'admin'}`,
    };

    const endpoint = isEdit ? '/annotation/update/' : '/annotation/submit/';
    const method = isEdit ? 'PUT' : 'POST';

    console.log(`📤 Forwarding CCH review to ${endpoint}:`, { item_id: itemId, correctness: mappedCorrectness });

    const response = await fetchWithTimeout(`${EXTERNAL_API_URL}${endpoint}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

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
    const forwardResult = await forwardReviewToBackend(report, verification, review, isEdit);

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
