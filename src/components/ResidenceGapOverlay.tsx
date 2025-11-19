'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { dateToPosition } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import type { AIIssue } from '../types/ai-feedback';

interface ResidenceGapOverlayProps {
  issue: AIIssue; // The timeline_gap issue from AI response
  timelineStart: Date;
  timelineEnd: Date;
  timelineHeight: number; // Total height of timeline area
  onClick?: () => void;
}

export default function ResidenceGapOverlay({
  issue,
  timelineStart,
  timelineEnd,
  timelineHeight,
  onClick
}: ResidenceGapOverlayProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Extract gap period from issue
  if (!issue.affected_period) return null;

  const startDate = new Date(issue.affected_period.start);
  const endDate = new Date(issue.affected_period.end);

  // Calculate positions using dateToPosition (same as events)
  const startPosition = dateToPosition(startDate, timelineStart, timelineEnd);
  const endPosition = dateToPosition(endDate, timelineStart, timelineEnd);

  // Only show if gap is within visible range
  if (endPosition < -10 || startPosition > 110) return null;

  const width = endPosition - startPosition;

  // Determine color based on severity
  const isCritical = issue.severity === 'critical';
  const fillColor = isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(251, 191, 36, 0.15)';
  const strokeColor = isCritical ? '#EF4444' : '#F59E0B';
  const textColor = isCritical ? '#DC2626' : '#D97706';

  // Pattern ID for striped effect
  const patternId = `gap-pattern-${issue.affected_period.start}`;

  return (
    <g
      className="residence-gap-overlay cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {/* Define diagonal stripe pattern */}
      <defs>
        <pattern
          id={patternId}
          patternUnits="userSpaceOnUse"
          width="8"
          height="8"
          patternTransform="rotate(45)"
        >
          <rect width="4" height="8" fill={fillColor} />
          <rect x="4" width="4" height="8" fill="transparent" />
        </pattern>
      </defs>

      {/* Gap overlay bar - spans full timeline height */}
      <motion.rect
        x={`${startPosition}%`}
        y={0}
        width={`${width}%`}
        height={timelineHeight}
        fill={`url(#${patternId})`}
        stroke={strokeColor}
        strokeWidth={isHovered ? 3 : 2}
        strokeDasharray="6,4"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.9 : 0.7 }}
        transition={{ duration: 0.2 }}
        style={{
          pointerEvents: 'all'
        }}
      />

      {/* Start marker with icon */}
      <g transform={`translate(${startPosition}%, 30)`}>
        {/* Background circle */}
        <motion.circle
          r={isHovered ? 18 : 16}
          fill={strokeColor}
          stroke="white"
          strokeWidth="2"
          animate={{ scale: isHovered ? 1.1 : 1 }}
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }}
        />

        {/* Warning triangle icon */}
        <foreignObject
          x="-10"
          y="-10"
          width="20"
          height="20"
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex items-center justify-center w-full h-full">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
        </foreignObject>
      </g>

      {/* End marker with icon */}
      <g transform={`translate(${endPosition}%, 30)`}>
        {/* Background circle */}
        <motion.circle
          r={isHovered ? 18 : 16}
          fill={strokeColor}
          stroke="white"
          strokeWidth="2"
          animate={{ scale: isHovered ? 1.1 : 1 }}
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }}
        />

        {/* Warning triangle icon */}
        <foreignObject
          x="-10"
          y="-10"
          width="20"
          height="20"
          style={{ pointerEvents: 'none' }}
        >
          <div className="flex items-center justify-center w-full h-full">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
        </foreignObject>
      </g>

      {/* Hover tooltip */}
      {isHovered && (
        <foreignObject
          x={`${startPosition + width / 2}%`}
          y={timelineHeight / 2 - 80}
          width="320"
          height="160"
          style={{
            overflow: 'visible',
            pointerEvents: 'none',
            transform: 'translateX(-160px)'
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 text-white px-4 py-3 rounded-lg shadow-2xl text-xs border-2"
            style={{ borderColor: strokeColor }}
          >
            {/* Header */}
            <div className="font-bold text-sm text-center mb-2 flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4" style={{ color: strokeColor }} />
              <span style={{ color: strokeColor }}>
                {isCritical ? 'Critical' : 'Warning'}: Residence Gap
              </span>
            </div>

            {/* Gap period */}
            <div className="text-slate-300 text-xs text-center mb-2">
              <div className="font-semibold">{format(startDate, 'MMM dd, yyyy')}</div>
              <div className="text-slate-500 text-[10px]">to</div>
              <div className="font-semibold">{format(endDate, 'MMM dd, yyyy')}</div>
            </div>

            {/* Duration */}
            <div className="text-center mb-2 bg-slate-700 rounded px-2 py-1">
              <span className="font-medium" style={{ color: strokeColor }}>
                {issue.affected_period.days} days
              </span>
              <span className="text-slate-400 text-[10px] ml-1">
                ({Math.round(issue.affected_period.days / 365 * 10) / 10} years)
              </span>
            </div>

            {/* Property info */}
            {issue.property_address && (
              <div className="text-slate-400 text-[10px] text-center mb-2">
                Property: {issue.property_address}
              </div>
            )}

            {/* Message */}
            <div className="text-slate-300 text-[10px] text-center line-clamp-2 mb-2">
              {issue.message}
            </div>

            {/* Action hint */}
            <div className="text-slate-500 text-[9px] text-center">
              Click for details
            </div>
          </motion.div>
        </foreignObject>
      )}
    </g>
  );
}
