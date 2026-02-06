'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Play,
  ChevronDown,
  ChevronUp,
  Building2,
  FileText,
  History,
  X,
} from 'lucide-react';
import VerificationResults from './VerificationResults';
import ComparisonView from './ComparisonView';
import AnalysisSummary from './AnalysisSummary';
import type { CGTReportSummary, VerificationRecord } from '@/types/cgt-report';

interface CCHVerificationTabProps {
  // Legacy props (for backward compatibility with CGT Analysis tab)
  aiResponse?: any;
  analysisLoading?: boolean;
  llmProvider?: string;
  cchResult?: any;
  cchLoading?: boolean;
  cchError?: string | null;
  onRetry?: () => void;
}

interface ReportWithVerificationState extends CGTReportSummary {
  isVerifying?: boolean;
  verificationError?: string | null;
  expandedVerification?: VerificationRecord | null;
  showHistory?: boolean;
  verificationHistory?: VerificationRecord[];
  loadingHistory?: boolean;
}

export default function CCHVerificationTab({
  aiResponse,
  analysisLoading,
  llmProvider,
  cchResult,
  cchLoading,
  cchError,
  onRetry
}: CCHVerificationTabProps) {
  // Reports state
  const [reports, setReports] = useState<ReportWithVerificationState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Get admin credentials from sessionStorage
  const getCredentials = useCallback(() => {
    if (typeof window !== 'undefined') {
      const user = sessionStorage.getItem('cgt_admin_user');
      const pass = sessionStorage.getItem('cgt_admin_pass');
      if (user && pass) {
        return { user, pass };
      }
    }
    return null;
  }, []);

  // Fetch reports that have been analyzed
  const fetchReports = useCallback(async () => {
    const creds = getCredentials();
    if (!creds) {
      setError('Admin credentials not found. Please log in again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      params.set('status', 'analyzed,verified'); // Only show reports ready for verification
      params.set('sortBy', 'createdAt');
      params.set('sortOrder', 'desc');

      const response = await fetch(`/api/admin/reports?${params.toString()}`, {
        headers: {
          'x-admin-user': creds.user,
          'x-admin-pass': creds.pass,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch reports');
      }

      setReports(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, getCredentials]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Run verification for a single report
  const runVerification = async (reportId: string) => {
    const creds = getCredentials();
    if (!creds) return;

    // Update state to show loading
    setReports(prev => prev.map(r =>
      r.id === reportId
        ? { ...r, isVerifying: true, verificationError: null }
        : r
    ));

    try {
      const response = await fetch(`/api/admin/reports/${reportId}/verify`, {
        method: 'POST',
        headers: {
          'x-admin-user': creds.user,
          'x-admin-pass': creds.pass,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Verification failed');
      }

      // Update report with new verification
      setReports(prev => prev.map(r =>
        r.id === reportId
          ? {
              ...r,
              isVerifying: false,
              status: 'verified',
              verificationCount: r.verificationCount + 1,
              latestVerification: data.verification.comparison ? {
                alignment: data.verification.comparison.overallAlignment,
                matchPercentage: data.verification.comparison.matchPercentage,
                verifiedAt: data.verification.verifiedAt,
              } : undefined,
              expandedVerification: data.verification,
            }
          : r
      ));
    } catch (err) {
      setReports(prev => prev.map(r =>
        r.id === reportId
          ? {
              ...r,
              isVerifying: false,
              verificationError: err instanceof Error ? err.message : 'Verification failed',
            }
          : r
      ));
    }
  };

  // Fetch verification history for a report
  const fetchVerificationHistory = async (reportId: string) => {
    const creds = getCredentials();
    if (!creds) return;

    setReports(prev => prev.map(r =>
      r.id === reportId ? { ...r, loadingHistory: true } : r
    ));

    try {
      const response = await fetch(`/api/admin/reports/${reportId}/verifications`, {
        headers: {
          'x-admin-user': creds.user,
          'x-admin-pass': creds.pass,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch history');
      }

      setReports(prev => prev.map(r =>
        r.id === reportId
          ? {
              ...r,
              loadingHistory: false,
              showHistory: true,
              verificationHistory: data.verifications,
            }
          : r
      ));
    } catch (err) {
      console.error('Error fetching verification history:', err);
      setReports(prev => prev.map(r =>
        r.id === reportId ? { ...r, loadingHistory: false } : r
      ));
    }
  };

  // Toggle expanded verification view
  const toggleExpandedVerification = (reportId: string, verification?: VerificationRecord) => {
    setReports(prev => prev.map(r =>
      r.id === reportId
        ? {
            ...r,
            expandedVerification: r.expandedVerification?.id === verification?.id ? null : verification,
          }
        : r
    ));
  };

  // Toggle history view
  const toggleHistory = (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (report?.showHistory) {
      setReports(prev => prev.map(r =>
        r.id === reportId ? { ...r, showHistory: false } : r
      ));
    } else if (!report?.verificationHistory) {
      fetchVerificationHistory(reportId);
    } else {
      setReports(prev => prev.map(r =>
        r.id === reportId ? { ...r, showHistory: true } : r
      ));
    }
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getAlignmentColor = (alignment?: string) => {
    switch (alignment) {
      case 'high': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Show loading state
  if (loading && reports.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="ml-3 text-slate-600 dark:text-slate-400">Loading analyses...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Error Loading Reports
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <button
            onClick={fetchReports}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show empty state
  if (reports.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-8">
        <div className="text-center">
          <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            No Analyses Available
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            CGT analyses will appear here once they are completed from the main app.
            Each analysis can then be sent to CCH for verification.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              CCH Verification
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {total} analyses available for verification
            </p>
          </div>
          <button
            onClick={fetchReports}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((report) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            {/* Report Header */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                {/* Report Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {report.primaryPropertyAddress || 'Unknown Property'}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <span className="font-mono text-xs">{report.id.slice(0, 20)}...</span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span>{formatDate(report.createdAt)}</span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span className="capitalize">{report.llmProvider}</span>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <span>{formatCurrency(report.netCapitalGain)}</span>
                  </div>
                </div>

                {/* Verification Status & Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Show latest verification result */}
                  {report.latestVerification && (
                    <span className={`px-3 py-1 text-sm rounded-full border ${getAlignmentColor(report.latestVerification.alignment)}`}>
                      {report.latestVerification.matchPercentage}% match
                    </span>
                  )}

                  {/* Verification button or loading state */}
                  {report.isVerifying ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Verifying...</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => runVerification(report.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                      <Play className="w-4 h-4" />
                      {report.verificationCount > 0 ? 'Re-verify' : 'Start Verification'}
                    </button>
                  )}

                  {/* History toggle */}
                  {report.verificationCount > 0 && (
                    <button
                      onClick={() => toggleHistory(report.id)}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <History className="w-4 h-4" />
                      <span>{report.verificationCount}</span>
                      {report.showHistory ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Error message */}
              {report.verificationError && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {report.verificationError}
                </div>
              )}
            </div>

            {/* Expanded Verification Result */}
            <AnimatePresence>
              {report.expandedVerification && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Verification Result - {new Date(report.expandedVerification.verifiedAt).toLocaleString()}
                      </h4>
                      <button
                        onClick={() => toggleExpandedVerification(report.id)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>

                    {report.expandedVerification.comparison ? (
                      <div className="space-y-4">
                        {/* Quick stats */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Alignment</div>
                            <div className={`text-lg font-bold capitalize ${
                              report.expandedVerification.comparison.overallAlignment === 'high' ? 'text-green-500' :
                              report.expandedVerification.comparison.overallAlignment === 'medium' ? 'text-yellow-500' :
                              'text-red-500'
                            }`}>
                              {report.expandedVerification.comparison.overallAlignment}
                            </div>
                          </div>
                          <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Match</div>
                            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                              {report.expandedVerification.comparison.matchPercentage}%
                            </div>
                          </div>
                          <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Confidence</div>
                            <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                              {report.expandedVerification.comparison.confidenceScore}%
                            </div>
                          </div>
                        </div>

                        {/* Checkboxes */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {Object.entries(report.expandedVerification.comparison.checkboxes).map(([key, value]) => (
                            <div
                              key={key}
                              className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs ${
                                value
                                  ? 'bg-green-500/10 text-green-500'
                                  : 'bg-red-500/10 text-red-500'
                              }`}
                            >
                              {value ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <X className="w-3 h-3" />
                              )}
                              <span className="capitalize truncate">
                                {key.replace(/([A-Z])/g, ' $1').replace('Match', '')}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* CGT Comparison */}
                        {(report.expandedVerification.comparison.ourNetCgt || report.expandedVerification.comparison.externalNetCgt) && (
                          <div className="grid grid-cols-3 gap-4 bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                            <div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Our CGT</div>
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {report.expandedVerification.comparison.ourNetCgt || '-'}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">CCH CGT</div>
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {report.expandedVerification.comparison.externalNetCgt || '-'}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Difference</div>
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {report.expandedVerification.comparison.calculationDifference || '-'}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Summary */}
                        {report.expandedVerification.comparison.summary && (
                          <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Summary</div>
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                              {report.expandedVerification.comparison.summary}
                            </p>
                          </div>
                        )}

                        {/* Key Differences */}
                        {report.expandedVerification.comparison.keyDifferences.length > 0 && (
                          <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Key Differences</div>
                            <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                              {report.expandedVerification.comparison.keyDifferences.map((diff, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <span className="text-amber-500">•</span>
                                  {diff}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : report.expandedVerification.errorMessage ? (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                        {report.expandedVerification.errorMessage}
                      </div>
                    ) : (
                      <div className="text-slate-500 dark:text-slate-400 text-sm">
                        No comparison data available
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Verification History */}
            <AnimatePresence>
              {report.showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Verification History ({report.verificationHistory?.length || 0})
                    </h4>

                    {report.loadingHistory ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      </div>
                    ) : report.verificationHistory && report.verificationHistory.length > 0 ? (
                      <div className="space-y-2">
                        {report.verificationHistory.map((verif) => (
                          <button
                            key={verif.id}
                            onClick={() => toggleExpandedVerification(report.id, verif)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                              report.expandedVerification?.id === verif.id
                                ? 'bg-blue-500/10 border-blue-500/30'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {verif.status === 'success' ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              )}
                              <span className="text-sm text-slate-700 dark:text-slate-300">
                                {new Date(verif.verifiedAt).toLocaleString()}
                              </span>
                            </div>
                            {verif.comparison && (
                              <span className={`px-2 py-0.5 text-xs rounded border ${getAlignmentColor(verif.comparison.overallAlignment)}`}>
                                {verif.comparison.matchPercentage}%
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        No verification history
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
