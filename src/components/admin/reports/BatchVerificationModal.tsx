'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BatchVerificationResult, BatchVerificationResponse } from '@/types/cgt-report';

interface BatchVerificationModalProps {
  reportIds: string[];
  adminCredentials: { user: string; pass: string };
  onClose: () => void;
  onComplete: () => void;
}

interface VerificationProgress {
  reportId: string;
  status: 'pending' | 'verifying' | 'success' | 'failed';
  alignment?: 'high' | 'medium' | 'low';
  matchPercentage?: number;
  error?: string;
}

export default function BatchVerificationModal({
  reportIds,
  adminCredentials,
  onClose,
  onComplete,
}: BatchVerificationModalProps) {
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState<VerificationProgress[]>(
    reportIds.map(id => ({ reportId: id, status: 'pending' }))
  );
  const [summary, setSummary] = useState<BatchVerificationResponse['summary'] | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startVerification = async () => {
    setRunning(true);
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/admin/reports/batch-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-user': adminCredentials.user,
          'x-admin-pass': adminCredentials.pass,
        },
        body: JSON.stringify({ reportIds }),
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json() as BatchVerificationResponse & { success: boolean; error?: string };

      if (!data.success) {
        throw new Error(data.error || 'Batch verification failed');
      }

      // Update progress with results
      setProgress(data.results.map(result => ({
        reportId: result.reportId,
        status: result.success ? 'success' : 'failed',
        alignment: result.alignment,
        matchPercentage: result.matchPercentage,
        error: result.error,
      })));

      setSummary(data.summary);
      setCompleted(true);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Batch verification cancelled');
      } else {
        console.error('Batch verification error:', err);
        // Mark all pending as failed
        setProgress(prev => prev.map(p =>
          p.status === 'pending' || p.status === 'verifying'
            ? { ...p, status: 'failed', error: err instanceof Error ? err.message : 'Unknown error' }
            : p
        ));
      }
    } finally {
      setRunning(false);
    }
  };

  const cancelVerification = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    onClose();
  };

  const getStatusIcon = (status: VerificationProgress['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-slate-400" />;
      case 'verifying':
        return <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getAlignmentColor = (alignment?: string) => {
    switch (alignment) {
      case 'high': return 'text-green-400 bg-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-red-400 bg-red-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const completedCount = progress.filter(p => p.status === 'success' || p.status === 'failed').length;
  const progressPercent = (completedCount / reportIds.length) * 100;

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
          className="w-full max-w-lg bg-slate-900 rounded-xl border border-slate-700 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-slate-800/50">
            <div className="flex items-center gap-3">
              <PlayCircle className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">Batch Verification</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Summary */}
            <div className="text-center">
              <p className="text-lg text-white">
                {completed
                  ? `Verified ${summary?.successful || 0} of ${reportIds.length} reports`
                  : `Selected ${reportIds.length} reports for verification`
                }
              </p>
              {!running && !completed && (
                <p className="text-sm text-slate-400 mt-1">
                  This may take several minutes. CCH verification can take 1-3 minutes per report.
                </p>
              )}
            </div>

            {/* Progress Bar */}
            {running && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Progress</span>
                  <span className="text-white">{completedCount} / {reportIds.length}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}

            {/* Results List */}
            {(running || completed) && (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {progress.map((item) => (
                  <div
                    key={item.reportId}
                    className="flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {getStatusIcon(item.status)}
                      <span className="text-sm text-slate-300 font-mono truncate">
                        {item.reportId.slice(0, 20)}...
                      </span>
                    </div>

                    {item.status === 'success' && item.alignment && (
                      <span className={`px-2 py-0.5 rounded text-xs ${getAlignmentColor(item.alignment)}`}>
                        {item.matchPercentage}%
                      </span>
                    )}

                    {item.status === 'failed' && item.error && (
                      <span className="text-xs text-red-400 truncate max-w-32" title={item.error}>
                        {item.error}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Summary Stats */}
            {completed && summary && (
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-500/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-400">{summary.highAlignment}</div>
                  <div className="text-xs text-green-400/70">High</div>
                </div>
                <div className="bg-yellow-500/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{summary.mediumAlignment}</div>
                  <div className="text-xs text-yellow-400/70">Medium</div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-400">{summary.lowAlignment + summary.failed}</div>
                  <div className="text-xs text-red-400/70">Low/Failed</div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-700 bg-slate-800/50">
            {!running && !completed && (
              <>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={startVerification}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Start Verification
                </Button>
              </>
            )}

            {running && (
              <Button
                onClick={cancelVerification}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                Cancel
              </Button>
            )}

            {completed && (
              <Button
                onClick={onComplete}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                Done
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
