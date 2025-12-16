'use client';

import React from 'react';
import { Property, TimelineEvent } from '@/store/timeline';
import { format } from 'date-fns';

interface DualAxisTimelineViewProps {
  properties: Property[];
  events: TimelineEvent[];
  absoluteStart: Date;
  absoluteEnd: Date;
}

export default function DualAxisTimelineView({
  properties,
  events,
  absoluteStart,
  absoluteEnd,
}: DualAxisTimelineViewProps) {
  // Calculate position as percentage
  const getDatePosition = (date: Date): number => {
    const totalRange = absoluteEnd.getTime() - absoluteStart.getTime();
    const offset = date.getTime() - absoluteStart.getTime();
    return (offset / totalRange) * 100;
  };

  // Combine all events and sort by date
  const allEvents = events
    .map(event => {
      const property = properties.find(p => p.id === event.propertyId);
      return { event, property };
    })
    .filter(item => item.property !== undefined)
    .sort((a, b) => a.event.date.getTime() - b.event.date.getTime());

  // Split events into two groups - alternate between above and below
  const eventsAbove: Array<{ event: TimelineEvent; property: Property }> = [];
  const eventsBelow: Array<{ event: TimelineEvent; property: Property }> = [];

  allEvents.forEach((item, index) => {
    // Alternate: even indices go above, odd go below
    // But prioritize certain event types above
    const priorityAbove = ['purchase', 'sale', 'improvement', 'refinance'].includes(item.event.type);

    if (priorityAbove || index % 2 === 0) {
      eventsAbove.push(item as { event: TimelineEvent; property: Property });
    } else {
      eventsBelow.push(item as { event: TimelineEvent; property: Property });
    }
  });

  // Calculate vertical tiers to prevent overlap (for events above)
  const calculateTiers = (eventList: Array<{ event: TimelineEvent; property: Property }>) => {
    const tiers = new Map<string, number>();
    const overlapThreshold = 12; // Position percentage threshold for overlap

    eventList.forEach((item, index) => {
      const eventPos = getDatePosition(item.event.date);
      let tier = 0;

      for (let i = 0; i < index; i++) {
        const prevItem = eventList[i];
        const prevPos = getDatePosition(prevItem.event.date);
        const prevTier = tiers.get(prevItem.event.id) || 0;

        if (Math.abs(eventPos - prevPos) < overlapThreshold && tier === prevTier) {
          tier = prevTier + 1;
        }
      }
      tiers.set(item.event.id, tier);
    });

    return tiers;
  };

  const tiersAbove = calculateTiers(eventsAbove);
  const tiersBelow = calculateTiers(eventsBelow);

  const maxTierAbove = eventsAbove.length > 0 ? Math.max(...Array.from(tiersAbove.values())) : 0;
  const maxTierBelow = eventsBelow.length > 0 ? Math.max(...Array.from(tiersBelow.values())) : 0;

  const TIER_HEIGHT = 80;
  const ABOVE_HEIGHT = (maxTierAbove + 1) * TIER_HEIGHT + 60;
  const BELOW_HEIGHT = (maxTierBelow + 1) * TIER_HEIGHT + 60;

  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg overflow-auto">
      {/* Main Content */}
      <div className="relative min-w-[1200px] p-12">
        <div className="max-w-[1400px] mx-auto">
          {/* Events Above Timeline */}
          <div className="relative" style={{ height: `${ABOVE_HEIGHT}px`, marginBottom: '20px' }}>
            {eventsAbove.map((item) => {
              const position = getDatePosition(item.event.date);
              const tier = tiersAbove.get(item.event.id) || 0;
              const verticalOffset = ABOVE_HEIGHT - 60 - (tier * TIER_HEIGHT);

              return (
                <div
                  key={`above-${item.event.id}`}
                  className="absolute"
                  style={{
                    left: `${position}%`,
                    bottom: `${ABOVE_HEIGHT - verticalOffset - 60}px`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  {/* Vertical connector line */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 w-px bg-slate-300 dark:bg-slate-600"
                    style={{
                      height: `${ABOVE_HEIGHT - verticalOffset - 10}px`,
                      top: '100%',
                    }}
                  />

                  {/* Connector dot at timeline */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900"
                    style={{
                      backgroundColor: item.event.color,
                      top: `${ABOVE_HEIGHT - verticalOffset - 6}px`,
                    }}
                  />

                  {/* Event card */}
                  <div
                    className="rounded-lg px-4 py-2 shadow-lg cursor-pointer hover:shadow-xl transition-all min-w-[140px] max-w-[200px]"
                    style={{ backgroundColor: item.event.color }}
                  >
                    <div className="text-xs font-bold text-white mb-0.5">
                      {format(item.event.date, 'MMM yyyy')}
                    </div>
                    <div className="text-sm font-semibold text-white truncate">
                      {item.event.title}
                    </div>
                    <div className="text-xs text-white/80 truncate mt-0.5">
                      {item.property!.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline Axis */}
          <div className="relative h-1 bg-slate-400 dark:bg-slate-600 rounded-full my-8">
            {/* Arrow at the end */}
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-l-8 border-t-4 border-b-4 border-l-slate-400 dark:border-l-slate-600 border-t-transparent border-b-transparent" />
          </div>

          {/* Events Below Timeline */}
          <div className="relative" style={{ height: `${BELOW_HEIGHT}px`, marginTop: '20px' }}>
            {eventsBelow.map((item) => {
              const position = getDatePosition(item.event.date);
              const tier = tiersBelow.get(item.event.id) || 0;
              const verticalOffset = tier * TIER_HEIGHT;

              return (
                <div
                  key={`below-${item.event.id}`}
                  className="absolute"
                  style={{
                    left: `${position}%`,
                    top: `${verticalOffset + 20}px`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  {/* Vertical connector line */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 w-px bg-slate-300 dark:bg-slate-600"
                    style={{
                      height: `${verticalOffset + 20}px`,
                      bottom: '100%',
                    }}
                  />

                  {/* Connector dot at timeline */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-slate-800 dark:bg-slate-200 border-2 border-white dark:border-slate-900"
                    style={{
                      bottom: `${verticalOffset + 14}px`,
                    }}
                  />

                  {/* Event label */}
                  <div className="text-center min-w-[140px] max-w-[200px]">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      {format(item.event.date, 'MMM yyyy')}
                    </div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {item.event.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {item.property!.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {allEvents.length === 0 && (
            <div className="text-center py-16 text-slate-400 dark:text-slate-600">
              <p className="text-lg font-semibold">No events to display</p>
              <p className="text-sm mt-2">Add events to see the dual axis timeline</p>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      {allEvents.length > 0 && (
        <div className="px-12 pb-8">
          <div className="max-w-[1400px] mx-auto pt-8 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              Timeline Legend
            </div>
            <div className="flex items-center gap-6 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500" />
                <span>Above: Major events (purchases, sales, improvements)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-800 dark:bg-slate-200" />
                <span>Below: Secondary events (transitions, status changes)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
