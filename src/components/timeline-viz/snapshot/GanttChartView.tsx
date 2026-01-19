'use client';

import React from 'react';
import { Property, TimelineEvent, EventType } from '@/store/timeline';
import { format, differenceInDays, differenceInYears } from 'date-fns';
import {
  Home,
  DollarSign,
  LogIn,
  LogOut,
  Briefcase,
  XCircle,
  Hammer,
  RefreshCw,
  FileEdit,
  Building,
  Users,
  Split
} from 'lucide-react';

interface GanttChartViewProps {
  properties: Property[];
  events: TimelineEvent[];
  absoluteStart: Date;
  absoluteEnd: Date;
}

// Compression modes for different timeline spans
type CompressionMode = 'standard' | 'moderate' | 'heavy' | 'maximum';

interface CompressionConfig {
  mode: CompressionMode;
  rowHeight: number;
  headerHeight: number;
  barHeight: number;
  eventSize: number;
  showEventIcons: boolean;
  propertyNameSize: string;
  addressSize: string;
  dateMarkerSize: string;
  dateMarkerInterval: number; // Years between markers
  showDurationLabels: boolean;
  labelMargin: string; // Width for property labels
}

export default function GanttChartView({
  properties,
  events,
  absoluteStart,
  absoluteEnd,
}: GanttChartViewProps) {
  // Calculate earliest purchase date across all properties
  const calculateChartStartDate = (): Date => {
    if (properties.length === 0) return absoluteStart;

    const allDates: Date[] = [];

    // Collect all purchase dates from properties
    properties.forEach(p => {
      if (p.purchaseDate) {
        allDates.push(p.purchaseDate);
      }
    });

    // Collect all event dates
    events.forEach(e => {
      allDates.push(e.date);
    });

    // Return the earliest date found
    if (allDates.length > 0) {
      return new Date(Math.min(...allDates.map(d => d.getTime())));
    }

    return absoluteStart;
  };

  const chartStartDate = calculateChartStartDate();

  // Calculate latest end date across all properties
  const calculateChartEndDate = (): Date => {
    if (properties.length === 0) return absoluteEnd;

    // Find the latest end date from all properties
    const propertyEndDates: Date[] = [];

    properties.forEach((property) => {
      const propertyEvents = events.filter((e) => e.propertyId === property.id);
      const isSold = property.currentStatus === 'sold' || property.saleDate;
      const saleEvent = propertyEvents.find((e) => e.type === 'sale');

      if (isSold) {
        // If sold, use sale date
        const saleDate = property.saleDate || saleEvent?.date;
        if (saleDate) {
          propertyEndDates.push(saleDate);
        }
      } else {
        // If not sold, use the latest event date for this property
        if (propertyEvents.length > 0) {
          const latestEventDate = new Date(Math.max(...propertyEvents.map(e => e.date.getTime())));
          propertyEndDates.push(latestEventDate);
        }
      }
    });

    // If no dates found, fall back to absoluteEnd
    if (propertyEndDates.length === 0) {
      return absoluteEnd;
    }

    const maxDate = new Date(Math.max(...propertyEndDates.map(d => d.getTime())));
    return maxDate;
  };

  const chartEndDate = calculateChartEndDate();

  // Calculate timeline span in years
  const timelineSpanYears = differenceInYears(chartEndDate, chartStartDate);
  const propertyCount = properties.length;

  // Determine compression mode based on timeline span
  const getCompressionConfig = (): CompressionConfig => {
    // Short timeline (0-5 years) - Standard layout
    if (timelineSpanYears <= 5) {
      return {
        mode: 'standard',
        rowHeight: 60,
        headerHeight: 80,
        barHeight: 32,
        eventSize: 24,
        showEventIcons: true,
        propertyNameSize: 'text-sm',
        addressSize: 'text-xs',
        dateMarkerSize: 'text-sm',
        dateMarkerInterval: 1,
        showDurationLabels: true,
        labelMargin: '250px',
      };
    }

    // Medium timeline (5-20 years) - Moderate compression
    if (timelineSpanYears <= 20) {
      return {
        mode: 'moderate',
        rowHeight: 50,
        headerHeight: 70,
        barHeight: 24,
        eventSize: 20,
        showEventIcons: true,
        propertyNameSize: 'text-sm',
        addressSize: 'text-xs',
        dateMarkerSize: 'text-sm',
        dateMarkerInterval: 2,
        showDurationLabels: true,
        labelMargin: '220px',
      };
    }

    // Long timeline (20-50 years) - Heavy compression
    if (timelineSpanYears <= 50) {
      return {
        mode: 'heavy',
        rowHeight: 40,
        headerHeight: 60,
        barHeight: 20,
        eventSize: 12,
        showEventIcons: false,
        propertyNameSize: 'text-xs',
        addressSize: 'text-[10px]',
        dateMarkerSize: 'text-xs',
        dateMarkerInterval: 5,
        showDurationLabels: false,
        labelMargin: '200px',
      };
    }

    // Very long timeline (50+ years) - Maximum compression
    return {
      mode: 'maximum',
      rowHeight: 35,
      headerHeight: 50,
      barHeight: 16,
      eventSize: 8,
      showEventIcons: false,
      propertyNameSize: 'text-xs',
      addressSize: 'text-[9px]',
      dateMarkerSize: 'text-xs',
      dateMarkerInterval: 10,
      showDurationLabels: false,
      labelMargin: '180px',
    };
  };

  const config = getCompressionConfig();

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
      vacant_start: Building,
      vacant_end: Building,
      ownership_change: Users,
      subdivision: Split,
      living_in_rental_start: LogIn,
      living_in_rental_end: LogOut,
      custom: Home,
    };
    return iconMap[eventType] || Home;
  };

  // Calculate position as percentage using chartStartDate instead of absoluteStart
  const getDatePosition = (date: Date): number => {
    const totalRange = chartEndDate.getTime() - chartStartDate.getTime();
    const offset = date.getTime() - chartStartDate.getTime();
    return (offset / totalRange) * 100;
  };

  // Generate date range markers with adaptive intervals
  const generateDateMarkers = () => {
    const startYear = chartStartDate.getFullYear();
    const endYear = chartEndDate.getFullYear();
    const yearSpan = endYear - startYear;
    const interval = config.dateMarkerInterval;

    // For very short timelines (< 3 years), show quarters
    if (yearSpan < 3 && config.mode === 'standard') {
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
      return markers.filter(m => m.date >= chartStartDate && m.date <= chartEndDate);
    }

    // Otherwise show years with interval
    const markers = [];
    for (let year = startYear; year <= endYear; year += interval) {
      markers.push({
        label: `${year}`,
        date: new Date(year, 0, 1),
      });
    }

    // Always include the end year if not already included
    if ((endYear - startYear) % interval !== 0) {
      markers.push({
        label: `${endYear}`,
        date: new Date(endYear, 0, 1),
      });
    }

    return markers;
  };

  const dateMarkers = generateDateMarkers();

  // Calculate label tiers to prevent overlap
  const calculateLabelTiers = (propertyEvents: TimelineEvent[]) => {
    const sortedEvents = [...propertyEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
    const tiers = new Map<string, number>();
    const overlapThreshold = 8; // Position percentage threshold for overlap

    sortedEvents.forEach((event, index) => {
      const eventPos = getDatePosition(event.date);
      let tier = 0;

      for (let i = 0; i < index; i++) {
        const prevEvent = sortedEvents[i];
        const prevPos = getDatePosition(prevEvent.date);
        const prevTier = tiers.get(prevEvent.id) || 0;

        if (Math.abs(eventPos - prevPos) < overlapThreshold && tier === prevTier) {
          tier = prevTier + 1;
        }
      }
      tiers.set(event.id, tier);
    });

    return tiers;
  };

  // Group events by property and calculate duration bars
  // First, separate parent and child properties
  const parentProperties = properties.filter(p => !p.parentPropertyId);
  const childProperties = properties.filter(p => p.parentPropertyId);

  // Build property rows with parent-child ordering
  const propertyRows: Array<{
    property: Property;
    propertyStart: Date;
    propertyEnd: Date;
    events: TimelineEvent[];
    labelTiers: Map<string, number>;
    isChildLot: boolean;
    parentProperty?: Property;
  }> = [];

  parentProperties.forEach((parentProp) => {
    const propertyEvents = events
      .filter((e) => e.propertyId === parentProp.id)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Determine property start and end dates
    const propertyStart = parentProp.purchaseDate || propertyEvents[0]?.date || chartStartDate;
    const isSold = parentProp.currentStatus === 'sold' || parentProp.saleDate;
    const saleEvent = propertyEvents.find((e) => e.type === 'sale');
    const propertyEnd = isSold
      ? (parentProp.saleDate || saleEvent?.date || chartEndDate)
      : (propertyEvents.length > 0
          ? new Date(Math.max(...propertyEvents.map(e => e.date.getTime())))
          : chartEndDate);

    // Calculate label tiers for this property's events
    const labelTiers = calculateLabelTiers(propertyEvents);

    // Add parent row
    propertyRows.push({
      property: parentProp,
      propertyStart,
      propertyEnd,
      events: propertyEvents,
      labelTiers,
      isChildLot: false,
    });

    // Add child lot rows immediately after parent
    const children = childProperties.filter(c => c.parentPropertyId === parentProp.id);
    children.forEach((childProp) => {
      const childEvents = events
        .filter((e) => e.propertyId === childProp.id)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      // Child lots start at subdivisionDate (which equals purchaseDate)
      const childStart = childProp.subdivisionDate || childProp.purchaseDate || chartStartDate;
      const childIsSold = childProp.currentStatus === 'sold' || childProp.saleDate;
      const childSaleEvent = childEvents.find((e) => e.type === 'sale');
      const childEnd = childIsSold
        ? (childProp.saleDate || childSaleEvent?.date || chartEndDate)
        : (childEvents.length > 0
            ? new Date(Math.max(...childEvents.map(e => e.date.getTime())))
            : chartEndDate);

      const childLabelTiers = calculateLabelTiers(childEvents);

      propertyRows.push({
        property: childProp,
        propertyStart: childStart,
        propertyEnd: childEnd,
        events: childEvents,
        labelTiers: childLabelTiers,
        isChildLot: true,
        parentProperty: parentProp,
      });
    });
  });

  // Format date based on compression mode
  const formatDateForMode = (date: Date): string => {
    switch (config.mode) {
      case 'standard':
        return format(date, 'MMM yyyy');
      case 'moderate':
        return format(date, 'MMM yy');
      case 'heavy':
      case 'maximum':
        return format(date, 'yyyy');
      default:
        return format(date, 'MMM yyyy');
    }
  };

  return (
    <div className="w-full h-full bg-white dark:bg-slate-900 rounded-lg">
      {/* Header */}
      <div className="px-8 py-4 border-b-2 border-slate-200 dark:border-slate-700">
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
          Simple Timeline View
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Property ownership and event timeline ({timelineSpanYears} years • {config.mode} compression)
        </p>
      </div>

      {/* Gantt Chart */}
      <div className="relative overflow-x-auto">
        <div className="min-w-[1000px] p-8">
          {/* Timeline Header with Date Range Markers */}
          <div className="relative mb-4" style={{ height: `${config.headerHeight}px`, marginLeft: config.labelMargin }}>
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
                    <div className={`${config.dateMarkerSize} font-bold text-slate-700 dark:text-slate-300 -translate-x-1/2`}>
                      {marker.label}
                    </div>
                    {/* Vertical grid line */}
                    <div
                      className="absolute top-8 w-px bg-slate-200 dark:bg-slate-700 -translate-x-1/2"
                      style={{ height: `${properties.length * config.rowHeight + 20}px` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Property Rows */}
          <div className="space-y-0">
            {propertyRows.map(({ property, propertyStart, propertyEnd, events: propertyEvents, labelTiers, isChildLot, parentProperty }, index) => {
              const startPos = getDatePosition(propertyStart);
              const endPos = getDatePosition(propertyEnd);
              const barWidth = endPos - startPos;

              // Calculate indentation for child lots
              const indentAmount = isChildLot ? 24 : 0;

              return (
                <div
                  key={property.id}
                  className="relative flex items-center border-b border-slate-100 dark:border-slate-800"
                  style={{ height: `${config.rowHeight}px` }}
                >
                  {/* Task Label (Left side) */}
                  <div
                    className="absolute left-0 flex flex-col justify-center pr-4"
                    style={{
                      width: config.labelMargin,
                      paddingLeft: `${indentAmount}px`
                    }}
                  >
                    {isChildLot ? (
                      // Child lot label: show lot number + size
                      <>
                        <div
                          className={`font-semibold ${config.propertyNameSize} truncate`}
                          style={{ color: property.color }}
                        >
                          {property.lotNumber || property.name}
                        </div>
                        {property.lotSize && config.mode !== 'maximum' && (
                          <div className={`${config.addressSize} text-slate-500 dark:text-slate-400 truncate`}>
                            {property.lotSize.toFixed(0)} sqm
                          </div>
                        )}
                      </>
                    ) : (
                      // Parent property label: show name + address
                      <>
                        <div
                          className={`font-semibold ${config.propertyNameSize} truncate`}
                          style={{ color: property.color }}
                        >
                          {property.name}
                        </div>
                        {property.address && config.mode !== 'maximum' && (
                          <div className={`${config.addressSize} text-slate-500 dark:text-slate-400 truncate`}>
                            {property.address}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Timeline area */}
                  <div className="relative flex-1" style={{ marginLeft: config.labelMargin }}>
                    {/* Connector line for child lots */}
                    {isChildLot && parentProperty && (
                      <svg
                        className="absolute pointer-events-none"
                        style={{
                          left: `${startPos}%`,
                          top: `-${config.rowHeight / 2}px`,
                          width: '2px',
                          height: `${config.rowHeight}px`,
                          transform: 'translateX(-1px)',
                          zIndex: 5,
                        }}
                      >
                        <line
                          x1="1"
                          y1="0"
                          x2="1"
                          y2={config.rowHeight}
                          stroke={property.color}
                          strokeWidth="2"
                          strokeDasharray="4,4"
                          opacity="0.5"
                        />
                      </svg>
                    )}

                    {/* Property duration bar */}
                    <div
                      className="absolute shadow-md transition-all hover:shadow-lg cursor-pointer"
                      style={{
                        backgroundColor: isChildLot ? `${property.color}CC` : property.color,
                        left: `${startPos}%`,
                        width: `${barWidth}%`,
                        height: `${config.barHeight}px`,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        opacity: isChildLot ? 0.9 : 0.8,
                        borderRadius: config.mode === 'maximum' ? '6px' : '10px',
                        borderLeft: isChildLot ? `4px solid ${property.color}` : 'none',
                      }}
                      title={`${property.lotNumber || property.name}: ${formatDateForMode(propertyStart)} - ${formatDateForMode(propertyEnd)}`}
                    >
                      {/* Duration label inside bar if wide enough and mode allows */}
                      {config.showDurationLabels && barWidth > 15 && (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white dark:text-slate-900 px-2">
                          {formatDateForMode(propertyStart)} - {formatDateForMode(propertyEnd)}
                        </div>
                      )}
                    </div>

                    {/* Event markers - simplified for compressed modes */}
                    {propertyEvents.map((event) => {
                      const eventPos = getDatePosition(event.date);
                      const EventIcon = getEventIcon(event.type);

                      // Determine label size based on compression mode
                      const labelFontSize = config.mode === 'maximum' ? 8 :
                                          config.mode === 'heavy' ? 9 :
                                          config.mode === 'moderate' ? 10 : 11;

                      // Get tier for stacking overlapping labels
                      const tier = labelTiers.get(event.id) || 0;
                      const tierSpacing = 18; // Vertical spacing between tiers
                      const baseLabelOffset = config.eventSize / 2 + 14; // Increased from 6 to 14 for more clearance
                      const labelOffset = baseLabelOffset + (tier * tierSpacing);

                      return (
                        <div
                          key={event.id}
                          className="absolute"
                          style={{
                            left: `${eventPos}%`,
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                          }}
                        >
                          {/* Event label above marker - stacked by tier */}
                          {/* Only show labels for purchase and sale events */}
                          {(event.type === 'purchase' || event.type === 'sale') && (
                            <div
                              className="absolute whitespace-nowrap text-center pointer-events-none"
                              style={{
                                left: '50%',
                                transform: 'translateX(-50%)',
                                bottom: `${labelOffset}px`,
                              }}
                            >
                              <div
                                className="px-1.5 py-0.5 rounded"
                                style={{
                                  fontSize: `${labelFontSize}px`,
                                  fontWeight: 600,
                                  color: '#ffffff',
                                  backgroundColor: event.color,
                                  lineHeight: '1.2',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                }}
                              >
                                {event.title}
                              </div>
                            </div>
                          )}

                          {/* Event marker circle */}
                          <div
                            className="rounded-full border-2 border-white dark:border-slate-900 shadow-md cursor-pointer hover:scale-125 transition-transform z-10"
                            style={{
                              backgroundColor: event.color,
                              width: `${config.eventSize}px`,
                              height: `${config.eventSize}px`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title={`${event.title} - ${format(event.date, 'MMM dd, yyyy')}`}
                          >
                            {/* Always show icons for middle events (no label), conditionally for purchase/sale */}
                            {(config.showEventIcons || (event.type !== 'purchase' && event.type !== 'sale')) && (
                              <EventIcon
                                className="text-white dark:text-slate-900"
                                style={{
                                  width: `${config.eventSize * 0.5}px`,
                                  height: `${config.eventSize * 0.5}px`,
                                  strokeWidth: 2.5
                                }}
                              />
                            )}
                          </div>
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
        </div>
      </div>
    </div>
  );
}
