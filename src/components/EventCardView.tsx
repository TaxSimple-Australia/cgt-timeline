'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TimelineEvent, useTimelineStore } from '@/store/timeline';
import { positionToDate } from '@/lib/utils';
import {
  Home,
  DollarSign,
  TrendingUp,
  LogIn,
  LogOut,
  Wrench,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface EventCardViewProps {
  event: TimelineEvent;
  cx: string; // X position as percentage
  cy: number; // Y position
  color: string;
  onClick: () => void;
  tier?: number; // Vertical tier for positioning (0 = default, 1-3 = higher tiers)
  enableDrag?: boolean; // Enable drag functionality
  timelineStart?: Date; // Timeline start for date conversion
  timelineEnd?: Date; // Timeline end for date conversion
  onUpdateEvent?: (id: string, updates: Partial<TimelineEvent>) => void; // Update event callback
  isSyntheticStatusMarker?: boolean; // Whether this is a synthetic status marker
}

export default function EventCardView({
  event,
  cx,
  cy,
  color,
  onClick,
  tier = 0,
  enableDrag = false,
  timelineStart,
  timelineEnd,
  onUpdateEvent,
  isSyntheticStatusMarker = false
}: EventCardViewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<number | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const svgRef = useRef<SVGGElement>(null);
  const dragStartPosRef = useRef<number | null>(null);

  // Helper function to get display title for sale events
  const getDisplayTitle = (event: TimelineEvent): string => {
    if (event.type === 'sale') {
      // Handle case where title is exactly "sale" (case-insensitive)
      if (event.title.toLowerCase() === 'sale') {
        return 'sold';
      }
      // Handle case where title contains "Marginal tax rate:" (data needs migration)
      if (event.title.includes('Marginal tax rate:')) {
        return 'Sold';
      }
    }
    return event.title;
  };

  // Get AI feedback issues for this event
  const { timelineIssues, selectIssue } = useTimelineStore();
  const eventIssues = timelineIssues.filter(issue => issue.eventId === event.id);

  // Calculate card Y position based on tier
  // Use dynamic spacing that accounts for the tallest possible card
  const TIER_SPACING = 160; // Pixels between tiers (cards are dynamic height, max ~145px)
  const BASE_CARD_OFFSET = -50; // Base offset from branch center (place above branch)
  const cardY = cy + BASE_CARD_OFFSET + (tier * TIER_SPACING);

  // Determine icon based on event type
  const getEventIcon = () => {
    const iconClass = "w-5 h-5";
    switch (event.type) {
      case 'purchase':
        return <Home className={iconClass} />;
      case 'sale':
        return <TrendingUp className={iconClass} />;
      case 'move_in':
        return <LogIn className={iconClass} />;
      case 'move_out':
        return <LogOut className={iconClass} />;
      case 'rent_start':
      case 'rent_end':
        return <DollarSign className={iconClass} />;
      case 'improvement':
        return <Wrench className={iconClass} />;
      case 'refinance':
        return <RefreshCw className={iconClass} />;
      default:
        return <DollarSign className={iconClass} />;
    }
  };

  // Get event type label
  const getEventTypeLabel = () => {
    switch (event.type) {
      case 'purchase': return 'Purchase';
      case 'sale': return 'Sale';
      case 'move_in': return 'Move In';
      case 'move_out': return 'Move Out';
      case 'rent_start': return 'Rent Start';
      case 'rent_end': return 'Rent End';
      case 'improvement': return 'Improvement';
      case 'refinance': return 'Inherit';
      case 'status_change': return 'Status Change';
      default: return event.type;
    }
  };

  const hasAmount = event.amount !== undefined && event.amount > 0;
  const isPPR = event.isPPR === true;
  const hasPriceSplit = event.landPrice !== undefined || event.buildingPrice !== undefined;
  const hasDescription = !hasAmount && event.description && event.description.length > 0;

  // Calculate dynamic card height based on content
  const calculateCardHeight = () => {
    let height = 85; // Base height: header (32px) + title (20px) + date (18px) + padding (15px)

    // Add height for amount/price information
    if (hasAmount) {
      if (hasPriceSplit) {
        height += 50; // Land + Building + Total breakdown (3 lines with spacing)
      } else {
        height += 22; // Single amount line
      }
    }

    // Add height for description (when no amount)
    if (hasDescription) {
      height += 30; // Description text (2 lines max)
    }

    // Add height for hover indicator
    height += 14; // "Click to edit" text

    return height;
  };

  // Card dimensions - dynamic height, fixed width
  const cardWidth = 180;
  const cardHeight = calculateCardHeight();

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enableDrag || !timelineStart || !timelineEnd || !onUpdateEvent) return;

    e.stopPropagation();

    // Store starting mouse position but DON'T set isDragging yet
    const svgElement = svgRef.current?.ownerSVGElement;
    if (svgElement) {
      const rect = svgElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const position = (x / rect.width) * 100;
      dragStartPosRef.current = position;
    }

    // Set isDragging only after we detect movement
    setHasDragged(false);
  };

  useEffect(() => {
    // Only start listening if we have a drag start position
    if (dragStartPosRef.current === null) return;

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
        // Start dragging mode
        if (!isDragging) {
          setIsDragging(true);
        }
        setHasDragged(true);
      }

      if (isDragging) {
        setDragPosition(clampedPosition);
      }
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
  }, [isDragging, dragPosition, hasDragged, event.id, timelineStart, timelineEnd, onUpdateEvent, dragStartPosRef.current]);

  // Use drag position if dragging, otherwise use cx
  const displayCx = isDragging && dragPosition !== null ? `${dragPosition}%` : cx;

  // Store original parent and next sibling for cleanup
  const originalParentRef = React.useRef<Node | null>(null);
  const originalNextSiblingRef = React.useRef<Node | null>(null);

  // Re-order the element in DOM when hovered to bring it to front
  React.useEffect(() => {
    if (!svgRef.current) return;

    if (isHovered || isDragging) {
      // Store original position before moving (only first time)
      if (!originalParentRef.current) {
        originalParentRef.current = svgRef.current.parentNode;
        originalNextSiblingRef.current = svgRef.current.nextSibling;
      }

      // Find the root SVG element (go up the tree to find the main SVG container)
      let rootSvg = svgRef.current.ownerSVGElement;

      if (rootSvg) {
        // Move this element to the end of the SVG root (renders on top of ALL elements)
        rootSvg.appendChild(svgRef.current);
      }
    }

    // Cleanup: restore original position when component unmounts
    return () => {
      if (svgRef.current && originalParentRef.current) {
        try {
          // Restore to original position
          if (originalNextSiblingRef.current) {
            originalParentRef.current.insertBefore(svgRef.current, originalNextSiblingRef.current);
          } else {
            originalParentRef.current.appendChild(svgRef.current);
          }
        } catch (e) {
          // Silently catch if element was already removed
        }
      }
    };
  }, [isHovered, isDragging]);

  return (
    <g
      ref={svgRef}
      className={enableDrag ? "event-card-group cursor-grab" : "event-card-group cursor-pointer"}
      style={{ cursor: isDragging ? 'grabbing' : undefined }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        // Don't trigger onClick if we just finished dragging
        if (!isDragging && !hasDragged) {
          // Clear drag start position to prevent mouse tracking after click
          dragStartPosRef.current = null;
          onClick();
        }
      }}
    >
      {/* Connecting line from card to branch */}
      <line
        x1={displayCx}
        x2={displayCx}
        y1={cardY + cardHeight}
        y2={cy}
        stroke={color}
        strokeWidth="2"
        strokeDasharray="4,4"
        opacity={isHovered ? 0.8 : 0.6}
        className="pointer-events-none"
        style={{ transition: 'opacity 0.2s' }}
      />

      {/* Small circle marker on branch line */}
      <motion.circle
        cx={displayCx}
        cy={cy}
        r="6"
        fill={color}
        stroke="white"
        strokeWidth="2"
        initial={{ scale: 0 }}
        animate={{ scale: isHovered ? 1.3 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
          opacity: isDragging ? 0.7 : 1,
        }}
      />

      {/* Warning Badge - Positioned at top-left of card */}
      {eventIssues.length > 0 && (
        <g
          transform={`translate(${displayCx}, ${cardY})`}
          onClick={(e) => {
            e.stopPropagation();
            selectIssue(eventIssues[0].id);
          }}
          className="cursor-pointer"
        >
          {/* Warning circle - offset to top-left corner of card */}
          <circle
            cx={-cardWidth / 2 + 12}
            cy={12}
            r="12"
            fill={eventIssues.some(i => i.severity === 'critical') ? '#EF4444' : '#F59E0B'}
            stroke="white"
            strokeWidth="2"
            className="hover:opacity-90 transition-opacity"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
          />
          {/* Warning icon (exclamation mark) */}
          <text
            x={-cardWidth / 2 + 12}
            y={13}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="16"
            fontWeight="bold"
            fill="white"
          >
            !
          </text>
          {/* Badge count */}
          {eventIssues.length > 1 && (
            <g>
              <circle
                cx={-cardWidth / 2 + 20}
                cy={6}
                r="6"
                fill="white"
                stroke="#E5E7EB"
                strokeWidth="1"
              />
              <text
                x={-cardWidth / 2 + 20}
                y={9}
                textAnchor="middle"
                fontSize="9"
                fontWeight="bold"
                fill="#1F2937"
              >
                {eventIssues.length}
              </text>
            </g>
          )}
        </g>
      )}

      {/* Card Container */}
      <foreignObject
        x={displayCx}
        y={cardY}
        width={cardWidth}
        height={cardHeight}
        style={{
          overflow: 'visible',
          transform: `translateX(-${cardWidth / 2}px)`,
          opacity: isDragging ? 0.7 : 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{
            opacity: 1,
            scale: isHovered ? 1.05 : 1,
            y: 0
          }}
          transition={{
            duration: 0.3,
            scale: { type: 'spring', stiffness: 300, damping: 20 }
          }}
          className="relative w-full h-full"
        >
          {/* Glow effect on hover */}
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              className="absolute inset-0 rounded-xl blur-lg"
              style={{ backgroundColor: color }}
            />
          )}

          {/* Main Card */}
          <div
            className="relative bg-white dark:bg-slate-800 rounded-xl shadow-lg border-2 overflow-hidden h-full flex flex-col"
            style={{
              borderColor: color,
              borderStyle: isSyntheticStatusMarker ? 'dashed' : 'solid'
            }}
          >
            {/* Header with colored bar and icon */}
            <div
              className="flex items-center gap-2 px-2.5 py-1.5"
              style={{ backgroundColor: `${color}20` }}
            >
              <div
                className="p-1 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: color }}
              >
                <div className="text-white">
                  {getEventIcon()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">
                  {getEventTypeLabel()}
                </div>
              </div>
              {isPPR && (
                <div
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                  style={{
                    backgroundColor: '#10B98120',
                    color: '#10B981'
                  }}
                >
                  Main Res
                </div>
              )}
            </div>

            {/* Body */}
            <div className="flex-1 px-2.5 py-2 flex flex-col">
              {/* Title */}
              <div className="font-bold text-[13px] text-slate-900 dark:text-slate-100 truncate mb-1.5">
                {getDisplayTitle(event)}
              </div>

              {/* Date */}
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mb-2">
                {format(new Date(event.date), 'MMM dd, yyyy')}
              </div>

              {/* Amount - Show breakdown if land/building split exists */}
              {hasAmount && hasPriceSplit && (
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 flex justify-between items-center">
                    <span>Land:</span>
                    <span className="font-semibold">${(event.landPrice || 0).toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 flex justify-between items-center">
                    <span>Building:</span>
                    <span className="font-semibold">${(event.buildingPrice || 0).toLocaleString()}</span>
                  </div>
                  <div className="text-[11px] font-bold flex justify-between items-center pt-1 mt-1 border-t border-slate-200 dark:border-slate-600" style={{ color: color }}>
                    <span>Total:</span>
                    <span>${event.amount?.toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Regular amount (no breakdown) */}
              {hasAmount && !hasPriceSplit && (
                <div className="text-[13px] font-bold truncate" style={{ color: color }}>
                  ${event.amount?.toLocaleString()}
                </div>
              )}

              {/* Description snippet (if exists and no amount) */}
              {hasDescription && (
                <div className="text-[10px] text-slate-500 dark:text-slate-500 line-clamp-2">
                  {event.description}
                </div>
              )}

              {/* Spacer */}
              <div className="flex-1 min-h-[4px]" />

              {/* Hover indicator */}
              {isHovered && (
                <div className="text-[8px] text-slate-400 dark:text-slate-500 text-right">
                  Click to edit
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </foreignObject>
    </g>
  );
}
