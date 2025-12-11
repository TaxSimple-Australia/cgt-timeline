import React from 'react';
import { format, differenceInMonths } from 'date-fns';
import { Property, TimelineEvent } from '@/store/timeline';
import { formatCurrency } from '@/lib/utils';

interface HybridLayoutProps {
  properties: Property[];
  events: TimelineEvent[];
}

export default function HybridLayout({ properties, events }: HybridLayoutProps) {
  // Find min/max dates
  const allDates = events.map((e) => e.date.getTime());
  const minDate = new Date(Math.min(...allDates));
  const maxDate = new Date(Math.max(...allDates));
  const totalMonths = differenceInMonths(maxDate, minDate) || 1;

  const getPositionPercent = (date: Date): number => {
    const months = differenceInMonths(date, minDate);
    return (months / totalMonths) * 100;
  };

  const getPropertyData = (property: Property) => {
    const propertyEvents = events
      .filter((e) => e.propertyId === property.id)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const purchaseEvent = propertyEvents.find((e) => e.type === 'purchase');
    const saleEvent = propertyEvents.find((e) => e.type === 'sale');
    const moveInEvent = propertyEvents.find((e) => e.type === 'move_in');
    const moveOutEvent = propertyEvents.find((e) => e.type === 'move_out');
    const rentStartEvent = propertyEvents.find((e) => e.type === 'rent_start');
    const improvementEvents = propertyEvents.filter((e) => e.type === 'improvement');

    const purchasePrice = purchaseEvent?.amount || 0;
    const purchaseCostTotal =
      purchaseEvent?.costBases?.reduce((sum, cb) => sum + cb.amount, 0) || 0;
    const improvementTotal = improvementEvents.reduce(
      (sum, e) => sum + (e.amount || 0) + (e.costBases?.reduce((s, cb) => s + cb.amount, 0) || 0),
      0
    );
    const saleCostTotal = saleEvent?.costBases?.reduce((sum, cb) => sum + cb.amount, 0) || 0;
    const totalCostBase = purchasePrice + purchaseCostTotal + improvementTotal + saleCostTotal;

    return {
      propertyEvents,
      purchaseEvent,
      saleEvent,
      moveInEvent,
      moveOutEvent,
      rentStartEvent,
      improvementEvents,
      purchasePrice,
      purchaseCostTotal,
      improvementTotal,
      saleCostTotal,
      totalCostBase,
      capitalGain: saleEvent ? (saleEvent.amount || 0) - totalCostBase : 0,
    };
  };

  return (
    <div className="p-8 space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Hybrid Table + Visual Layout
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Combined tabular data and visual timeline representation
        </p>
      </div>

      {/* Timeline Scale */}
      <div className="mb-8 bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span>{format(minDate, 'MMM yyyy')}</span>
          <span className="text-center font-medium text-gray-700 dark:text-gray-300">Timeline Scale</span>
          <span>{format(maxDate, 'MMM yyyy')}</span>
        </div>
        <div className="relative h-3 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 dark:from-blue-900 dark:via-purple-900 dark:to-pink-900 rounded-full">
          {/* Year markers */}
          {Array.from({ length: Math.ceil(totalMonths / 12) }).map((_, idx) => {
            const yearDate = new Date(minDate);
            yearDate.setMonth(yearDate.getMonth() + idx * 12);
            const pos = getPositionPercent(yearDate);
            return (
              <div
                key={idx}
                className="absolute top-0 h-full w-0.5 bg-gray-400 dark:bg-gray-600"
                style={{ left: `${pos}%` }}
              ></div>
            );
          })}
        </div>
      </div>

      {properties.map((property) => {
        const data = getPropertyData(property);
        if (!data.purchaseEvent) return null;

        const startPos = data.purchaseEvent ? getPositionPercent(data.purchaseEvent.date) : 0;
        const endDate = data.saleEvent?.date || maxDate;
        const endPos = getPositionPercent(endDate);

        return (
          <div
            key={property.id}
            className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900"
          >
            {/* Property Header with Visual Bar */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 p-4">
              <div className="flex items-center justify-between text-white mb-3">
                <div>
                  <h3 className="text-xl font-bold">{property.name}</h3>
                  <p className="text-sm text-blue-100">{property.address}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs opacity-90">Status</div>
                  <div className="text-lg font-bold">
                    {data.saleEvent ? 'SOLD' : 'CURRENT'}
                  </div>
                </div>
              </div>

              {/* Mini Visual Timeline */}
              <div className="relative h-8 bg-white/20 backdrop-blur-sm rounded">
                {/* Ownership bar */}
                <div
                  className="absolute top-0 h-full bg-white/40 rounded"
                  style={{ left: `${startPos}%`, width: `${endPos - startPos}%` }}
                ></div>

                {/* PPR period */}
                {data.moveInEvent && (
                  <div
                    className="absolute top-1 h-6 bg-blue-400 rounded"
                    style={{
                      left: `${getPositionPercent(data.moveInEvent.date)}%`,
                      width: `${
                        getPositionPercent(data.moveOutEvent?.date || endDate) -
                        getPositionPercent(data.moveInEvent.date)
                      }%`,
                    }}
                  ></div>
                )}

                {/* Rental period */}
                {data.rentStartEvent && (
                  <div
                    className="absolute top-1 h-6 bg-purple-400 rounded"
                    style={{
                      left: `${getPositionPercent(data.rentStartEvent.date)}%`,
                      width: `${endPos - getPositionPercent(data.rentStartEvent.date)}%`,
                    }}
                  ></div>
                )}

                {/* Purchase marker */}
                <div
                  className="absolute top-0 w-1 h-full bg-green-400"
                  style={{ left: `${startPos}%` }}
                ></div>

                {/* Sale marker */}
                {data.saleEvent && (
                  <div
                    className="absolute top-0 w-1 h-full bg-red-400"
                    style={{ left: `${endPos}%` }}
                  ></div>
                )}
              </div>
            </div>

            {/* Data Table Section */}
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left: Event Table */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                    Events Table
                  </h4>
                  <div className="space-y-2">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 dark:bg-gray-800">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                            Date
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
                            Event
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-300">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {data.propertyEvents.map((event) => (
                          <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                              {format(event.date, 'dd/MM/yy')}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-900 dark:text-gray-100">
                              {event.type === 'refinance' ? 'Inherit' : event.type.replace('_', ' ')}
                            </td>
                            <td className="px-3 py-2 text-xs font-medium text-right text-gray-900 dark:text-gray-100 whitespace-nowrap">
                              {event.amount ? formatCurrency(event.amount) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right: Cost Base Breakdown */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                    Cost Base Breakdown
                  </h4>
                  <div className="space-y-3">
                    {/* Purchase */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                        1. PURCHASE
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 dark:text-gray-300">Price</span>
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(data.purchasePrice)}
                        </span>
                      </div>
                      {data.purchaseEvent?.costBases?.map((cb) => (
                        <div key={cb.id} className="flex justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">{cb.name}</span>
                          <span className="text-gray-900 dark:text-gray-100">
                            {formatCurrency(cb.amount)}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <span className="text-gray-700 dark:text-gray-300">Subtotal</span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {formatCurrency(data.purchasePrice + data.purchaseCostTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Improvements */}
                    {data.improvementTotal > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                          2. IMPROVEMENTS
                        </div>
                        {data.improvementEvents.map((imp) => (
                          <div key={imp.id} className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-400">
                              {imp.description || 'Improvement'}
                            </span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {formatCurrency(imp.amount || 0)}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <span className="text-gray-700 dark:text-gray-300">Subtotal</span>
                          <span className="text-purple-600 dark:text-purple-400">
                            {formatCurrency(data.improvementTotal)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Sale Costs */}
                    {data.saleEvent && data.saleCostTotal > 0 && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                          5. SELLING COSTS
                        </div>
                        {data.saleEvent.costBases?.map((cb) => (
                          <div key={cb.id} className="flex justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">{cb.name}</span>
                            <span className="text-gray-900 dark:text-gray-100">
                              {formatCurrency(cb.amount)}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <span className="text-gray-700 dark:text-gray-300">Subtotal</span>
                          <span className="text-red-600 dark:text-red-400">
                            {formatCurrency(data.saleCostTotal)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Footer */}
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Cost Base</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(data.totalCostBase)}
                  </div>
                </div>
                {data.saleEvent && (
                  <>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Sale Price</div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(data.saleEvent.amount || 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Capital Gain</div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(data.capitalGain)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Ownership</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {Math.round(
                          (data.saleEvent.date.getTime() - data.purchaseEvent.date.getTime()) /
                            (1000 * 60 * 60 * 24 * 365)
                        )}{' '}
                        yrs
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
  );
}
