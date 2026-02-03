'use client';

import React from 'react';
import { TimelineEvent, calculateStatusPeriods, statusColors, PropertyStatus, Property } from '@/store/timeline';
import { dateToPosition } from '@/lib/utils';

interface PropertyStatusBandsProps {
  events: TimelineEvent[];
  branchY: number;
  timelineStart: Date;
  timelineEnd: Date;
  propertyColor: string;
  propertyId: string;
  property: Property;
  isHovered?: boolean;
  onHoverChange: (isHovered: boolean) => void;
  onBandClick: (propertyId: string, position: number, clientX: number, clientY: number) => void;
  subdivisionDate?: Date;  // For parent properties that have been subdivided
}

export default function PropertyStatusBands({
  events,
  branchY,
  timelineStart,
  timelineEnd,
  propertyColor,
  propertyId,
  property,
  isHovered = false,
  onHoverChange,
  onBandClick,
  subdivisionDate,
}: PropertyStatusBandsProps) {
  const statusPeriods = calculateStatusPeriods(events);
  const today = new Date();

  // Calculate subdivision position for parent properties that have been subdivided
  const subdivisionPosition = subdivisionDate
    ? dateToPosition(subdivisionDate, timelineStart, timelineEnd)
    : null;

  // For subdivided child properties, calculate minimum start position
  const isChildLot = Boolean(property.parentPropertyId);
  const subdivisionStartPos = isChildLot && property.subdivisionDate
    ? dateToPosition(property.subdivisionDate, timelineStart, timelineEnd)
    : null;

  // Find the last position - for sold properties it's the sale, for unsold it matches "Not Sold" marker
  const getLastPosition = () => {
    // Check if property is sold
    const saleEvent = events.find(e => e.type === 'sale');
    if (saleEvent) {
      return dateToPosition(saleEvent.date, timelineStart, timelineEnd);
    }

    // For unsold properties, match "Not Sold" marker positioning logic from PropertyBranch.tsx
    // Position is max(today, lastEventDate + 1 year)
    const today = new Date();
    const lastEvent = events.length > 0
      ? events.reduce((latest, e) => e.date > latest.date ? e : latest)
      : null;
    const lastEventDate = lastEvent ? new Date(lastEvent.date) : today;

    // Add 1 year to last event date (same as PropertyBranch.tsx lines 391-399)
    const markerDate = new Date(lastEventDate);
    markerDate.setFullYear(markerDate.getFullYear() + 1);

    // Use the later of today or markerDate
    const endDate = today > markerDate ? today : markerDate;

    return dateToPosition(endDate, timelineStart, timelineEnd);
  };

  const lastPos = getLastPosition();

  // Status labels for display
  const statusLabels: Record<PropertyStatus, string> = {
    ppr: 'Living',
    rental: 'Rental',
    vacant: 'Vacant',
    construction: 'Construction',
    sold: 'Sold',
    subdivided: 'Subdivided',
    living_in_rental: 'Living in Rental',
  };

  // Helper to render a single status band segment
  const renderStatusBand = (
    startPos: number,
    endPos: number,
    status: PropertyStatus,
    key: string
  ) => {
    const width = endPos - startPos;

    // Only render if the segment is visible in current timeline view
    if (endPos < 0 || startPos > 100 || width < 0.1) return null;

    const color = statusColors[status];
    const bandY = branchY - 4;
    const bandHeight = 8;
    const hoveredBandY = isHovered ? bandY - 2 : bandY;
    const hoveredBandHeight = isHovered ? bandHeight + 4 : bandHeight;

    return (
      <g key={key}>
        {/* Glow effect when hovered */}
        {isHovered && (
          <rect
            x={`${startPos}%`}
            y={hoveredBandY - 2}
            width={`${width}%`}
            height={hoveredBandHeight + 4}
            fill={color}
            opacity={0.3}
            rx={4}
            filter="blur(4px)"
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Interactive Status band - always visible */}
        <rect
          x={`${startPos}%`}
          y={hoveredBandY}
          width={`${width}%`}
          height={hoveredBandHeight}
          fill={color}
          opacity={isHovered ? 0.95 : 0.4}
          rx={2}
          style={{
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            filter: isHovered ? 'brightness(1.2)' : 'none'
          }}
          onMouseEnter={() => onHoverChange(true)}
          onMouseLeave={() => onHoverChange(false)}
          onClick={(e) => {
            e.stopPropagation();
            const svgElement = e.currentTarget.ownerSVGElement;
            if (!svgElement) return;
            const rect = svgElement.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const position = (x / rect.width) * 100;
            onBandClick(propertyId, position, e.clientX, e.clientY);
          }}
        />

        {/* Status label (show if band is wide enough) */}
        {width > 2 && (
          <text
            x={`${startPos + width / 2}%`}
            y={hoveredBandY - 12}
            textAnchor="middle"
            dominantBaseline="middle"
            className={isHovered ? "text-[13px] font-bold fill-slate-900 dark:fill-slate-100" : "text-[12px] font-bold fill-slate-900 dark:fill-slate-100"}
            style={{
              pointerEvents: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {statusLabels[status]}
          </text>
        )}

        {/* Start marker */}
        <line
          x1={`${startPos}%`}
          x2={`${startPos}%`}
          y1={hoveredBandY}
          y2={hoveredBandY + hoveredBandHeight}
          stroke={color}
          strokeWidth={isHovered ? "2" : "1.5"}
          opacity={isHovered ? 1 : 0.8}
          style={{
            pointerEvents: 'none',
            transition: 'all 0.2s ease'
          }}
        />

        {/* End marker */}
        <line
          x1={`${endPos}%`}
          x2={`${endPos}%`}
          y1={hoveredBandY}
          y2={hoveredBandY + hoveredBandHeight}
          stroke={color}
          strokeWidth={isHovered ? "2" : "1.5"}
          opacity={isHovered ? 1 : 0.8}
          style={{
            pointerEvents: 'none',
            transition: 'all 0.2s ease'
          }}
        />
      </g>
    );
  };

  // Fallback for child lots with no status periods - render a default vacant band
  // This ensures child lots created from subdivision display a status band
  // from the subdivision date to today (or sale date)
  if (statusPeriods.length === 0 && isChildLot && subdivisionStartPos !== null) {
    return (
      <g className="status-bands">
        {renderStatusBand(subdivisionStartPos, lastPos, 'vacant', 'default-vacant-band')}
      </g>
    );
  }

  return (
    <g className="status-bands">
      {statusPeriods.map((period, index) => {
        let startPos = dateToPosition(period.startDate, timelineStart, timelineEnd);

        // For child lots, never render status bands before subdivision date
        if (subdivisionStartPos !== null && startPos < subdivisionStartPos) {
          startPos = subdivisionStartPos;
        }

        // If no end date, cap at last position (sale or today) instead of extending to 100%
        const rawEndPos = period.endDate
          ? dateToPosition(period.endDate, timelineStart, timelineEnd)
          : lastPos;
        const endPos = Math.min(rawEndPos, lastPos); // Never extend beyond last position

        const width = endPos - startPos;

        // Check if this period spans the subdivision date - if so, split into two bands
        if (subdivisionPosition !== null && startPos < subdivisionPosition && endPos > subdivisionPosition) {
          // Split the band at subdivision position
          return (
            <React.Fragment key={`status-${index}`}>
              {renderStatusBand(startPos, subdivisionPosition, period.status, `status-${index}-before`)}
              {renderStatusBand(subdivisionPosition, endPos, period.status, `status-${index}-after`)}
            </React.Fragment>
          );
        }

        // Render single band (no subdivision split)
        return renderStatusBand(startPos, endPos, period.status, `status-${index}`);
      })}
    </g>
  );
}
