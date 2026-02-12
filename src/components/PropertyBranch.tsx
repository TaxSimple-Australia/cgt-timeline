'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Split, ChevronDown, ChevronRight } from 'lucide-react';
import { Property, TimelineEvent, useTimelineStore, statusColors, calculateStatusPeriods } from '@/store/timeline';
import { useValidationStore } from '@/store/validation';
import EventCircle from './EventCircle';
import EventCardView from './EventCardView';
import PropertyStatusBands from './PropertyStatusBands';
import TimelineGap from './TimelineGap';
import VerificationAlertBar from './VerificationAlertBar';
import { cn, dateToPosition, calculateOverlapThreshold } from '@/lib/utils';
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
  onLotBadgeClick?: (lotId: string) => void;
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
  onLotBadgeClick,
}: PropertyBranchProps) {
  const { eventDisplayMode, positionedGaps, selectIssue, selectProperty, enableDragEvents, updateEvent, verificationAlerts, resolveVerificationAlert, properties, events: allEvents, collapsedSubdivisions, toggleSubdivisionCollapse } = useTimelineStore();
  const { getIssuesForProperty } = useValidationStore();
  const branchY = 100 + branchIndex * 100; // Vertical spacing between branches

  // Check if this property has been subdivided
  const hasBeenSubdivided = isSubdivided(property, properties);
  const childLots = hasBeenSubdivided ? getChildProperties(property.id!, properties) : [];
  // Get subdivision date from property OR from first child property (parent doesn't have subdivisionDate)
  const subdivisionDate = hasBeenSubdivided
    ? (getSubdivisionDate(property) || childLots[0]?.subdivisionDate || null)
    : null;
  const subdivisionPosition = subdivisionDate ? dateToPosition(subdivisionDate, timelineStart, timelineEnd) : null;

  // Check if this subdivision is collapsed
  const subdivisionGroup = property.subdivisionGroup || '';
  const isCollapsed = hasBeenSubdivided && subdivisionGroup && collapsedSubdivisions.includes(subdivisionGroup);

  // Get verification alerts for this property
  const propertyAlerts = verificationAlerts.filter(alert => alert.propertyId === property.id);

  // Handle property circle click to select property
  const handlePropertyClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering timeline click (QuickAddMenu)
    selectProperty(property.id);
  };

  // Handle toggle collapse/expand for subdivision
  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (subdivisionGroup) {
      toggleSubdivisionCollapse(subdivisionGroup);
    }
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

    // If clicking after subdivision point, redirect to Lot 1
    let targetPropertyId = property.id;
    if (hasBeenSubdivided && subdivisionPosition !== null && position > subdivisionPosition) {
      const lot1 = childLots.find(c => c.isMainLotContinuation);
      if (lot1) {
        targetPropertyId = lot1.id;
      }
    }

    onBranchClick(targetPropertyId, position, e.clientX, e.clientY);
  };

  // Wrapper for status band clicks - redirect to Lot 1 if clicking after subdivision
  const handleStatusBandClick = (propId: string, position: number, clientX: number, clientY: number) => {
    let targetPropertyId = propId;
    if (hasBeenSubdivided && subdivisionPosition !== null && position > subdivisionPosition) {
      const lot1 = childLots.find(c => c.isMainLotContinuation);
      if (lot1) {
        targetPropertyId = lot1.id;
      }
    }
    onBranchClick(targetPropertyId, position, clientX, clientY);
  };

  // Get gaps that apply to this property
  const propertyGaps = positionedGaps.filter(gap =>
    gap.propertyIds.includes(property.id)
  );

  // Get validation issues for this property
  const propertyIssues = getIssuesForProperty(property.name) || getIssuesForProperty(property.address);
  const hasIssues = propertyIssues && propertyIssues.length > 0;
  const criticalIssues = propertyIssues?.filter(issue => issue.severity === 'high' || issue.type === 'error') || [];

  // Calculate positions from dates for each event
  const eventsWithPositions = events.map(event => ({
    ...event,
    calculatedPosition: dateToPosition(event.date, timelineStart, timelineEnd)
  }));

  // Sort events by DATE (chronological order), with purchase events first when same date
  const sortedEvents = [...eventsWithPositions].sort((a, b) => {
    // Compare by date only (ignore time component) to properly handle same-day events
    const aDateOnly = new Date(a.date.getFullYear(), a.date.getMonth(), a.date.getDate()).getTime();
    const bDateOnly = new Date(b.date.getFullYear(), b.date.getMonth(), b.date.getDate()).getTime();
    const dateDiff = aDateOnly - bDateOnly;
    if (dateDiff !== 0) return dateDiff;
    // When same date, put purchase events first so mixed-use indicator ends at the next event
    if (a.type === 'purchase' && b.type !== 'purchase') return -1;
    if (b.type === 'purchase' && a.type !== 'purchase') return 1;
    // Same date and neither is purchase - sort by ID (creation order)
    return a.id.localeCompare(b.id);
  });

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

  // Helper to get date-only string for grouping same-day events
  const getDateKey = (date: Date) =>
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

  // Filter out status_change events with newStatus="vacant" BEFORE calculating offsets
  // This ensures remaining events don't get stacking offsets from hidden events
  // (data remains intact for backend purposes - status bands still show "Vacant" label)
  const eventsForRendering = eventsWithTiers.filter(event => {
    if (event.type === 'status_change' && (event as any).newStatus === 'vacant') {
      return false;
    }
    return true;
  });

  // Assign vertical offsets for overlapping circles
  const assignCircleVerticalOffsets = () => {
    // Calculate zoom-aware threshold based on timeline range
    // This adapts the overlap detection to the current zoom level
    const POSITION_THRESHOLD = calculateOverlapThreshold(timelineStart, timelineEnd, 40, 1200);
    const VERTICAL_OFFSET = 60; // Increased from 50px to 60px for better visual separation

    interface PositionGroup {
      position: number;
      events: Array<typeof eventsForRendering[0] & { verticalOffset: number; zIndex: number }>;
    }

    const positionGroups: PositionGroup[] = [];

    // Group events by date (same day) to ensure proper stacking of same-day events
    // This replaces pure position-based grouping which failed when events had different times
    eventsForRendering.forEach(event => {
      const eventDateKey = getDateKey(event.date);
      const existingGroup = positionGroups.find(group =>
        getDateKey(group.events[0].date) === eventDateKey
      );

      if (existingGroup) {
        // Add to existing group (same day)
        existingGroup.events.push({ ...event, verticalOffset: 0, zIndex: 0 });
      } else {
        // Create new group for this day
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
        // IMPORTANT: For vertically stacked events, reset tier to 0 so labels appear centered below
        group.events.forEach((event, index) => {
          event.verticalOffset = startOffset + (index * VERTICAL_OFFSET);
          event.zIndex = group.events.length - index; // Top event gets highest z-index
          event.tier = 0; // Force labels to appear centered below for stacked events
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
  const addStatusMarkerIfNeeded = (baseEvents: typeof eventsWithOffsetsAndTiers) => {
    // For subdivided properties, check if Lot 1 (main continuation) is sold
    // If not sold, show status marker based on Lot 1's status
    if (hasBeenSubdivided) {
      const lot1 = childLots.find(c => c.isMainLotContinuation);
      if (!lot1) return baseEvents;

      // Check if Lot 1 is sold
      const lot1Events = allEvents.filter(e => e.propertyId === lot1.id);
      const lot1HasSaleEvent = lot1Events.some(e => e.type === 'sale');
      const lot1IsSold = lot1.currentStatus === 'sold' || lot1.saleDate || lot1HasSaleEvent;

      if (lot1IsSold) return baseEvents;

      // Calculate today's position
      const todayPosition = getTodayPosition(timelineStart, timelineEnd);

      // Find the last event date - position marker 1 year after it
      const lastEvent = baseEvents.length > 0
        ? baseEvents.reduce((latest, e) => e.date > latest.date ? e : latest)
        : null;
      const lastEventDate = lastEvent ? new Date(lastEvent.date) : new Date();

      // Add 1 year to the last event date for marker position
      const markerDate = new Date(lastEventDate);
      markerDate.setFullYear(markerDate.getFullYear() + 1);

      // Use the later of: today's position OR marker date position
      const markerPosition = Math.max(
        todayPosition,
        dateToPosition(markerDate, timelineStart, timelineEnd)
      );

      // Only add if marker position is visible in timeline
      if (markerPosition < 0 || markerPosition > 100) return baseEvents;

      const today = new Date();
      const statusPeriods = calculateStatusPeriods(lot1Events);
      const currentStatusPeriod = statusPeriods.find(p => p.endDate === null);
      const currentStatus = currentStatusPeriod?.status || 'vacant';
      // Always use grey for "Not Sold" marker
      const statusColor = '#94a3b8';
      const clampedPosition = Math.max(0, Math.min(markerPosition, 100));

      const statusMarker: any = {
        id: `status-marker-${lot1.id}`,
        propertyId: lot1.id,
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

      return [...baseEvents, statusMarker];
    }

    // Check all possible indicators that property is sold
    const hasSaleEvent = events.some(e => e.type === 'sale');
    const isSold = property.currentStatus === 'sold' || property.saleDate || hasSaleEvent;
    if (isSold) return baseEvents;

    // Calculate today's position relative to current timeline bounds (unclamped)
    const todayPosition = getTodayPosition(timelineStart, timelineEnd);

    // Find the last event date - position marker 1 year after it
    const lastEvent = baseEvents.length > 0
      ? baseEvents.reduce((latest, e) => e.date > latest.date ? e : latest)
      : null;
    const lastEventDate = lastEvent ? new Date(lastEvent.date) : new Date();

    // Add 1 year to the last event date for marker position
    const markerDate = new Date(lastEventDate);
    markerDate.setFullYear(markerDate.getFullYear() + 1);

    // Use the later of: today's position OR marker date position
    const markerPosition = Math.max(
      todayPosition,
      dateToPosition(markerDate, timelineStart, timelineEnd)
    );

    // Only add if marker position is visible in timeline
    if (markerPosition < 0 || markerPosition > 100) return baseEvents;

    const today = new Date();

    const statusPeriods = calculateStatusPeriods(events);
    const currentStatusPeriod = statusPeriods.find(p => p.endDate === null);
    const currentStatus = currentStatusPeriod?.status || 'vacant';
    // Always use grey for "Not Sold" marker
    const statusColor = '#94a3b8';

    // Clamp position for rendering (marker must be within 0-100%)
    const clampedPosition = Math.max(0, Math.min(markerPosition, 100));

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

    return [...baseEvents, statusMarker];
  };

  const eventsToRender = addStatusMarkerIfNeeded(eventsWithOffsetsAndTiers);

  // Snap-aware wrapper: when an event is dropped near a sibling event on the
  // same property, snap to the sibling's exact date so same-day stacking works.
  const SNAP_THRESHOLD = 1.5; // percentage of timeline width
  const handleUpdateEventWithSnap = (id: string, updates: Partial<TimelineEvent>) => {
    if (updates.date) {
      const newPos = dateToPosition(updates.date, timelineStart, timelineEnd);
      for (const sibling of events) {
        if (sibling.id === id) continue;
        const siblingPos = dateToPosition(sibling.date, timelineStart, timelineEnd);
        if (Math.abs(newPos - siblingPos) < SNAP_THRESHOLD) {
          updates = { ...updates, date: sibling.date };
          break;
        }
      }
    }
    updateEvent(id, updates);
  };

  // Check if property has any events
  const hasEvents = events.length > 0;

  // Check if property is sold
  const isSold = property.currentStatus === 'sold' || property.saleDate || events.some(e => e.type === 'sale');

  // Calculate first and last event positions for the line
  const getLinePositions = () => {
    // For child lots, calculate the minimum start position based on subdivision date
    const isChildLot = Boolean(property.parentPropertyId);

    // Check if this is Lot 1 that continues the main property timeline
    const isMainLotContinuation = property.isMainLotContinuation === true;

    // Find subdivision event to get authoritative date (matches subdivision-helpers logic)
    // This ensures lot circles align perfectly with subdivision connector lines
    const subdivisionEvent = isChildLot && property.parentPropertyId
      ? allEvents.find(e =>
          e.propertyId === property.parentPropertyId &&
          e.type === 'subdivision'
        )
      : null;

    const subdivisionDateValue = subdivisionEvent?.date || property.subdivisionDate;

    // For Lot 1 (main continuation), start from first event position (like parent properties)
    // For other child lots, start from subdivision date
    const subdivisionStartPos = isChildLot && subdivisionDateValue && !isMainLotContinuation
      ? dateToPosition(
          subdivisionDateValue,
          timelineStart,
          timelineEnd
        )
      : 0;

    if (eventsWithTiers.length === 0) {
      // Empty property - show line from subdivision date (or start) to today
      const todayPos = getTodayPosition(timelineStart, timelineEnd);
      // Clamp to visible range for rendering
      const clampedTodayPos = Math.max(0, Math.min(todayPos, 100));

      // For subdivided parent properties, ensure line extends past subdivision to show Lot 1 badge
      if (hasBeenSubdivided && subdivisionPosition !== null && !isChildLot) {
        const lot1 = childLots.find(c => c.isMainLotContinuation);
        if (lot1) {
          const lot1Events = allEvents.filter(e => e.propertyId === lot1.id);
          const lot1IsSold = lot1.currentStatus === 'sold' || lot1.saleDate || lot1Events.some(e => e.type === 'sale');

          // If Lot 1 has no events and is not sold, extend line past subdivision so badge is visible
          if (lot1Events.length === 0 && !lot1IsSold) {
            // Extend to max of today or subdivision point + spacing for badge
            return {
              start: subdivisionStartPos,
              end: Math.max(subdivisionPosition + 5, clampedTodayPos),
              isEmpty: true
            };
          }
        }
      }

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

    // For subdivided parent properties, ensure line extends past subdivision to show Lot 1 badge
    if (hasBeenSubdivided && subdivisionPosition !== null && !isChildLot) {
      const lot1 = childLots.find(c => c.isMainLotContinuation);
      if (lot1) {
        const lot1Events = allEvents.filter(e => e.propertyId === lot1.id);
        const lot1IsSold = lot1.currentStatus === 'sold' || lot1.saleDate || lot1Events.some(e => e.type === 'sale');

        // If Lot 1 has no events and is not sold, extend line to today so badge is visible
        if (lot1Events.length === 0 && !lot1IsSold) {
          const todayPos = getTodayPosition(timelineStart, timelineEnd);
          const clampedTodayPos = Math.max(0, Math.min(todayPos, 100));

          // Extend to max of last event or today (minimum past subdivision point + spacing for badge)
          return {
            start: actualStartPos,
            end: Math.max(lastEventPos, subdivisionPosition + 5, clampedTodayPos),
            isEmpty: false
          };
        }
      }
    }

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
          onBandClick={handleStatusBandClick}
          subdivisionDate={subdivisionDate || undefined}
          eventsWithPositions={eventsWithOffsetsAndTiers}
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
            // Use allEvents instead of events prop because Timeline.tsx filters out the subdivision event
            // from parent property events (it filters events < subdivisionDate, excluding the event itself)
            const subdivisionEvent = allEvents.find(e =>
              e.propertyId === property.id &&
              e.type === 'subdivision'
            );

            // Calculate split position with multiple fallbacks and better date parsing
            let splitPos: number | null = null;

            if (subdivisionEvent) {
              splitPos = dateToPosition(subdivisionEvent.date, timelineStart, timelineEnd);
              console.log('📍 Subdivision via event:', { date: subdivisionEvent.date, splitPos });
            } else if (hasBeenSubdivided && subdivisionDate) {
              // Ensure subdivisionDate is a Date object (might be string when loaded)
              const parsedDate = subdivisionDate instanceof Date ? subdivisionDate : new Date(subdivisionDate);
              splitPos = dateToPosition(parsedDate, timelineStart, timelineEnd);
              console.log('📍 Subdivision via subdivisionDate:', { date: parsedDate, splitPos });
            } else if (hasBeenSubdivided && childLots.length > 0 && childLots[0]?.subdivisionDate) {
              // Final fallback to first child lot's subdivisionDate
              const childDate = childLots[0].subdivisionDate;
              const parsedDate = childDate instanceof Date ? childDate : new Date(childDate);
              splitPos = dateToPosition(parsedDate, timelineStart, timelineEnd);
              console.log('📍 Subdivision via childLot date:', { date: parsedDate, splitPos });
            }

            // Debug logging for subdivision state
            if (hasBeenSubdivided) {
              console.log('🔍 Subdivision debug:', {
                propertyId: property.id,
                propertyName: property.name,
                hasBeenSubdivided,
                splitPos,
                lineStart: linePositions.start,
                lineEnd: linePositions.end,
                childLotsCount: childLots.length,
                subdivisionDateExists: !!subdivisionDate,
                subdivisionEventExists: !!subdivisionEvent
              });
            }

            // If property has been subdivided - render circles regardless of line range
            // Removed position check (splitPos >= linePositions.start && splitPos <= linePositions.end)
            // to ensure circles always appear when subdivision exists
            if (hasBeenSubdivided && splitPos !== null) {
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
                  {/* Segment after subdivision - Lot 1's line (solid) */}
                  <motion.line
                    x1={`${splitPos}%`}
                    y1={branchY}
                    x2={`${linePositions.end}%`}
                    y2={branchY}
                    stroke={hasIssues ? '#EF4444' : (childLots.find(c => c.isMainLotContinuation)?.color || property.color)}
                    strokeWidth={isHovered ? 6 : (isSelected ? 4 : 3)}
                    strokeLinecap="round"
                    opacity={isHovered ? 1 : (isSelected ? 1 : 0.7)}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: "easeInOut", delay: 0.2 }}
                    className="drop-shadow-sm"
                    style={{
                      transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                      pointerEvents: 'none'
                    }}
                  />
                  {/* Subdivision event is now rendered via EventCircle (passed in events prop) */}
                  {/* Static purple circle removed - subdivision event is interactive */}
                  {/* Lot 1 label after subdivision point - on parent line */}
                  {(() => {
                    const lot1 = childLots.find(c => c.isMainLotContinuation);
                    if (!lot1) return null;
                    return (
                      <foreignObject
                        x={`${splitPos}%`}
                        y={branchY - 25}
                        width="80"
                        height="20"
                        style={{ overflow: 'visible', transform: 'translateX(20px)', pointerEvents: 'none' }}
                      >
                        <div
                          className="flex items-center justify-center text-gray-300 text-[10px] font-medium whitespace-nowrap cursor-pointer transition-all"
                          style={{ pointerEvents: 'auto' }}
                          onClick={(e) => {
                            console.log('🎯 Lot 1 badge clicked!', lot1.id);
                            e.stopPropagation();
                            if (onLotBadgeClick) onLotBadgeClick(lot1.id!);
                          }}
                        >
                          {lot1.lotNumber}
                          {(lot1.lotSize ?? 0) > 0 && ` • ${parseFloat((lot1.lotSize! / 10000).toFixed(4))} ha`}
                        </div>
                      </foreignObject>
                    );
                  })()}
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

      {/* Lot Start Label - Show for child properties */}
      {property.parentPropertyId && property.subdivisionDate && property.lotNumber && (
        <g>
          {/* Lot label - only show for non-main-continuation child lots (Lot 2, etc.) */}
          {!property.isMainLotContinuation && (
            <foreignObject
              x={`${dateToPosition(property.subdivisionDate, timelineStart, timelineEnd)}%`}
              y={branchY - 25}
              width="80"
              height="20"
              style={{ overflow: 'visible', transform: 'translateX(20px)', pointerEvents: 'none' }}
            >
              <div
                className="flex items-center justify-center text-gray-300 text-[10px] font-medium whitespace-nowrap cursor-pointer transition-all"
                style={{ pointerEvents: 'auto' }}
                onClick={(e) => {
                  console.log('🎯 Lot badge clicked!', property.id, property.lotNumber);
                  e.stopPropagation();
                  if (onLotBadgeClick) onLotBadgeClick(property.id!);
                }}
              >
                {property.lotNumber}
                {(property.lotSize ?? 0) > 0 && ` • ${parseFloat((property.lotSize! / 10000).toFixed(4))} ha`}
              </div>
            </foreignObject>
          )}
        </g>
      )}

      {/* Branch Label - Show for parent properties only (child lots show lot number labels) */}
      {!property.parentPropertyId && (
        <foreignObject x="10" y={branchY - 30} width="300" height={60 + (property.owners?.length ? property.owners.length * 16 : 0)} style={{ pointerEvents: 'none' }}>
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
                <div className="flex flex-col gap-0">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Owned by
                  </span>
                  {property.owners.map((o, i) => (
                    <span key={i} className="text-xs text-slate-400 dark:text-slate-500 pl-1">
                      {o.name} ({o.percentage}%)
                    </span>
                  ))}
                </div>
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
              y2={branchY + event.verticalOffset + (event.verticalOffset < 0 ? 14 : -14)}
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
              onUpdateEvent={handleUpdateEventWithSnap}
              isSyntheticStatusMarker={(event as any).isSyntheticStatusMarker}
              verticalOffset={event.verticalOffset}
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
              onUpdateEvent={handleUpdateEventWithSnap}
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

      {/* Collapse/Expand Toggle Button - for subdivided parent properties */}
      {hasBeenSubdivided && childLots.length > 0 && !property.parentPropertyId && (
        <foreignObject
          x="95%"
          y={branchY - 15}
          width="30"
          height="30"
          style={{ overflow: 'visible', pointerEvents: 'auto' }}
        >
          <button
            onClick={handleToggleCollapse}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 hover:border-pink-500 dark:hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-all shadow-sm"
            title={isCollapsed ? `Expand ${childLots.length} lots` : `Collapse ${childLots.length} lots`}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            )}
          </button>
        </foreignObject>
      )}

      </g>
    </>
  );
}
