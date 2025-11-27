'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Property, TimelineEvent, useTimelineStore, statusColors, calculateStatusPeriods } from '@/store/timeline';
import { useValidationStore } from '@/store/validation';
import EventCircle from './EventCircle';
import EventCardView from './EventCardView';
import PropertyStatusBands from './PropertyStatusBands';
import TimelineGap from './TimelineGap';
import VerificationAlertBar from './VerificationAlertBar';
import { cn, dateToPosition } from '@/lib/utils';
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
  const { eventDisplayMode, positionedGaps, selectIssue, selectProperty, enableDragEvents, updateEvent, verificationAlerts, resolveVerificationAlert } = useTimelineStore();
  const { getIssuesForProperty } = useValidationStore();
  const branchY = 100 + branchIndex * 120; // Vertical spacing between branches

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
  if (positionedGaps.length > 0) {
    console.log('PropertyBranch:', property.name, 'ID:', property.id);
    console.log('Total gaps:', positionedGaps.length);
    console.log('Gaps for this property:', propertyGaps.length);
    console.log('Property gaps:', propertyGaps);
  }

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

  // Add synthetic status marker for unsold properties at today's date
  const addStatusMarkerIfNeeded = () => {
    const isSold = property.currentStatus === 'sold' || property.saleDate;
    if (isSold) return eventsWithOffsetsAndTiers;

    const today = new Date();
    const todayPosition = dateToPosition(today, timelineStart, timelineEnd);

    // Only add if today is visible in timeline
    if (todayPosition < 0 || todayPosition > 100) return eventsWithOffsetsAndTiers;

    const statusPeriods = calculateStatusPeriods(events);
    const currentStatusPeriod = statusPeriods.find(p => p.endDate === null);
    const currentStatus = currentStatusPeriod?.status || 'vacant';
    const statusColor = statusColors[currentStatus] || '#94a3b8';

    const statusMarker: any = {
      id: `status-marker-${property.id}`,
      propertyId: property.id,
      type: 'status_change' as any,
      title: 'Not Sold',
      description: currentStatus.replace('_', ' ').toUpperCase(),
      date: today,
      color: statusColor,
      position: todayPosition,
      calculatedPosition: todayPosition,
      isSyntheticStatusMarker: true,
      verticalOffset: 0,
      tier: 0,
      zIndex: 999,
    };

    return [...eventsWithOffsetsAndTiers, statusMarker];
  };

  const eventsToRender = addStatusMarkerIfNeeded();

  // Generate branch path
  const generateBranchPath = () => {
    if (eventsToRender.length === 0) return '';

    let path = `M 0,${branchY}`;

    eventsToRender.forEach((event, index) => {
      const x = `${event.calculatedPosition}%`;

      if (index === 0) {
        // Smooth curve to first event
        path += ` Q ${event.calculatedPosition / 2}%,${branchY} ${x},${branchY}`;
      } else {
        // Connect to next event
        path += ` L ${x},${branchY}`;
      }
    });

    // End at last event (sale or "Not Sold" marker) instead of extending to 100%
    // The path already ends at the last event after the forEach loop

    return path;
  };
  
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
      {hasIssues && (
        <>
          {/* Animated red glow */}
          <motion.path
            d={generateBranchPath()}
            fill="none"
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
            <motion.path
              d={generateBranchPath()}
              fill="none"
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

      {/* Branch Line - Visual only, non-interactive */}
      <motion.path
        d={generateBranchPath()}
        fill="none"
        stroke={hasIssues ? '#EF4444' : property.color}
        strokeWidth={isHovered ? 6 : (isSelected ? 4 : 3)}
        strokeLinecap="round"
        opacity={isHovered ? 1 : (isSelected ? 1 : 0.7)}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="drop-shadow-sm"
        style={{
          transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
          pointerEvents: 'none'
        }}
      />

      {/* Branch Label */}
      <foreignObject x="10" y={branchY - 30} width="300" height="60">
        <div className="flex items-center gap-2 group select-none">
          <div
            className={cn(
              "w-5 h-5 rounded-full transition-all cursor-pointer flex-shrink-0",
              isSelected && "ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500",
              "hover:ring-2 hover:ring-offset-1 hover:ring-slate-300 dark:hover:ring-slate-500",
              "hover:scale-110"
            )}
            style={{ backgroundColor: property.color }}
            onClick={handlePropertyClick}
            title={`Click to view ${property.name} details`}
          />
          <span className={cn(
            "font-semibold text-sm transition-all pointer-events-none truncate",
            isSelected
              ? "text-slate-900 dark:text-slate-100"
              : "text-slate-600 dark:text-slate-400"
          )}>
            {property.name}
          </span>
        </div>
      </foreignObject>

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
          onResolveAlert={resolveVerificationAlert}
          onAlertClick={onAlertClick}
        />
      ))}

      </g>
    </>
  );
}
