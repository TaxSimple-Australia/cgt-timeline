'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TimelineEvent, useTimelineStore } from '@/store/timeline';
import { positionToDate } from '@/lib/utils';
import { Home, DollarSign, TrendingUp } from 'lucide-react';

interface EventCircleProps {
  event: TimelineEvent;
  cx: string; // X position as percentage
  cy: number; // Y position
  color: string;
  onClick: () => void;
  tier?: number; // Vertical tier for label positioning (0 = default, 1-3 = higher tiers)
  enableDrag?: boolean; // Enable drag functionality
  timelineStart?: Date; // Timeline start for date conversion
  timelineEnd?: Date; // Timeline end for date conversion
  onUpdateEvent?: (id: string, updates: Partial<TimelineEvent>) => void; // Update event callback
}

export default function EventCircle({ event, cx, cy, color, onClick, tier = 0, enableDrag = false, timelineStart, timelineEnd, onUpdateEvent }: EventCircleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<number | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const svgRef = useRef<SVGGElement>(null);
  const dragStartPosRef = useRef<number | null>(null);

  // Get AI feedback issues for this event
  const { timelineIssues, selectIssue } = useTimelineStore();
  const eventIssues = timelineIssues.filter(issue => issue.eventId === event.id);

  // Calculate label Y position based on tier
  // Each tier adds vertical space to avoid overlap
  const TIER_SPACING = 18; // Pixels between tiers
  const BASE_LABEL_OFFSET = 28; // Base offset from circle center
  const labelY = cy + BASE_LABEL_OFFSET + (tier * TIER_SPACING);

  // Determine icon based on event type
  const getEventIcon = () => {
    switch (event.type) {
      case 'purchase':
        return <Home className="w-3 h-3" />;
      case 'sale':
        return <TrendingUp className="w-3 h-3" />;
      case 'move_in':
      case 'move_out':
        return <Home className="w-3 h-3" />;
      default:
        return <DollarSign className="w-3 h-3" />;
    }
  };

  const hasAmount = event.amount !== undefined && event.amount > 0;
  const isPPR = event.isPPR === true;

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enableDrag || !timelineStart || !timelineEnd || !onUpdateEvent) return;

    e.stopPropagation();

    // Store starting mouse position
    const svgElement = svgRef.current?.ownerSVGElement;
    if (svgElement) {
      const rect = svgElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const position = (x / rect.width) * 100;
      dragStartPosRef.current = position;
    }

    setIsDragging(true);
    setHasDragged(false);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Find the parent SVG element to get its bounding rect
      const svgElement = svgRef.current?.ownerSVGElement;
      if (!svgElement || !timelineStart || !timelineEnd) return;

      const rect = svgElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const position = (x / rect.width) * 100;

      // Clamp position between 0 and 100
      const clampedPosition = Math.max(0, Math.min(100, position));

      // Check if we've actually moved (threshold: 0.5% of timeline width)
      if (dragStartPosRef.current !== null && Math.abs(clampedPosition - dragStartPosRef.current) > 0.5) {
        setHasDragged(true);
      }

      setDragPosition(clampedPosition);
    };

    const handleMouseUp = () => {
      if (dragPosition !== null && hasDragged && onUpdateEvent && timelineStart && timelineEnd) {
        // Convert position to date
        const newDate = positionToDate(dragPosition, timelineStart, timelineEnd);

        // Update the event
        onUpdateEvent(event.id, { date: newDate });
      }

      setIsDragging(false);
      setDragPosition(null);
      dragStartPosRef.current = null;

      // Clear hasDragged after a short delay to prevent click event
      if (hasDragged) {
        setTimeout(() => setHasDragged(false), 100);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragPosition, hasDragged, event.id, timelineStart, timelineEnd, onUpdateEvent]);

  // Use drag position if dragging, otherwise use cx
  const displayCx = isDragging && dragPosition !== null ? `${dragPosition}%` : cx;

  return (
    <g
      ref={svgRef}
      className={enableDrag ? "event-circle-group cursor-grab" : "event-circle-group cursor-pointer"}
      style={{ cursor: isDragging ? 'grabbing' : undefined }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        // Don't trigger onClick if we just finished dragging
        if (!isDragging && !hasDragged) {
          onClick();
        }
      }}
    >
      {/* Glow effect on hover */}
      {isHovered && (
        <motion.circle
          cx={displayCx}
          cy={cy}
          r="24"
          fill={color}
          opacity={0.2}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}

      {/* Main Residence indicator ring */}
      {isPPR && (
        <motion.circle
          cx={displayCx}
          cy={cy}
          r="20"
          fill="none"
          stroke="#10B981"
          strokeWidth="2.5"
          strokeDasharray="4,4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.8, scale: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Main event circle */}
      <motion.circle
        cx={displayCx}
        cy={cy}
        r="14"
        fill={color}
        stroke="white"
        strokeWidth="3"
        initial={{ scale: 0 }}
        animate={{ scale: isHovered ? 1.15 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))',
          opacity: isDragging ? 0.7 : 1,
        }}
      />

      {/* Amount indicator badge */}
      {hasAmount && (
        <motion.circle
          cx={displayCx}
          cy={cy}
          r="5"
          fill="white"
          stroke={color}
          strokeWidth="2"
          initial={{ scale: 0, x: 10, y: -10 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          style={{ transformOrigin: `${displayCx} ${cy}` }}
        />
      )}

      {/* Warning Badge */}
      {eventIssues.length > 0 && (
        <g
          onClick={(e) => {
            e.stopPropagation();
            selectIssue(eventIssues[0].id);
          }}
          className="cursor-pointer"
        >
          {/* Warning circle at top-left */}
          <g transform={`translate(${displayCx}, ${cy})`}>
            <circle
              cx="-12"
              cy="-12"
              r="8"
              fill={eventIssues.some(i => i.severity === 'critical') ? '#EF4444' : '#F59E0B'}
              stroke="white"
              strokeWidth="2"
              className="hover:opacity-90 transition-opacity"
              style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))' }}
            />
            {/* Warning icon */}
            <text
              x="-12"
              y="-10"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              fontWeight="bold"
              fill="white"
            >
              !
            </text>
            {/* Badge count */}
            {eventIssues.length > 1 && (
              <>
                <circle
                  cx="-6"
                  cy="-16"
                  r="5"
                  fill="white"
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
                <text
                  x="-6"
                  y="-14"
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="bold"
                  fill="#1F2937"
                >
                  {eventIssues.length}
                </text>
              </>
            )}
          </g>
        </g>
      )}

      {/* Hover tooltip */}
      {isHovered && !isDragging && (
        <foreignObject
          x={displayCx}
          y={cy - 50}
          width="160"
          height="80"
          style={{
            overflow: 'visible',
            pointerEvents: 'none',
            transform: 'translateX(-80px)'
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800 text-white px-3 py-2 rounded-lg shadow-xl text-xs"
          >
            <div className="font-semibold mb-1">{event.title}</div>
            <div className="text-slate-300 text-[10px]">
              {new Date(event.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            {hasAmount && (
              <div className="text-green-400 font-semibold mt-1">
                ${event.amount?.toLocaleString()}
              </div>
            )}
            {isPPR && (
              <div className="text-green-400 text-[10px] mt-1">
                ✓ Principal Residence
              </div>
            )}
            <div className="text-slate-400 text-[10px] mt-1">
              Click to edit
            </div>
          </motion.div>
        </foreignObject>
      )}

      {/* Connecting line from circle to label (if label is offset) */}
      {tier > 0 && (
        <line
          x1={displayCx}
          x2={displayCx}
          y1={cy + 14}
          y2={labelY - 8}
          stroke={color}
          strokeWidth="1"
          strokeDasharray="2,2"
          opacity={0.5}
          className="pointer-events-none"
        />
      )}

      {/* Label below circle (positioned based on tier) - Truncated with CSS */}
      <foreignObject
        x={displayCx}
        y={labelY - 10}
        width="100"
        height="20"
        style={{
          overflow: 'visible',
          pointerEvents: 'none',
          transform: 'translateX(-50px)'
        }}
      >
        <div
          className="text-xs font-semibold text-slate-900 dark:text-slate-100 text-center truncate px-1"
          style={{
            userSelect: 'none',
            maxWidth: '100px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
          title={event.title}
        >
          {event.title}
        </div>
      </foreignObject>
    </g>
  );
}
