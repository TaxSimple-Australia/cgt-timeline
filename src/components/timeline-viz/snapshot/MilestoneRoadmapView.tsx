'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Property, TimelineEvent, EventType } from '@/store/timeline';
import { format } from 'date-fns';

interface MilestoneRoadmapViewProps {
  properties: Property[];
  events: TimelineEvent[];
  absoluteStart: Date;
  absoluteEnd: Date;
}

// Event type to two-letter abbreviation mapping
const getEventAbbreviation = (eventType: EventType): string => {
  const abbreviations: Record<EventType, string> = {
    purchase: 'PU',
    sale: 'SA',
    improvement: 'IM',
    move_in: 'MI',
    move_out: 'MO',
    rent_start: 'RS',
    rent_end: 'RE',
    refinance: 'RF',
    status_change: 'SC',
    living_in_rental_start: 'LS',
    living_in_rental_end: 'LE',
    custom: 'CU',
  };
  return abbreviations[eventType] || 'EV';
};

const getEventTypeLabel = (eventType: EventType): string => {
  const labels: Record<EventType, string> = {
    purchase: 'Purchase',
    sale: 'Sale',
    improvement: 'Improvement',
    move_in: 'Move In',
    move_out: 'Move Out',
    rent_start: 'Rent Start',
    rent_end: 'Rent End',
    refinance: 'Refinance',
    status_change: 'Status Change',
    living_in_rental_start: 'Living In Rental Start',
    living_in_rental_end: 'Living In Rental End',
    custom: 'Custom Event',
  };
  return labels[eventType] || eventType;
};

