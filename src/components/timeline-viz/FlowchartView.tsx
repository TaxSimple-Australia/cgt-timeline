import React from 'react';
import { format } from 'date-fns';
import { Property, TimelineEvent } from '@/store/timeline';
import { formatCurrency } from '@/lib/utils';
import { ArrowRight, Home, TrendingUp } from 'lucide-react';

interface FlowchartViewProps {
  properties: Property[];
  events: TimelineEvent[];
}

export default function FlowchartView({ properties, events }: FlowchartViewProps) {
  const getPropertyFlowData = (property: Property) => {
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

    // Calculate cost base breakdown
    const purchasePrice = purchaseEvent?.amount || 0;
    const purchaseCosts = purchaseEvent?.costBases?.reduce((sum, cb) => sum + cb.amount, 0) || 0;
    const improvementCosts = improvementEvents.reduce(
      (sum, e) => sum + (e.amount || 0) + (e.costBases?.reduce((s, cb) => s + cb.amount, 0) || 0),
      0
    );
    const sellingCosts = saleEvent?.costBases?.reduce((sum, cb) => sum + cb.amount, 0) || 0;
    const totalCostBase = purchasePrice + purchaseCosts + improvementCosts + sellingCosts;

    return {
      purchaseEvent,
      saleEvent,
      moveInEvent,
      moveOutEvent,
      rentStartEvent,
      rentEndEvent,
      improvementEvents,
      purchasePrice,
      purchaseCosts,
      improvementCosts,
      sellingCosts,
      totalCostBase,
      capitalGain: saleEvent ? (saleEvent.amount || 0) - totalCostBase : 0,
    };
  };

  return (
    <div className="p-8 space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Flowchart Visualization
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Property lifecycle flow showing acquisition, occupancy, improvements, and disposition
        </p>
      </div>

      {properties.map((property) => {
        const data = getPropertyFlowData(property);
        if (!data.purchaseEvent) return null;

        return (
          <div
            key={property.id}
            className="bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 rounded-2xl p-8 shadow-xl"
          >
            {/* Property Title */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg">
                <Home className="w-6 h-6" />
                <div>
                  <div className="text-lg font-bold">{property.name}</div>
                  <div className="text-xs opacity-90">{property.address}</div>
                </div>
              </div>
            </div>

            {/* Flow Diagram */}
            <div className="space-y-6">
              {/* 1. Acquisition Phase */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-32 text-right">
                  <div className="inline-block bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-3 py-1 rounded-full text-xs font-bold">
                    ACQUISITION
                  </div>
                </div>
                <ArrowRight className="flex-shrink-0 w-6 h-6 text-gray-400 mt-4" />
                <div className="flex-1">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-500 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-bold text-green-700 dark:text-green-300 uppercase tracking-wide mb-1">
                          Purchase
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {format(data.purchaseEvent.date, 'dd MMM yyyy')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Purchase Price</div>
                        <div className="text-xl font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(data.purchasePrice)}
                        </div>
                      </div>
                    </div>
                    {data.purchaseCosts > 0 && (
                      <div className="pt-3 border-t border-green-200 dark:border-green-800">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {data.purchaseEvent.costBases?.map((cb) => (
                            <div key={cb.id} className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">{cb.name}:</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {formatCurrency(cb.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800 flex justify-between">
                          <span className="text-sm font-bold text-green-700 dark:text-green-300">
                            Total Acquisition Cost:
                          </span>
                          <span className="text-sm font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(data.purchasePrice + data.purchaseCosts)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Occupancy Phase */}
              {(data.moveInEvent || data.rentStartEvent) && (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-32 text-right">
                    <div className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-bold">
                      OCCUPANCY
                    </div>
                  </div>
                  <ArrowRight className="flex-shrink-0 w-6 h-6 text-gray-400 mt-4" />
                  <div className="flex-1 space-y-3">
                    {/* Main Residence */}
                    {data.moveInEvent && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-2 border-blue-500 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-1">
                              Main Residence (PPR)
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {format(data.moveInEvent.date, 'dd MMM yyyy')} -{' '}
                              {data.moveOutEvent
                                ? format(data.moveOutEvent.date, 'dd MMM yyyy')
                                : 'Present'}
                            </div>
                          </div>
                          <div className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">
                            CGT Exempt
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rental */}
                    {data.rentStartEvent && (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-2 border-purple-500 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide mb-1">
                              Rental Property
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {format(data.rentStartEvent.date, 'dd MMM yyyy')} -{' '}
                              {data.rentEndEvent
                                ? format(data.rentEndEvent.date, 'dd MMM yyyy')
                                : 'Present'}
                            </div>
                          </div>
                          <div className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold">
                            CGT Applies
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. Improvements Phase */}
              {data.improvementEvents.length > 0 && (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-32 text-right">
                    <div className="inline-block bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200 px-3 py-1 rounded-full text-xs font-bold">
                      IMPROVEMENTS
                    </div>
                  </div>
                  <ArrowRight className="flex-shrink-0 w-6 h-6 text-gray-400 mt-4" />
                  <div className="flex-1">
                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950 dark:to-rose-950 border-2 border-pink-500 rounded-xl p-4">
                      <div className="text-sm font-bold text-pink-700 dark:text-pink-300 uppercase tracking-wide mb-3">
                        Capital Improvements ({data.improvementEvents.length})
                      </div>
                      <div className="space-y-2">
                        {data.improvementEvents.map((imp) => (
                          <div
                            key={imp.id}
                            className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-pink-200 dark:border-pink-800"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  {format(imp.date, 'dd MMM yyyy')}
                                </div>
                                <div className="text-sm text-gray-900 dark:text-gray-100">
                                  {imp.description || 'Capital improvement'}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-pink-600 dark:text-pink-400">
                                  {formatCurrency(imp.amount || 0)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-pink-200 dark:border-pink-800 flex justify-between">
                        <span className="text-sm font-bold text-pink-700 dark:text-pink-300">
                          Total Improvements:
                        </span>
                        <span className="text-sm font-bold text-pink-600 dark:text-pink-400">
                          {formatCurrency(data.improvementCosts)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Disposition Phase */}
              {data.saleEvent && (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-32 text-right">
                    <div className="inline-block bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-3 py-1 rounded-full text-xs font-bold">
                      DISPOSITION
                    </div>
                  </div>
                  <ArrowRight className="flex-shrink-0 w-6 h-6 text-gray-400 mt-4" />
                  <div className="flex-1">
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950 border-2 border-red-500 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-sm font-bold text-red-700 dark:text-red-300 uppercase tracking-wide mb-1">
                            Sale
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {format(data.saleEvent.date, 'dd MMM yyyy')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 dark:text-gray-400">Sale Price</div>
                          <div className="text-xl font-bold text-red-600 dark:text-red-400">
                            {formatCurrency(data.saleEvent.amount || 0)}
                          </div>
                        </div>
                      </div>
                      {data.sellingCosts > 0 && (
                        <div className="pt-3 border-t border-red-200 dark:border-red-800">
                          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                            {data.saleEvent.costBases?.map((cb) => (
                              <div key={cb.id} className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">{cb.name}:</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {formatCurrency(cb.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 5. CGT Calculation Summary */}
              {data.saleEvent && (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-32 text-right">
                    <div className="inline-block bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-3 py-1 rounded-full text-xs font-bold">
                      CGT RESULT
                    </div>
                  </div>
                  <TrendingUp className="flex-shrink-0 w-6 h-6 text-gray-400 mt-4" />
                  <div className="flex-1">
                    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl p-6 shadow-xl">
                      <div className="grid grid-cols-3 gap-4 text-center mb-4">
                        <div>
                          <div className="text-xs opacity-90 mb-1">Total Cost Base</div>
                          <div className="text-lg font-bold">{formatCurrency(data.totalCostBase)}</div>
                        </div>
                        <div>
                          <div className="text-xs opacity-90 mb-1">Sale Proceeds</div>
                          <div className="text-lg font-bold">
                            {formatCurrency(data.saleEvent.amount || 0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs opacity-90 mb-1">Capital Gain</div>
                          <div className="text-2xl font-bold">{formatCurrency(data.capitalGain)}</div>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-white/20 text-center">
                        <div className="text-xs opacity-90">
                          Ownership Period: {Math.round((data.saleEvent.date.getTime() - data.purchaseEvent.date.getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
