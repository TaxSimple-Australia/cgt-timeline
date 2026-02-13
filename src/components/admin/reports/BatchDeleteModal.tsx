'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BatchDeleteModalProps {
  reportIds: string[];
  adminCredentials: { user: string; pass: string };
  onClose: () => void;
  onComplete: () => void;
}

interface DeleteProgress {
  reportId: string;
  status: 'pending' | 'deleting' | 'deleted' | 'failed';
  error?: string;
}

export default function BatchDeleteModal({
  reportIds,
  adminCredentials,
  onClose,
  onComplete,
}: BatchDeleteModalProps) {
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState<DeleteProgress[]>(
    reportIds.map(id => ({ reportId: id, status: 'pending' }))
  );
  const [summary, setSummary] = useState<{ total: number; deleted: number; failed: number } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startDeletion = async () => {
    setRunning(true);
    abortControllerRef.current = new AbortController();

    // Mark all as deleting
    setProgress(prev => prev.map(p => ({ ...p, status: 'deleting' as const })));

    try {
      const response = await fetch('/api/admin/reports/batch-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-user': adminCredentials.user,
          'x-admin-pass': adminCredentials.pass,
        },
        body: JSON.stringify({ reportIds }),
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Batch delete failed');
      }

      // Update progress with results
      setProgress(data.results.map((result: { reportId: string; success: boolean; error?: string }) => ({
        reportId: result.reportId,
        status: result.success ? 'deleted' as const : 'failed' as const,
        error: result.error,
      })));

      setSummary(data.summary);
      setCompleted(true);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Batch delete cancelled');
      } else {
        console.error('Batch delete error:', err);
        setProgress(prev => prev.map(p =>
          p.status === 'pending' || p.status === 'deleting'
            ? { ...p, status: 'failed' as const, error: err instanceof Error ? err.message : 'Unknown error' }
            : p
        ));
      }
    } finally {
      setRunning(false);
    }
  };

  const cancelDeletion = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    onClose();
  };

  const getStatusIcon = (status: DeleteProgress['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-slate-400" />;
      case 'deleting':
        return <Loader2 className="w-4 h-4 text-red-400 animate-spin" />;
      case 'deleted':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const completedCount = progress.filter(p => p.status === 'deleted' || p.status === 'failed').length;
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
              <Trash2 className="w-5 h-5 text-red-400" />
              <h2 className="text-lg font-semibold text-white">Batch Delete</h2>
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
              {!running && !completed && (
                <>
                  <div className="flex items-center justify-center gap-2 text-red-400 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Warning</span>
                  </div>
                  <p className="text-lg text-white">
                    You are about to permanently delete {reportIds.length} report{reportIds.length !== 1 ? 's' : ''}.
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    This cannot be undone. All associated verifications will also be deleted.
                  </p>
                </>
              )}
              {completed && (
                <p className="text-lg text-white">
                  Deleted {summary?.deleted || 0} of {reportIds.length} reports
                </p>
              )}
              {running && !completed && (
                <p className="text-lg text-white">
                  Deleting reports...
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
                    className="h-full bg-gradient-to-r from-red-500 to-rose-500"
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

                    {item.status === 'deleted' && (
                      <span className="text-xs text-green-400">Deleted</span>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-500/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-400">{summary.deleted}</div>
                  <div className="text-xs text-green-400/70">Deleted</div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-400">{summary.failed}</div>
                  <div className="text-xs text-red-400/70">Failed</div>
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
                  onClick={startDeletion}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete {reportIds.length} Report{reportIds.length !== 1 ? 's' : ''}
                </Button>
              </>
            )}

            {running && (
              <Button
                onClick={cancelDeletion}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                Cancel
              </Button>
            )}

            {completed && (
              <Button
                onClick={onComplete}
                className="bg-slate-600 hover:bg-slate-700 text-white"
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
