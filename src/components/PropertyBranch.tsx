'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { Property, TimelineEvent, useTimelineStore } from '@/store/timeline';
import { useValidationStore } from '@/store/validation';
import EventCircle from './EventCircle';
import EventCardView from './EventCardView';
import PropertyStatusBands from './PropertyStatusBands';
import TimelineGap from './TimelineGap';
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
}: PropertyBranchProps) {
  const { eventDisplayMode, selectIssue, selectProperty, enableDragEvents, updateEvent } = useTimelineStore();
  const { getIssuesForProperty } = useValidationStore();
  const branchY = 100 + branchIndex * 120; // Vertical spacing between branches

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

  // Generate branch path
  const generateBranchPath = () => {
    if (eventsWithTiers.length === 0) return '';

    let path = `M 0,${branchY}`;

    eventsWithTiers.forEach((event, index) => {
      const x = `${event.calculatedPosition}%`;

      if (index === 0) {
        // Smooth curve to first event
        path += ` Q ${event.calculatedPosition / 2}%,${branchY} ${x},${branchY}`;
      } else {
        // Connect to next event
        path += ` L ${x},${branchY}`;
      }
    });

    // Extend to end
    path += ` L 100%,${branchY}`;

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

      {/* Gaps are now rendered globally in Timeline component */}

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
      {eventsWithTiers.map((event) => (
        eventDisplayMode === 'circle' ? (
          <EventCircle
            key={event.id}
            event={event}
            cx={`${event.calculatedPosition}%`}
            cy={branchY}
            color={event.color}
            onClick={() => onEventClick(event)}
            tier={event.tier}
            enableDrag={enableDragEvents}
            timelineStart={timelineStart}
            timelineEnd={timelineEnd}
            onUpdateEvent={updateEvent}
          />
        ) : (
          <EventCardView
            key={event.id}
            event={event}
            cx={`${event.calculatedPosition}%`}
            cy={branchY}
            color={event.color}
            onClick={() => onEventClick(event)}
            tier={event.tier}
            enableDrag={enableDragEvents}
            timelineStart={timelineStart}
            timelineEnd={timelineEnd}
            onUpdateEvent={updateEvent}
          />
        )
      ))}

      </g>
    </>
  );
}
