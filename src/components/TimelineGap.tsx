'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import type { PositionedGap } from '../types/ai-feedback';

interface TimelineGapProps {
  gap: PositionedGap;
  timelineHeight: number;
  branchY?: number; // Y position of the property branch
  onClick?: () => void;
}

export default function TimelineGap({ gap, timelineHeight, branchY = 0, onClick }: TimelineGapProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Only show if gap is within visible range
  if (gap.x < -10 || gap.x > 110) return null;

  const startDate = new Date(gap.start_date);
  const endDate = new Date(gap.end_date);

  // Calculate vertical position - center on branch line
  const gapY = branchY - (timelineHeight / 2);

  return (
    <g
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Red highlighted region */}
      <rect
        x={`${gap.x}%`}
        y={gapY}
        width={`${gap.width}%`}
        height={timelineHeight}
        fill="rgba(239, 68, 68, 0.15)"
        stroke="#EF4444"
        strokeWidth="3"
        strokeDasharray="5,5"
        className="cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      />

      {/* Warning icon at the center of the gap */}
      <g className="cursor-pointer" onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}>
        {/* Pulse animation circle */}
        <circle
          cx={`${gap.x + gap.width / 2}%`}
          cy={branchY}
          r="24"
          fill="none"
          stroke="#EF4444"
          strokeWidth="2"
          opacity="0.6"
        >
          <animate
            attributeName="r"
            from="20"
            to="28"
            dur="1.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            from="0.6"
            to="0"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Main circle background */}
        <circle
          cx={`${gap.x + gap.width / 2}%`}
          cy={branchY}
          r="20"
          fill="#EF4444"
          stroke="white"
          strokeWidth="2"
          className="hover:opacity-90 transition-opacity"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
        />

        {/* Exclamation mark */}
        <text
          x={`${gap.x + gap.width / 2}%`}
          y={branchY + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="18"
          fontWeight="bold"
          fill="white"
        >
          !
        </text>
      </g>

      {/* Tooltip using foreignObject */}
      {showTooltip && (
        <foreignObject
          x={`${gap.x + gap.width / 2}%`}
          y={branchY - 110}
          width="240"
          height="100"
          style={{
            overflow: 'visible',
            transform: 'translateX(-120px)',
            pointerEvents: 'none',
          }}
        >
          <div className="bg-slate-800 text-white rounded-lg shadow-xl p-3">
            <div className="font-semibold text-sm text-center mb-2">
              ⚠️ Timeline Gap Detected
            </div>
            <div className="text-gray-300 text-xs text-center mb-1">
              {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
            </div>
            <div className="text-yellow-400 text-xs font-medium text-center">
              {gap.duration_days} days ({Math.round(gap.duration_days / 365 * 10) / 10} years)
            </div>
            {gap.relatedIssue && (
              <div className="text-gray-400 text-[10px] text-center mt-2">
                Click for details
              </div>
            )}
          </div>
        </foreignObject>
      )}

    </g>
  );
}
