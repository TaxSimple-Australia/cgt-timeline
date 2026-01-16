import { Property, TimelineEvent, EventType } from '@/store/timeline';
import { format, differenceInDays, differenceInMonths, differenceInYears } from 'date-fns';

/**
 * Portfolio Statistics
 */
export interface PortfolioStats {
  propertyCount: number;
  timelineSpan: string;
  spanYears: number;
  totalEvents: number;
  eventBreakdown: Record<EventType, number>;
  statusBreakdown: Record<string, number>;
}

export const calculatePortfolioStats = (
  properties: Property[],
  events: TimelineEvent[],
  absoluteStart: Date,
  absoluteEnd: Date
): PortfolioStats => {
  const spanYears = differenceInYears(absoluteEnd, absoluteStart);
  const timelineSpan = `${format(absoluteStart, 'MMM yyyy')} - ${format(absoluteEnd, 'MMM yyyy')} (${spanYears} ${spanYears === 1 ? 'year' : 'years'})`;

  // Event breakdown by type
  const eventBreakdown: Record<EventType, number> = {
    purchase: 0,
    sale: 0,
    move_in: 0,
    move_out: 0,
    rent_start: 0,
    rent_end: 0,
    improvement: 0,
    refinance: 0,
    status_change: 0,
    vacant_start: 0,
    vacant_end: 0,
    ownership_change: 0,
    subdivision: 0,
    custom: 0,
  };

  events.forEach((event) => {
    if (eventBreakdown[event.type] !== undefined) {
      eventBreakdown[event.type]++;
    }
  });

  // Status breakdown
  const statusBreakdown: Record<string, number> = {};
  properties.forEach((property) => {
    const status = property.currentStatus || 'unknown';
    statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
  });

  return {
    propertyCount: properties.length,
    timelineSpan,
    spanYears,
    totalEvents: events.length,
    eventBreakdown,
    statusBreakdown,
  };
};

/**
 * Get event type breakdown as formatted string
 */
export const getEventTypeBreakdownText = (eventBreakdown: Record<EventType, number>): string => {
  const parts: string[] = [];

  if (eventBreakdown.purchase > 0) parts.push(`Purchases: ${eventBreakdown.purchase}`);
  if (eventBreakdown.sale > 0) parts.push(`Sales: ${eventBreakdown.sale}`);
  if (eventBreakdown.improvement > 0) parts.push(`Improvements: ${eventBreakdown.improvement}`);

  const occupancyEvents =
    eventBreakdown.move_in +
    eventBreakdown.move_out +
    eventBreakdown.rent_start +
    eventBreakdown.rent_end +
    eventBreakdown.vacant_start +
    eventBreakdown.vacant_end;

  if (occupancyEvents > 0) parts.push(`Occupancy: ${occupancyEvents}`);

  return parts.join(' | ');
};

/**
 * Calculate date position as percentage (0-100) with optional edge margins
 */
export const getDatePosition = (
  date: Date,
  absoluteStart: Date,
  absoluteEnd: Date,
  edgeMargin: number = 5
): number => {
  const totalRange = absoluteEnd.getTime() - absoluteStart.getTime();
  const offset = date.getTime() - absoluteStart.getTime();
  const basePosition = (offset / totalRange) * 100;

  // Scale to fit within margins
  return edgeMargin + (basePosition * (100 - 2 * edgeMargin) / 100);
};

/**
 * Calculate property ownership duration
 */
export const getPropertyDuration = (property: Property, absoluteEnd: Date): {
  days: number;
  months: number;
  years: number;
  formatted: string;
} => {
  const startDate = property.purchaseDate || new Date();
  const endDate = property.saleDate || absoluteEnd;

  const days = differenceInDays(endDate, startDate);
  const months = differenceInMonths(endDate, startDate);
  const years = differenceInYears(endDate, startDate);

  let formatted: string;
  if (years > 0) {
    const remainingMonths = months - (years * 12);
    formatted = remainingMonths > 0
      ? `${years}y ${remainingMonths}m`
      : `${years}y`;
  } else if (months > 0) {
    formatted = `${months}m`;
  } else {
    formatted = `${days}d`;
  }

  return { days, months, years, formatted };
};

/**
 * Format timeline span string
 */
export const formatTimelineSpan = (start: Date, end: Date): string => {
  const years = differenceInYears(end, start);
  const months = differenceInMonths(end, start) - (years * 12);

  if (years > 0 && months > 0) {
    return `${years} ${years === 1 ? 'year' : 'years'}, ${months} ${months === 1 ? 'month' : 'months'}`;
  } else if (years > 0) {
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  } else if (months > 0) {
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  } else {
    const days = differenceInDays(end, start);
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }
};

