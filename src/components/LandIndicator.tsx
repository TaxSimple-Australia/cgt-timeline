'use client';

import React from 'react';

interface LandIndicatorProps {
  x: number;           // Position percentage (0-100)
  y: number;           // Vertical position
  isLandOnly?: boolean;
  overTwoHectares?: boolean;
}

export default function LandIndicator({
  x,
  y,
  isLandOnly = false,
  overTwoHectares = false,
}: LandIndicatorProps) {
  // Only show if at least one flag is set
  if (!isLandOnly && !overTwoHectares) {
    return null;
  }

  // Build the label text
  const parts: string[] = [];
  if (isLandOnly) {
    parts.push('Land Only');
  }
  if (overTwoHectares) {
    parts.push('2+ Ha');
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
        style={{ transform: 'translateX(200px)' }}
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
