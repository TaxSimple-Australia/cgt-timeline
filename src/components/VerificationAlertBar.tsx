'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VerificationAlert } from '@/types/verification-alert';
import { dateToPosition } from '@/lib/utils';

interface VerificationAlertBarProps {
  alert: VerificationAlert;
  branchY: number;
  timelineStart: Date;
  timelineEnd: Date;
  onResolveAlert: (alertId: string, userResponse: string) => void;
  onAlertClick?: (alertId: string) => void;
}

export default function VerificationAlertBar({
  alert,
  branchY,
  timelineStart,
  timelineEnd,
  onResolveAlert,
  onAlertClick,
}: VerificationAlertBarProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Parse dates - handle missing data gracefully
  const startDate = alert.startDate ? new Date(alert.startDate) : null;
  const endDate = alert.endDate ? new Date(alert.endDate) : null;

  console.log('🎨 VerificationAlertBar rendering:', {
    alertId: alert.id,
    property: alert.propertyAddress,
    startDateRaw: alert.startDate,
    endDateRaw: alert.endDate,
    startDateParsed: startDate,
    endDateParsed: endDate,
    isValidDates: !!(startDate && endDate),
  });

  // Skip rendering if we don't have valid dates
  if (!startDate || !endDate) {
    console.warn('⚠️ AlertBar: Missing dates', alert);
    return null;
  }

  // Calculate positions
  const startPos = dateToPosition(startDate, timelineStart, timelineEnd);
  const endPos = dateToPosition(endDate, timelineStart, timelineEnd);
  const width = endPos - startPos;

  console.log('📍 AlertBar position:', {
    alertId: alert.id,
    startPos,
    endPos,
    width,
    willRender: !(endPos < 0 || startPos > 100 || width < 0.1),
  });

  // Only render if the alert period is visible in current timeline view
  if (endPos < 0 || startPos > 100 || width < 0.1) {
    console.log('⏭️ AlertBar skipped (outside viewport):', alert.id);
    return null;
  }

  console.log('✅ AlertBar WILL RENDER:', alert.id);

  // Alert bar positioning - place it above the status bands
  const alertY = branchY + 8; // Position slightly above status bands
  const alertHeight = 10; // 10px thick (increased by 5px)
  const circleRadius = 10; // Circle radius for endpoints (like property branches)

  // Colors based on resolved state and severity
  const severityColors = {
    critical: '#DC2626', // Brighter red for critical
    warning: '#EF4444', // Slightly lighter red for warnings
    info: '#F87171', // Even lighter red for info
  };

  const resolvedColor = '#10B981'; // Green when resolved
  const alertColor = alert.resolved ? resolvedColor : severityColors[alert.severity || 'critical'];
  const isResolved = !!alert.resolved;

  // Center position for question mark icon
  const centerPos = startPos + width / 2;

  return (
    <g className="verification-alert-bar" style={{ isolation: 'isolate', zIndex: showTooltip ? 10000 : 1000 }}>
      {/* Pulsing glow effect - only when not resolved */}
      {!isResolved && (
        <motion.rect
          x={`${Math.max(0, startPos)}%`}
          y={alertY - 3}
          width={`${Math.min(100 - startPos, width)}%`}
          height={alertHeight + 6}
          fill={alertColor}
          opacity={0.4}
          rx={6}
          initial={{ opacity: 0.2 }}
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ pointerEvents: 'none', filter: 'blur(6px)' }}
        />
      )}

      {/* Main alert bar - flashing animation when not resolved, solid when resolved */}
      <motion.rect
        x={`${Math.max(0, startPos)}%`}
        y={alertY}
        width={`${Math.min(100 - startPos, width)}%`}
        height={alertHeight}
        fill={alertColor}
        opacity={0.9}
        rx={3}
        initial={{ opacity: 0.9 }}
        animate={isResolved ? {} : { opacity: [0.9, 1, 0.9] }}
        transition={isResolved ? {} : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          cursor: isResolved ? 'default' : 'pointer',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
        }}
        onMouseEnter={() => !isResolved && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (!isResolved && onAlertClick) {
            onAlertClick(alert.id);
            setShowTooltip(false);
          }
        }}
      />

      {/* Start circle endpoint - pulse only when not resolved */}
      {/* Glow layer for start circle */}
      {!isResolved && (
        <motion.circle
          cx={`${startPos}%`}
          cy={alertY + alertHeight / 2}
          r={circleRadius + 4}
          fill={alertColor}
          opacity={0.4}
          initial={{ scale: 1, opacity: 0.3 }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ pointerEvents: 'none', filter: 'blur(4px)' }}
        />
      )}
      {/* Main start circle */}
      <motion.circle
        cx={`${startPos}%`}
        cy={alertY + alertHeight / 2}
        r={circleRadius}
        fill={alertColor}
        opacity={1}
        initial={{ scale: 1 }}
        animate={isResolved ? {} : { scale: [1, 1.3, 1] }}
        transition={isResolved ? {} : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))',
        }}
      />
      {/* Inner highlight for start circle */}
      <motion.circle
        cx={`${startPos}%`}
        cy={alertY + alertHeight / 2}
        r={circleRadius * 0.4}
        fill="white"
        opacity={isResolved ? 0.5 : 0.7}
        initial={{ scale: 1 }}
        animate={isResolved ? {} : { scale: [1, 1.2, 1], opacity: [0.7, 0.9, 0.7] }}
        transition={isResolved ? {} : { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ pointerEvents: 'none' }}
      />

      {/* End circle endpoint - pulse only when not resolved */}
      {/* Glow layer for end circle */}
      {!isResolved && (
        <motion.circle
          cx={`${endPos}%`}
          cy={alertY + alertHeight / 2}
          r={circleRadius + 4}
          fill={alertColor}
          opacity={0.4}
          initial={{ scale: 1, opacity: 0.3 }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
          style={{ pointerEvents: 'none', filter: 'blur(4px)' }}
        />
      )}
      {/* Main end circle */}
      <motion.circle
        cx={`${endPos}%`}
        cy={alertY + alertHeight / 2}
        r={circleRadius}
        fill={alertColor}
        opacity={1}
        initial={{ scale: 1 }}
        animate={isResolved ? {} : { scale: [1, 1.3, 1] }}
        transition={isResolved ? {} : { duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
        style={{
          filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.4))',
        }}
      />
      {/* Inner highlight for end circle */}
      <motion.circle
        cx={`${endPos}%`}
        cy={alertY + alertHeight / 2}
        r={circleRadius * 0.4}
        fill="white"
        opacity={isResolved ? 0.5 : 0.7}
        initial={{ scale: 1 }}
        animate={isResolved ? {} : { scale: [1, 1.2, 1], opacity: [0.7, 0.9, 0.7] }}
        transition={isResolved ? {} : { duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
        style={{ pointerEvents: 'none' }}
      />

      {/* Icon centered above the bar - Question mark or Check mark */}
      {/* Always show the icon, even for tiny gaps */}
      <g
        className="alert-icon"
        style={{ cursor: isResolved ? 'default' : 'pointer' }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (!isResolved && onAlertClick) {
            onAlertClick(alert.id);
            setShowTooltip(false);
          }
        }}
      >
          {/* Glow layer for question mark - flashing continuously when not resolved */}
          {!isResolved && (
            <motion.circle
              cx={`${centerPos}%`}
              cy={alertY - 15}
              r={14}
              fill={alertColor}
              opacity={0.5}
              initial={{ scale: 1, opacity: 0.3 }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ pointerEvents: 'none', filter: 'blur(5px)' }}
            />
          )}

          {/* Icon background circle - flash continuously until resolved */}
          <motion.circle
            cx={`${centerPos}%`}
            cy={alertY - 15}
            r={12}
            fill={alertColor}
            opacity={0.95}
            initial={{ scale: 1, opacity: 0.95 }}
            whileHover={{
              scale: isResolved ? 1 : 1.3,
              opacity: isResolved ? 0.95 : 1,
            }}
            animate={isResolved ? { scale: [1, 1.2, 1] } : {
              scale: [1, 1.15, 1],
              opacity: [0.95, 1, 0.95]
            }}
            transition={isResolved ? { duration: 0.5 } : {
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            style={{
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
            }}
          />

          {/* Icon: Question mark or Check mark */}
          {isResolved ? (
            // Check mark (✓) when resolved
            <text
              x={`${centerPos}%`}
              y={alertY - 15}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[16px] font-bold fill-white"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              ✓
            </text>
          ) : (
            // Question mark (?) when not resolved - flash continuously
            <motion.text
              x={`${centerPos}%`}
              y={alertY - 15}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[16px] font-bold fill-white"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
              initial={{ opacity: 1 }}
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              ?
            </motion.text>
          )}

          {/* Tooltip - positioned to the left so question mark remains clickable */}
          <AnimatePresence>
            {showTooltip && (
              <foreignObject
                x={`${Math.max(5, Math.min(70, centerPos - 25))}%`}
                y={alertY - 80}
                width="220"
                height="70"
                style={{ overflow: 'visible', pointerEvents: 'none' }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className={`${
                    isResolved
                      ? 'bg-green-600 dark:bg-green-700'
                      : 'bg-slate-900 dark:bg-slate-100'
                  } ${
                    isResolved
                      ? 'text-white dark:text-white'
                      : 'text-white dark:text-slate-900'
                  } px-3 py-2 rounded-lg shadow-xl text-xs max-w-[200px] break-words`}
                  style={{
                    position: 'relative',
                    zIndex: 15000,
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                  }}
                >
                  {isResolved ? (
                    <>
                      <div className="font-semibold mb-1">✓ Resolved</div>
                      <div className="text-[11px] leading-tight">
                        {alert.userResponse || 'Issue has been resolved'}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-semibold mb-1">Verification Issue:</div>
                      <div className="text-[11px] leading-tight">
                        {alert.resolutionText}
                      </div>
                      <div className="text-[10px] mt-1 opacity-80">
                        Click to resolve
                      </div>
                    </>
                  )}
                  {/* Tooltip arrow */}
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 ${
                      isResolved
                        ? 'bg-green-600 dark:bg-green-700'
                        : 'bg-slate-900 dark:bg-slate-100'
                    } rotate-45`}
                    style={{ transform: 'translateX(-50%) rotate(45deg)' }}
                  />
                </motion.div>
              </foreignObject>
            )}
          </AnimatePresence>
        </g>

      {/* Property address label (show if bar is wide enough) */}
      {width > 8 && (
        <text
          x={`${startPos + width / 2}%`}
          y={alertY + alertHeight / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[11px] font-bold fill-white"
          style={{
            pointerEvents: 'none',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          {isResolved ? 'Resolved' : 'Alert'}
        </text>
      )}
    </g>
  );
}
