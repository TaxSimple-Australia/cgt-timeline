'use client';

import { useState } from 'react';
import { ArrowLeft, Mail, Phone, Calendar, Home, ExternalLink, Save, Send, CheckCircle, Clock, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import FeedbackEmailModal from './FeedbackEmailModal';
import type { TaxAgentSubmission, SubmissionStatus, SUBMISSION_STATUS_INFO } from '@/types/tax-agent';

interface SubmissionDetailViewProps {
  submission: TaxAgentSubmission;
  token: string;
  statusInfo: typeof SUBMISSION_STATUS_INFO;
  onBack: () => void;
  onStatusUpdate: () => void;
}

export default function SubmissionDetailView({
  submission,
  token,
  statusInfo,
  onBack,
  onStatusUpdate,
}: SubmissionDetailViewProps) {
  const [status, setStatus] = useState<SubmissionStatus>(submission.status);
  const [notes, setNotes] = useState(submission.agentNotes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusChange = async (newStatus: SubmissionStatus) => {
    setSavingStatus(true);
    try {
      const response = await fetch(`/api/submissions/${submission.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }

      setStatus(newStatus);
      setSuccessMessage('Status updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      onStatusUpdate();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setSavingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const response = await fetch(`/api/submissions/${submission.id}/notes`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save notes');
      }

      setSuccessMessage('Notes saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      onStatusUpdate();
    } catch (err) {
      console.error('Failed to save notes:', err);
      alert(err instanceof Error ? err.message : 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const getStatusIcon = (s: SubmissionStatus) => {
    switch (s) {
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'reviewed': return <RefreshCw className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Submissions
        </button>
        {successMessage && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
            <CheckCircle className="w-4 h-4" />
            {successMessage}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Info & Actions */}
        <div className="lg:col-span-1 space-y-4">
          {/* User Contact Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">User Contact</h3>

            <div className="space-y-3">
              {/* Email */}
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Email</div>
                <a
                  href={`mailto:${submission.userEmail}`}
                  className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <Mail className="w-4 h-4" />
                  {submission.userEmail}
                </a>
              </div>

              {/* Phone */}
              {submission.userPhone && (
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Phone</div>
                  <a
                    href={`tel:${submission.userPhone}`}
                    className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <Phone className="w-4 h-4" />
                    {submission.userPhone}
                  </a>
                </div>
              )}

              {/* Submitted At */}
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Submitted</div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Calendar className="w-4 h-4" />
                  {formatDate(submission.submittedAt)}
                </div>
              </div>
            </div>
          </div>

          {/* Submission Summary Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Submission Summary</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Properties
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{submission.propertiesCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Events
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{submission.eventsCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Analysis
                </span>
                <span className={`font-medium ${submission.hasAnalysis ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                  {submission.hasAnalysis ? (submission.analysisProvider || 'Yes') : 'No'}
                </span>
              </div>
            </div>

            {/* View Timeline Button */}
            <a
              href={submission.timelineLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Full Timeline
            </a>
          </div>

          {/* Status Management Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Status</h3>

            <div className="space-y-2">
              {(['pending', 'in_progress', 'reviewed', 'completed'] as SubmissionStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={savingStatus || status === s}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    status === s
                      ? `${statusInfo[s].bgColor} ${statusInfo[s].color} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ${s === 'pending' ? 'ring-yellow-500' : s === 'in_progress' ? 'ring-blue-500' : s === 'reviewed' ? 'ring-purple-500' : 'ring-green-500'}`
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                  } ${savingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {getStatusIcon(s)}
                  {statusInfo[s].label}
                  {status === s && <CheckCircle className="w-4 h-4 ml-auto" />}
                </button>
              ))}
            </div>

            {/* Status Timeline */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                {submission.viewedAt && (
                  <div>Viewed: {formatDate(submission.viewedAt)}</div>
                )}
                {submission.reviewedAt && (
                  <div>Reviewed: {formatDate(submission.reviewedAt)}</div>
                )}
                {submission.completedAt && (
                  <div>Completed: {formatDate(submission.completedAt)}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Notes & Feedback */}
        <div className="lg:col-span-2 space-y-4">
          {/* Private Notes Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">Private Notes</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">Only visible to you</span>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add private notes about this submission..."
              rows={6}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none"
            />

            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors"
            >
              {savingNotes ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Notes
                </>
              )}
            </button>
          </div>

          {/* Feedback Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">User Feedback</h3>
              {submission.feedbackSentAt && (
                <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                  Sent {formatDate(submission.feedbackSentAt)}
                </span>
              )}
            </div>

            {submission.feedbackMessage ? (
              <div className="mb-4">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Previous Feedback:</div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {submission.feedbackMessage}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                No feedback has been sent to the user yet.
              </p>
            )}

            <button
              onClick={() => setShowFeedbackModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
            >
              <Send className="w-4 h-4" />
              {submission.feedbackMessage ? 'Send Additional Feedback' : 'Send Feedback Email'}
            </button>
          </div>

          {/* Quick Note Templates */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Quick Note Templates</h3>
            <div className="flex flex-wrap gap-2">
              {[
                'CGT calculation verified - no issues found',
                'Missing cost base documentation',
                'Main residence exemption may apply',
                'Need clarification on property use dates',
                '50% CGT discount applicable',
                'Capital improvements need receipts',
              ].map((template, idx) => (
                <button
                  key={idx}
                  onClick={() => setNotes(notes ? `${notes}\n\n${template}` : template)}
                  className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-400 rounded transition-colors"
                >
                  + {template}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackEmailModal
          submission={submission}
          token={token}
          onClose={() => setShowFeedbackModal(false)}
          onSent={() => {
            setShowFeedbackModal(false);
            onStatusUpdate();
          }}
        />
      )}
    </div>
  );
}
