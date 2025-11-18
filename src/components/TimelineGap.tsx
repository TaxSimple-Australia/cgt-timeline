'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { dateToPosition } from '@/lib/utils';
import type { TimelineGap } from '../types/ai-feedback';

interface TimelineGapProps {
  gap: TimelineGap;
  timelineHeight: number;
  branchY?: number; // Y position of the property branch
  timelineStart: Date;
  timelineEnd: Date;
  onClick?: () => void;
}

export default function TimelineGap({ gap, timelineHeight, branchY = 0, timelineStart, timelineEnd, onClick }: TimelineGapProps) {
  const [isHovered, setIsHovered] = useState(false);

  const startDate = new Date(gap.start_date);
  const endDate = new Date(gap.end_date);

  // Calculate position from date using same logic as events
  const calculatedPosition = dateToPosition(startDate, timelineStart, timelineEnd);

  // Only show if gap is within visible range
  if (calculatedPosition < -10 || calculatedPosition > 110) return null;

  // Position at START of gap (like events) - use percentage string for SVG
  const cx = `${calculatedPosition}%`;
  const cy = branchY;

  return (
    <g
      className="gap-marker-group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {/* Glow effect on hover - triangle outline */}
      {isHovered && (
        <g>
          <path
            d={`M ${cx},-${cy - 32} L calc(${cx} + 28px),${cy + 20} L calc(${cx} - 28px),${cy + 20} Z`}
            fill="#EF4444"
            opacity={0.15}
          />
        </g>
      )}

      {/* Pulse animation - triangle outline */}
      <g>
        <path
          d={`M ${cx},${cy - 24} L calc(${cx} + 21px),${cy + 15} L calc(${cx} - 21px),${cy + 15} Z`}
          fill="none"
          stroke="#EF4444"
          strokeWidth="2"
          opacity="0.5"
        >
          <animate
            attributeName="opacity"
            from="0.6"
            to="0"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>
      </g>

      {/* Main triangle warning symbol - using foreignObject for proper positioning */}
      <foreignObject
        x={cx}
        y={cy - 18}
        width="32"
        height="30"
        style={{
          overflow: 'visible',
          transform: 'translateX(-16px)',
          pointerEvents: 'none'
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: isHovered ? 1.15 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="relative"
          style={{ width: '32px', height: '30px' }}
        >
          <svg width="32" height="30" viewBox="0 0 32 30" style={{ overflow: 'visible' }}>
            {/* Yellow/Orange warning triangle */}
            <path
              d="M 16,0 L 32,30 L 0,30 Z"
              fill="#FCD34D"
              stroke="#F59E0B"
              strokeWidth="2.5"
              strokeLinejoin="round"
              style={{
                filter: 'drop-shadow(0 3px 8px rgba(239, 68, 68, 0.5))',
              }}
            />

            {/* Red border for emphasis */}
            <path
              d="M 16,0 L 32,30 L 0,30 Z"
              fill="none"
              stroke="#EF4444"
              strokeWidth="1.5"
              strokeLinejoin="round"
              opacity="0.6"
            />

            {/* Exclamation mark inside triangle */}
            <rect
              x="14.5"
              y="10"
              width="3"
              height="12"
              fill="#DC2626"
              rx="1"
            />
            <circle
              cx="16"
              cy="25"
              r="2"
              fill="#DC2626"
            />
          </svg>
        </motion.div>
      </foreignObject>

      {/* Hover tooltip */}
      {isHovered && (
        <foreignObject
          x={cx}
          y={cy - 70}
          width="260"
          height="100"
          style={{
            overflow: 'visible',
            pointerEvents: 'none',
            transform: 'translateX(-130px)'
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 text-white px-4 py-3 rounded-lg shadow-xl text-xs"
          >
            <div className="font-bold text-sm text-center mb-2 flex items-center justify-center gap-1.5">
              <span className="text-red-400">⚠️</span>
              <span>Residence Gap</span>
            </div>
            <div className="text-slate-300 text-xs text-center mb-2">
              <div className="font-semibold">{format(startDate, 'MMM dd, yyyy')}</div>
              <div className="text-slate-500 text-[10px]">to</div>
              <div className="font-semibold">{format(endDate, 'MMM dd, yyyy')}</div>
            </div>
            <div className="text-yellow-400 text-xs font-medium text-center bg-slate-700 rounded px-2 py-1">
              {gap.duration_days} days ({Math.round(gap.duration_days / 365 * 10) / 10} years)
            </div>
            <div className="text-slate-400 text-[10px] text-center mt-2">
              Click for details
            </div>
          </motion.div>
        </foreignObject>
      )}

      {/* Label below triangle */}
      <text
        x={cx}
        y={cy + 32}
        textAnchor="middle"
        className="text-[12px] font-bold fill-red-600 dark:fill-red-500 pointer-events-none"
        style={{ userSelect: 'none' }}
      >
        Gap: {gap.duration_days}d
      </text>
    </g>
  );
}
