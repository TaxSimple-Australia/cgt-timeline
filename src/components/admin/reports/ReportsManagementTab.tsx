'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  Search,
  PlayCircle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReportsList from './ReportsList';
import ReportDetailModal from './ReportDetailModal';
import BatchVerificationModal from './BatchVerificationModal';
import BatchDeleteModal from './BatchDeleteModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import type {
  CGTReportSummary,
  ReportListFilters,
  ReportStats,
  ReportStatus,
} from '@/types/cgt-report';

interface ReportsManagementTabProps {
  adminCredentials: { user: string; pass: string };
}

export default function ReportsManagementTab({ adminCredentials }: ReportsManagementTabProps) {
  // Data state
  const [reports, setReports] = useState<CGTReportSummary[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [filters, setFilters] = useState<ReportListFilters>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('');
  const [providerFilter, setProviderFilter] = useState<string>('');

  // Selection
  const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set());

  // Modals
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      params.set('stats', 'true');

      if (statusFilter) params.set('status', statusFilter);
      if (providerFilter) params.set('llmProvider', providerFilter);
      if (searchQuery) params.set('search', searchQuery);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

      const response = await fetch(`/api/admin/reports?${params.toString()}`, {
        headers: {
          'x-admin-user': adminCredentials.user,
          'x-admin-pass': adminCredentials.pass,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch reports');
      }

      setReports(data.items || []);
      setStats(data.stats || null);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, providerFilter, searchQuery, filters, adminCredentials]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Toggle selection
  const toggleSelection = (reportId: string) => {
    setSelectedReportIds(prev => {
      const next = new Set(prev);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
  };

  // Select all on current page
  const toggleSelectAll = () => {
    if (selectedReportIds.size === reports.length) {
      setSelectedReportIds(new Set());
    } else {
      setSelectedReportIds(new Set(reports.map(r => r.id)));
    }
  };

  // Run verification on single report
  const runVerification = async (reportId: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/verify`, {
        method: 'POST',
        headers: {
          'x-admin-user': adminCredentials.user,
          'x-admin-pass': adminCredentials.pass,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Verification failed');
      }

      // Refresh reports list
      fetchReports();
    } catch (err) {
      console.error('Verification error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
  };

  // Clear selection after batch verification
  const handleBatchComplete = () => {
    setSelectedReportIds(new Set());
    setShowBatchModal(false);
    fetchReports();
  };

  // Delete a single report
  const deleteSingleReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-user': adminCredentials.user,
          'x-admin-pass': adminCredentials.pass,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete report');
      }

      // Close detail modal if this report was open
      if (selectedReportId === reportId) {
        setSelectedReportId(null);
      }

      // Remove from selection if selected
      setSelectedReportIds(prev => {
        const next = new Set(prev);
        next.delete(reportId);
        return next;
      });

      fetchReports();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete report');
    }
  };

  // Clear selection after batch delete
  const handleBatchDeleteComplete = () => {
    setSelectedReportIds(new Set());
    setShowBatchDeleteModal(false);
    fetchReports();
  };

  // Delete all reports
  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      const response = await fetch('/api/admin/reports/delete-all', {
        method: 'POST',
        headers: {
          'x-admin-user': adminCredentials.user,
          'x-admin-pass': adminCredentials.pass,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete all reports');
      }

      setSelectedReportIds(new Set());
      setShowDeleteAllConfirm(false);
      fetchReports();
    } catch (err) {
      console.error('Delete all error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete all reports');
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            CGT Reports
          </h2>
          <p className="text-slate-400 mt-1">
            Manage and verify CGT analysis reports
          </p>
        </div>

        <div className="flex items-center gap-3">
          {total > 0 && (
            <Button
              onClick={() => setShowDeleteAllConfirm(true)}
              variant="outline"
              size="sm"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete All
            </Button>
          )}

          <Button
            onClick={fetchReports}
            variant="outline"
            size="sm"
            disabled={loading}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {selectedReportIds.size > 0 && (
            <>
              <Button
                onClick={() => setShowBatchDeleteModal(true)}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedReportIds.size})
              </Button>
              <Button
                onClick={() => setShowBatchModal(true)}
                size="sm"
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <PlayCircle className="w-4 h-4 mr-2" />
                Verify Selected ({selectedReportIds.size})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
          >
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <FileText className="w-4 h-4" />
              Total Reports
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalReports}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
          >
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Verified
            </div>
            <div className="text-2xl font-bold text-green-400">{stats.byStatus.verified}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
          >
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <Clock className="w-4 h-4 text-yellow-400" />
              Pending Verification
            </div>
            <div className="text-2xl font-bold text-yellow-400">{stats.byStatus.analyzed}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 rounded-lg p-4 border border-slate-700"
          >
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
              <AlertCircle className="w-4 h-4 text-cyan-400" />
              Avg. Alignment
            </div>
            <div className="text-2xl font-bold text-cyan-400">{stats.averageAlignment}%</div>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by address, notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ReportStatus | '');
              setPage(1);
            }}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="analyzed">Analyzed</option>
            <option value="verified">Verified</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={providerFilter}
            onChange={(e) => {
              setProviderFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">All Providers</option>
            <option value="deepseek">DeepSeek</option>
            <option value="claude">Claude</option>
            <option value="openai">OpenAI</option>
            <option value="gemini">Gemini</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Reports List */}
      {loading && reports.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      ) : (
        <ReportsList
          reports={reports}
          selectedIds={selectedReportIds}
          onToggleSelect={toggleSelection}
          onToggleSelectAll={toggleSelectAll}
          onViewReport={(id) => setSelectedReportId(id)}
          onVerifyReport={runVerification}
          onDeleteReport={deleteSingleReport}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
        />
      )}

      {/* Report Detail Modal */}
      {selectedReportId && (
        <ReportDetailModal
          reportId={selectedReportId}
          adminCredentials={adminCredentials}
          onClose={() => setSelectedReportId(null)}
          onVerify={runVerification}
          onDelete={deleteSingleReport}
        />
      )}

      {/* Batch Verification Modal */}
      {showBatchModal && (
        <BatchVerificationModal
          reportIds={Array.from(selectedReportIds)}
          adminCredentials={adminCredentials}
          onClose={() => setShowBatchModal(false)}
          onComplete={handleBatchComplete}
        />
      )}

      {/* Batch Delete Modal */}
      {showBatchDeleteModal && (
        <BatchDeleteModal
          reportIds={Array.from(selectedReportIds)}
          adminCredentials={adminCredentials}
          onClose={() => setShowBatchDeleteModal(false)}
          onComplete={handleBatchDeleteComplete}
        />
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <DeleteConfirmModal
          title="Delete All Reports"
          message={`This will permanently delete all ${total} report(s) and their associated verifications. This action cannot be undone.`}
          confirmLabel="Delete All Reports"
          loading={deletingAll}
          onConfirm={handleDeleteAll}
          onCancel={() => setShowDeleteAllConfirm(false)}
          requireTypedConfirmation="DELETE ALL"
        />
      )}
    </div>
  );
}
