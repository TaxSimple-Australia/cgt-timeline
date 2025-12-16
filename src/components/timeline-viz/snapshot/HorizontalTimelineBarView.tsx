'use client';

import React from 'react';
import { Property, TimelineEvent } from '@/store/timeline';
import { format } from 'date-fns';

interface HorizontalTimelineBarViewProps {
  properties: Property[];
  events: TimelineEvent[];
  absoluteStart: Date;
  absoluteEnd: Date;
}

export default function HorizontalTimelineBarView({
  properties,
  events,
  absoluteStart,
  absoluteEnd,
}: HorizontalTimelineBarViewProps) {
  // Calculate position as percentage
  const getDatePosition = (date: Date): number => {
    const totalRange = absoluteEnd.getTime() - absoluteStart.getTime();
    const offset = date.getTime() - absoluteStart.getTime();
    return (offset / totalRange) * 100;
  };


  // Group events by property and calculate duration bars
  const propertyRows = properties.map((property) => {
    const propertyEvents = events
      .filter((e) => e.propertyId === property.id)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Determine property start and end dates
    const propertyStart = property.purchaseDate || propertyEvents[0]?.date || absoluteStart;
    const isSold = property.currentStatus === 'sold' || property.saleDate;
    const saleEvent = propertyEvents.find((e) => e.type === 'sale');
    const propertyEnd = isSold
      ? (property.saleDate || saleEvent?.date || absoluteEnd)
      : absoluteEnd;

    return {
      property,
      propertyStart,
      propertyEnd,
      events: propertyEvents,
    };
  });

  const ROW_HEIGHT = 70;
  const HEADER_HEIGHT = 80;
  const LABEL_WIDTH = 200;

  return (
    <div className="w-full h-full bg-white dark:bg-gray-900 rounded-lg overflow-auto">
      {/* Main Content */}
      <div className="relative min-w-[1000px] p-8">
        {/* Timeline Header with Date Range */}
        <div
          className="relative mb-6"
          style={{ marginLeft: `${LABEL_WIDTH}px` }}
        >
          {/* Date range display */}
          <div className="flex items-center justify-center py-4 border-b-2 border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Timeline Range</div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {format(absoluteStart, 'MMMM dd, yyyy')} — {format(absoluteEnd, 'MMMM dd, yyyy')}
              </div>
            </div>
          </div>
        </div>

        {/* Property Rows */}
        <div className="space-y-0">
          {propertyRows.map(({ property, propertyStart, propertyEnd, events: propertyEvents }, index) => {
            const startPos = getDatePosition(propertyStart);
            const endPos = getDatePosition(propertyEnd);
            const barWidth = endPos - startPos;

            return (
              <div
                key={property.id}
                className="relative flex items-center"
                style={{ height: `${ROW_HEIGHT}px` }}
              >
                {/* Property Label (Left side) */}
                <div
                  className="absolute left-0 flex flex-col justify-center pr-4 z-10"
                  style={{ width: `${LABEL_WIDTH}px` }}
                >
                  <div className="font-bold text-sm truncate" style={{ color: property.color }}>
                    {property.name}
                  </div>
                  {property.address && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {property.address}
                    </div>
                  )}
                </div>

                {/* Timeline area */}
                <div
                  className="relative flex-1"
                  style={{ marginLeft: `${LABEL_WIDTH}px` }}
                >
                  {/* Property duration bar with gradient */}
                  <div
                    className="absolute h-10 shadow-lg transition-all hover:shadow-xl cursor-pointer group"
                    style={{
                      background: `linear-gradient(135deg, ${property.color} 0%, ${property.color}dd 100%)`,
                      left: `${startPos}%`,
                      width: `${barWidth}%`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      borderRadius: '6px',
                      opacity: 0.95,
                    }}
                    title={`${property.name}: ${format(propertyStart, 'MMM yyyy')} - ${format(propertyEnd, 'MMM yyyy')}`}
                  >
                    {/* Glossy overlay effect */}
                    <div
                      className="absolute inset-0 rounded-md opacity-30"
                      style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 100%)',
                      }}
                    />

                    {/* Duration label inside bar if wide enough */}
                    {barWidth > 12 && (
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white px-2">
                        {format(propertyStart, 'MMM yyyy')} - {format(propertyEnd, 'MMM yyyy')}
                      </div>
                    )}

                    {/* Hover effect - subtle glow */}
                    <div className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        boxShadow: `0 0 20px ${property.color}`,
                      }}
                    />
                  </div>

                  {/* Event markers on the bar */}
                  {propertyEvents.map((event) => {
                    const eventPos = getDatePosition(event.date);
                    return (
                      <div
                        key={event.id}
                        className="absolute w-3 h-12 bg-white/60 shadow-md cursor-pointer hover:bg-white hover:h-14 transition-all z-20"
                        style={{
                          left: `${eventPos}%`,
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          borderRadius: '2px',
                        }}
                        title={`${event.title} - ${format(event.date, 'MMM dd, yyyy')}`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {properties.length === 0 && (
          <div className="text-center py-16 text-gray-600 dark:text-gray-400">
            <p className="text-lg font-semibold">No properties to display</p>
            <p className="text-sm mt-2">Add properties to see the timeline</p>
          </div>
        )}
      </div>
    </div>
  );
}
