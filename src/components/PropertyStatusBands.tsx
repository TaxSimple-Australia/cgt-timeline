'use client';

import React from 'react';
import { TimelineEvent, calculateStatusPeriods, statusColors, PropertyStatus } from '@/store/timeline';
import { dateToPosition } from '@/lib/utils';

interface PropertyStatusBandsProps {
  events: TimelineEvent[];
  branchY: number;
  timelineStart: Date;
  timelineEnd: Date;
  propertyColor: string;
  propertyId: string;
  isHovered?: boolean;
  onHoverChange: (isHovered: boolean) => void;
  onBandClick: (propertyId: string, position: number, clientX: number, clientY: number) => void;
}

export default function PropertyStatusBands({
  events,
  branchY,
  timelineStart,
  timelineEnd,
  propertyColor,
  propertyId,
  isHovered = false,
  onHoverChange,
  onBandClick,
}: PropertyStatusBandsProps) {
  const statusPeriods = calculateStatusPeriods(events);
  const today = new Date();

  // Find the last position - for sold properties it's the sale, for unsold it's today
  const getLastPosition = () => {
    if (events.length === 0) return 0;

    // If there's a sale event, that's the absolute end
    const saleEvent = events.find(e => e.type === 'sale');
    if (saleEvent) {
      return dateToPosition(saleEvent.date, timelineStart, timelineEnd);
    }

    // For unsold properties, extend to today's position (unclamped)
    const today = new Date();
    return dateToPosition(today, timelineStart, timelineEnd);
  };

  const lastPos = getLastPosition();

  // Status labels for display
  const statusLabels: Record<PropertyStatus, string> = {
    ppr: 'Main Residence',
    rental: 'Rental',
    vacant: 'Vacant',
    construction: 'Construction',
    sold: 'Sold',
    living_in_rental: 'Living in Rental',
  };

  return (
    <g className="status-bands">
      {statusPeriods.map((period, index) => {
        const startPos = dateToPosition(period.startDate, timelineStart, timelineEnd);
        // If no end date, cap at last position (sale or today) instead of extending to 100%
        const rawEndPos = period.endDate
          ? dateToPosition(period.endDate, timelineStart, timelineEnd)
          : lastPos;
        const endPos = Math.min(rawEndPos, lastPos); // Never extend beyond last position

        const width = endPos - startPos;

        // Only render if the period is visible in current timeline view
        if (endPos < 0 || startPos > 100 || width < 0.1) return null;

        const color = statusColors[period.status];
        const bandY = branchY - 4; // Position at same level as branch line
        const bandHeight = 8;

        const hoveredBandY = isHovered ? bandY - 2 : bandY;
        const hoveredBandHeight = isHovered ? bandHeight + 4 : bandHeight;

        return (
          <g key={`status-${index}`}>
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

            {/* Status label (show if band is wide enough, but not for vacant) */}
            {width > 5 && period.status !== 'vacant' && (
              <text
                x={`${startPos + width / 2}%`}
                y={hoveredBandY + hoveredBandHeight / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className={isHovered ? "text-[13px] font-bold fill-slate-900 dark:fill-slate-100" : "text-[12px] font-bold fill-slate-900 dark:fill-slate-100"}
                style={{
                  pointerEvents: 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {statusLabels[period.status]}
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

            {/* End marker (if period has ended) */}
            {period.endDate && (
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
            )}
          </g>
        );
      })}
    </g>
  );
}
