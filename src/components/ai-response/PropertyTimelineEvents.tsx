'use client';

import React from 'react';
import { Clock, Circle } from 'lucide-react';
import { TimelineEvent } from '@/types/model-response';
import { cn } from '@/lib/utils';

interface PropertyTimelineEventsProps {
  timeline: TimelineEvent[];
}

const getEventColor = (event: string): string => {
  const eventLower = event.toLowerCase();
  if (eventLower.includes('purchase')) return 'blue';
  if (eventLower.includes('sale')) return 'purple';
  if (eventLower.includes('move in')) return 'green';
  if (eventLower.includes('move out')) return 'orange';
  if (eventLower.includes('rent')) return 'indigo';
  if (eventLower.includes('improvement')) return 'yellow';
  return 'gray';
};

const colorClasses = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700',
    dot: 'bg-blue-500'
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-700',
    dot: 'bg-purple-500'
  },
  green: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-700',
    dot: 'bg-green-500'
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-300 dark:border-orange-700',
    dot: 'bg-orange-500'
  },
  indigo: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-300 dark:border-indigo-700',
    dot: 'bg-indigo-500'
  },
  yellow: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-300 dark:border-yellow-700',
    dot: 'bg-yellow-500'
  },
  gray: {
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-300 dark:border-gray-700',
    dot: 'bg-gray-500'
  }
};

export default function PropertyTimelineEvents({ timeline }: PropertyTimelineEventsProps) {
  if (!timeline || timeline.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Timeline Events
        </h3>
      </div>

      <div className="space-y-0">
        {timeline.map((event, index) => {
          const color = getEventColor(event.event);
          const classes = colorClasses[color as keyof typeof colorClasses];
          const isLast = index === timeline.length - 1;

          return (
            <div key={index} className="relative flex gap-4">
              {/* Timeline Line & Dot */}
              <div className="flex flex-col items-center pt-1">
                <div className={cn("w-3 h-3 rounded-full border-2 border-white dark:border-gray-800", classes.dot)} />
                {!isLast && (
                  <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 min-h-[2rem]" />
                )}
              </div>

              {/* Event Content */}
              <div className={cn("flex-1 pb-6", isLast && "pb-0")}>
                <div className={cn(
                  "rounded-lg p-3 border",
                  classes.bg,
                  classes.border
                )}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className={cn("text-xs font-semibold", classes.text)}>
                      {event.date}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 text-xs font-medium rounded",
                      classes.bg,
                      classes.text
                    )}>
                      {event.event}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {event.details}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
