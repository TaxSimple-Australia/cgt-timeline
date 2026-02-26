'use client';

import React from 'react';
import { Property, TimelineEvent, calculateStatusPeriods, statusColors, PropertyStatus } from '@/store/timeline';
import { format, differenceInDays, differenceInYears } from 'date-fns';

interface StatusPeriodsViewProps {
  properties: Property[];
  events: TimelineEvent[];
  absoluteStart: Date;
  absoluteEnd: Date;
}

export default function StatusPeriodsView({
  properties,
  events,
  absoluteStart,
  absoluteEnd,
}: StatusPeriodsViewProps) {
  // Status labels for display
  const statusLabels: Record<PropertyStatus, string> = {
    ppr: 'Main Residence',
    rental: 'Rental (Investment)',
    vacant: 'Vacant',
    construction: 'Construction',
    sold: 'Sold',
    subdivided: 'Subdivided',
    living_in_rental: 'Living in Rental',
  };

  // Calculate timeline span in years
  const timelineSpanYears = differenceInYears(absoluteEnd, absoluteStart);

  // Get total duration for a property (from first event to last event/today)
  const getPropertyTotalDuration = (property: Property, propertyEvents: TimelineEvent[]) => {
    const today = new Date();
    const firstDate = property.purchaseDate || propertyEvents[0]?.date || absoluteStart;

    // If sold, use sale date; otherwise use today
    const isSold = property.currentStatus === 'sold' || property.saleDate;
    const saleEvent = propertyEvents.find((e) => e.type === 'sale');
    const lastDate = isSold
      ? (property.saleDate || saleEvent?.date || today)
      : today;

    return differenceInDays(lastDate, firstDate);
  };

  return (
    <div className="w-full h-full">
      {/* Properties List */}
      <div className="overflow-y-auto p-8">
        {properties.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-slate-600">
            <p className="text-lg font-semibold">No properties to display</p>
            <p className="text-sm mt-2">Add properties to see status periods</p>
          </div>
        ) : (
          <div className="space-y-8">
            {properties.map((property) => {
              const propertyEvents = events.filter((e) => e.propertyId === property.id);
              const statusPeriods = calculateStatusPeriods(propertyEvents);
              const totalDuration = getPropertyTotalDuration(property, propertyEvents);

              // Separate parent and child properties
              const isChildLot = Boolean(property.parentPropertyId);

              return (
                <div
                  key={property.id}
                  className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border-2 border-slate-200 dark:border-slate-700"
                >
                  {/* Property Header */}
                  <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: property.color }}
                      />
                      <h4
                        className="text-xl font-bold"
                        style={{ color: property.color }}
                      >
                        {isChildLot ? (property.lotNumber || property.name) : property.name}
                      </h4>
                      {property.address && !isChildLot && (
                        <>
                          <span className="text-slate-400 dark:text-slate-500">•</span>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {property.address}
                          </p>
                        </>
                      )}
                    </div>
                    {property.lotSize && isChildLot && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 ml-7 mt-1">
                        Lot Size: {property.lotSize.toFixed(0)} sqm
                      </p>
                    )}
                  </div>

                  {/* Status Periods Bars */}
                  {statusPeriods.length > 0 ? (
                    <div className="space-y-4">
                      {/* Thin visual bar showing all periods (like reference) */}
                      <div className="relative">
                        {/* Date labels above the bar */}
                        <div className="relative h-6 mb-1">
                          {statusPeriods.map((period, index) => {
                            const periodStart = period.startDate;
                            const periodEnd = period.endDate || new Date();
                            const periodDays = differenceInDays(periodEnd, periodStart);
                            const percentage = totalDuration > 0 ? (periodDays / totalDuration) * 100 : 0;
                            const leftPosition = statusPeriods.slice(0, index).reduce((sum, p) => {
                              const pStart = p.startDate;
                              const pEnd = p.endDate || new Date();
                              const pDays = differenceInDays(pEnd, pStart);
                              return sum + (totalDuration > 0 ? (pDays / totalDuration) * 100 : 0);
                            }, 0);

                            // Always show first and last segments, only apply width threshold to middle segments
                            const isFirstSegment = index === 0;
                            const isLastSegment = index === statusPeriods.length - 1;
                            const shouldShow = isFirstSegment || isLastSegment || percentage >= 15;

                            if (!shouldShow) return null;

                            return (
                              <div
                                key={`label-${index}`}
                                className="absolute top-0 text-[10px] text-slate-300 dark:text-slate-400"
                                style={isLastSegment ? {
                                  right: 0,
                                } : {
                                  left: `${leftPosition}%`,
                                }}
                              >
                                <div className={`whitespace-nowrap ${isLastSegment ? 'text-right' : 'px-2'}`}>
                                  {format(periodStart, 'd MMM yyyy')} - {format(periodEnd, 'd MMM yyyy')}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* The bar itself */}
                        <div className="relative h-[30px] rounded-md overflow-hidden">
                          {statusPeriods.map((period, index) => {
                            const periodStart = period.startDate;
                            const periodEnd = period.endDate || new Date();
                            const periodDays = differenceInDays(periodEnd, periodStart);
                            const percentage = totalDuration > 0 ? (periodDays / totalDuration) * 100 : 0;

                            const color = statusColors[period.status];

                            return (
                              <div
                                key={index}
                                className="absolute top-0 bottom-0 flex items-center justify-center"
                                style={{
                                  left: `${statusPeriods.slice(0, index).reduce((sum, p) => {
                                    const pStart = p.startDate;
                                    const pEnd = p.endDate || new Date();
                                    const pDays = differenceInDays(pEnd, pStart);
                                    return sum + (totalDuration > 0 ? (pDays / totalDuration) * 100 : 0);
                                  }, 0)}%`,
                                  width: `${percentage}%`,
                                  backgroundColor: color,
                                }}
                              >
                                {percentage > 3 && (
                                  <span className="text-xs font-bold text-white px-1 truncate">
                                    {percentage.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Period Details - Horizontal layout like reference */}
                      <div className="flex flex-wrap gap-3">
                        {statusPeriods.map((period, index) => {
                          const periodStart = period.startDate;
                          const periodEnd = period.endDate || new Date();
                          const periodDays = differenceInDays(periodEnd, periodStart);
                          const percentage = totalDuration > 0 ? (periodDays / totalDuration) * 100 : 0;

                          const color = statusColors[period.status];
                          const label = statusLabels[period.status] || period.status;

                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 dark:bg-slate-700/50 rounded-lg border border-slate-700 dark:border-slate-600"
                            >
                              {/* Icon placeholder */}
                              <div
                                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: color + '33' }}
                              >
                                <div
                                  className="w-3 h-3 rounded-sm"
                                  style={{ backgroundColor: color }}
                                />
                              </div>

                              {/* Period info - single line */}
                              <div className="flex items-baseline gap-2 min-w-0">
                                <span
                                  className="font-bold text-sm"
                                  style={{ color }}
                                >
                                  {percentage.toFixed(1)}%
                                </span>
                                <span className="font-semibold text-sm text-slate-200 dark:text-slate-300">
                                  {label}
                                </span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                  ({periodDays.toLocaleString()}d)
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-600">
                      <p className="text-sm">No status periods available for this property</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
