'use client';

import React from 'react';
import { Property, TimelineEvent, EventType } from '@/store/timeline';
import { format, differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import {
  Key,
  Home,
  DollarSign,
  LogIn,
  LogOut,
  Briefcase,
  XCircle,
  Hammer,
  RefreshCw,
  FileEdit,
  UserPlus,
  Users
} from 'lucide-react';

interface GanttChartViewProps {
  properties: Property[];
  events: TimelineEvent[];
  absoluteStart: Date;
  absoluteEnd: Date;
}

export default function GanttChartView({
  properties,
  events,
  absoluteStart,
  absoluteEnd,
}: GanttChartViewProps) {
  // Get icon for event type
  const getEventIcon = (eventType: EventType) => {
    const iconMap: Record<EventType, typeof Home> = {
      purchase: DollarSign,
      sale: DollarSign,
      move_in: LogIn,
      move_out: LogOut,
      rent_start: Briefcase,
      rent_end: XCircle,
      improvement: Hammer,
      refinance: RefreshCw,
      status_change: FileEdit,
      living_in_rental_start: Users,
      living_in_rental_end: UserPlus,
      custom: Home,
    };
    return iconMap[eventType] || Home;
  };

  // Calculate position as percentage
  const getDatePosition = (date: Date): number => {
    const totalRange = absoluteEnd.getTime() - absoluteStart.getTime();
    const offset = date.getTime() - absoluteStart.getTime();
    return (offset / totalRange) * 100;
  };

  // Generate date range markers (years or quarters based on timeline span)
  const generateDateMarkers = () => {
    const totalDays = differenceInDays(absoluteEnd, absoluteStart);
    const startYear = absoluteStart.getFullYear();
    const endYear = absoluteEnd.getFullYear();
    const yearSpan = endYear - startYear;

    // If span is less than 3 years, show quarters
    if (yearSpan < 3) {
      const markers = [];
      for (let year = startYear; year <= endYear; year++) {
        const quarters = [
          { label: `Q1 ${year}`, date: new Date(year, 0, 1) },
          { label: `Q2 ${year}`, date: new Date(year, 3, 1) },
          { label: `Q3 ${year}`, date: new Date(year, 6, 1) },
          { label: `Q4 ${year}`, date: new Date(year, 9, 1) },
        ];
        markers.push(...quarters);
      }
      return markers.filter(m => m.date >= absoluteStart && m.date <= absoluteEnd);
    }

    // Otherwise show years
    const markers = [];
    for (let year = startYear; year <= endYear; year++) {
      markers.push({
        label: `${year}`,
        date: new Date(year, 0, 1),
      });
    }
    return markers;
  };

  const dateMarkers = generateDateMarkers();

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

  const ROW_HEIGHT = 60;
  const HEADER_HEIGHT = 80;

  return (
    <div className="w-full h-full bg-white dark:bg-slate-900 rounded-lg">
      {/* Header */}
      <div className="px-8 py-4 border-b-2 border-slate-200 dark:border-slate-700">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
          Gantt Chart View
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Property ownership and event timeline
        </p>
      </div>

      {/* Gantt Chart */}
      <div className="relative overflow-x-auto">
        <div className="min-w-[1000px] p-8">
          {/* Timeline Header with Date Range Markers */}
          <div className="relative mb-4" style={{ height: `${HEADER_HEIGHT}px`, marginLeft: '250px' }}>
            {/* Date range labels */}
            <div className="relative h-full">
              {dateMarkers.map((marker) => {
                const position = getDatePosition(marker.date);
                return (
                  <div
                    key={marker.date.toISOString()}
                    className="absolute top-0"
                    style={{ left: `${position}%` }}
                  >
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300 -translate-x-1/2">
                      {marker.label}
                    </div>
                    {/* Vertical grid line */}
                    <div
                      className="absolute top-8 w-px bg-slate-200 dark:bg-slate-700 -translate-x-1/2"
                      style={{ height: `${properties.length * ROW_HEIGHT + 20}px` }}
                    />
                  </div>
                );
              })}
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
                  className="relative flex items-center border-b border-slate-100 dark:border-slate-800"
                  style={{ height: `${ROW_HEIGHT}px` }}
                >
                  {/* Task Label (Left side) */}
                  <div
                    className="absolute left-0 flex flex-col justify-center pr-4"
                    style={{ width: '250px' }}
                  >
                    <div
                      className="font-semibold text-sm truncate"
                      style={{ color: property.color }}
                    >
                      {property.name}
                    </div>
                    {property.address && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {property.address}
                      </div>
                    )}
                  </div>

                  {/* Timeline area */}
                  <div className="relative flex-1" style={{ marginLeft: '250px' }}>
                    {/* Property duration bar */}
                    <div
                      className="absolute h-8 shadow-md transition-all hover:shadow-lg cursor-pointer"
                      style={{
                        backgroundColor: property.color,
                        left: `${startPos}%`,
                        width: `${barWidth}%`,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        opacity: 0.8,
                        borderRadius: '10px',
                      }}
                      title={`${property.name}: ${format(propertyStart, 'MMM yyyy')} - ${format(propertyEnd, 'MMM yyyy')}`}
                    >
                      {/* Duration label inside bar if wide enough */}
                      {barWidth > 15 && (
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white dark:text-slate-900 px-2">
                          {format(propertyStart, 'MMM yyyy')} - {format(propertyEnd, 'MMM yyyy')}
                        </div>
                      )}
                    </div>

                    {/* Event markers with icons */}
                    {propertyEvents.map((event) => {
                      const eventPos = getDatePosition(event.date);
                      const EventIcon = getEventIcon(event.type);
                      return (
                        <div
                          key={event.id}
                          className="absolute w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 shadow-md cursor-pointer hover:scale-125 transition-transform z-10 flex items-center justify-center"
                          style={{
                            backgroundColor: event.color,
                            left: `${eventPos}%`,
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                          }}
                          title={`${event.title} - ${format(event.date, 'MMM dd, yyyy')}`}
                        >
                          <EventIcon className="w-3 h-3 text-white dark:text-slate-900" strokeWidth={2.5} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {properties.length === 0 && (
            <div className="text-center py-16 text-slate-400 dark:text-slate-600">
              <p className="text-lg font-semibold">No properties to display</p>
              <p className="text-sm mt-2">Add properties to see the Gantt chart</p>
            </div>
          )}

          {/* Legend/Key */}
          {properties.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-2 mb-3">
                <Key className="w-5 h-5 text-slate-600 dark:text-slate-400 mt-0.5" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Event Legend</h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                    <DollarSign className="w-3 h-3 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Purchase/Sale</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <LogIn className="w-3 h-3 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Move In</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <LogOut className="w-3 h-3 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Move Out</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                    <Briefcase className="w-3 h-3 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Rent Start</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                    <XCircle className="w-3 h-3 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Rent End</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center">
                    <Hammer className="w-3 h-3 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Improvement</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center">
                    <RefreshCw className="w-3 h-3 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Refinance</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-500 flex items-center justify-center">
                    <FileEdit className="w-3 h-3 text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Status Change</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
