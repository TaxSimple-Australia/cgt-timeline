import React from 'react';
import { format } from 'date-fns';
import { Property, TimelineEvent } from '@/store/timeline';
import { formatCurrency } from '@/lib/utils';
import { Home, TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface CardLayoutProps {
  properties: Property[];
  events: TimelineEvent[];
}

export default function CardLayout({ properties, events }: CardLayoutProps) {
  const getPropertyData = (property: Property) => {
    const propertyEvents = events
      .filter((e) => e.propertyId === property.id)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const purchaseEvent = propertyEvents.find((e) => e.type === 'purchase');
    const saleEvent = propertyEvents.find((e) => e.type === 'sale');
    const moveInEvent = propertyEvents.find((e) => e.type === 'move_in');
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
    <div className="p-8 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Card-Style Layout</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Professional card-based presentation with event timeline
        </p>
      </div>

      <div className="grid gap-6">
        {properties.map((property) => {
          const data = getPropertyData(property);
          if (!data.purchaseEvent) return null;

          return (
            <div
              key={property.id}
              className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Home className="w-6 h-6 mt-1" />
                    <div>
                      <h3 className="text-2xl font-bold">{property.name}</h3>
                      <p className="text-blue-100 mt-1">{property.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`px-4 py-2 rounded-full font-bold text-sm ${
                        data.saleEvent
                          ? 'bg-white/20 text-white'
                          : 'bg-green-500 text-white'
                      }`}
                    >
                      {data.saleEvent ? 'SOLD' : 'CURRENT'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 dark:bg-gray-800/50">
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Purchase
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {formatCurrency(data.purchasePrice)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {format(data.purchaseEvent.date, 'MMM yyyy')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Total Cost Base
                  </div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(data.totalCostBase)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {data.purchaseEvent.costBases?.length || 0} + {data.improvementEvents.length}{' '}
                    items
                  </div>
                </div>
                {data.saleEvent && (
                  <>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Sale Price
                      </div>
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(data.saleEvent.amount || 0)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {format(data.saleEvent.date, 'MMM yyyy')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                        Capital Gain
                      </div>
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {formatCurrency(data.capitalGain)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
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

              {/* Timeline Events */}
              <div className="p-6">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Timeline Events
                </h4>
                <div className="space-y-3">
                  {data.propertyEvents.map((event, idx) => {
                    const eventIcons: Record<string, string> = {
                      purchase: '🏠',
                      move_in: '📦',
                      move_out: '🚚',
                      rent_start: '🔑',
                      rent_end: '🏁',
                      sale: '💰',
                      improvement: '🔨',
                    };

                    const eventColors: Record<string, string> = {
                      purchase: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                      move_in: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                      move_out: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                      rent_start: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
                      rent_end: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                      sale: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                      improvement: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
                    };

                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="text-2xl">{eventIcons[event.type] || '📋'}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                eventColors[event.type] || 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {event.type.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {format(event.date, 'dd MMM yyyy')}
                            </span>
                          </div>
                          {event.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              {event.description}
                            </p>
                          )}
                          {event.amount && (
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              {formatCurrency(event.amount)}
                            </div>
                          )}
                          {event.costBases && event.costBases.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {event.costBases.map((cb) => (
                                <div key={cb.id} className="flex items-center justify-between text-xs">
                                  <span className="text-gray-600 dark:text-gray-400">• {cb.name}</span>
                                  <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {formatCurrency(cb.amount)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cost Base Summary */}
              <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-950 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Cost Base Summary
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Purchase + Costs</div>
                    <div className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(data.purchasePrice + data.purchaseCostTotal)}
                    </div>
                  </div>
                  {data.improvementTotal > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Improvements</div>
                      <div className="text-base font-bold text-purple-600 dark:text-purple-400">
                        {formatCurrency(data.improvementTotal)}
                      </div>
                    </div>
                  )}
                  {data.saleCostTotal > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Selling Costs</div>
                      <div className="text-base font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(data.saleCostTotal)}
                      </div>
                    </div>
                  )}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-3">
                    <div className="text-xs opacity-90">Total Cost Base</div>
                    <div className="text-lg font-bold">{formatCurrency(data.totalCostBase)}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
