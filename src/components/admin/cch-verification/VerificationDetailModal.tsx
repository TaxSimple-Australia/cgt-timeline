'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import type { VerificationRecord } from '@/types/cgt-report';

interface VerificationDetailModalProps {
  verification: VerificationRecord;
  propertyAddress: string;
  onClose: () => void;
}

export default function VerificationDetailModal({
  verification,
  propertyAddress,
  onClose,
}: VerificationDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'scenario' | 'our-answer' | 'cch-response'>('summary');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    scenario: true,
    ourAnswer: false,
    cchResponse: false,
  });

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleString('en-AU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getAlignmentColor = (alignment?: string) => {
    switch (alignment) {
      case 'high': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-red-500';
      default: return 'text-slate-400';
    }
  };

  const getAlignmentBg = (alignment?: string) => {
    switch (alignment) {
      case 'high': return 'bg-green-500/20 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'bg-red-500/20 border-red-500/30';
      default: return 'bg-slate-500/20 border-slate-500/30';
    }
  };

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'scenario', label: 'Scenario Sent' },
    { id: 'our-answer', label: 'Our Answer' },
    { id: 'cch-response', label: 'CCH Response' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Verification Details
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {propertyAddress} • {formatDate(verification.verifiedAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Status Banner */}
        <div className={`px-4 py-3 border-b border-slate-200 dark:border-slate-700 ${
          verification.status === 'success' ? 'bg-green-500/10' :
          verification.status === 'timeout' ? 'bg-yellow-500/10' :
          'bg-red-500/10'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {verification.status === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : verification.status === 'timeout' ? (
                <Clock className="w-5 h-5 text-yellow-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <span className={`font-medium ${
                verification.status === 'success' ? 'text-green-700 dark:text-green-400' :
                verification.status === 'timeout' ? 'text-yellow-700 dark:text-yellow-400' :
                'text-red-700 dark:text-red-400'
              }`}>
                {verification.status === 'success' ? 'Verification Complete' :
                 verification.status === 'timeout' ? 'Verification Timed Out' :
                 'Verification Failed'}
              </span>
              {verification.duration && (
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  ({(verification.duration / 1000).toFixed(1)}s)
                </span>
              )}
            </div>

            {verification.comparison && (
              <div className="flex items-center gap-4">
                <div className={`px-3 py-1 rounded-full border ${getAlignmentBg(verification.comparison.overallAlignment)}`}>
                  <span className={`text-sm font-medium capitalize ${getAlignmentColor(verification.comparison.overallAlignment)}`}>
                    {verification.comparison.overallAlignment} Alignment
                  </span>
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {verification.comparison.matchPercentage}% Match
                </span>
              </div>
            )}
          </div>

          {verification.errorMessage && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {verification.errorMessage}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              {verification.comparison && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Overall Alignment</div>
                      <div className={`text-2xl font-bold capitalize ${getAlignmentColor(verification.comparison.overallAlignment)}`}>
                        {verification.comparison.overallAlignment}
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Match Percentage</div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {verification.comparison.matchPercentage}%
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Confidence Score</div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {verification.comparison.confidenceScore}%
                      </div>
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Verification Checkpoints</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.entries(verification.comparison.checkboxes).map(([key, value]) => (
                        <div
                          key={key}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                            value
                              ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400'
                              : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {value ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                          <span className="text-sm font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace('Match', '')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CGT Comparison */}
                  {(verification.comparison.ourNetCgt || verification.comparison.externalNetCgt) && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">CGT Comparison</h3>
                      <div className="grid grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                        <div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Our Net CGT</div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {verification.comparison.ourNetCgt || '-'}
                          </div>
                        </div>
                        <div className="flex items-center justify-center">
                          <ArrowRight className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">CCH Net CGT</div>
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {verification.comparison.externalNetCgt || '-'}
                          </div>
                        </div>
                      </div>
                      {verification.comparison.calculationDifference && (
                        <div className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                          Difference: {verification.comparison.calculationDifference}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Summary */}
                  {verification.comparison.summary && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Summary</h3>
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {verification.comparison.summary}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Key Differences */}
                  {verification.comparison.keyDifferences.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Key Differences</h3>
                      <ul className="space-y-2">
                        {verification.comparison.keyDifferences.map((diff, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-700 dark:text-amber-300"
                          >
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            {diff}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* External LLM Errors */}
                  {verification.comparison.externalLlmErrors && verification.comparison.externalLlmErrors.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">CCH LLM Errors</h3>
                      <ul className="space-y-2">
                        {verification.comparison.externalLlmErrors.map((err, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-700 dark:text-red-300"
                          >
                            <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            {err}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === 'scenario' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Scenario / Verification Prompt
                  </h3>
                </div>
                <button
                  onClick={() => copyToClipboard(verification.scenario || '', 'scenario')}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                  {copiedField === 'scenario' ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono overflow-auto max-h-[60vh]">
                  {verification.scenario || 'No scenario data available'}
                </pre>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {verification.scenario?.length || 0} characters
              </div>
            </div>
          )}

          {activeTab === 'our-answer' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Our AI Answer (Formatted for CCH)
                  </h3>
                </div>
                <button
                  onClick={() => copyToClipboard(verification.ourAnswer || '', 'ourAnswer')}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                  {copiedField === 'ourAnswer' ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
                <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono overflow-auto max-h-[60vh]">
                  {verification.ourAnswer || 'No answer data available'}
                </pre>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {verification.ourAnswer?.length || 0} characters
              </div>
            </div>
          )}

          {activeTab === 'cch-response' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5 text-purple-400" />
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    CCH iConnect Response
                  </h3>
                </div>
                {verification.cchResponse?.text && (
                  <button
                    onClick={() => copyToClipboard(verification.cchResponse?.text || '', 'cchResponse')}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    {copiedField === 'cchResponse' ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-green-600 dark:text-green-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {verification.cchResponse ? (
                <>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-4">
                    <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono overflow-auto max-h-[50vh]">
                      {verification.cchResponse.text || 'No response text'}
                    </pre>
                  </div>

                  {verification.cchResponse.sources && verification.cchResponse.sources.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sources</h4>
                      <ul className="space-y-2">
                        {verification.cchResponse.sources.map((source, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700"
                          >
                            <ExternalLink className="w-4 h-4 text-blue-500" />
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {source.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {verification.cchResponse.queriedAt && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Queried at: {formatDate(verification.cchResponse.queriedAt)}
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">
                    No CCH response available
                  </p>
                  {verification.errorMessage && (
                    <p className="text-sm text-red-500 mt-2">
                      {verification.errorMessage}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Verification ID: {verification.id}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