export default function MilestoneRoadmapView({
  properties,
  events,
  absoluteStart,
  absoluteEnd,
}: MilestoneRoadmapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1400, height: 800 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width - 64,
          height: rect.height - 240, // More space for legend
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Group events by property
  const propertiesWithEvents = properties.map(property => {
    const propertyEvents = events
      .filter(e => e.propertyId === property.id)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      property,
      events: propertyEvents,
    };
  }).filter(p => p.events.length > 0);

  // Get unique event types for legend
  const uniqueEventTypes = Array.from(new Set(events.map(e => e.type)));

  if (propertiesWithEvents.length === 0) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center text-slate-400 dark:text-slate-600">
          <p className="text-lg font-semibold">No events to display</p>
          <p className="text-sm mt-2">Add events to see the milestone roadmap</p>
        </div>
      </div>
    );
  }

  const PROPERTY_LABEL_WIDTH = 220;
  const TIMELINE_START_X = 250;
  const PADDING = 20;
  const TIMELINE_WIDTH = dimensions.width - TIMELINE_START_X - PADDING;
  const AVAILABLE_HEIGHT = dimensions.height;
  const ROW_HEIGHT = Math.max(60, Math.floor(AVAILABLE_HEIGHT / propertiesWithEvents.length));
  const MARKER_SIZE = 14; // Circle radius

  const getDatePosition = (date: Date): number => {
    const totalRange = absoluteEnd.getTime() - absoluteStart.getTime();
    const offset = date.getTime() - absoluteStart.getTime();
    return TIMELINE_START_X + (offset / totalRange) * TIMELINE_WIDTH;
  };

  // Resolve overlaps by staggering vertically
  const resolveOverlaps = (positions: Array<{ event: TimelineEvent; x: number; y: number }>, baseY: number) => {
    const minSpacing = MARKER_SIZE * 3;
    const resolved = positions.map((pos, idx) => ({ ...pos, tier: 0 }));

    for (let i = 0; i < resolved.length; i++) {
      for (let j = i + 1; j < resolved.length; j++) {
        const distance = Math.abs(resolved[j].x - resolved[i].x);
        if (distance < minSpacing && resolved[i].tier === resolved[j].tier) {
          resolved[j].tier += 1;
        }
      }
    }

    const maxTier = Math.max(...resolved.map(r => r.tier), 0);
    const tierHeight = MARKER_SIZE * 2.5;
    const totalTierHeight = (maxTier + 1) * tierHeight;
    const startY = baseY - totalTierHeight / 2 + tierHeight / 2;

    return resolved.map(pos => ({
      ...pos,
      y: startY + pos.tier * tierHeight,
    }));
  };

  const svgHeight = propertiesWithEvents.length * ROW_HEIGHT + 20;

  // Render circle with two-letter abbreviation
  const renderEventMarker = (x: number, y: number, color: string, abbreviation: string) => {
    const size = MARKER_SIZE;

    return (
      <g>
        <circle cx={x} cy={y} r={size} fill={color} stroke="#ffffff" strokeWidth="2.5" />
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#ffffff"
          fontSize="10"
          fontWeight="bold"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {abbreviation}
        </text>
      </g>
    );
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-8 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 text-center mb-1">
          Milestone Roadmap
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          {propertiesWithEvents.length} {propertiesWithEvents.length === 1 ? 'property' : 'properties'} • {events.length} events
        </p>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 px-8 pt-6 pb-4 overflow-hidden flex items-center justify-center">
        <svg
          width={dimensions.width}
          height={svgHeight}
          viewBox={`0 0 ${dimensions.width} ${svgHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
          style={{ maxHeight: '100%', maxWidth: '100%' }}
        >
          {propertiesWithEvents.map((item, rowIndex) => {
            const yCenter = rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2 + 10;

            const initialPositions = item.events.map(event => ({
              event,
              x: getDatePosition(event.date),
              y: yCenter,
            }));

            const eventPositions = resolveOverlaps(initialPositions, yCenter);

            // Generate straight path
            let pathD = '';
            if (eventPositions.length > 0) {
              pathD = `M ${PROPERTY_LABEL_WIDTH + 20} ${yCenter}`;

              eventPositions.forEach((pos) => {
                pathD += ` L ${pos.x} ${pos.y}`;
              });
            }

            return (
              <g key={item.property.id}>
                {/* Property Label */}
                <foreignObject x={0} y={yCenter - 20} width={PROPERTY_LABEL_WIDTH} height={40}>
                  <div
                    className="h-full rounded-md shadow-md border-2 flex items-center justify-center px-3"
                    style={{
                      backgroundColor: item.property.color,
                      borderColor: item.property.color,
                    }}
                  >
                    <div className="text-xs font-bold text-white truncate" title={item.property.name}>
                      {item.property.name}
                    </div>
                  </div>
                </foreignObject>

                {/* Connection line */}
                {pathD && (
                  <path
                    d={pathD}
                    stroke={item.property.color}
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.3"
                  />
                )}

                {/* Event markers */}
                {eventPositions.map((pos) => (
                  <g key={pos.event.id} className="cursor-pointer">
                    <title>
                      {pos.event.title} - {format(pos.event.date, 'MMM dd, yyyy')}
                      {pos.event.amount ? ` - $${pos.event.amount.toLocaleString()}` : ''}
                    </title>
                    {renderEventMarker(pos.x, pos.y, item.property.color, getEventAbbreviation(pos.event.type))}
                  </g>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="px-8 pb-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0">
        <div className="grid grid-cols-2 gap-4 py-3">
          {/* Event Types Legend */}
          <div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Event Key</div>
            <div className="flex flex-wrap gap-3">
              {uniqueEventTypes.map(eventType => {
                const abbreviation = getEventAbbreviation(eventType);
                return (
                  <div key={eventType} className="flex items-center gap-1.5">
                    <svg width="20" height="20">
                      {renderEventMarker(10, 10, '#64748b', abbreviation)}
                    </svg>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {abbreviation} = {getEventTypeLabel(eventType)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Properties Legend */}
          <div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Properties</div>
            <div className="flex flex-wrap gap-3">
              {propertiesWithEvents.map(({ property }) => (
                <div key={property.id} className="flex items-center gap-1.5">
                  <div
                    className="w-4 h-4 rounded-sm border border-white"
                    style={{ backgroundColor: property.color }}
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 truncate" style={{ maxWidth: '150px' }}>
                    {property.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
