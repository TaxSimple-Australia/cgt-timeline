import React from 'react';
import { format } from 'date-fns';
import { Property, TimelineEvent } from '@/store/timeline';
import { formatCurrency } from '@/lib/utils';
import {
  Home,
  TrendingUp,
  TrendingDown,
  Key,
  Users,
  Hammer,
  DollarSign,
  Calendar,
} from 'lucide-react';

interface VerticalTimelineProps {
  properties: Property[];
  events: TimelineEvent[];
}

export default function VerticalTimeline({ properties, events }: VerticalTimelineProps) {
  // Group and sort all events chronologically
  const allEventsWithProperty = events
    .map((event) => ({
      event,
      property: properties.find((p) => p.id === event.propertyId),
    }))
    .filter((item) => item.property)
    .sort((a, b) => a.event.date.getTime() - b.event.date.getTime());

  const getEventIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      purchase: <Home className="w-5 h-5" />,
      sale: <DollarSign className="w-5 h-5" />,
      move_in: <Key className="w-5 h-5" />,
      move_out: <TrendingDown className="w-5 h-5" />,
      rent_start: <Users className="w-5 h-5" />,
      rent_end: <TrendingUp className="w-5 h-5" />,
      improvement: <Hammer className="w-5 h-5" />,
    };
    return icons[type] || <Calendar className="w-5 h-5" />;
  };

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      purchase: 'bg-green-500 text-white border-green-600',
      sale: 'bg-red-500 text-white border-red-600',
      move_in: 'bg-blue-500 text-white border-blue-600',
      move_out: 'bg-orange-500 text-white border-orange-600',
      rent_start: 'bg-purple-500 text-white border-purple-600',
      rent_end: 'bg-yellow-500 text-white border-yellow-600',
      improvement: 'bg-pink-500 text-white border-pink-600',
    };
    return colors[type] || 'bg-gray-500 text-white border-gray-600';
  };

  const getEventLabel = (type: string): string => {
    const labels: Record<string, string> = {
      purchase: 'Purchase',
      sale: 'Sale',
      move_in: 'Move In (PPR)',
      move_out: 'Move Out',
      rent_start: 'Rent Start',
      rent_end: 'Rent End',
      improvement: 'Capital Improvement',
    };
    return labels[type] || type;
  };

  return (
    <div className="p-8 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Vertical Timeline View
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Chronological flow of all property events from earliest to latest
        </p>
      </div>

      {/* Timeline Container */}
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500"></div>

          {/* Events */}
          <div className="space-y-8">
            {allEventsWithProperty.map(({ event, property }, idx) => {
              const isLeft = idx % 2 === 0;
              const costBasesTotal = event.costBases?.reduce((sum, cb) => sum + cb.amount, 0) || 0;

              return (
                <div key={event.id} className="relative">
                  {/* Timeline Node */}
                  <div
                    className={`absolute left-8 -translate-x-1/2 w-16 h-16 rounded-full border-4 shadow-lg flex items-center justify-center ${getEventColor(
                      event.type
                    )}`}
                  >
                    {getEventIcon(event.type)}
                  </div>

                  {/* Event Card */}
                  <div className={`ml-24 ${isLeft ? '' : 'mr-24'}`}>
                    <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                      {/* Card Header */}
                      <div
                        className={`p-4 ${
                          event.type === 'purchase'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : event.type === 'sale'
                            ? 'bg-gradient-to-r from-red-500 to-pink-500'
                            : event.type === 'improvement'
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500'
                            : 'bg-gradient-to-r from-blue-500 to-purple-500'
                        } text-white`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-xs uppercase tracking-wide opacity-90 mb-1">
                              {getEventLabel(event.type)}
                            </div>
                            <div className="text-lg font-bold">{property?.name}</div>
                            <div className="text-sm opacity-90">
                              {property?.address.split(',')[0]}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs opacity-90">Date</div>
                            <div className="text-sm font-bold">
                              {format(event.date, 'dd MMM yyyy')}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4">
                        {/* Amount */}
                        {event.amount && (
                          <div className="mb-3">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              {event.type === 'purchase'
                                ? 'Purchase Price'
                                : event.type === 'sale'
                                ? 'Sale Price'
                                : event.type === 'improvement'
                                ? 'Improvement Cost'
                                : 'Amount'}
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                              {formatCurrency(event.amount)}
                            </div>
                          </div>
                        )}

                        {/* Description */}
                        {event.description && (
                          <div className="mb-3">
                            <div className="text-sm text-gray-700 dark:text-gray-300 italic">
                              "{event.description}"
                            </div>
                          </div>
                        )}

                        {/* Cost Bases */}
                        {event.costBases && event.costBases.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                              Cost Base Items ({event.costBases.length})
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {event.costBases.map((cb) => (
                                <div
                                  key={cb.id}
                                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2"
                                >
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {cb.name}
                                  </div>
                                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                    {formatCurrency(cb.amount)}
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                Total Cost Base Items:
                              </span>
                              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                {formatCurrency(costBasesTotal)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Total for event */}
                        {(event.amount || costBasesTotal > 0) && (
                          <div className="mt-3 pt-3 border-t-2 border-gray-300 dark:border-gray-600 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                {event.type === 'purchase'
                                  ? 'Total Acquisition Cost'
                                  : event.type === 'improvement'
                                  ? 'Total Improvement Cost'
                                  : event.type === 'sale'
                                  ? 'Total Proceeds & Costs'
                                  : 'Total'}
                              </span>
                              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {formatCurrency((event.amount || 0) + costBasesTotal)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Footer - Property Color */}
                      <div
                        className="h-2"
                        style={{ backgroundColor: property?.color || '#6366f1' }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* End Marker */}
          <div className="relative mt-8">
            <div className="absolute left-8 -translate-x-1/2 w-12 h-12 rounded-full border-4 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 flex items-center justify-center shadow-lg">
              <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
            </div>
            <div className="ml-24 text-center py-4">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Events: {allEventsWithProperty.length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Timeline Period: {format(allEventsWithProperty[0]?.event.date || new Date(), 'MMM yyyy')}{' '}
                -{' '}
                {format(
                  allEventsWithProperty[allEventsWithProperty.length - 1]?.event.date || new Date(),
                  'MMM yyyy'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
