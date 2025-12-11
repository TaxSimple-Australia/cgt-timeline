'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle, AlertCircle, Calendar, DollarSign, Home } from 'lucide-react';
import { format } from 'date-fns';
import type { TimelineIssue } from '../types/ai-feedback';
import { useTimelineStore } from '../store/timeline';

interface FeedbackModalProps {
  issue: TimelineIssue | null;
  onClose: () => void;
  onResolve: (issueId: string, response: string) => void;
}

export default function FeedbackModal({ issue, onClose, onResolve }: FeedbackModalProps) {
  const [userResponse, setUserResponse] = useState('');
  const { properties, events } = useTimelineStore();

  useEffect(() => {
    // Reset response when issue changes
    setUserResponse(issue?.userResponse || '');
  }, [issue]);

  if (!issue) return null;

  // Get related property/event if linked
  const property = issue.propertyId ? properties.find(p => p.id === issue.propertyId) : null;
  const event = issue.eventId ? events.find(e => e.id === issue.eventId) : null;

  // Icon based on category
  const getCategoryIcon = () => {
    switch (issue.category) {
      case 'timeline_gap':
        return <Calendar className="w-6 h-6" />;
      case 'cost_base_missing':
      case 'missing_sale_price':
        return <DollarSign className="w-6 h-6" />;
      case 'completeness_missing_purchase':
        return <Home className="w-6 h-6" />;
      default:
        return <AlertCircle className="w-6 h-6" />;
    }
  };

  // Color based on severity
  const severityColor = issue.severity === 'critical'
    ? 'text-red-600 bg-red-50 border-red-200'
    : 'text-yellow-600 bg-yellow-50 border-yellow-200';

  const severityBadge = issue.severity === 'critical'
    ? 'bg-red-100 text-red-800 border-red-300'
    : 'bg-yellow-100 text-yellow-800 border-yellow-300';

  const handleSubmit = () => {
    if (userResponse.trim()) {
      onResolve(issue.id, userResponse);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="
        fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-full max-w-2xl max-h-[90vh]
        bg-white dark:bg-slate-800
        rounded-lg shadow-2xl
        z-50
        overflow-hidden
        flex flex-col
      ">
        {/* Header */}
        <div className={`
          px-6 py-4
          border-b-2 border-l-4
          ${severityColor}
          flex items-center justify-between
        `}>
          <div className="flex items-center gap-3">
            <div className={`
              p-2 rounded-lg
              ${issue.severity === 'critical' ? 'bg-red-100' : 'bg-yellow-100'}
            `}>
              {getCategoryIcon()}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {issue.severity === 'critical' ? 'Critical Issue' : 'Warning'}
              </h2>
              <div className={`
                inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium border
                ${severityBadge}
              `}>
                {issue.category.replace(/_/g, ' ').toUpperCase()}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="
              p-2 rounded-lg
              hover:bg-gray-100 dark:hover:bg-slate-700
              transition-colors
            "
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Property/Event Context */}
          {(property || event) && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                Related to:
              </div>
              {property && (
                <div className="text-blue-700 dark:text-blue-400">
                  📍 {property.name || property.address}
                </div>
              )}
              {event && (
                <div className="text-blue-600 dark:text-blue-500 text-sm">
                  {event.type === 'refinance' ? 'INHERIT' : event.type.replace(/_/g, ' ').toUpperCase()} - {format(event.date, 'MMM d, yyyy')}
                </div>
              )}
            </div>
          )}

          {/* Gap Date Range */}
          {issue.startDate && issue.endDate && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="text-sm font-medium text-orange-900 dark:text-orange-300 mb-2">
                Timeline Gap Period:
              </div>
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(issue.startDate, 'MMM d, yyyy')} → {format(issue.endDate, 'MMM d, yyyy')}
                </span>
              </div>
              <div className="text-orange-600 dark:text-orange-500 text-sm mt-1">
                Duration: {issue.duration} days ({Math.round((issue.duration || 0) / 365 * 10) / 10} years)
              </div>
            </div>
          )}

          {/* Issue Message */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Issue Description:
            </h3>
            <p className="text-gray-900 dark:text-gray-100">
              {issue.message}
            </p>
          </div>

          {/* Question */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">
              ❓ Question:
            </h3>
            <p className="text-purple-800 dark:text-purple-200 font-medium">
              {issue.question}
            </p>
          </div>

          {/* Impact */}
          {issue.impact && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-red-900 dark:text-red-300 mb-2">
                ⚠️ Impact on CGT Calculation:
              </h3>
              <p className="text-red-700 dark:text-red-300">
                {issue.impact}
              </p>
            </div>
          )}

          {/* Suggestion */}
          {issue.suggestion && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2">
                💡 Suggestion:
              </h3>
              <p className="text-green-700 dark:text-green-300">
                {issue.suggestion}
              </p>
            </div>
          )}

          {/* User Response Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Your Response:
            </label>
            <textarea
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              placeholder="Provide your answer or additional information here..."
              className="
                w-full h-32 px-4 py-3
                border-2 border-gray-300 dark:border-slate-600
                rounded-lg
                bg-white dark:bg-slate-700
                text-gray-900 dark:text-gray-100
                placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                resize-none
              "
            />
          </div>
        </div>

        {/* Footer */}
        <div className="
          px-6 py-4
          border-t border-gray-200 dark:border-slate-700
          flex items-center justify-between
          bg-gray-50 dark:bg-slate-900
        ">
          <button
            onClick={onClose}
            className="
              px-4 py-2
              text-gray-700 dark:text-gray-300
              hover:bg-gray-200 dark:hover:bg-slate-700
              rounded-lg
              transition-colors
            "
          >
            Cancel
          </button>

          <div className="flex gap-2">
            {issue.resolved && (
              <span className="
                px-4 py-2
                bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300
                rounded-lg
                font-medium
              ">
                ✓ Resolved
              </span>
            )}
            <button
              onClick={handleSubmit}
              disabled={!userResponse.trim()}
              className="
                px-6 py-2
                bg-blue-600 hover:bg-blue-700
                disabled:bg-gray-400 disabled:cursor-not-allowed
                text-white
                rounded-lg
                font-medium
                transition-colors
              "
            >
              {issue.resolved ? 'Update Response' : 'Submit & Resolve'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
