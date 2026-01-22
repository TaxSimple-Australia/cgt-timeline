'use client';

import { useState } from 'react';
import { RefreshCw, Mail, Phone, Calendar, Home, ExternalLink, Eye, ChevronDown, Filter, Building } from 'lucide-react';
import SubmissionDetailView from './SubmissionDetailView';
import type { TaxAgentSubmission, SubmissionStatus, SUBMISSION_STATUS_INFO } from '@/types/tax-agent';

interface SubmissionListProps {
  submissions: TaxAgentSubmission[];
  loading: boolean;
  token: string;
  statusInfo: typeof SUBMISSION_STATUS_INFO;
  onRefresh: () => void;
  onStatusUpdate: () => void;
}

type FilterStatus = 'all' | SubmissionStatus;

export default function SubmissionList({
  submissions,
  loading,
  token,
  statusInfo,
  onRefresh,
  onStatusUpdate,
}: SubmissionListProps) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<TaxAgentSubmission | null>(null);

  const filteredSubmissions = filterStatus === 'all'
    ? submissions
    : submissions.filter(s => s.status === filterStatus);

  // Sort by submission date (newest first)
  const sortedSubmissions = [...filteredSubmissions].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

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

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  if (selectedSubmission) {
    return (
      <SubmissionDetailView
        submission={selectedSubmission}
        token={token}
        statusInfo={statusInfo}
        onBack={() => setSelectedSubmission(null)}
        onStatusUpdate={() => {
          onStatusUpdate();
          // Refresh the submission data
          fetch(`/api/submissions/${selectedSubmission.id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          })
            .then(res => res.json())
            .then(data => {
              if (data.success && data.submission) {
                setSelectedSubmission(data.submission);
              }
            })
            .catch(console.error);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400">Filter:</span>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Submissions ({submissions.length})</option>
              <option value="pending">Pending ({submissions.filter(s => s.status === 'pending').length})</option>
              <option value="in_progress">In Progress ({submissions.filter(s => s.status === 'in_progress').length})</option>
              <option value="reviewed">Reviewed ({submissions.filter(s => s.status === 'reviewed').length})</option>
              <option value="completed">Completed ({submissions.filter(s => s.status === 'completed').length})</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Submissions */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
        {loading && sortedSubmissions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent"></div>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Loading submissions...</p>
          </div>
        ) : sortedSubmissions.length === 0 ? (
          <div className="p-8 text-center">
            <Building className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-slate-500 dark:text-slate-400">
              {filterStatus === 'all' ? 'No submissions yet' : `No ${statusInfo[filterStatus as SubmissionStatus]?.label.toLowerCase()} submissions`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {sortedSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="p-4 sm:p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                onClick={() => setSelectedSubmission(submission)}
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {/* Status Badge */}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo[submission.status].bgColor} ${statusInfo[submission.status].color}`}>
                        {statusInfo[submission.status].label}
                      </span>
                      {/* Time */}
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {formatRelativeTime(submission.submittedAt)}
                      </span>
                      {/* Feedback indicator */}
                      {submission.feedbackSentAt && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                          Feedback Sent
                        </span>
                      )}
                    </div>

                    {/* User Contact */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400 mb-2">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {submission.userEmail}
                      </span>
                      {submission.userPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {submission.userPhone}
                        </span>
                      )}
                    </div>

                    {/* Summary */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Home className="w-3.5 h-3.5" />
                        {submission.propertiesCount} {submission.propertiesCount === 1 ? 'property' : 'properties'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {submission.eventsCount} events
                      </span>
                      {submission.hasAnalysis && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          {submission.analysisProvider && `Analyzed with ${submission.analysisProvider}`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <a
                      href={submission.timelineLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="hidden sm:inline">View Timeline</span>
                    </a>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSubmission(submission);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">Details</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
