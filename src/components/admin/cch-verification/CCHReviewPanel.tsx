'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  X,
  Copy,
  Check,
  Loader2,
  Keyboard,
  AlertTriangle,
} from 'lucide-react';
import type { VerificationRecord, ReviewCorrectness, ReviewStatus } from '@/types/cgt-report';

// CGT-specific quick note templates
const QUICK_NOTES = [
  { label: 'CGT calculation mismatch', value: 'CGT calculation mismatch. ' },
  { label: 'Cost base differs', value: 'Cost base calculation differs. ' },
  { label: 'Exemption % wrong', value: 'Main residence exemption percentage is wrong. ' },
  { label: '6-year rule error', value: '6-year absence rule incorrectly applied. ' },
  { label: 'Ownership period mismatch', value: 'Ownership period dates are mismatched. ' },
  { label: 'CCH response unclear', value: 'CCH response is unclear or ambiguous. ' },
  { label: 'Discount method differs', value: 'Discount method application differs. ' },
  { label: 'Our AI is correct', value: 'Our AI analysis is correct. ' },
  { label: 'Both partially correct', value: 'Both our AI and CCH are partially correct. ' },
  { label: 'Missing CGT event', value: 'A relevant CGT event was not considered. ' },
];

interface CCHReviewPanelProps {
  verification: VerificationRecord;
  reportId: string;
  propertyAddress: string;
  onReviewSubmitted: (verifId: string, reviewStatus: ReviewStatus) => void;
  onSkip: () => void;
}

