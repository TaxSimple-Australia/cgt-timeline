'use client';

import React from 'react';
import { PropertyAnalysis } from '@/types/model-response';
import { formatCurrency } from '@/lib/utils';

interface TimelineSummaryTableProps {
  property: PropertyAnalysis;
  timelineUnderstanding?: string; // High-level narrative from data.timeline_understanding
}

export default function TimelineSummaryTable({
  property,
  timelineUnderstanding,
}: TimelineSummaryTableProps) {
  // Use timeline_understanding if provided, otherwise fall back to high_level_description
  const narrativeSummary = timelineUnderstanding || property.high_level_description;

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-teal-700 dark:text-teal-400">
          📊 Section 1: Summary
        </span>
      </div>

      {/* Narrative Summary */}
      {narrativeSummary && (
        <div className="p-4 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-lg">
          <h4 className="text-sm font-semibold text-teal-900 dark:text-teal-100 mb-2">
            Timeline Understanding
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {narrativeSummary}
          </p>
        </div>
      )}
    </div>
  );
}
