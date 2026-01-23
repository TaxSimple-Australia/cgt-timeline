'use client';

import React from 'react';

interface MixedUseIndicatorProps {
  x: number;           // Position percentage (0-100)
  y: number;           // Vertical position
  livingPercentage?: number;
  rentalPercentage?: number;
  businessPercentage?: number;
}

export default function MixedUseIndicator({
  x,
  y,
  livingPercentage = 0,
  rentalPercentage = 0,
  businessPercentage = 0,
}: MixedUseIndicatorProps) {
  // Only show if at least one percentage is set
  const hasPercentages = livingPercentage > 0 || rentalPercentage > 0 || businessPercentage > 0;

  if (!hasPercentages) {
    return null;
  }

  // Build the label text showing only non-zero percentages (abbreviated)
  const parts: string[] = [];
  if (livingPercentage > 0) {
    parts.push(`L: ${livingPercentage.toFixed(0)}%`);
  }
  if (rentalPercentage > 0) {
    parts.push(`R: ${rentalPercentage.toFixed(0)}%`);
  }
  if (businessPercentage > 0) {
    parts.push(`B: ${businessPercentage.toFixed(0)}%`);
  }

  const labelText = parts.join(' | ');

  return (
    <foreignObject
      x={`${x}%`}
      y={y}
      width="1"
      height="30"
      style={{ overflow: 'visible' }}
    >
      <div
        className="flex items-center justify-center h-full"
        style={{ transform: 'translateX(100px)' }}
      >
        <div
          className="px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap
                     bg-gray-100/90 dark:bg-gray-700/90
                     text-gray-600 dark:text-gray-300
                     border border-gray-300 dark:border-gray-600
                     shadow-sm backdrop-blur-sm"
        >
          {labelText}
        </div>
      </div>
    </foreignObject>
  );
}
