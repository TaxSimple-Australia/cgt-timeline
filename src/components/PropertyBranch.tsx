'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Split } from 'lucide-react';
import { Property, TimelineEvent, useTimelineStore, statusColors, calculateStatusPeriods } from '@/store/timeline';
import { useValidationStore } from '@/store/validation';
import EventCircle from './EventCircle';
import EventCardView from './EventCardView';
import PropertyStatusBands from './PropertyStatusBands';
import TimelineGap from './TimelineGap';
import VerificationAlertBar from './VerificationAlertBar';
import { cn, dateToPosition } from '@/lib/utils';
import { isSubdivided, getSubdivisionDate, getChildProperties } from '@/lib/subdivision-helpers';
import type { PositionedGap } from '@/types/ai-feedback';

interface PropertyBranchProps {
  property: Property;
  events: TimelineEvent[];
  branchIndex: number;
  onDragStart: (eventId: string) => void;
  isSelected: boolean;
  isHovered?: boolean;
  timelineStart: Date;
  timelineEnd: Date;
  onEventClick: (event: TimelineEvent) => void;
  onBranchClick: (propertyId: string, position: number, clientX: number, clientY: number) => void;
  onHoverChange: (isHovered: boolean) => void;
  onAlertClick?: (alertId: string) => void;
}

