'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  ShoppingCart,
  TrendingUp,
  Key,
  Users,
  Hammer,
  Calendar
} from 'lucide-react';
import type { Property } from '@/types/model-response';

interface PropertyGanttChartProps {
  properties: Property[];
}

export default function PropertyGanttChart({ properties }: PropertyGanttChartProps) {
  // Calculate the overall timeline range
  const { startDate, endDate, totalDays } = useMemo(() => {
    let earliest = new Date();
    let latest = new Date(0);

    properties.forEach(property => {
      property.property_history.forEach(event => {
        const eventDate = new Date(event.date);
        if (eventDate < earliest) earliest = eventDate;
        if (eventDate > latest) latest = eventDate;
      });
    });

    const diffTime = Math.abs(latest.getTime() - earliest.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      startDate: earliest,
      endDate: latest,
      totalDays: diffDays
    };
  }, [properties]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'purchase':
        return <ShoppingCart className="w-3 h-3" />;
      case 'sale':
        return <TrendingUp className="w-3 h-3" />;
      case 'move_in':
        return <Key className="w-3 h-3" />;
      case 'move_out':
        return <Users className="w-3 h-3" />;
      case 'rent_start':
        return <Home className="w-3 h-3" />;
      case 'improvement':
        return <Hammer className="w-3 h-3" />;
      default:
        return <Calendar className="w-3 h-3" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'purchase':
        return 'bg-green-500 border-green-600';
      case 'sale':
        return 'bg-purple-500 border-purple-600';
      case 'move_in':
        return 'bg-blue-500 border-blue-600';
      case 'move_out':
        return 'bg-amber-500 border-amber-600';
      case 'rent_start':
        return 'bg-orange-500 border-orange-600';
      case 'improvement':
        return 'bg-cyan-500 border-cyan-600';
      default:
        return 'bg-gray-500 border-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white dark:bg-gray-900 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Property Timeline
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatDate(startDate)} - {formatDate(endDate)} ({totalDays} days)
            </p>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="p-6 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Timeline Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {formatDate(startDate)}
              </span>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Today
              </span>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {formatDate(endDate)}
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full relative">
              {/* Current date marker */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-purple-500"
                style={{
                  left: `${((new Date().getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100}%`
                }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-500 rounded-full" />
              </div>
            </div>
          </div>

          {/* Properties */}
          <div className="space-y-6">
            {properties.map((property, propIndex) => {
              // Find purchase and sale events
              const purchaseEvent = property.property_history.find(e => e.event.toLowerCase() === 'purchase');
              const saleEvent = property.property_history.find(e => e.event.toLowerCase() === 'sale');

              const propStartDate = purchaseEvent ? new Date(purchaseEvent.date) : new Date(property.property_history[0].date);
              const propEndDate = saleEvent ? new Date(saleEvent.date) : new Date();

              const startPercent = ((propStartDate.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100;
              const widthPercent = ((propEndDate.getTime() - propStartDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100;

              return (
                <motion.div
                  key={propIndex}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: propIndex * 0.1 }}
                >
                  {/* Property Name */}
                  <div className="flex items-start gap-3 mb-2">
                    <div className="flex-shrink-0 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Home className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">
                        {property.address}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {property.property_history.length} events
                      </p>
                    </div>
                  </div>

                  {/* Timeline Bar */}
                  <div className="relative h-12 mb-2">
                    {/* Background track */}
                    <div className="absolute top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-full" />

                    {/* Ownership period bar */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPercent}%` }}
                      transition={{ duration: 1, delay: propIndex * 0.1 + 0.2 }}
                      className="absolute top-1/2 -translate-y-1/2 h-6 bg-gradient-to-r from-purple-400 to-pink-400 dark:from-purple-600 dark:to-pink-600 rounded-lg shadow-md"
                      style={{ left: `${startPercent}%` }}
                    />

                    {/* Event markers */}
                    {property.property_history.map((event, eventIndex) => {
                      const eventDate = new Date(event.date);
                      const eventPercent = ((eventDate.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100;

                      return (
                        <motion.div
                          key={eventIndex}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, delay: propIndex * 0.1 + eventIndex * 0.05 + 0.5 }}
                          className="absolute top-1/2 -translate-y-1/2 group"
                          style={{ left: `${eventPercent}%` }}
                        >
                          <div className={`w-8 h-8 rounded-full border-2 ${getEventColor(event.event)} flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-110 transition-transform`}>
                            {getEventIcon(event.event)}
                          </div>

                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg shadow-xl text-xs whitespace-nowrap">
                              <p className="font-semibold capitalize">{event.event.replace('_', ' ')}</p>
                              <p className="text-gray-300 dark:text-gray-600">
                                {new Date(event.date).toLocaleDateString('en-AU')}
                              </p>
                              {event.price && (
                                <p className="text-gray-300 dark:text-gray-600">
                                  ${event.price.toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                              <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Event Legend */}
                  <div className="flex flex-wrap gap-2 text-xs ml-9">
                    {property.property_history.map((event, eventIndex) => (
                      <div
                        key={eventIndex}
                        className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full"
                      >
                        <div className={`w-2 h-2 rounded-full ${getEventColor(event.event)}`} />
                        <span className="text-gray-700 dark:text-gray-300 capitalize">
                          {event.event.replace('_', ' ')}
                        </span>
                        <span className="text-gray-500 dark:text-gray-500">
                          {new Date(event.date).toLocaleDateString('en-AU', { month: 'short', year: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Event Types
            </h4>
            <div className="flex flex-wrap gap-4">
              {[
                { type: 'purchase', label: 'Purchase' },
                { type: 'sale', label: 'Sale' },
                { type: 'move_in', label: 'Move In' },
                { type: 'move_out', label: 'Move Out' },
                { type: 'rent_start', label: 'Rent Start' },
                { type: 'improvement', label: 'Improvement' },
              ].map(({ type, label }) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getEventColor(type)}`} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
