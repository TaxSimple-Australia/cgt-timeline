import React from 'react';
import { format } from 'date-fns';
import { Property, TimelineEvent } from '@/store/timeline';
import { formatCurrency } from '@/lib/utils';
import {
  calculatePurchaseIncidentalCosts,
  calculateImprovementCosts,
  calculateSellingCosts,
  calculateCapitalGain,
  getPurchasePrice,
  getSalePrice,
  getImprovementAmount,
} from '@/lib/cost-base-calculations';

interface TwoColumnLayoutProps {
  properties: Property[];
  events: TimelineEvent[];
}

export default function TwoColumnLayout({ properties, events }: TwoColumnLayoutProps) {
  const getPropertyData = (property: Property) => {
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

    // Use shared utility functions to properly extract prices from amount OR costBases
    const purchasePrice = getPurchasePrice(purchaseEvent);
    const purchaseCostBases = purchaseEvent?.costBases || [];
    const purchaseCostTotal = calculatePurchaseIncidentalCosts(purchaseEvent);

    const improvementCosts = improvementEvents.map((e) => ({
      date: e.date,
      description: e.description || 'Capital improvement',
      amount: getImprovementAmount(e),
      costBases: e.costBases || [],
    }));
    const improvementTotal = calculateImprovementCosts(improvementEvents);

    const saleCostBases = saleEvent?.costBases || [];
    const saleCostTotal = calculateSellingCosts(saleEvent);

    const totalCostBase = purchasePrice + purchaseCostTotal + improvementTotal + saleCostTotal;
    const salePrice = getSalePrice(saleEvent);
    const capitalGain = calculateCapitalGain(purchaseEvent, improvementEvents, saleEvent);

    return {
      purchaseEvent,
      saleEvent,
      moveInEvent,
      moveOutEvent,
      rentStartEvent,
      rentEndEvent,
      improvementEvents,
      purchasePrice,
      purchaseCostBases,
      purchaseCostTotal,
      improvementCosts,
      improvementTotal,
      saleCostBases,
      saleCostTotal,
      totalCostBase,
      salePrice,
      capitalGain,
    };
  };

  return (
    <div className="p-8 space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Two-Column Summary Layout
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Space-efficient format with property details and cost breakdowns side by side
        </p>
      </div>

      {properties.map((property) => {
        const data = getPropertyData(property);
        if (!data.purchaseEvent) return null;

        return (
          <div
            key={property.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
          >
            {/* Property Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 p-4">
              <h3 className="text-xl font-bold text-white">{property.name}</h3>
              <p className="text-blue-100">{property.address}</p>
            </div>

            {/* Two Column Content */}
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
              {/* Left Column: Property Details & Timeline */}
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                    Property Timeline
                  </h4>

                  <div className="space-y-3">
                    {/* Purchase */}
                    {data.purchaseEvent && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Purchase
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {format(data.purchaseEvent.date, 'dd MMM yyyy')}
                          </div>
                          <div className="text-sm font-bold text-green-600 dark:text-green-400 mt-1">
                            {formatCurrency(data.purchasePrice)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Move In */}
                    {data.moveInEvent && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Move In (Main Residence)
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {format(data.moveInEvent.date, 'dd MMM yyyy')}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Improvements */}
                    {data.improvementEvents.map((event, idx) => (
                      <div key={event.id} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5"></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {event.description || 'Capital Improvement'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {format(event.date, 'dd MMM yyyy')}
                          </div>
                          <div className="text-sm font-bold text-purple-600 dark:text-purple-400 mt-1">
                            {formatCurrency(event.amount || 0)}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Move Out */}
                    {data.moveOutEvent && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5"></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Move Out
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {format(data.moveOutEvent.date, 'dd MMM yyyy')}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rent Start */}
                    {data.rentStartEvent && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5"></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Rent Start
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {format(data.rentStartEvent.date, 'dd MMM yyyy')}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rent End */}
                    {data.rentEndEvent && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5"></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Rent End
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {format(data.rentEndEvent.date, 'dd MMM yyyy')}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sale */}
                    {data.saleEvent && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5"></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Sale
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {format(data.saleEvent.date, 'dd MMM yyyy')}
                          </div>
                          <div className="text-sm font-bold text-red-600 dark:text-red-400 mt-1">
                            {formatCurrency(data.salePrice)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Occupancy Summary */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Occupancy Summary
                  </h4>
                  <div className="space-y-2 text-xs">
                    {data.moveInEvent && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">Main Residence:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {format(data.moveInEvent.date, 'MMM yyyy')} -{' '}
                          {data.moveOutEvent
                            ? format(data.moveOutEvent.date, 'MMM yyyy')
                            : 'Present'}
                        </span>
                      </div>
                    )}
                    {data.rentStartEvent && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-indigo-500 rounded"></div>
                        <span className="text-gray-600 dark:text-gray-400">Rental:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {format(data.rentStartEvent.date, 'MMM yyyy')} -{' '}
                          {data.rentEndEvent
                            ? format(data.rentEndEvent.date, 'MMM yyyy')
                            : 'Present'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Cost Base Breakdown */}
              <div className="p-6 bg-gray-50 dark:bg-gray-800/50 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                    Cost Base Breakdown
                  </h4>

                  {/* First Element: Purchase */}
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                        ELEMENT 1: PURCHASE
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Purchase Price
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {formatCurrency(data.purchasePrice)}
                        </span>
                      </div>
                      {data.purchaseCostBases.map((cb) => (
                        <div key={cb.id} className="flex justify-between items-center text-xs">
                          <span className="text-gray-600 dark:text-gray-400">{cb.name}</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {formatCurrency(cb.amount)}
                          </span>
                        </div>
                      ))}
                      {data.purchaseCostBases.length > 0 && (
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Subtotal
                          </span>
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(data.purchasePrice + data.purchaseCostTotal)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Second Element: Improvements */}
                    {data.improvementTotal > 0 && (
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                          ELEMENT 2: CAPITAL IMPROVEMENTS
                        </div>
                        {data.improvementCosts.map((imp, idx) => (
                          <div key={idx} className="mb-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {imp.description}
                              </span>
                              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                {formatCurrency(imp.amount)}
                              </span>
                            </div>
                            {imp.costBases.map((cb) => (
                              <div key={cb.id} className="flex justify-between items-center text-xs ml-4">
                                <span className="text-gray-600 dark:text-gray-400">{cb.name}</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {formatCurrency(cb.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ))}
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Subtotal
                          </span>
                          <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                            {formatCurrency(data.improvementTotal)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Fifth Element: Selling Costs */}
                    {data.saleEvent && data.saleCostBases.length > 0 && (
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                          ELEMENT 5: SELLING COSTS
                        </div>
                        {data.saleCostBases.map((cb) => (
                          <div key={cb.id} className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 dark:text-gray-400">{cb.name}</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(cb.amount)}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Subtotal
                          </span>
                          <span className="text-sm font-bold text-red-600 dark:text-red-400">
                            {formatCurrency(data.saleCostTotal)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Total Cost Base & CGT */}
                <div className="pt-4 border-t-2 border-gray-300 dark:border-gray-600 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      Total Cost Base
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(data.totalCostBase)}
                    </span>
                  </div>
                  {data.saleEvent && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Sale Price
                        </span>
                        <span className="text-base font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(data.salePrice)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                          Capital Gain
                        </span>
                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(data.capitalGain)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
