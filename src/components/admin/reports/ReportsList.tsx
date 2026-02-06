'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CGTReportSummary, ReportStatus } from '@/types/cgt-report';

interface ReportsListProps {
  reports: CGTReportSummary[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onViewReport: (id: string) => void;
  onVerifyReport: (id: string) => void;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

const statusConfig: Record<ReportStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'text-slate-400', icon: <Clock className="w-4 h-4" /> },
  analyzing: { label: 'Analyzing', color: 'text-blue-400', icon: <Clock className="w-4 h-4 animate-spin" /> },
  analyzed: { label: 'Analyzed', color: 'text-yellow-400', icon: <AlertCircle className="w-4 h-4" /> },
  verifying: { label: 'Verifying', color: 'text-blue-400', icon: <Clock className="w-4 h-4 animate-spin" /> },
  verified: { label: 'Verified', color: 'text-green-400', icon: <CheckCircle2 className="w-4 h-4" /> },
  failed: { label: 'Failed', color: 'text-red-400', icon: <XCircle className="w-4 h-4" /> },
};

const alignmentColors: Record<string, string> = {
  high: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function ReportsList({
  reports,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onViewReport,
  onVerifyReport,
  page,
  totalPages,
  total,
  onPageChange,
}: ReportsListProps) {
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

  if (reports.length === 0) {
    return (
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-12 text-center">
        <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-300 mb-2">No reports found</h3>
        <p className="text-slate-400">
          Reports will appear here when CGT analyses are run from the app.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[auto_1fr_120px_120px_120px_100px_120px] gap-4 px-4 py-3 bg-slate-900/50 border-b border-slate-700 text-sm font-medium text-slate-400">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selectedIds.size === reports.length && reports.length > 0}
            onChange={onToggleSelectAll}
            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
          />
        </div>
        <div>Property / Report</div>
        <div>Provider</div>
        <div>Status</div>
        <div>Net CGT</div>
        <div>Alignment</div>
        <div className="text-right">Actions</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-slate-700/50">
        {reports.map((report, index) => {
          const status = statusConfig[report.status];
          const canVerify = report.status === 'analyzed' || report.status === 'verified';

          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="grid grid-cols-[auto_1fr_120px_120px_120px_100px_120px] gap-4 px-4 py-3 hover:bg-slate-700/30 transition-colors items-center"
            >
              {/* Checkbox */}
              <div>
                <input
                  type="checkbox"
                  checked={selectedIds.has(report.id)}
                  onChange={() => onToggleSelect(report.id)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                />
              </div>

              {/* Property / Report Info */}
              <div className="min-w-0">
                <div className="text-white font-medium truncate">
                  {report.primaryPropertyAddress || 'Unknown Property'}
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span className="font-mono">{report.id.slice(0, 16)}...</span>
                  <span className="text-slate-600">|</span>
                  <span>{formatDate(report.createdAt)}</span>
                  <span className="text-slate-600">|</span>
                  <span>{report.propertyCount} {report.propertyCount === 1 ? 'property' : 'properties'}</span>
                </div>
              </div>

              {/* Provider */}
              <div>
                <span className="px-2 py-1 text-xs rounded-full bg-slate-700/50 text-slate-300 capitalize">
                  {report.llmProvider}
                </span>
              </div>

              {/* Status */}
              <div className={`flex items-center gap-1.5 ${status.color}`}>
                {status.icon}
                <span className="text-sm">{status.label}</span>
              </div>

              {/* Net CGT */}
              <div className="text-white font-medium">
                {formatCurrency(report.netCapitalGain)}
              </div>

              {/* Alignment */}
              <div>
                {report.latestVerification ? (
                  <span className={`px-2 py-1 text-xs rounded-full border ${alignmentColors[report.latestVerification.alignment]}`}>
                    {report.latestVerification.matchPercentage}%
                  </span>
                ) : (
                  <span className="text-slate-500 text-sm">-</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onViewReport(report.id)}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                {canVerify && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onVerifyReport(report.id)}
                    className="h-8 w-8 p-0 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                  >
                    <PlayCircle className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50 border-t border-slate-700">
        <div className="text-sm text-slate-400">
          Showing {(page - 1) * 20 + 1} - {Math.min(page * 20, total)} of {total} reports
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="h-8 border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="text-sm text-slate-400">
            Page {page} of {totalPages}
          </span>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="h-8 border-slate-600 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
