import React from 'react';
import { format } from 'date-fns';
import { Property, TimelineEvent } from '@/store/timeline';
import { formatCurrency } from '@/lib/utils';
import { COST_BASE_DEFINITIONS } from '@/lib/cost-base-definitions';

interface ChronologicalTableProps {
  properties: Property[];
  events: TimelineEvent[];
}

export default function ChronologicalTable({ properties, events }: ChronologicalTableProps) {
  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Group events by property
  const eventsByProperty = properties.map((property) => ({
    property,
    events: sortedEvents.filter((e) => e.propertyId === property.id),
  }));

  const getEventTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      purchase: 'Purchase',
      move_in: 'Move In (PPR)',
      move_out: 'Move Out',
      rent_start: 'Rent Start',
      rent_end: 'Rent End',
      sale: 'Sale',
      improvement: 'Capital Improvement',
      refinance: 'Refinance',
      status_change: 'Status Change',
      living_in_rental_start: 'Living in Rental (Start)',
      living_in_rental_end: 'Living in Rental (End)',
    };
    return labels[type] || type;
  };

  const getCostBasesTotal = (event: TimelineEvent): number => {
    if (!event.costBases || event.costBases.length === 0) return 0;
    return event.costBases.reduce((sum, cb) => sum + cb.amount, 0);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Chronological Event Table
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Complete property timeline with all events and cost bases
        </p>
      </div>

      {eventsByProperty.map(({ property, events: propertyEvents }) => {
        if (propertyEvents.length === 0) return null;

        const purchaseEvent = propertyEvents.find((e) => e.type === 'purchase');
        const saleEvent = propertyEvents.find((e) => e.type === 'sale');
        const improvementEvents = propertyEvents.filter((e) => e.type === 'improvement');

        // Calculate cost base summary
        const purchaseCostBase = purchaseEvent ? getCostBasesTotal(purchaseEvent) : 0;
        const improvementCostBase = improvementEvents.reduce(
          (sum, e) => sum + getCostBasesTotal(e),
          0
        );
        const saleCostBase = saleEvent ? getCostBasesTotal(saleEvent) : 0;
        const totalCostBase =
          (purchaseEvent?.amount || 0) + purchaseCostBase + improvementCostBase + saleCostBase;

        return (
          <div key={property.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {/* Property Header */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {property.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{property.address}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 dark:text-gray-400">Total Events</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {propertyEvents.length}
                  </div>
                </div>
              </div>

              {/* Cost Base Summary */}
              {(purchaseEvent || saleEvent) && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {purchaseEvent && (
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Purchase Price</div>
                      <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(purchaseEvent.amount || 0)}
                      </div>
                    </div>
                  )}
                  {purchaseCostBase > 0 && (
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Purchase Costs</div>
                      <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(purchaseCostBase)}
                      </div>
                    </div>
                  )}
                  {improvementCostBase > 0 && (
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Improvements</div>
                      <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(improvementCostBase)}
                      </div>
                    </div>
                  )}
                  {saleEvent && (
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Sale Price</div>
                      <div className="text-sm font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(saleEvent.amount || 0)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Events Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Event Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Cost Base Items
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {propertyEvents.map((event, idx) => (
                    <tr
                      key={event.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {format(event.date, 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {getEventTypeLabel(event.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {event.description || event.title || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-right text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {event.amount ? formatCurrency(event.amount) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {event.costBases && event.costBases.length > 0 ? (
                          <div className="space-y-1">
                            {event.costBases.map((cb) => (
                              <div
                                key={cb.id}
                                className="flex items-center justify-between gap-2 text-xs"
                              >
                                <span className="text-gray-600 dark:text-gray-400">{cb.name}:</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {formatCurrency(cb.amount)}
                                </span>
                              </div>
                            ))}
                            <div className="pt-1 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between gap-2 text-xs font-bold">
                              <span className="text-gray-700 dark:text-gray-300">Total:</span>
                              <span className="text-blue-600 dark:text-blue-400">
                                {formatCurrency(getCostBasesTotal(event))}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Property Summary Footer */}
            {(purchaseEvent || saleEvent) && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total Cost Base</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(totalCostBase)}
                    </div>
                  </div>
                  {saleEvent && purchaseEvent && (
                    <>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Capital Gain
                        </div>
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {formatCurrency((saleEvent.amount || 0) - totalCostBase)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Ownership Period
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {Math.round(
                            (saleEvent.date.getTime() - purchaseEvent.date.getTime()) /
                              (1000 * 60 * 60 * 24 * 365)
                          )}{' '}
                          years
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
