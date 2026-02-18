'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Image, Table, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ProcessedDocument, TimelineAction } from '@/types/ai-builder';

interface DocumentExtractionCardProps {
  document: ProcessedDocument;
  onApply: (actions: TimelineAction[]) => void;
}

export default function DocumentExtractionCard({ document, onApply }: DocumentExtractionCardProps) {
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());
  const [isApplied, setIsApplied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Auto-select all actions on mount
  useEffect(() => {
    setSelectedActions(new Set(document.suggestedActions.map((a) => a.id)));
  }, [document.suggestedActions]);

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'image':
        return <Image className="w-4 h-4 text-blue-500" />;
      case 'excel':
      case 'csv':
        return <Table className="w-4 h-4 text-green-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const toggleAction = (actionId: string) => {
    setSelectedActions((prev) => {
      const next = new Set(prev);
      if (next.has(actionId)) {
        next.delete(actionId);
      } else {
        next.add(actionId);
      }
      return next;
    });
  };

  const handleApply = () => {
    const actionsToApply = document.suggestedActions.filter((a) =>
      selectedActions.has(a.id)
    );
    if (actionsToApply.length > 0) {
      onApply(actionsToApply);
      setIsApplied(true);
    }
  };

  const { extractedData } = document;
  const summaryParts: string[] = [];
  if (extractedData.properties.length > 0)
    summaryParts.push(`${extractedData.properties.length} propert${extractedData.properties.length === 1 ? 'y' : 'ies'}`);
  if (extractedData.events.length > 0)
    summaryParts.push(`${extractedData.events.length} event${extractedData.events.length === 1 ? '' : 's'}`);
  if (extractedData.dates.length > 0)
    summaryParts.push(`${extractedData.dates.length} date${extractedData.dates.length === 1 ? '' : 's'}`);
  if (extractedData.amounts.length > 0)
    summaryParts.push(`${extractedData.amounts.length} amount${extractedData.amounts.length === 1 ? '' : 's'}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-850"
    >
      {/* Header */}
      <button
        onClick={() => !isApplied && setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        {getDocumentIcon(document.type)}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {document.filename}
          </p>
          {summaryParts.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Found {summaryParts.join(', ')}
            </p>
          )}
        </div>
        {/* Confidence badge */}
        <div
          className={cn(
            'px-2 py-0.5 rounded text-xs font-medium flex-shrink-0',
            document.confidence >= 0.7
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : document.confidence >= 0.4
              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          )}
        >
          {Math.round(document.confidence * 100)}%
        </div>
        {!isApplied && (
          isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )
        )}
      </button>

      {/* Actions list */}
      {isExpanded && !isApplied && document.suggestedActions.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Suggested Actions
          </p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {document.suggestedActions.map((action) => (
              <label
                key={action.id}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedActions.has(action.id)}
                  onChange={() => toggleAction(action.id)}
                  className="w-3.5 h-3.5 rounded text-blue-500 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  {action.description}
                </span>
              </label>
            ))}
          </div>

          <button
            onClick={handleApply}
            disabled={selectedActions.size === 0}
            className={cn(
              'mt-2 w-full py-1.5 px-3 rounded-lg text-sm font-medium transition-colors',
              'flex items-center justify-center gap-1.5',
              selectedActions.size > 0
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700'
            )}
          >
            <Check className="w-3.5 h-3.5" />
            Apply {selectedActions.size} Action{selectedActions.size !== 1 ? 's' : ''}
          </button>
        </div>
      )}

      {/* Applied state */}
      {isApplied && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <Check className="w-4 h-4" />
            <span className="text-xs font-medium">Actions applied to timeline</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