/**
 * Get event icon for display
 */
export const getEventIcon = (type: EventType): string => {
  const icons: Record<EventType, string> = {
    purchase: '🏠',
    sale: '💰',
    move_in: '📦',
    move_out: '🚚',
    rent_start: '🔑',
    rent_end: '🔐',
    improvement: '🔨',
    refinance: '🏦',
    status_change: '📋',
    vacant_start: '🏚️',
    vacant_end: '🏢',
    ownership_change: '👥',
    subdivision: '✂️',
    custom: '⭐',
  };

  return icons[type] || '•';
};

/**
 * Get short event name for labels
 */
export const getShortEventName = (type: EventType): string => {
  const names: Record<EventType, string> = {
    purchase: 'Purchase',
    sale: 'Sale',
    move_in: 'Move In',
    move_out: 'Move Out',
    rent_start: 'Rent',
    rent_end: 'End Rent',
    improvement: 'Improve',
    refinance: 'Refinance',
    status_change: 'Status',
    vacant_start: 'Vacant',
    vacant_end: 'End Vacant',
    ownership_change: 'Ownership',
    subdivision: 'Subdivision',
    custom: 'Custom',
  };

  return names[type] || type;
};

/**
 * Get full event name
 */
export const getFullEventName = (type: EventType): string => {
  const names: Record<EventType, string> = {
    purchase: 'Property Purchase',
    sale: 'Property Sale',
    move_in: 'Moved In',
    move_out: 'Moved Out',
    rent_start: 'Rental Started',
    rent_end: 'Rental Ended',
    improvement: 'Capital Improvement',
    refinance: 'Refinanced',
    status_change: 'Status Change',
    vacant_start: 'Vacancy Started',
    vacant_end: 'Vacancy Ended',
    ownership_change: 'Change of Ownership',
    subdivision: 'Property Subdivision',
    custom: 'Custom Event',
  };

  return names[type] || type;
};

/**
 * Format event date
 */
export const formatEventDate = (date: Date): string => {
  return format(date, 'MMM dd, yyyy');
};

/**
 * Generate year markers for timeline
 */
export const generateYearMarkers = (
  absoluteStart: Date,
  absoluteEnd: Date
): Array<{ year: number; position: number }> => {
  const startYear = absoluteStart.getFullYear();
  const endYear = absoluteEnd.getFullYear();
  const yearCount = endYear - startYear + 1;

  // Determine interval based on span
  const interval = yearCount > 20 ? 5 : yearCount > 10 ? 2 : 1;

  const markers: Array<{ year: number; position: number }> = [];

  for (let year = startYear; year <= endYear; year += interval) {
    const yearDate = new Date(year, 0, 1);
    const position = getDatePosition(yearDate, absoluteStart, absoluteEnd, 5);
    markers.push({ year, position });
  }

  return markers;
};

/**
 * Calculate event tiers for vertical stacking when events overlap
 */
export const calculateEventTiers = (
  propertyEvents: TimelineEvent[],
  absoluteStart: Date,
  absoluteEnd: Date,
  overlapThreshold: number = 8
): Map<string, number> => {
  const sortedEvents = [...propertyEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
  const tiers = new Map<string, number>();

  sortedEvents.forEach((event, index) => {
    const eventPos = getDatePosition(event.date, absoluteStart, absoluteEnd);
    let tier = 0;

    for (let i = 0; i < index; i++) {
      const prevEvent = sortedEvents[i];
      const prevPos = getDatePosition(prevEvent.date, absoluteStart, absoluteEnd);
      const prevTier = tiers.get(prevEvent.id) || 0;

      if (Math.abs(eventPos - prevPos) < overlapThreshold && tier === prevTier) {
        tier = prevTier + 1;
      }
    }
    tiers.set(event.id, tier);
  });

  return tiers;
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number): string => {
  return `$${amount.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

/**
 * Get status color
 */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    ppr: '#10b981', // green
    rental: '#3b82f6', // blue
    vacant: '#9ca3af', // gray
    construction: '#f59e0b', // orange
    sold: '#8b5cf6', // purple
  };

  return colors[status] || '#64748b';
};

/**
 * Get status label
 */
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    ppr: 'Main Residence',
    rental: 'Rental',
    vacant: 'Vacant',
    construction: 'Under Construction',
    sold: 'Sold',
  };

  return labels[status] || status;
};
