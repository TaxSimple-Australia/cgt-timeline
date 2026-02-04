'use client';

import React from 'react';
import { PropertyAnalysis, OwnershipPeriod } from '@/types/model-response';
import { Scale } from 'lucide-react';

interface LegislationReferencesTableProps {
  property: PropertyAnalysis;
}

// Helper function to extract unique legislation sections from ownership periods
function extractUniqueLegislationSections(ownershipPeriods: OwnershipPeriod[]): string[] {
  const sections = new Set<string>();

  ownershipPeriods.forEach(period => {
    if (period.note) {
      sections.add(period.note);
    }
  });

  // Return sorted array
  return Array.from(sections).sort();
}

export default function LegislationReferencesTable({
  property,
}: LegislationReferencesTableProps) {
  const ownershipPeriods = property.ownership_periods || [];
  const legislationSections = extractUniqueLegislationSections(ownershipPeriods);

  if (legislationSections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-blue-700 dark:text-blue-400">
          ⚖️ Key Legislation Referenced
        </span>
      </div>

      {/* Simple List */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <ul className="space-y-2">
          {legislationSections.map((section, index) => (
            <li
              key={index}
              className="flex items-center gap-3 text-sm"
            >
              <Scale className="w-4 h-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
              <span className="font-mono font-semibold text-blue-900 dark:text-blue-100">
                {section}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Legend */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
        <p className="text-xs text-blue-900 dark:text-blue-100">
          <strong>Note:</strong> Legislation sections are referenced from the Income Tax Assessment Act 1997 (ITAA 1997)
          unless otherwise specified.
        </p>
      </div>
    </div>
  );
}
