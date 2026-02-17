'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  PlayCircle,
  Loader2,
  Building2,
  Calendar,
  Cpu,
  History,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  CGTReportWithVerifications,
  VerificationRecord,
  ReportStatus,
} from '@/types/cgt-report';

interface ReportDetailModalProps {
  reportId: string;
  adminCredentials: { user: string; pass: string };
  onClose: () => void;
  onVerify: (reportId: string) => void;
  onDelete: (reportId: string) => void;
}

const statusConfig: Record<ReportStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
  analyzing: { label: 'Analyzing', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  analyzed: { label: 'Ready for Verification', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  verifying: { label: 'Verifying', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  verified: { label: 'Verified', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  failed: { label: 'Failed', color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

export default function ReportDetailModal({
  reportId,
  adminCredentials,
  onClose,
  onVerify,
  onDelete,
}: ReportDetailModalProps) {
  const [report, setReport] = useState<CGTReportWithVerifications | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'verifications'>('overview');
  const [expandedVerification, setExpandedVerification] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        headers: {
          'x-admin-user': adminCredentials.user,
          'x-admin-pass': adminCredentials.pass,
        },
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch report');
      }

      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await onVerify(reportId);
      // Refresh report after verification
      await fetchReport();
    } finally {
      setVerifying(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this report? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await onDelete(reportId);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const getAlignmentColor = (alignment: string) => {
    switch (alignment) {
      case 'high': return 'text-green-400 bg-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl max-h-[90vh] bg-slate-900 rounded-xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/50">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-cyan-400" />
              <div>
                <h2 className="text-lg font-semibold text-white">Report Details</h2>
                <p className="text-xs text-slate-400 font-mono">{reportId}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              </div>
            ) : error ? (
              <div className="p-6 text-red-400">{error}</div>
            ) : report ? (
              <div className="p-6 space-y-6">
                {/* Status Banner */}
                <div className={`flex items-center justify-between p-4 rounded-lg ${statusConfig[report.status].bgColor}`}>
                  <div className="flex items-center gap-3">
                    {report.status === 'verified' ? (
                      <CheckCircle2 className={`w-5 h-5 ${statusConfig[report.status].color}`} />
                    ) : report.status === 'analyzed' ? (
                      <AlertCircle className={`w-5 h-5 ${statusConfig[report.status].color}`} />
                    ) : (
                      <Clock className={`w-5 h-5 ${statusConfig[report.status].color}`} />
                    )}
                    <span className={`font-medium ${statusConfig[report.status].color}`}>
                      {statusConfig[report.status].label}
                    </span>
                  </div>

                  {(report.status === 'analyzed' || report.status === 'verified') && (
                    <Button
                      onClick={handleVerify}
                      disabled={verifying}
                      size="sm"
                      className="bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      {verifying ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <PlayCircle className="w-4 h-4 mr-2" />
                      )}
                      {report.verificationCount > 0 ? 'Re-verify' : 'Run Verification'}
                    </Button>
                  )}
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Building2 className="w-3 h-3" />
                      Properties
                    </div>
                    <div className="text-lg font-semibold text-white">{report.propertyCount}</div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Cpu className="w-3 h-3" />
                      Provider
                    </div>
                    <div className="text-lg font-semibold text-white capitalize">{report.llmProvider}</div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Calendar className="w-3 h-3" />
                      Created
                    </div>
                    <div className="text-sm font-medium text-white">{formatDate(report.createdAt)}</div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <History className="w-3 h-3" />
                      Verifications
                    </div>
                    <div className="text-lg font-semibold text-white">{report.verificationCount}</div>
                  </div>
                </div>

                {/* Main Property */}
                {report.primaryPropertyAddress && (
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Primary Property</h3>
                    <p className="text-lg text-white">{report.primaryPropertyAddress}</p>
                  </div>
                )}

                {/* Net CGT */}
                {report.netCapitalGain !== undefined && (
                  <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-4 border border-cyan-500/20">
                    <h3 className="text-sm font-medium text-slate-400 mb-1">Net Capital Gain</h3>
                    <p className="text-2xl font-bold text-cyan-400">
                      {formatCurrency(report.netCapitalGain)}
                    </p>
                  </div>
                )}

                {/* Latest Verification */}
                {report.verifications.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-slate-400">Latest Verification</h3>
                    {(() => {
                      const latest = report.verifications[0];
                      return (
                        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              {latest.status === 'success' ? (
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                              ) : (
                                <AlertCircle className="w-5 h-5 text-red-400" />
                              )}
                              <span className="text-white font-medium">
                                {latest.status === 'success' ? 'Verification Successful' : 'Verification Failed'}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400">
                              {formatDate(latest.verifiedAt)}
                            </span>
                          </div>

                          {latest.comparison && (
                            <div className="space-y-4">
                              {/* Alignment Score */}
                              <div className="flex items-center gap-4">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAlignmentColor(latest.comparison.overallAlignment)}`}>
                                  {latest.comparison.overallAlignment.toUpperCase()} ALIGNMENT
                                </span>
                                <span className="text-2xl font-bold text-white">
                                  {latest.comparison.matchPercentage}%
                                </span>
                              </div>

                              {/* Checkboxes */}
                              <div className="grid grid-cols-3 gap-2">
                                {Object.entries(latest.comparison.checkboxes).map(([key, value]) => (
                                  <div
                                    key={key}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                                      value
                                        ? 'bg-green-500/10 text-green-400'
                                        : 'bg-red-500/10 text-red-400'
                                    }`}
                                  >
                                    {value ? (
                                      <CheckCircle2 className="w-4 h-4" />
                                    ) : (
                                      <X className="w-4 h-4" />
                                    )}
                                    <span className="capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').replace('Match', '')}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* CGT Comparison */}
                              {(latest.comparison.ourNetCgt || latest.comparison.externalNetCgt) && (
                                <div className="grid grid-cols-3 gap-4 bg-slate-700/30 rounded-lg p-3">
                                  <div>
                                    <div className="text-xs text-slate-400 mb-1">Our CGT</div>
                                    <div className="text-white font-medium">{latest.comparison.ourNetCgt || '-'}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-400 mb-1">CCH CGT</div>
                                    <div className="text-white font-medium">{latest.comparison.externalNetCgt || '-'}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-400 mb-1">Difference</div>
                                    <div className="text-white font-medium">{latest.comparison.calculationDifference || '-'}</div>
                                  </div>
                                </div>
                              )}

                              {/* Summary */}
                              {latest.comparison.summary && (
                                <div className="bg-slate-700/30 rounded-lg p-3">
                                  <div className="text-xs text-slate-400 mb-1">Summary</div>
                                  <p className="text-sm text-slate-300">{latest.comparison.summary}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {latest.errorMessage && (
                            <div className="bg-red-500/10 rounded-lg p-3 text-red-400 text-sm">
                              {latest.errorMessage}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Verification History */}
                {report.verifications.length > 1 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-slate-400">
                      Verification History ({report.verifications.length})
                    </h3>
                    <div className="space-y-2">
                      {report.verifications.slice(1).map((verif) => (
                        <div
                          key={verif.id}
                          className="bg-slate-800/30 rounded-lg border border-slate-700/50"
                        >
                          <button
                            onClick={() => setExpandedVerification(
                              expandedVerification === verif.id ? null : verif.id
                            )}
                            className="w-full flex items-center justify-between px-4 py-3 text-left"
                          >
                            <div className="flex items-center gap-3">
                              {verif.status === 'success' ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-400" />
                              )}
                              <span className="text-sm text-white">
                                {formatDate(verif.verifiedAt)}
                              </span>
                              {verif.comparison && (
                                <span className={`px-2 py-0.5 rounded text-xs ${getAlignmentColor(verif.comparison.overallAlignment)}`}>
                                  {verif.comparison.matchPercentage}%
                                </span>
                              )}
                            </div>
                            {expandedVerification === verif.id ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </button>

                          <AnimatePresence>
                            {expandedVerification === verif.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 pt-2 border-t border-slate-700/50">
                                  {verif.comparison && (
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                      {Object.entries(verif.comparison.checkboxes).map(([key, value]) => (
                                        <div
                                          key={key}
                                          className={`flex items-center gap-1 ${
                                            value ? 'text-green-400' : 'text-red-400'
                                          }`}
                                        >
                                          {value ? '✓' : '✗'}
                                          <span className="capitalize text-xs">
                                            {key.replace(/([A-Z])/g, ' $1').replace('Match', '')}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-slate-800/50">
            <Button
              onClick={handleDelete}
              disabled={deleting || loading}
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete Report
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Close
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
