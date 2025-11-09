'use client';

import { useState } from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { TimelineIssue } from '../types/ai-feedback';

interface WarningBadgeProps {
  issues: TimelineIssue[];
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export default function WarningBadge({ issues, onClick, size = 'md', position = 'top-left' }: WarningBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!issues || issues.length === 0) return null;

  // Determine severity level (show highest severity)
  const hasCritical = issues.some(i => i.severity === 'critical');
  const severity = hasCritical ? 'critical' : 'warning';

  // Size mapping
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // Position mapping
  const positionClasses = {
    'top-left': 'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
    'top-right': 'top-0 right-0 translate-x-1/2 -translate-y-1/2',
    'bottom-left': 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
    'bottom-right': 'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
  };

  // Icon and color based on severity
  const Icon = severity === 'critical' ? AlertTriangle : AlertCircle;
  const bgColor = severity === 'critical'
    ? 'bg-red-500 hover:bg-red-600'
    : 'bg-yellow-500 hover:bg-yellow-600';
  const textColor = 'text-white';

  return (
    <div
      className={`absolute ${positionClasses[position]} z-10`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        className={`
          ${sizeClasses[size]}
          ${bgColor}
          ${textColor}
          rounded-full
          flex items-center justify-center
          shadow-lg
          cursor-pointer
          transition-all
          hover:scale-110
          relative
        `}
        title={`${issues.length} issue${issues.length > 1 ? 's' : ''}`}
      >
        <Icon className="w-3/4 h-3/4" />

        {/* Badge count for multiple issues */}
        {issues.length > 1 && (
          <div className="
            absolute -top-1 -right-1
            bg-white text-gray-900
            text-[10px] font-bold
            w-4 h-4
            rounded-full
            flex items-center justify-center
            border border-gray-300
          ">
            {issues.length}
          </div>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="
          absolute left-full ml-2 top-1/2 -translate-y-1/2
          bg-gray-900 text-white
          px-3 py-2
          rounded-lg shadow-xl
          text-xs
          whitespace-nowrap
          max-w-xs
          z-50
          pointer-events-none
        ">
          <div className="font-semibold mb-1">
            {severity === 'critical' ? '⚠️ Critical Issues' : '⚡ Warnings'}
          </div>
          {issues.slice(0, 3).map((issue, index) => (
            <div key={index} className="text-gray-300">
              • {issue.message.substring(0, 50)}{issue.message.length > 50 ? '...' : ''}
            </div>
          ))}
          {issues.length > 3 && (
            <div className="text-gray-400 mt-1">
              +{issues.length - 3} more...
            </div>
          )}
          <div className="text-gray-400 mt-1 pt-1 border-t border-gray-700">
            Click to view details
          </div>

          {/* Arrow */}
          <div className="
            absolute right-full top-1/2 -translate-y-1/2
            w-0 h-0
            border-t-4 border-t-transparent
            border-b-4 border-b-transparent
            border-r-4 border-r-gray-900
          " />
        </div>
      )}
    </div>
  );
}
