'use client';

import React from 'react';

interface MixedUseIndicatorProps {
  x: number;
  y: number;
  width: number;
  livingPercentage?: number;
  rentalPercentage?: number;
  businessPercentage?: number;
}

export default function MixedUseIndicator({
  x,
  y,
  width,
  livingPercentage = 0,
  rentalPercentage = 0,
  businessPercentage = 0,
}: MixedUseIndicatorProps) {
  // Only show if we have width and at least one percentage is set
  const hasPercentages = livingPercentage > 0 || rentalPercentage > 0 || businessPercentage > 0;

  if (!hasPercentages || width < 2) {
    return null;
  }

  // Build the label text showing only non-zero percentages
  const parts: string[] = [];
  if (livingPercentage > 0) {
    parts.push(`Living: ${livingPercentage.toFixed(0)}%`);
  }
  if (rentalPercentage > 0) {
    parts.push(`Rental: ${rentalPercentage.toFixed(0)}%`);
  }
  if (businessPercentage > 0) {
    parts.push(`Business: ${businessPercentage.toFixed(0)}%`);
  }

  const labelText = parts.join(' | ');

  return (
    <foreignObject
      x={`${x}%`}
      y={y}
      width={`${width}%`}
      height="30"
      style={{ overflow: 'visible' }}
    >
      <div className="flex items-center justify-center h-full">
        <div
          className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap
                     bg-purple-100/90 dark:bg-purple-900/90
                     text-purple-900 dark:text-purple-100
                     border border-purple-300 dark:border-purple-700
                     shadow-sm backdrop-blur-sm"
        >
          {labelText}
        </div>
      </div>
    </foreignObject>
  );
}
