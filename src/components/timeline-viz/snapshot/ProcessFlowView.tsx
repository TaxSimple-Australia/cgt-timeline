'use client';

import React from 'react';
import { Property, TimelineEvent } from '@/store/timeline';
import { format } from 'date-fns';
import { Calendar, DollarSign, Home } from 'lucide-react';

interface ProcessFlowViewProps {
  properties: Property[];
  events: TimelineEvent[];
  absoluteStart: Date;
  absoluteEnd: Date;
}

export default function ProcessFlowView({
  properties,
  events,
  absoluteStart,
  absoluteEnd,
}: ProcessFlowViewProps) {
  // Format currency
  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get event type display name
  const getEventTypeDisplay = (type: string) => {
    const typeMap: Record<string, string> = {
      'purchase': 'Purchase',
      'sale': 'Sale',
      'move_in': 'Move In',
      'move_out': 'Move Out',
      'rent_start': 'Rent Start',
      'rent_end': 'Rent End',
      'improvement': 'Improvement',
      'refinance': 'Refinance',
      'status_change': 'Status Change',
      'vacant_start': 'Vacant Start',
      'vacant_end': 'Vacant End',
      'custom': 'Custom Event',
    };
    return typeMap[type] || type;
  };

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-lg overflow-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
          Property Event Flow
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          All events organized by property
        </p>
      </div>

      {/* Properties with Events */}
      <div className="space-y-8">
        {properties.map((property) => {
          const propertyEvents = events
            .filter((e) => e.propertyId === property.id)
            .sort((a, b) => a.date.getTime() - b.date.getTime());

          return (
            <div key={property.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border-2 border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Property Header */}
              <div
                className="px-6 py-4 border-b-4"
                style={{ borderColor: property.color }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${property.color}20` }}
                    >
                      <Home className="w-6 h-6" style={{ color: property.color }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        {property.name}
                      </h3>
                      {property.address && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {property.address}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                      Status
                    </div>
                    <div
                      className="inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize"
                      style={{
                        backgroundColor: `${property.color}20`,
                        color: property.color,
                      }}
                    >
                      {property.currentStatus || 'Active'}
                    </div>
                  </div>
                </div>

                {/* Property Summary */}
                <div className="mt-4 flex gap-6 text-sm">
                  {property.purchasePrice && (
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Purchase Price</div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatCurrency(property.purchasePrice)}
                      </div>
                    </div>
                  )}
                  {property.salePrice && (
                    <div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Sale Price</div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatCurrency(property.salePrice)}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Total Events</div>
                    <div className="font-semibold text-slate-700 dark:text-slate-300">
                      {propertyEvents.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Cards */}
              <div className="p-6">
                {propertyEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {propertyEvents.map((event) => (
                      <div
                        key={event.id}
                        className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border-2 border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                      >
                        {/* Event Header */}
                        <div className="flex items-start gap-3 mb-3">
                          <div
                            className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                            style={{ backgroundColor: event.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">
                              {event.title}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                              {getEventTypeDisplay(event.type)}
                            </p>
                          </div>
                        </div>

                        {/* Event Date */}
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-2">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{format(event.date, 'MMM dd, yyyy')}</span>
                        </div>

                        {/* Event Amount */}
                        {event.amount && (
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-2">
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>{formatCurrency(event.amount)}</span>
                          </div>
                        )}

                        {/* Event Description */}
                        {event.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                            {event.description}
                          </p>
                        )}

                        {/* Additional Details */}
                        {(event.stampDuty || event.purchaseLegalFees || event.valuationFees) && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
                            {event.stampDuty && (
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500 dark:text-slate-400">Stamp Duty:</span>
                                <span className="text-slate-700 dark:text-slate-300 font-medium">
                                  {formatCurrency(event.stampDuty)}
                                </span>
                              </div>
                            )}
                            {event.purchaseLegalFees && (
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500 dark:text-slate-400">Legal Fees:</span>
                                <span className="text-slate-700 dark:text-slate-300 font-medium">
                                  {formatCurrency(event.purchaseLegalFees)}
                                </span>
                              </div>
                            )}
                            {event.valuationFees && (
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-500 dark:text-slate-400">Valuation:</span>
                                <span className="text-slate-700 dark:text-slate-300 font-medium">
                                  {formatCurrency(event.valuationFees)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-600">
                    <p className="text-sm">No events for this property</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {properties.length === 0 && (
        <div className="text-center py-16 text-slate-400 dark:text-slate-600">
          <Home className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-semibold">No properties to display</p>
          <p className="text-sm mt-2">Add properties and events to see the process flow</p>
        </div>
      )}
    </div>
  );
}
