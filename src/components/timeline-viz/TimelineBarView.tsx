import React from 'react';
import { format, differenceInMonths } from 'date-fns';
import { Property, TimelineEvent } from '@/store/timeline';
import { formatCurrency } from '@/lib/utils';
import {
  calculatePurchaseIncidentalCosts,
  calculateImprovementCosts,
  calculateSellingCosts,
  getPurchasePrice,
  getSalePrice,
  getDivision43Deductions,
} from '@/lib/cost-base-calculations';

interface TimelineBarViewProps {
  properties: Property[];
  events: TimelineEvent[];
}

export default function TimelineBarView({ properties, events }: TimelineBarViewProps) {
  // Find min/max dates across all properties
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

    const periods: Array<{
      type: 'ppr' | 'rental' | 'vacant';
      start: Date;
      end: Date;
      label: string;
    }> = [];

    // PPR period
    if (moveInEvent) {
      const pprEnd = moveOutEvent?.date || saleEvent?.date || maxDate;
      periods.push({
        type: 'ppr',
        start: moveInEvent.date,
        end: pprEnd,
        label: 'Main Residence',
      });
    }

    // Rental period
    if (rentStartEvent) {
      const rentalEnd = rentEndEvent?.date || saleEvent?.date || maxDate;
      periods.push({
        type: 'rental',
        start: rentStartEvent.date,
        end: rentalEnd,
        label: 'Rental',
      });
    }

    return { purchaseEvent, saleEvent, periods, allEvents: propertyEvents };
  };

  return (
    <div className="p-8 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Timeline Bar with Summary Boxes
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Visual representation of property ownership and occupancy periods
        </p>
      </div>

      {/* Timeline Scale */}
      <div className="mb-8 relative">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span>{format(minDate, 'MMM yyyy')}</span>
          <span>{format(maxDate, 'MMM yyyy')}</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>

      {/* Properties */}
      <div className="space-y-8">
        {properties.map((property) => {
          const { purchaseEvent, saleEvent, periods, allEvents } = getPropertyPeriods(property);
          if (!purchaseEvent) return null;

          const startPos = getPositionPercent(purchaseEvent.date);
          const endDate = saleEvent?.date || maxDate;
          const endPos = getPositionPercent(endDate);
          const width = endPos - startPos;

          // Calculate cost base summary using shared utilities to avoid double-counting
          const improvementEvents = allEvents.filter((e) => e.type === 'improvement');
          const purchasePrice = getPurchasePrice(purchaseEvent);
          const purchaseCostBasesTotal = calculatePurchaseIncidentalCosts(purchaseEvent);
          const improvementCosts = calculateImprovementCosts(improvementEvents);
          const saleCostBasesTotal = calculateSellingCosts(saleEvent);
          const salePrice = getSalePrice(saleEvent);
          const div43Deductions = getDivision43Deductions(saleEvent);
          const totalCostBase =
            purchasePrice + purchaseCostBasesTotal + improvementCosts + saleCostBasesTotal - div43Deductions;

          return (
            <div
              key={property.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              {/* Property Summary Box */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {property.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{property.address}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Status</div>
                    <div
                      className={`text-sm font-bold ${
                        saleEvent
                          ? 'text-gray-500 dark:text-gray-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {saleEvent ? 'SOLD' : 'CURRENT'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Purchase</div>
                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(purchasePrice)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {format(purchaseEvent.date, 'MMM yyyy')}
                    </div>
                  </div>

                  {purchaseCostBasesTotal > 0 && (
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Purchase Costs</div>
                      <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(purchaseCostBasesTotal)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {purchaseEvent.costBases?.length || 0} items
                      </div>
                    </div>
                  )}

                  {improvementCosts > 0 && (
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Improvements</div>
                      <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                        {formatCurrency(improvementCosts)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {improvementEvents.length} events
                      </div>
                    </div>
                  )}

                  {saleEvent && (
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-2">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Sale</div>
                      <div className="text-sm font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(salePrice)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {format(saleEvent.date, 'MMM yyyy')}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline Bar */}
              <div className="p-6 bg-white dark:bg-gray-900">
                <div className="relative h-20">
                  {/* Property Ownership Bar */}
                  <div
                    className="absolute top-0 h-8 bg-gray-200 dark:bg-gray-700 rounded"
                    style={{ left: `${startPos}%`, width: `${width}%` }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">
                      Owned
                    </div>
                  </div>

                  {/* Occupancy Periods */}
                  {periods.map((period, idx) => {
                    const periodStart = getPositionPercent(period.start);
                    const periodEnd = getPositionPercent(period.end);
                    const periodWidth = periodEnd - periodStart;

                    const colors = {
                      ppr: 'bg-blue-500 dark:bg-blue-600',
                      rental: 'bg-purple-500 dark:bg-purple-600',
                      vacant: 'bg-gray-400 dark:bg-gray-500',
                    };

                    return (
                      <div
                        key={idx}
                        className={`absolute top-10 h-6 ${colors[period.type]} rounded shadow-sm`}
                        style={{ left: `${periodStart}%`, width: `${periodWidth}%` }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                          {period.label}
                        </div>
                      </div>
                    );
                  })}

                  {/* Purchase Marker */}
                  <div
                    className="absolute top-0 w-0.5 h-20 bg-green-500"
                    style={{ left: `${startPos}%` }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-green-600 dark:text-green-400 whitespace-nowrap">
                      ↓ Purchase
                    </div>
                  </div>

                  {/* Sale Marker */}
                  {saleEvent && (
                    <div
                      className="absolute top-0 w-0.5 h-20 bg-red-500"
                      style={{ left: `${endPos}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
                        ↓ Sale
                      </div>
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="mt-8 flex items-center gap-6 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">Owned</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 dark:bg-blue-600 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">Main Residence</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-500 dark:bg-purple-600 rounded"></div>
                    <span className="text-gray-600 dark:text-gray-400">Rental</span>
                  </div>
                </div>
              </div>

              {/* Cost Base Summary Footer */}
              <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total Cost Base</div>
                    <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(totalCostBase)}
                    </div>
                  </div>
                  {saleEvent && (
                    <>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Sale Price</div>
                        <div className="text-base font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(salePrice)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Capital Gain
                        </div>
                        <div className="text-base font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(salePrice - totalCostBase)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Ownership Period
                        </div>
                        <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                          {Math.round(
                            (saleEvent.date.getTime() - purchaseEvent.date.getTime()) /
                              (1000 * 60 * 60 * 24 * 365 / 12)
                          )}{' '}
                          months
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
