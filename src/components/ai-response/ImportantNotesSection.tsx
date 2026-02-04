'use client';

import React from 'react';
import { PropertyAnalysis } from '@/types/model-response';
import { AlertCircle } from 'lucide-react';

interface ImportantNotesSectionProps {
  property: PropertyAnalysis;
}

export default function ImportantNotesSection({
  property,
}: ImportantNotesSectionProps) {
  const importantNotes = property.important_notes || [];

  if (importantNotes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-amber-700 dark:text-amber-400">
          ⚠️ O7. Important Notes
        </span>
      </div>

      {/* Notes List */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
        <ul className="space-y-2">
          {importantNotes.map((note, index) => (
            <li
              key={index}
              className="flex items-start gap-3 text-sm text-amber-900 dark:text-amber-100"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span className="leading-relaxed">{note}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
