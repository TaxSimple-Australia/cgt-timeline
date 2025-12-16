'use client';

import React from 'react';
import { Property, TimelineEvent } from '@/store/timeline';
import { format } from 'date-fns';

interface PhaseTimelineViewProps {
  properties: Property[];
  events: TimelineEvent[];
  absoluteStart: Date;
  absoluteEnd: Date;
}

export default function PhaseTimelineView({
  properties,
  events,
  absoluteStart,
  absoluteEnd,
}: PhaseTimelineViewProps) {
  // Calculate position as percentage
  const getDatePosition = (date: Date): number => {
    const totalRange = absoluteEnd.getTime() - absoluteStart.getTime();
    const offset = date.getTime() - absoluteStart.getTime();
    return (offset / totalRange) * 100;
  };

  // Group events by property
  const propertyData = properties.map(property => {
    const propertyEvents = events
      .filter(e => e.propertyId === property.id)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // For each event, create a bar
    const eventBars = propertyEvents.map((event, eventIndex) => {
      const startDate = event.date;
      // Create a visual duration (use next event or add 2 months)
      const nextEvent = propertyEvents[eventIndex + 1];
      const endDate = nextEvent
        ? nextEvent.date
        : new Date(startDate.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days later

      return {
        event,
        startDate,
        endDate,
        label: `${event.title}`,
      };
    });

    return {
      property,
      events: eventBars,
    };
  });

  const ROW_HEIGHT = 60;
  const PROPERTY_LABEL_WIDTH = 200;
  const BAR_HEIGHT = 36;

  // Generate date markers for bottom scale
  const generateDateMarkers = () => {
    const totalTime = absoluteEnd.getTime() - absoluteStart.getTime();
    const markers = [];

    // Calculate number of markers based on time span
    const yearsDiff = (absoluteEnd.getFullYear() - absoluteStart.getFullYear());
    const numMarkers = Math.min(Math.max(4, yearsDiff + 1), 8); // Between 4 and 8 markers

    for (let i = 0; i <= numMarkers; i++) {
      const position = (i / numMarkers) * 100;
      const timestamp = absoluteStart.getTime() + (i / numMarkers) * totalTime;
      const date = new Date(timestamp);
      markers.push({ position, date });
    }

    return markers;
  };

  const dateMarkers = generateDateMarkers();

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 rounded-lg overflow-auto">
      {/* Main Content */}
      <div className="relative min-w-[1200px] p-8">
        {/* Property Rows */}
        <div className="space-y-0">
          {propertyData.map(({ property, events: eventBars }) => {
            // Calculate row height based on number of events (for stacking)
            const maxOverlap = Math.max(1, Math.ceil(eventBars.length / 3));
            const rowHeight = ROW_HEIGHT + (maxOverlap - 1) * (BAR_HEIGHT + 8);

            return (
              <div
                key={property.id}
                className="relative flex items-start border-b border-gray-200 dark:border-gray-700"
                style={{ minHeight: `${rowHeight}px`, paddingTop: '16px', paddingBottom: '16px' }}
              >
                {/* Property Label (Left side) */}
                <div
                  className="absolute left-0 top-0 h-full flex flex-col justify-center pr-4 border-r border-gray-200 dark:border-gray-700"
                  style={{ width: `${PROPERTY_LABEL_WIDTH}px` }}
                >
                  <div className="font-bold text-sm truncate" style={{ color: property.color }}>
                    {property.name}
                  </div>
                  {property.address && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                      {property.address}
                    </div>
                  )}
                </div>

                {/* Timeline area */}
                <div
                  className="relative flex-1"
                  style={{ marginLeft: `${PROPERTY_LABEL_WIDTH}px`, minHeight: '50px' }}
                >
                  {/* Event bars and circles */}
                  {eventBars.map((item, itemIndex) => {
                    const startPos = getDatePosition(item.startDate);
                    const isPurchaseOrSale = item.event.type === 'purchase' || item.event.type === 'sale';

                    // Calculate vertical offset for stacking (stagger bars)
                    const verticalOffset = (itemIndex % 3) * (BAR_HEIGHT + 8);

                    // Render circles for purchase/sale
                    if (isPurchaseOrSale) {
                      const circleSize = 40;
                      return (
                        <div
                          key={`${item.event.id}-${itemIndex}`}
                          className="absolute rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer group flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${property.color} 0%, ${property.color}dd 100%)`,
                            left: `${startPos}%`,
                            width: `${circleSize}px`,
                            height: `${circleSize}px`,
                            top: `${verticalOffset}px`,
                            transform: 'translateX(-50%)',
                            opacity: 0.9,
                          }}
                          title={`${item.label} - ${format(item.startDate, 'MMM dd, yyyy')}`}
                        >
                          {/* Circle label */}
                          <div className="text-xs font-bold text-white">
                            {item.event.type === 'purchase' ? 'P' : 'S'}
                          </div>

                          {/* Hover glow */}
                          <div
                            className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{
                              boxShadow: `0 0 15px ${property.color}`,
                            }}
                          />
                        </div>
                      );
                    }

                    // Render bars for other events
                    const endPos = getDatePosition(item.endDate);
                    // Calculate minimum width based on label length (roughly 8px per character)
                    const minWidthForLabel = (item.label.length * 8) / 12; // Convert px to percentage estimate
                    const barWidth = Math.max(endPos - startPos, minWidthForLabel, 8); // Minimum width to fit label

                    return (
                      <div
                        key={`${item.event.id}-${itemIndex}`}
                        className="absolute rounded-md shadow-md hover:shadow-lg transition-all cursor-pointer group"
                        style={{
                          background: `linear-gradient(135deg, ${property.color} 0%, ${property.color}dd 100%)`,
                          left: `${startPos}%`,
                          width: `${barWidth}%`,
                          height: `${BAR_HEIGHT}px`,
                          top: `${verticalOffset}px`,
                          opacity: 0.9,
                        }}
                        title={`${item.label} - ${format(item.startDate, 'MMM dd, yyyy')}`}
                      >
                        {/* Bar label */}
                        <div className="absolute inset-0 flex items-center justify-start px-3 text-xs font-semibold text-white truncate">
                          {item.label}
                        </div>

                        {/* Hover glow */}
                        <div
                          className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{
                            boxShadow: `0 0 15px ${property.color}`,
                          }}
                        />
                      </div>
                    );
                  })}

                  {/* Empty state for property */}
                  {eventBars.length === 0 && (
                    <div className="text-xs text-gray-400 dark:text-gray-600 italic py-4">
                      No events for this property
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Date scale at bottom */}
        <div className="relative mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700" style={{ marginLeft: `${PROPERTY_LABEL_WIDTH}px` }}>
          {/* Date markers */}
          <div className="relative h-12">
            {dateMarkers.map((marker, idx) => (
              <div
                key={idx}
                className="absolute"
                style={{ left: `${marker.position}%`, transform: 'translateX(-50%)' }}
              >
                {/* Vertical tick mark */}
                <div className="absolute bottom-6 w-px h-4 bg-gray-400 dark:bg-gray-600" style={{ left: '50%', transform: 'translateX(-50%)' }} />
                {/* Date label */}
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {format(marker.date, 'MMM dd, yyyy')}
                </div>
              </div>
            ))}
            {/* Horizontal line */}
            <div className="absolute bottom-6 left-0 right-0 h-px bg-gray-300 dark:bg-gray-700" />
          </div>
        </div>

        {/* Empty state */}
        {properties.length === 0 && (
          <div className="text-center py-16 text-gray-600 dark:text-gray-400">
            <p className="text-lg font-semibold">No properties to display</p>
            <p className="text-sm mt-2">Add properties and events to see the phase timeline</p>
          </div>
        )}
      </div>
    </div>
  );
}