export default function CCHReviewPanel({
  verification,
  reportId,
  propertyAddress,
  onReviewSubmitted,
  onSkip,
}: CCHReviewPanelProps) {
  // Form state
  const [correctness, setCorrectness] = useState<ReviewCorrectness | ''>('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Answer tab state
  const [activeTab, setActiveTab] = useState<'our' | 'cch'>('our');
  const [copiedTab, setCopiedTab] = useState<'our' | 'cch' | null>(null);

  const isReviewed = verification.review?.reviewStatus === 'reviewed';
  const isSkipped = verification.review?.reviewStatus === 'skipped';
  const hasExistingReview = isReviewed || isSkipped;

  // Initialize form from existing review
  useEffect(() => {
    if (verification.review) {
      setCorrectness(verification.review.correctness || '');
      setCorrectAnswer(verification.review.correctAnswer || '');
      setReviewNotes(verification.review.reviewNotes || '');
      setIsEditMode(false);
    } else {
      setCorrectness('');
      setCorrectAnswer('');
      setReviewNotes('');
      setIsEditMode(false);
    }
    setSubmitError(null);
  }, [verification.id]);

  // Get admin credentials
  const getCredentials = useCallback(() => {
    if (typeof window !== 'undefined') {
      const user = sessionStorage.getItem('cgt_admin_user');
      const pass = sessionStorage.getItem('cgt_admin_pass');
      if (user && pass) return { user, pass };
    }
    return null;
  }, []);

  // Submit review
  const submitReview = useCallback(async (status: ReviewStatus = 'reviewed') => {
    if (status === 'reviewed' && !correctness) return;
    const creds = getCredentials();
    if (!creds) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(
        `/api/admin/reports/${reportId}/verifications/${verification.id}/review`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-user': creds.user,
            'x-admin-pass': creds.pass,
          },
          body: JSON.stringify({
            reviewStatus: status,
            correctness: status === 'reviewed' ? correctness : undefined,
            correctAnswer: correctAnswer || undefined,
            reviewNotes: reviewNotes || undefined,
            reviewedBy: creds.user,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save review');
      }

      setIsEditMode(false);
      onReviewSubmitted(verification.id, status);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save review');
    } finally {
      setSubmitting(false);
    }
  }, [correctness, correctAnswer, reviewNotes, reportId, verification.id, getCredentials, onReviewSubmitted]);

  // Skip handler
  const handleSkip = useCallback(async () => {
    await submitReview('skipped');
    onSkip();
  }, [submitReview, onSkip]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }

      // Don't handle if already reviewed and not in edit mode
      if (hasExistingReview && !isEditMode) return;

      switch (e.key) {
        case '1':
          setCorrectness('correct');
          break;
        case '2':
          setCorrectness('partial');
          break;
        case '3':
          setCorrectness('incorrect');
          break;
        case '-':
          setCorrectness('unsure');
          break;
        case '4':
          handleSkip();
          break;
        case 'Enter':
          if (e.ctrlKey && correctness) {
            submitReview();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [correctness, hasExistingReview, isEditMode, submitReview, handleSkip]);

  // Copy to clipboard
  const handleCopy = async (text: string, tab: 'our' | 'cch') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTab(tab);
      setTimeout(() => setCopiedTab(null), 2000);
    } catch {
      // Fallback for non-HTTPS
    }
  };

  const addQuickNote = (note: string) => {
    setReviewNotes((prev) => prev + note);
  };

  const comp = verification.comparison;

  const getAlignmentColor = (alignment?: string) => {
    switch (alignment) {
      case 'high': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const canEdit = !hasExistingReview || isEditMode;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto space-y-4 p-4">
        {/* Header with property address */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
            {propertyAddress}
          </h3>
          <div className="text-right text-xs text-slate-500 dark:text-slate-400 hidden xl:block">
            <div className="flex items-center gap-1 font-medium mb-1">
              <Keyboard className="w-3 h-3" />
              Shortcuts
            </div>
            <div><kbd className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-[10px]">1</kbd> Correct <kbd className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-[10px]">2</kbd> Partial <kbd className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-[10px]">3</kbd> Incorrect</div>
            <div><kbd className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-[10px]">-</kbd> Unsure <kbd className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-[10px]">4</kbd> Skip <kbd className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-[10px]">Ctrl+Enter</kbd> Submit</div>
          </div>
        </div>

        {/* 1. Verification Summary */}
        {comp && (
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Alignment</div>
              <span className={`inline-block px-2 py-0.5 text-sm rounded-full border capitalize ${getAlignmentColor(comp.overallAlignment)}`}>
                {comp.overallAlignment}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Match</div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{comp.matchPercentage}%</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Confidence</div>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{comp.confidenceScore}%</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Verified</div>
              <div className="text-sm text-slate-700 dark:text-slate-300">
                {new Date(verification.verifiedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          </div>
        )}

        {/* 2. Comparison Quick View */}
        {comp && (
          <div className="space-y-3">
            {/* Checkboxes grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {Object.entries(comp.checkboxes).map(([key, value]) => (
                <div
                  key={key}
                  className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs ${
                    value
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}
                >
                  {value ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  <span className="capitalize truncate">
                    {key.replace(/([A-Z])/g, ' $1').replace('Match', '')}
                  </span>
                </div>
              ))}
            </div>

            {/* CGT numbers comparison */}
            {(comp.ourNetCgt || comp.externalNetCgt) && (
              <div className="grid grid-cols-3 gap-3 bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Our CGT</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{comp.ourNetCgt || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">CCH CGT</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{comp.externalNetCgt || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Difference</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{comp.calculationDifference || '-'}</div>
                </div>
              </div>
            )}

            {/* Key Differences */}
            {comp.keyDifferences.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Key Differences</div>
                <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                  {comp.keyDifferences.map((diff, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-500 flex-shrink-0">•</span>
                      <span>{diff}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 3. Answer Tabs */}
        <div>
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('our')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'our'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Our Answer
            </button>
            <button
              onClick={() => setActiveTab('cch')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'cch'
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              CCH Response
            </button>
          </div>
          <div className="relative bg-white dark:bg-slate-900 border border-t-0 border-slate-200 dark:border-slate-700 rounded-b-lg">
            <button
              onClick={() => handleCopy(
                activeTab === 'our' ? verification.ourAnswer : (verification.cchResponse?.text || ''),
                activeTab
              )}
              className="absolute top-2 right-2 p-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors z-10"
              title="Copy to clipboard"
            >
              {copiedTab === activeTab ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              )}
            </button>
            <pre className="p-3 text-xs text-slate-700 dark:text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">
              {activeTab === 'our'
                ? verification.ourAnswer
                : (verification.cchResponse?.text || 'No CCH response available')}
            </pre>
          </div>
        </div>

        {/* 4. Review Form */}
        <div className="space-y-4">
          {/* Correctness Rating */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border-2 border-slate-200 dark:border-slate-600">
            <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">
              Is our AI&apos;s CGT analysis correct?
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: 'correct' as const, label: 'Correct', key: '1', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-500', text: 'text-green-800 dark:text-green-200' },
                { value: 'partial' as const, label: 'Partial', key: '2', bg: 'bg-yellow-100 dark:bg-yellow-900/30', border: 'border-yellow-500', text: 'text-yellow-800 dark:text-yellow-200' },
                { value: 'incorrect' as const, label: 'Incorrect', key: '3', bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-500', text: 'text-red-800 dark:text-red-200' },
                { value: 'unsure' as const, label: 'Unsure', key: '-', bg: 'bg-slate-100 dark:bg-slate-700', border: 'border-slate-400', text: 'text-slate-800 dark:text-slate-200' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => canEdit && setCorrectness(option.value)}
                  disabled={!canEdit}
                  className={`py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                    correctness === option.value
                      ? `${option.bg} ${option.border} ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-800 ${option.text}`
                      : canEdit
                        ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <div>{option.label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">({option.key})</div>
                </button>
              ))}
            </div>
          </div>

          {/* Correct Answer (if partial/incorrect) */}
          {(correctness === 'partial' || correctness === 'incorrect') && (
            <div>
              <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-1">
                What is the correct answer/calculation?
              </h4>
              <textarea
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                disabled={!canEdit}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg text-sm h-28 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder="Provide the correct CGT calculation or answer..."
              />
            </div>
          )}

          {/* Quick Notes */}
          <div>
            <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-2">
              Quick Notes (click to add)
            </h4>
            <div className="flex flex-wrap gap-1 mb-2">
              {QUICK_NOTES.map((note, idx) => (
                <button
                  key={idx}
                  onClick={() => canEdit && addQuickNote(note.value)}
                  disabled={!canEdit}
                  className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {note.label}
                </button>
              ))}
            </div>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              disabled={!canEdit}
              className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg text-sm h-20 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder="Additional notes for this review..."
            />
          </div>
        </div>

        {/* Submit error */}
        {submitError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {submitError}
          </div>
        )}
      </div>

      {/* 5. Action Buttons (sticky footer) */}
      <div className="flex-shrink-0 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
        {hasExistingReview && !isEditMode ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 text-sm text-slate-500 dark:text-slate-400">
              {isReviewed ? (
                <span className="text-green-600 dark:text-green-400 font-medium">Reviewed - {verification.review?.correctness}</span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400 font-medium">Skipped</span>
              )}
              {verification.review?.editedAt && (
                <span className="text-xs ml-2">(edited)</span>
              )}
            </div>
            <button
              onClick={() => setIsEditMode(true)}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
            >
              Edit Review
            </button>
          </div>
        ) : isEditMode ? (
          <div className="flex gap-3">
            <button
              onClick={() => submitReview('reviewed')}
              disabled={!correctness || submitting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </span>
              ) : 'Save Changes'}
            </button>
            <button
              onClick={() => {
                setIsEditMode(false);
                // Reset to existing review values
                if (verification.review) {
                  setCorrectness(verification.review.correctness || '');
                  setCorrectAnswer(verification.review.correctAnswer || '');
                  setReviewNotes(verification.review.reviewNotes || '');
                }
              }}
              className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => submitReview('reviewed')}
              disabled={!correctness || submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </span>
              ) : 'Submit & Next (Ctrl+Enter)'}
            </button>
            <button
              onClick={handleSkip}
              disabled={submitting}
              className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Skip (4)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