export default function PropertyBranch({
  property,
  events,
  branchIndex,
  onDragStart,
  isSelected,
  isHovered = false,
  timelineStart,
  timelineEnd,
  onEventClick,
  onBranchClick,
  onHoverChange,
  onAlertClick,
}: PropertyBranchProps) {
  const { eventDisplayMode, positionedGaps, selectIssue, selectProperty, enableDragEvents, updateEvent, verificationAlerts, resolveVerificationAlert, properties, events: allEvents } = useTimelineStore();
  const { getIssuesForProperty } = useValidationStore();
  const branchY = 100 + branchIndex * 120; // Vertical spacing between branches

  // Check if this property has been subdivided
  const hasBeenSubdivided = isSubdivided(property, properties);
  const childLots = hasBeenSubdivided ? getChildProperties(property.id!, properties) : [];
  // Get subdivision date from property OR from first child property (parent doesn't have subdivisionDate)
  const subdivisionDate = hasBeenSubdivided
    ? (getSubdivisionDate(property) || childLots[0]?.subdivisionDate || null)
    : null;
  const subdivisionPosition = subdivisionDate ? dateToPosition(subdivisionDate, timelineStart, timelineEnd) : null;

  // Get verification alerts for this property
  const propertyAlerts = verificationAlerts.filter(alert => alert.propertyId === property.id);

  // Debug logging
  if (verificationAlerts.length > 0) {
    console.log(`🔍 PropertyBranch [${property.name}]:`, {
      propertyId: property.id,
      totalAlerts: verificationAlerts.length,
      matchedAlerts: propertyAlerts.length,
      alerts: propertyAlerts,
    });
  }

  // Handle property circle click to select property
  const handlePropertyClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering timeline click (QuickAddMenu)
    selectProperty(property.id);
  };

  // Handle branch line click to add event
  const handleBranchLineClick = (e: React.MouseEvent<SVGPathElement>) => {
    e.stopPropagation(); // Prevent triggering timeline click

    // Get SVG element to calculate position
    const svgElement = e.currentTarget.ownerSVGElement;
    if (!svgElement) return;

    const rect = svgElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = (x / rect.width) * 100;

    onBranchClick(property.id, position, e.clientX, e.clientY);
  };

  // Get gaps that apply to this property
  const propertyGaps = positionedGaps.filter(gap =>
    gap.propertyIds.includes(property.id)
  );

  // Debug logging to help troubleshoot gap display
  console.log('🏠 PropertyBranch rendering:', {
    propertyName: property.name,
    propertyId: property.id,
    totalGapsInStore: positionedGaps.length,
    gapsForThisProperty: propertyGaps.length,
    propertyGaps: propertyGaps.map(g => ({
      id: g.id,
      start_date: g.start_date,
      end_date: g.end_date,
      duration_days: g.duration_days,
      propertyIds: g.propertyIds,
    })),
  });

  // Get validation issues for this property
  const propertyIssues = getIssuesForProperty(property.name) || getIssuesForProperty(property.address);
  const hasIssues = propertyIssues && propertyIssues.length > 0;
  const criticalIssues = propertyIssues?.filter(issue => issue.severity === 'high' || issue.type === 'error') || [];

  // Calculate positions from dates for each event
  const eventsWithPositions = events.map(event => ({
    ...event,
    calculatedPosition: dateToPosition(event.date, timelineStart, timelineEnd)
  }));

  // Sort events by DATE (chronological order)
  const sortedEvents = [...eventsWithPositions].sort((a, b) =>
    a.date.getTime() - b.date.getTime()
  );

  // Assign tiers to avoid label overlap
  const assignLabelTiers = () => {
    const LABEL_MIN_SPACING = 8; // Minimum horizontal spacing in percentage points
    const MAX_TIERS = 4; // Maximum number of tiers

    interface PlacedLabel {
      startPos: number;
      endPos: number;
      tier: number;
    }

    const placedLabels: PlacedLabel[] = [];

    return sortedEvents.map((event) => {
      // Estimate label width based on title length (rough approximation)
      const estimatedLabelWidth = Math.min(event.title.length * 0.5, 12); // in percentage points
      const startPos = event.calculatedPosition - estimatedLabelWidth / 2;
      const endPos = event.calculatedPosition + estimatedLabelWidth / 2;

      // Find the lowest tier where this label doesn't overlap with existing labels
      let assignedTier = 0;

      for (let tier = 0; tier < MAX_TIERS; tier++) {
        const labelsInTier = placedLabels.filter(l => l.tier === tier);

        // Check if there's overlap with any label in this tier
        const hasOverlap = labelsInTier.some(placed => {
          return !(endPos + LABEL_MIN_SPACING < placed.startPos ||
                   startPos - LABEL_MIN_SPACING > placed.endPos);
        });

        if (!hasOverlap) {
          assignedTier = tier;
          break;
        }
      }

      // Place the label
      placedLabels.push({ startPos, endPos, tier: assignedTier });

      return {
        ...event,
        tier: assignedTier
      };
    });
  };

  const eventsWithTiers = assignLabelTiers();

  // Assign vertical offsets for overlapping circles
  const assignCircleVerticalOffsets = () => {
    const POSITION_THRESHOLD = 2; // Events within 2% position are considered overlapping
    const VERTICAL_OFFSET = 50; // Pixels to offset each overlapping circle

    interface PositionGroup {
      position: number;
      events: Array<typeof eventsWithTiers[0] & { verticalOffset: number; zIndex: number }>;
    }

    const positionGroups: PositionGroup[] = [];

    // Group events by position (with threshold)
    eventsWithTiers.forEach(event => {
      const existingGroup = positionGroups.find(group =>
        Math.abs(group.position - event.calculatedPosition) < POSITION_THRESHOLD
      );

      if (existingGroup) {
        // Add to existing group
        existingGroup.events.push({ ...event, verticalOffset: 0, zIndex: 0 });
      } else {
        // Create new group
        positionGroups.push({
          position: event.calculatedPosition,
          events: [{ ...event, verticalOffset: 0, zIndex: 0 }]
        });
      }
    });

    // Assign vertical offsets within each group
    positionGroups.forEach(group => {
      if (group.events.length > 1) {
        // Calculate total height and start position
        const totalHeight = (group.events.length - 1) * VERTICAL_OFFSET;
        // Shift stack upward so upper events move higher to avoid overlap
        const startOffset = -(totalHeight * 0.65);

        // Assign offsets with upper events positioned higher
        // Also assign z-index: upper events (lower index) get higher z-index for proper layering
        group.events.forEach((event, index) => {
          event.verticalOffset = startOffset + (index * VERTICAL_OFFSET);
          event.zIndex = group.events.length - index; // Top event gets highest z-index
        });
      }
    });

    // Flatten back to single array
    return positionGroups.flatMap(group => group.events);
  };

  const eventsWithOffsetsAndTiers = assignCircleVerticalOffsets();

  // Helper function to get today's position (unclamped - can be outside 0-100%)
  const getTodayPosition = (start: Date, end: Date) => {
    const today = new Date();
    return dateToPosition(today, start, end);
  };

  // Add synthetic status marker for unsold properties at today's date
  const addStatusMarkerIfNeeded = () => {
    // If property has been subdivided, don't show any status marker
    // The property ceased to exist as a whole when subdivided
    if (hasBeenSubdivided) return eventsWithOffsetsAndTiers;

    // Check all possible indicators that property is sold
    const hasSaleEvent = events.some(e => e.type === 'sale');
    const isSold = property.currentStatus === 'sold' || property.saleDate || hasSaleEvent;
    if (isSold) return eventsWithOffsetsAndTiers;

    // Calculate today's position relative to current timeline bounds (unclamped)
    const todayPosition = getTodayPosition(timelineStart, timelineEnd);

    // Only add if today is visible in timeline
    if (todayPosition < 0 || todayPosition > 100) return eventsWithOffsetsAndTiers;

    const today = new Date();

    const statusPeriods = calculateStatusPeriods(events);
    const currentStatusPeriod = statusPeriods.find(p => p.endDate === null);
    const currentStatus = currentStatusPeriod?.status || 'vacant';
    const statusColor = statusColors[currentStatus] || '#94a3b8';

    // Clamp position for rendering (marker must be within 0-100%)
    const clampedPosition = Math.max(0, Math.min(todayPosition, 100));

    const statusMarker: any = {
      id: `status-marker-${property.id}`,
      propertyId: property.id,
      type: 'status_change' as any,
      title: 'Not Sold',
      description: currentStatus.replace('_', ' ').toUpperCase(),
      date: today,
      color: statusColor,
      position: clampedPosition,
      calculatedPosition: clampedPosition,
      isSyntheticStatusMarker: true,
      verticalOffset: 0,
      tier: 0,
      zIndex: 999,
    };

    return [...eventsWithOffsetsAndTiers, statusMarker];
  };

  const eventsToRender = addStatusMarkerIfNeeded();

  // Check if property has any events
  const hasEvents = events.length > 0;

  // Check if property is sold
  const isSold = property.currentStatus === 'sold' || property.saleDate || events.some(e => e.type === 'sale');

  // Calculate first and last event positions for the line
  const getLinePositions = () => {
    // For child lots, calculate the minimum start position based on subdivision date
    const isChildLot = Boolean(property.parentPropertyId);

    // Find subdivision event to get authoritative date (matches subdivision-helpers logic)
    // This ensures lot circles align perfectly with subdivision connector lines
    const subdivisionEvent = isChildLot && property.parentPropertyId
      ? allEvents.find(e =>
          e.propertyId === property.parentPropertyId &&
          e.type === 'subdivision'
        )
      : null;

    const subdivisionStartPos = isChildLot && (subdivisionEvent || property.subdivisionDate)
      ? dateToPosition(
          subdivisionEvent?.date || property.subdivisionDate,
          timelineStart,
          timelineEnd
        )
      : 0;

    if (eventsWithTiers.length === 0) {
      // Empty property - show line from subdivision date (or start) to today
      const todayPos = getTodayPosition(timelineStart, timelineEnd);
      // Clamp to visible range for rendering
      const clampedTodayPos = Math.max(0, Math.min(todayPos, 100));
      return {
        start: subdivisionStartPos, // Use actual subdivision position (may be negative)
        end: clampedTodayPos,
        isEmpty: true
      };
    }

    const positions = eventsWithTiers.map(e => e.calculatedPosition);
    const firstEventPos = Math.min(...positions);
    const lastEventPos = Math.max(...positions);

    // For child lots, use subdivision date; for parent properties, use first event
    const actualStartPos = isChildLot ? subdivisionStartPos : firstEventPos;

    // For unsold properties, extend to today's position (the "Not Sold" marker)
    if (!isSold) {
      const todayPos = getTodayPosition(timelineStart, timelineEnd);

      // Only extend to today if it's within or after the visible range
      // If today is before the visible range (todayPos < 0), end at last event
      if (todayPos < 0) {
        return {
          start: actualStartPos, // Use actualStartPos for child lots
          end: lastEventPos,
          isEmpty: false
        };
      }

      // If today is visible or after visible range, extend to today (clamped to 100% max)
      const clampedTodayPos = Math.min(todayPos, 100);
      return {
        start: actualStartPos, // Use actualStartPos for child lots
        end: Math.max(lastEventPos, clampedTodayPos),
        isEmpty: false
      };
    }

    // For sold properties, line ends at the last event (sale)
    return { start: actualStartPos, end: lastEventPos, isEmpty: false }; // Use actualStartPos for child lots
  };

  const linePositions = getLinePositions();

  return (
    <>
      <g className="property-branch">
        {/* Status Bands - Show Main Residence/Rental/Vacant periods */}
        <PropertyStatusBands
          events={events}
          branchY={branchY}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
          propertyColor={property.color}
          propertyId={property.id}
          property={property}
          isHovered={isHovered}
          onHoverChange={onHoverChange}
          onBandClick={onBranchClick}
        />

      {/* Timeline Gaps for this Property */}
      {propertyGaps.map((gap) => (
        <TimelineGap
          key={gap.id}
          gap={gap}
          timelineHeight={40} // Height of branch line area
          branchY={branchY}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
          property={property}
          onClick={() => {
            // Find and select the related issue
            const gapIssue = useTimelineStore.getState().timelineIssues.find(
              issue => issue.gapId === gap.id
            );
            if (gapIssue) {
              selectIssue(gapIssue.id);
            }
          }}
        />
      ))}

      {/* Warning Glow Effect for Properties with Issues */}
      {hasIssues && hasEvents && linePositions.start !== linePositions.end && (
        <>
          {/* Animated red glow */}
          <motion.line
            x1={`${linePositions.start}%`}
            y1={branchY}
            x2={`${linePositions.end}%`}
            y2={branchY}
            stroke="#EF4444"
            strokeWidth={12}
            strokeLinecap="round"
            opacity={0.3}
            filter="url(#glow)"
            initial={{ opacity: 0.1 }}
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          {/* Solid red underline for critical issues */}
          {criticalIssues.length > 0 && (
            <motion.line
              x1={`${linePositions.start}%`}
              y1={branchY}
              x2={`${linePositions.end}%`}
              y2={branchY}
              stroke="#DC2626"
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="5,5"
              opacity={0.8}
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: 10 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </>
      )}

      {/* Invisible hover target for the branch line */}
      {(hasEvents || linePositions.isEmpty) && linePositions.start !== linePositions.end && (
        <line
          x1={`${linePositions.start}%`}
          y1={branchY}
          x2={`${linePositions.end}%`}
          y2={branchY}
          stroke="transparent"
          strokeWidth={20}
          strokeLinecap="round"
          style={{ cursor: 'pointer' }}
          onClick={handleBranchLineClick}
          onMouseEnter={() => onHoverChange(true)}
          onMouseLeave={() => onHoverChange(false)}
        />
      )}

      {/* Branch Line - always visible */}
      {(hasEvents || linePositions.isEmpty) && linePositions.start !== linePositions.end && (
        <>
          {/* White glow effect on hover */}
          {isHovered && (
            <>
              <motion.line
                x1={`${linePositions.start}%`}
                y1={branchY}
                x2={`${linePositions.end}%`}
                y2={branchY}
                stroke="white"
                strokeWidth={16}
                strokeLinecap="round"
                opacity={0.6}
                filter="blur(8px)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.2 }}
                style={{ pointerEvents: 'none' }}
              />
              <motion.line
                x1={`${linePositions.start}%`}
                y1={branchY}
                x2={`${linePositions.end}%`}
                y2={branchY}
                stroke="white"
                strokeWidth={10}
                strokeLinecap="round"
                opacity={0.4}
                filter="blur(4px)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ duration: 0.2 }}
                style={{ pointerEvents: 'none' }}
              />
            </>
          )}
          {/* Main line - split into solid/dashed segments if subdivided */}
          {(() => {
            // Find subdivision event to get authoritative date
            const subdivisionEvent = events.find(e =>
              e.propertyId === property.id &&
              e.type === 'subdivision'
            );

            // Calculate split position from subdivision event OR from subdivisionDate
            // This ensures parent line is dashed after split even without explicit subdivision event
            const splitPos = subdivisionEvent
              ? dateToPosition(subdivisionEvent.date, timelineStart, timelineEnd)
              : (hasBeenSubdivided && subdivisionDate)
                ? dateToPosition(subdivisionDate, timelineStart, timelineEnd)
                : null;

            // If property has been subdivided and split is within line range
            if (hasBeenSubdivided && splitPos !== null && splitPos >= linePositions.start && splitPos <= linePositions.end) {
              return (
                <>
                  {/* Segment before subdivision - solid line */}
                  <motion.line
                    x1={`${linePositions.start}%`}
                    y1={branchY}
                    x2={`${splitPos}%`}
                    y2={branchY}
                    stroke={hasIssues ? '#EF4444' : property.color}
                    strokeWidth={isHovered ? 6 : (isSelected ? 4 : 3)}
                    strokeLinecap="round"
                    opacity={linePositions.isEmpty ? (isHovered ? 0.8 : 0.4) : (isHovered ? 1 : (isSelected ? 1 : 0.7))}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className="drop-shadow-sm"
                    style={{
                      transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                      pointerEvents: 'none'
                    }}
                  />
                  {/* Segment after subdivision - dashed line */}
                  <motion.line
                    x1={`${splitPos}%`}
                    y1={branchY}
                    x2={`${linePositions.end}%`}
                    y2={branchY}
                    stroke={hasIssues ? '#EF4444' : property.color}
                    strokeWidth={isHovered ? 6 : (isSelected ? 4 : 3)}
                    strokeLinecap="round"
                    strokeDasharray="12,8"
                    opacity={0.9}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: "easeInOut", delay: 0.2 }}
                    className="drop-shadow-sm"
                    style={{
                      transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                      pointerEvents: 'none'
                    }}
                  />
                  {/* Visual marker at subdivision point */}
                  <motion.circle
                    cx={`${splitPos}%`}
                    cy={branchY}
                    r="8"
                    fill="#9333EA"
                    stroke="#FFF"
                    strokeWidth="2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                  />
                </>
              );
            } else {
              // Normal solid line for non-subdivided or when split is outside range
              return (
                <motion.line
                  x1={`${linePositions.start}%`}
                  y1={branchY}
                  x2={`${linePositions.end}%`}
                  y2={branchY}
                  stroke={hasIssues ? '#EF4444' : property.color}
                  strokeWidth={isHovered ? 6 : (isSelected ? 4 : 3)}
                  strokeLinecap="round"
                  opacity={linePositions.isEmpty ? (isHovered ? 0.8 : 0.4) : (isHovered ? 1 : (isSelected ? 1 : 0.7))}
                  strokeDasharray={linePositions.isEmpty ? "4,4" : undefined}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                  className="drop-shadow-sm"
                  style={{
                    transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                    pointerEvents: 'none'
                  }}
                />
              );
            }
          })()}
        </>
      )}

      {/* Lot Start Label - Show for child properties at subdivision point */}
      {property.parentPropertyId && property.subdivisionDate && property.lotNumber && (
        <g>
          {/* Visual marker at subdivision start point */}
          <motion.circle
            cx={`${linePositions.start}%`}
            cy={branchY}
            r="6"
            fill={property.color}
            stroke="#FFF"
            strokeWidth="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
          />

          {/* Lot label above the timeline */}
          <foreignObject
            x={`${linePositions.start}%`}
            y={branchY - 50}
            width="140"
            height="30"
            style={{ overflow: 'visible', transform: 'translateX(-70px)' }}
          >
            <div
              className="flex items-center justify-center px-2.5 py-1 rounded-md text-white text-xs font-semibold shadow-lg whitespace-nowrap"
              style={{ backgroundColor: `${property.color}E6` }}
            >
              {property.lotNumber}
              {property.lotSize && ` • ${property.lotSize.toFixed(0)} sqm`}
            </div>
          </foreignObject>
        </g>
      )}

      {/* Branch Label - Hide for child lots */}
      {!property.parentPropertyId && (
        <foreignObject x="10" y={branchY - 30} width="300" height="60" style={{ pointerEvents: 'none' }}>
          <div className="flex items-center gap-2 group select-none">
            <div
              className={cn(
                "w-5 h-5 rounded-full transition-all cursor-pointer flex-shrink-0",
                isSelected && "ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500",
                "hover:ring-2 hover:ring-offset-1 hover:ring-slate-300 dark:hover:ring-slate-500",
                "hover:scale-110"
              )}
              style={{ backgroundColor: property.color, pointerEvents: 'auto' }}
              onClick={handlePropertyClick}
              title={`Click to view ${property.name} details`}
            />
            <div className="flex flex-col gap-0.5 pointer-events-none">
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "font-semibold text-sm transition-all truncate",
                  isSelected
                    ? "text-slate-900 dark:text-slate-100"
                    : "text-slate-600 dark:text-slate-400"
                )}>
                  {property.name}
                </span>
                {/* Show "Subdivided" badge for parent properties */}
                {hasBeenSubdivided && childLots.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
                    <Split className="w-3 h-3" />
                    {childLots.length} lots
                  </span>
                )}
              </div>
              {/* Show owner information if available */}
              {property.owners && property.owners.length > 0 && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Owned by: {property.owners.map(o => `${o.name} (${o.percentage}%)`).join(', ')}
                </span>
              )}
            </div>
          </div>
        </foreignObject>
      )}

      {/* Event Display - Circles or Cards based on mode */}
      {eventsToRender.map((event) => (
        <React.Fragment key={event.id}>
          {/* Connector line for stacked circles */}
          {event.verticalOffset !== 0 && eventDisplayMode === 'circle' && (
            <line
              x1={`${event.calculatedPosition}%`}
              y1={branchY}
              x2={`${event.calculatedPosition}%`}
              y2={branchY + event.verticalOffset}
              stroke={event.color}
              strokeWidth="2"
              strokeDasharray="4,3"
              opacity={0.4}
              className="pointer-events-none"
            />
          )}

          {eventDisplayMode === 'circle' ? (
            <EventCircle
              event={event}
              cx={`${event.calculatedPosition}%`}
              cy={branchY + event.verticalOffset}
              color={event.color}
              onClick={() => onEventClick(event)}
              tier={event.tier}
              zIndex={event.zIndex || 0}
              enableDrag={enableDragEvents && !(event as any).isSyntheticStatusMarker}
              timelineStart={timelineStart}
              timelineEnd={timelineEnd}
              onUpdateEvent={updateEvent}
              isSyntheticStatusMarker={(event as any).isSyntheticStatusMarker}
            />
          ) : (
            <EventCardView
              event={event}
              cx={`${event.calculatedPosition}%`}
              cy={branchY + event.verticalOffset}
              color={event.color}
              onClick={() => onEventClick(event)}
              tier={event.tier}
              enableDrag={enableDragEvents && !(event as any).isSyntheticStatusMarker}
              timelineStart={timelineStart}
              timelineEnd={timelineEnd}
              onUpdateEvent={updateEvent}
              isSyntheticStatusMarker={(event as any).isSyntheticStatusMarker}
            />
          )}
        </React.Fragment>
      ))}

      {/* Verification Alert Bars - Render LAST so they appear on top of everything */}
      {propertyAlerts.map((alert) => (
        <VerificationAlertBar
          key={alert.id}
          alert={alert}
          branchY={branchY}
          timelineStart={timelineStart}
          timelineEnd={timelineEnd}
          property={property}
          onResolveAlert={resolveVerificationAlert}
          onAlertClick={onAlertClick}
        />
      ))}

      </g>
    </>
  );
}
