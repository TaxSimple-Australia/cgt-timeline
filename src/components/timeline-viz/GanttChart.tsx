import React from 'react';
import { format, differenceInMonths, addMonths } from 'date-fns';
import { Property, TimelineEvent } from '@/store/timeline';
import { formatCurrency } from '@/lib/utils';

interface GanttChartProps {
  properties: Property[];
  events: TimelineEvent[];
}

export default function GanttChart({ properties, events }: GanttChartProps) {
  // Find min/max dates
  const allDates = events.map((e) => e.date.getTime());
  const minDate = new Date(Math.min(...allDates));
  const maxDate = new Date(Math.max(...allDates));
  const totalMonths = differenceInMonths(maxDate, minDate) || 1;

  const getPositionPercent = (date: Date): number => {
    const months = differenceInMonths(date, minDate);
    return (months / totalMonths) * 100;
  };

  const getPropertyPeriods = (property: Property) => {
    const propertyEvents = events
      .filter((e) => e.propertyId === property.id)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const purchaseEvent = propertyEvents.find((e) => e.type === 'purchase');
    const saleEvent = propertyEvents.find((e) => e.type === 'sale');
    const moveInEvent = propertyEvents.find((e) => e.type === 'move_in');
    const moveOutEvent = propertyEvents.find((e) => e.type === 'move_out');
    const rentStartEvent = propertyEvents.find((e) => e.type === 'rent_start');
    const rentEndEvent = propertyEvents.find((e) => e.type === 'rent_end');
    const improvementEvents = propertyEvents.filter((e) => e.type === 'improvement');

    const ownershipEnd = saleEvent?.date || maxDate;

    // Calculate cost base
    const purchasePrice = purchaseEvent?.amount || 0;
    const purchaseCostTotal =
      purchaseEvent?.costBases?.reduce((sum, cb) => sum + cb.amount, 0) || 0;
    const improvementTotal = improvementEvents.reduce(
      (sum, e) => sum + (e.amount || 0) + (e.costBases?.reduce((s, cb) => s + cb.amount, 0) || 0),
      0
    );

    return {
      purchaseEvent,
      saleEvent,
      moveInEvent,
      moveOutEvent,
      rentStartEvent,
      rentEndEvent,
      improvementEvents,
      ownershipEnd,
      totalCostBase: purchasePrice + purchaseCostTotal + improvementTotal,
    };
  };

  // Generate year markers
  const yearMarkers: Date[] = [];
  let currentYear = new Date(minDate.getFullYear(), 0, 1);
  while (currentYear <= maxDate) {
    if (currentYear >= minDate) {
      yearMarkers.push(new Date(currentYear));
    }
    currentYear = addMonths(currentYear, 12);
  }

  return (
    <div className="p-8 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gantt Chart View</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Project-style chart showing property ownership and occupancy periods
        </p>
      </div>

      {/* Timeline Header */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {/* Left: Property Names Column */}
          <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Property
            </div>
          </div>

          {/* Right: Timeline Grid */}
          <div className="flex-1 relative bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
            <div className="flex h-12 border-b border-gray-200 dark:border-gray-700">
              {yearMarkers.map((yearDate, idx) => {
                const pos = getPositionPercent(yearDate);
                return (
                  <div
                    key={idx}
                    className="absolute top-0 h-full border-l border-gray-300 dark:border-gray-600"
                    style={{ left: `${pos}%` }}
                  >
                    <div className="px-2 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {format(yearDate, 'yyyy')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Property Rows */}
        {properties.map((property, propIdx) => {
          const data = getPropertyPeriods(property);
          if (!data.purchaseEvent) return null;

          const ownershipStart = getPositionPercent(data.purchaseEvent.date);
          const ownershipEnd = getPositionPercent(data.ownershipEnd);
          const ownershipWidth = ownershipEnd - ownershipStart;

          return (
            <div
              key={property.id}
              className="flex border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              {/* Property Info */}
              <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {property.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {property.address.split(',')[0]}
                </div>
                <div className="space-y-1">
                  <div className="text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Purchase:</span>
                    <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(data.purchaseEvent.amount || 0)}
                    </span>
                  </div>
                  {data.saleEvent && (
                    <div className="text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Sale:</span>
                      <span className="ml-1 font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(data.saleEvent.amount || 0)}
                      </span>
                    </div>
                  )}
                  <div className="text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Cost Base:</span>
                    <span className="ml-1 font-medium text-blue-600 dark:text-blue-400">
                      {formatCurrency(data.totalCostBase)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Gantt Bars */}
              <div className="flex-1 relative p-4 min-h-[120px]">
                {/* Year grid lines */}
                {yearMarkers.map((yearDate, idx) => {
                  const pos = getPositionPercent(yearDate);
                  return (
                    <div
                      key={idx}
                      className="absolute top-0 h-full border-l border-gray-200 dark:border-gray-700"
                      style={{ left: `${pos}%` }}
                    ></div>
                  );
                })}

                {/* Ownership bar (background) */}
                <div
                  className="absolute top-4 h-6 bg-gray-300 dark:bg-gray-600 rounded shadow-sm"
                  style={{ left: `${ownershipStart}%`, width: `${ownershipWidth}%` }}
                  title={`Owned: ${format(data.purchaseEvent.date, 'MMM yyyy')} - ${format(
                    data.ownershipEnd,
                    'MMM yyyy'
                  )}`}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">
                    Ownership
                  </div>
                </div>

                {/* PPR bar */}
                {data.moveInEvent && (
                  <div
                    className="absolute top-12 h-5 bg-blue-500 dark:bg-blue-600 rounded shadow-md z-10"
                    style={{
                      left: `${getPositionPercent(data.moveInEvent.date)}%`,
                      width: `${
                        getPositionPercent(data.moveOutEvent?.date || data.ownershipEnd) -
                        getPositionPercent(data.moveInEvent.date)
                      }%`,
                    }}
                    title={`Main Residence: ${format(data.moveInEvent.date, 'MMM yyyy')} - ${format(
                      data.moveOutEvent?.date || data.ownershipEnd,
                      'MMM yyyy'
                    )}`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                      PPR
                    </div>
                  </div>
                )}

                {/* Rental bar */}
                {data.rentStartEvent && (
                  <div
                    className="absolute top-12 h-5 bg-purple-500 dark:bg-purple-600 rounded shadow-md z-10"
                    style={{
                      left: `${getPositionPercent(data.rentStartEvent.date)}%`,
                      width: `${
                        getPositionPercent(data.rentEndEvent?.date || data.ownershipEnd) -
                        getPositionPercent(data.rentStartEvent.date)
                      }%`,
                    }}
                    title={`Rental: ${format(data.rentStartEvent.date, 'MMM yyyy')} - ${format(
                      data.rentEndEvent?.date || data.ownershipEnd,
                      'MMM yyyy'
                    )}`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                      Rental
                    </div>
                  </div>
                )}

                {/* Improvement markers */}
                {data.improvementEvents.map((imp, idx) => {
                  const impPos = getPositionPercent(imp.date);
                  return (
                    <div
                      key={imp.id}
                      className="absolute top-20 w-3 h-3 bg-pink-500 dark:bg-pink-400 rounded-full shadow-md z-20"
                      style={{ left: `calc(${impPos}% - 6px)` }}
                      title={`${imp.description || 'Improvement'}: ${formatCurrency(
                        imp.amount || 0
                      )} on ${format(imp.date, 'MMM yyyy')}`}
                    >
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs font-medium text-pink-600 dark:text-pink-400 whitespace-nowrap">
                        {idx === 0 && '🔨'}
                      </div>
                    </div>
                  );
                })}

                {/* Purchase marker */}
                <div
                  className="absolute top-0 w-0.5 h-full bg-green-500 z-30"
                  style={{ left: `${ownershipStart}%` }}
                  title={`Purchase: ${format(data.purchaseEvent.date, 'dd MMM yyyy')}`}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-green-500 rounded-full"></div>
                </div>

                {/* Sale marker */}
                {data.saleEvent && (
                  <div
                    className="absolute top-0 w-0.5 h-full bg-red-500 z-30"
                    style={{ left: `${ownershipEnd}%` }}
                    title={`Sale: ${format(data.saleEvent.date, 'dd MMM yyyy')}`}
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Ownership Period</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Main Residence (PPR)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Rental Property</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Capital Improvement</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-4 bg-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Purchase</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-0.5 h-4 bg-red-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Sale</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
