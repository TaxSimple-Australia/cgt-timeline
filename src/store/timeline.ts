import { create } from 'zustand';
import { addDays, format } from 'date-fns';
import type { AIResponse, TimelineIssue } from '../types/ai-feedback';
import type { CostBaseCategory } from '../lib/cost-base-definitions';

export type EventType =
  | 'purchase'
  | 'move_in'
  | 'move_out'
  | 'rent_start'
  | 'rent_end'
  | 'sale'
  | 'improvement'
  | 'refinance'
  | 'status_change'
  | 'living_in_rental_start'  // Person starts living in a rental they don't own
  | 'living_in_rental_end';    // Person stops living in a rental they don't own

export type PropertyStatus =
  | 'ppr'              // Main Residence (owner lives in it)
  | 'rental'           // Rented to tenants
  | 'vacant'           // Empty/not used
  | 'construction'     // Being built/renovated
  | 'sold'             // Sold
  | 'living_in_rental'; // Person living in a rental they don't own

/**
 * Dynamic cost base item for CGT calculations
 */
export interface CostBaseItem {
  id: string;                  // Unique identifier for this cost base entry
  definitionId: string;        // References COST_BASE_DEFINITIONS id, or 'custom' for user-created
  name: string;                // Display name (e.g., "Stamp Duty", "Custom Legal Fees")
  amount: number;              // Cost amount in dollars
  category: CostBaseCategory;  // Which of the 5 CGT elements this belongs to
  isCustom: boolean;           // true if user-created, false if from predefined list
  description?: string;        // Optional notes about this cost
}

export interface TimelineEvent {
  id: string;
  propertyId: string;
  type: EventType;
  date: Date;
  title: string;
  amount?: number;
  description?: string;
  position: number; // Position on timeline (0-100) - kept for drag compatibility
  color: string;
  // CGT-specific fields
  contractDate?: Date;      // For sales - contract date vs settlement
  settlementDate?: Date;    // Actual settlement date
  newStatus?: PropertyStatus; // For status_change events
  isPPR?: boolean;          // Is this event related to Main Residence?
  // Price breakdown for purchases (land + building)
  landPrice?: number;       // Price of land component
  buildingPrice?: number;   // Price of building component

  // NEW: Dynamic Cost Base Items
  costBases?: CostBaseItem[];  // Array of cost base items for this event

  // DEPRECATED: Legacy cost base fields (kept for backward compatibility during migration)
  /** @deprecated Use costBases array instead */
  purchaseLegalFees?: number;
  /** @deprecated Use costBases array instead */
  valuationFees?: number;
  /** @deprecated Use costBases array instead */
  stampDuty?: number;
  /** @deprecated Use costBases array instead */
  purchaseAgentFees?: number;
  /** @deprecated Use costBases array instead */
  landTax?: number;
  /** @deprecated Use costBases array instead */
  insurance?: number;
  /** @deprecated Use costBases array instead */
  improvementCost?: number;
  /** @deprecated Use costBases array instead */
  titleLegalFees?: number;
  /** @deprecated Use costBases array instead */
  saleLegalFees?: number;
  /** @deprecated Use costBases array instead */
  saleAgentFees?: number;
  /** @deprecated Use costBases array instead */
  marketValuation?: number;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  color: string;
  purchasePrice?: number;
  purchaseDate?: Date;
  currentValue?: number;
  salePrice?: number;
  saleDate?: Date;
  currentStatus?: PropertyStatus;
  branch: number; // Y-position for branch visualization
  isRental?: boolean; // Is this a rental property you don't own?
}

export type ZoomLevel =
  | '30-years'    // 30 years
  | 'decade'      // 10-30 years
  | 'multi-year'  // 5-10 years
  | 'years'       // 2-5 years
  | 'year'        // 1-2 years
  | 'months'      // 6-12 months
  | 'month'       // 3-6 months
  | 'weeks'       // 1-3 months
  | 'days';       // < 1 month

export type EventDisplayMode = 'circle' | 'card';

export type Theme = 'light' | 'dark';

interface TimelineState {
  properties: Property[];
  events: TimelineEvent[];
  selectedProperty: string | null;
  selectedEvent: string | null;
  lastInteractedEventId: string | null; // Last selected, edited, or added event
  timelineStart: Date; // Currently visible start
  timelineEnd: Date; // Currently visible end
  absoluteStart: Date; // Earliest possible date (based on data)
  absoluteEnd: Date; // Latest possible date (today)
  zoom: number;
  zoomLevel: ZoomLevel;
  centerDate: Date; // The date at the center of the viewport
  theme: Theme; // Current theme: light, dark, or golden
  eventDisplayMode: EventDisplayMode; // Toggle between circle and card display
  lockFutureDates: boolean; // Prevent panning beyond today's date
  enableDragEvents: boolean; // Allow dragging events along timeline to change dates

  // AI Feedback State
  aiResponse: AIResponse | null; // Latest AI analysis response
  timelineIssues: TimelineIssue[]; // Processed issues for UI display
  selectedIssue: string | null; // Currently viewing issue details
  isAnalyzing: boolean; // Loading state during AI analysis

  // Actions
  addProperty: (property: Omit<Property, 'id' | 'branch'>) => void;
  updateProperty: (id: string, property: Partial<Property>) => void;
  deleteProperty: (id: string) => void;

  addEvent: (event: Omit<TimelineEvent, 'id'>) => void;
  updateEvent: (id: string, event: Partial<TimelineEvent>) => void;
  deleteEvent: (id: string) => void;
  moveEvent: (id: string, newPosition: number) => void;

  selectProperty: (id: string | null) => void;
  selectEvent: (id: string | null) => void;

  setZoom: (zoom: number) => void;
  setTimelineRange: (start: Date, end: Date) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setZoomByIndex: (index: number) => void; // Set zoom level by index (0-8)
  getZoomLevelIndex: () => number; // Get current zoom level index (0-8)
  setCenterDate: (date: Date) => void;
  panToPosition: (position: number) => void; // Position 0-100 on absolute timeline
  loadDemoData: () => void; // Load demo data from Excel sheet
  clearAllData: () => void; // Clear all properties and events
  importTimelineData: (data: any) => void; // Import timeline data from JSON
  toggleTheme: () => void; // Cycle through themes: light -> dark -> golden -> light
  toggleEventDisplayMode: () => void; // Toggle between circle and card display
  toggleLockFutureDates: () => void; // Toggle lock future dates setting
  toggleDragEvents: () => void; // Toggle event dragging functionality

  // AI Feedback Actions
  setAIResponse: (response: AIResponse) => void; // Store AI analysis response
  selectIssue: (issueId: string | null) => void; // Select issue for viewing
  resolveIssue: (issueId: string, response: string) => void; // Mark issue resolved with user response
  clearAIFeedback: () => void; // Clear all AI feedback
  analyzePortfolio: () => Promise<void>; // Trigger AI analysis of current timeline
}

const propertyColors = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#14B8A6', // Teal
];

const eventColors: Record<EventType, string> = {
  purchase: '#3B82F6',
  move_in: '#10B981',
  move_out: '#EF4444',
  rent_start: '#F59E0B',
  rent_end: '#F97316',
  sale: '#8B5CF6',
  improvement: '#06B6D4',
  refinance: '#6366F1',
  status_change: '#A855F7',
  living_in_rental_start: '#F472B6',  // Pink - Start living in rental
  living_in_rental_end: '#FB923C',    // Orange - End living in rental
};

// Status colors for visualization
export const statusColors: Record<PropertyStatus, string> = {
  ppr: '#10B981',         // Green - Main Residence
  rental: '#3B82F6',      // Blue - Rental/Investment
  vacant: '#94A3B8',      // Gray - Vacant
  construction: '#F59E0B', // Orange - Under construction
  sold: '#8B5CF6',        // Purple - Sold
  living_in_rental: '#F472B6', // Pink - Living in rental (not owned)
};

// Zoom level definitions with their time spans in days
export const zoomLevels: Array<{ level: ZoomLevel; minDays: number; maxDays: number; label: string }> = [
  { level: '30-years', minDays: 10950, maxDays: Infinity, label: '30 Years' },
  { level: 'decade', minDays: 3650, maxDays: 10950, label: '10-30 Years' },
  { level: 'multi-year', minDays: 1825, maxDays: 3650, label: '5-10 Years' },
  { level: 'years', minDays: 730, maxDays: 1825, label: '2-5 Years' },
  { level: 'year', minDays: 365, maxDays: 730, label: '1-2 Years' },
  { level: 'months', minDays: 180, maxDays: 365, label: '6-12 Months' },
  { level: 'month', minDays: 90, maxDays: 180, label: '3-6 Months' },
  { level: 'weeks', minDays: 30, maxDays: 90, label: '1-3 Months' },
  { level: 'days', minDays: 0, maxDays: 30, label: '< 1 Month' },
];

// Calculate zoom level from date range
const calculateZoomLevel = (start: Date, end: Date): ZoomLevel => {
  const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  for (const { level, minDays, maxDays } of zoomLevels) {
    if (days >= minDays && days < maxDays) {
      return level;
    }
  }

  return '30-years';
};

// Get next zoom level (more detailed)
const getNextZoomLevel = (current: ZoomLevel): ZoomLevel | null => {
  const currentIndex = zoomLevels.findIndex(z => z.level === current);
  if (currentIndex < zoomLevels.length - 1) {
    return zoomLevels[currentIndex + 1].level;
  }
  return null;
};

// Get previous zoom level (less detailed)
const getPreviousZoomLevel = (current: ZoomLevel): ZoomLevel | null => {
  const currentIndex = zoomLevels.findIndex(z => z.level === current);
  if (currentIndex > 0) {
    return zoomLevels[currentIndex - 1].level;
  }
  return null;
};

// Calculate date range for a zoom level centered on a date
const calculateDateRange = (centerDate: Date, targetLevel: ZoomLevel): { start: Date; end: Date } => {
  const zoomConfig = zoomLevels.find(z => z.level === targetLevel);
  if (!zoomConfig) return { start: new Date(), end: new Date() };

  // Use the midpoint of the range for this zoom level
  const targetDays = Math.floor((zoomConfig.minDays + Math.min(zoomConfig.maxDays, 7300)) / 2);
  const halfSpan = (targetDays / 2) * 24 * 60 * 60 * 1000;

  const start = new Date(centerDate.getTime() - halfSpan);
  const end = new Date(centerDate.getTime() + halfSpan);

  // Don't allow end date to be in the future
  const today = new Date();
  if (end > today) {
    const diff = end.getTime() - today.getTime();
    return {
      start: new Date(start.getTime() - diff),
      end: today
    };
  }

  return { start, end };
};

// Calculate property status periods from events
export interface StatusPeriod {
  status: PropertyStatus;
  startDate: Date;
  endDate: Date | null; // null means ongoing
}

export const calculateStatusPeriods = (events: TimelineEvent[]): StatusPeriod[] => {
  const periods: StatusPeriod[] = [];

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());

  let currentStatus: PropertyStatus | null = null;
  let currentStartDate: Date | null = null;

  for (const event of sortedEvents) {
    // Determine status change from event
    let newStatus: PropertyStatus | null = null;

    switch (event.type) {
      case 'purchase':
        newStatus = event.isPPR ? 'ppr' : 'rental';
        break;
      case 'move_in':
        newStatus = 'ppr';
        break;
      case 'move_out':
        // After moving out, property might be vacant or rented
        newStatus = 'vacant';
        break;
      case 'rent_start':
        newStatus = 'rental';
        break;
      case 'rent_end':
        newStatus = 'vacant';
        break;
      case 'living_in_rental_start':
        // Person starts living in a rental they don't own
        newStatus = 'living_in_rental';
        break;
      case 'living_in_rental_end':
        // Person stops living in the rental
        newStatus = 'vacant';
        break;
      case 'sale':
        newStatus = 'sold';
        break;
      case 'status_change':
        newStatus = event.newStatus || null;
        break;
    }

    // If status changed, close previous period and start new one
    if (newStatus && newStatus !== currentStatus) {
      if (currentStatus && currentStartDate) {
        periods.push({
          status: currentStatus,
          startDate: currentStartDate,
          endDate: event.date,
        });
      }

      currentStatus = newStatus;
      currentStartDate = event.date;
    }
  }

  // Add final ongoing period
  if (currentStatus && currentStartDate) {
    periods.push({
      status: currentStatus,
      startDate: currentStartDate,
      endDate: null,
    });
  }

  return periods;
};

const defaultAbsoluteStart = new Date(1900, 0, 1);
const defaultAbsoluteEnd = new Date();

export const useTimelineStore = create<TimelineState>((set, get) => {
  // Calculate initial 30-year range
  const today = new Date();
  const thirtyYearsAgo = new Date(today);
  thirtyYearsAgo.setFullYear(today.getFullYear() - 30);

  return {
    properties: [],
    events: [],
    selectedProperty: null,
    selectedEvent: null,
    lastInteractedEventId: null,
    timelineStart: thirtyYearsAgo,
    timelineEnd: today,
    absoluteStart: defaultAbsoluteStart,
    absoluteEnd: defaultAbsoluteEnd,
    zoom: 1,
    zoomLevel: calculateZoomLevel(thirtyYearsAgo, today),
    centerDate: new Date(
      (thirtyYearsAgo.getTime() + today.getTime()) / 2
    ),
    theme: 'dark',
    eventDisplayMode: 'card',
    lockFutureDates: true,
    enableDragEvents: true,

    // AI Feedback Initial State
    aiResponse: null,
    timelineIssues: [],
    selectedIssue: null,
    isAnalyzing: false,

  addProperty: (property) => {
    const properties = get().properties;
    const newProperty: Property = {
      ...property,
      id: `prop-${Date.now()}`,
      color: property.color || propertyColors[properties.length % propertyColors.length],
      branch: properties.length,
    };
    set({ properties: [...properties, newProperty] });
  },
  
  updateProperty: (id, updates) => {
    set((state) => ({
      properties: state.properties.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  },
  
  deleteProperty: (id) => {
    set((state) => ({
      properties: state.properties.filter((p) => p.id !== id),
      events: state.events.filter((e) => e.propertyId !== id),
    }));
  },
  
  addEvent: (event) => {
    const newEvent: TimelineEvent = {
      ...event,
      id: `event-${Date.now()}`,
      color: event.color || eventColors[event.type],
    };
    set((state) => ({
      events: [...state.events, newEvent],
      lastInteractedEventId: newEvent.id,
      centerDate: newEvent.date
    }));
  },
  
  updateEvent: (id, updates) => {
    set((state) => {
      const updatedEvents = state.events.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      );
      const updatedEvent = updatedEvents.find(e => e.id === id);
      return {
        events: updatedEvents,
        lastInteractedEventId: id,
        centerDate: updatedEvent?.date || state.centerDate
      };
    });
  },
  
  deleteEvent: (id) => {
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
    }));
  },
  
  moveEvent: (id, newPosition) => {
    const state = get();
    const event = state.events.find((e) => e.id === id);
    if (!event) return;
    
    const timelineRange = state.timelineEnd.getTime() - state.timelineStart.getTime();
    const newTime = state.timelineStart.getTime() + (newPosition / 100) * timelineRange;
    const newDate = new Date(newTime);
    
    set((state) => ({
      events: state.events.map((e) =>
        e.id === id ? { ...e, position: newPosition, date: newDate } : e
      ),
    }));
  },
  
  selectProperty: (id) => set({ selectedProperty: id }),
  selectEvent: (id) => {
    const state = get();
    const event = state.events.find(e => e.id === id);
    set({
      selectedEvent: id,
      lastInteractedEventId: id,
      centerDate: event?.date || state.centerDate
    });
  },

  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(3, zoom)) }),

  setTimelineRange: (start, end) => {
    const state = get();
    const newCenterDate = new Date((start.getTime() + end.getTime()) / 2);
    const newZoomLevel = calculateZoomLevel(start, end);

    // Expand absolute range if needed to accommodate the new range
    const newAbsoluteStart = start < state.absoluteStart ? start : state.absoluteStart;
    const newAbsoluteEnd = end > state.absoluteEnd ? end : state.absoluteEnd;

    set({
      timelineStart: start,
      timelineEnd: end,
      centerDate: newCenterDate,
      zoomLevel: newZoomLevel,
      absoluteStart: newAbsoluteStart,
      absoluteEnd: newAbsoluteEnd,
    });
  },

  setCenterDate: (date) => set({ centerDate: date }),

  zoomIn: () => {
    const state = get();
    const nextLevel = getNextZoomLevel(state.zoomLevel);

    if (nextLevel) {
      // Smart zoom: Focus on last interacted event if available
      let focusDate = state.centerDate;

      if (state.lastInteractedEventId) {
        const lastEvent = state.events.find(e => e.id === state.lastInteractedEventId);
        if (lastEvent) {
          focusDate = lastEvent.date;
        }
      }

      const { start, end } = calculateDateRange(focusDate, nextLevel);
      set({
        timelineStart: start,
        timelineEnd: end,
        zoomLevel: nextLevel,
        centerDate: focusDate,
      });
    }
  },

  zoomOut: () => {
    const state = get();
    const prevLevel = getPreviousZoomLevel(state.zoomLevel);

    if (prevLevel) {
      // Smart zoom: Focus on last interacted event if available
      let focusDate = state.centerDate;

      if (state.lastInteractedEventId) {
        const lastEvent = state.events.find(e => e.id === state.lastInteractedEventId);
        if (lastEvent) {
          focusDate = lastEvent.date;
        }
      }

      const { start, end } = calculateDateRange(focusDate, prevLevel);
      set({
        timelineStart: start,
        timelineEnd: end,
        zoomLevel: prevLevel,
        centerDate: focusDate,
      });
    }
  },

  setZoomByIndex: (index: number) => {
    const state = get();
    const clampedIndex = Math.max(0, Math.min(zoomLevels.length - 1, index));
    const targetLevel = zoomLevels[clampedIndex].level;

    if (targetLevel !== state.zoomLevel) {
      // Smart zoom: Focus on last interacted event if available
      let focusDate = state.centerDate;

      if (state.lastInteractedEventId) {
        const lastEvent = state.events.find(e => e.id === state.lastInteractedEventId);
        if (lastEvent) {
          focusDate = lastEvent.date;
        }
      }

      const { start, end } = calculateDateRange(focusDate, targetLevel);
      set({
        timelineStart: start,
        timelineEnd: end,
        zoomLevel: targetLevel,
        centerDate: focusDate,
      });
    }
  },

  getZoomLevelIndex: () => {
    const state = get();
    return zoomLevels.findIndex(z => z.level === state.zoomLevel);
  },

  panToPosition: (position: number) => {
    const state = get();
    const absoluteRange = state.absoluteEnd.getTime() - state.absoluteStart.getTime();
    const newCenterTime = state.absoluteStart.getTime() + (position / 100) * absoluteRange;
    const newCenterDate = new Date(newCenterTime);

    const { start, end } = calculateDateRange(newCenterDate, state.zoomLevel);

    set({
      timelineStart: start,
      timelineEnd: end,
      centerDate: newCenterDate,
    });
  },

  loadDemoData: () => {
    const demoProperties: Property[] = [];
    const demoEvents: TimelineEvent[] = [];

    // Property 1: First main residence (2010-2015)
    const prop1 = {
      id: 'demo-prop-1',
      name: 'Humpty Doo, NT 0836',
      address: '45 Collard Road',
      color: propertyColors[0],
      purchasePrice: 106000,
      purchaseDate: new Date(2010, 0, 1),
      salePrice: 250000,
      saleDate: new Date(2016, 5, 1),
      currentStatus: 'sold' as PropertyStatus,
      branch: 0,
    };
    demoProperties.push(prop1);

    // Events for Property 1 - Lived here 2010-2015, then moved out
    demoEvents.push({
      id: 'demo-event-1-1',
      propertyId: prop1.id,
      type: 'purchase',
      date: new Date(2010, 0, 1),
      title: 'Purchase',
      amount: 106000,
      position: 0,
      color: eventColors.purchase,
      isPPR: true,
    });

    demoEvents.push({
      id: 'demo-event-1-2',
      propertyId: prop1.id,
      type: 'move_in',
      date: new Date(2010, 0, 1),
      title: 'Move In',
      position: 0,
      color: eventColors.move_in,
      isPPR: true,
    });

    demoEvents.push({
      id: 'demo-event-1-3',
      propertyId: prop1.id,
      type: 'move_out',
      date: new Date(2015, 11, 31), // Dec 31, 2015
      title: 'Move Out',
      position: 0,
      color: eventColors.move_out,
      description: 'Moved out - creates GAP until Jul 1, 2016',
    });

    demoEvents.push({
      id: 'demo-event-1-4',
      propertyId: prop1.id,
      type: 'sale',
      date: new Date(2016, 5, 1), // Jun 1, 2016
      title: 'Sold',
      amount: 250000,
      position: 0,
      color: eventColors.sale,
      contractDate: new Date(2016, 5, 1),
    });

    // Property 2: 50 Flynn Circuit, Bellamack
    const prop2 = {
      id: 'demo-prop-2',
      name: 'Bellamack, NT 0832',
      address: '50 Flynn Circuit',
      color: propertyColors[1],
      purchasePrice: 705000,
      purchaseDate: new Date(2014, 5, 5),
      currentStatus: 'rental' as PropertyStatus,
      branch: 1,
    };
    demoProperties.push(prop2);

    demoEvents.push({
      id: 'demo-event-2-1',
      propertyId: prop2.id,
      type: 'purchase',
      date: new Date(2014, 5, 5),
      title: 'Purchase',
      amount: 705000,
      position: 0,
      color: eventColors.purchase,
    });

    demoEvents.push({
      id: 'demo-event-2-2',
      propertyId: prop2.id,
      type: 'rent_start',
      date: new Date(2014, 5, 20),
      title: 'Start Rent',
      position: 0,
      color: eventColors.rent_start,
    });

    // Property 3: Second main residence (2019-2020, then 2021-present)
    const prop3 = {
      id: 'demo-prop-3',
      name: 'Boyne Island, Qld 4680',
      address: '5 Wanda Dr',
      color: propertyColors[2],
      purchasePrice: 530000,
      purchaseDate: new Date(2019, 2, 1), // Mar 1, 2019
      currentStatus: 'ppr' as PropertyStatus,
      branch: 2,
    };
    demoProperties.push(prop3);

    demoEvents.push({
      id: 'demo-event-3-1',
      propertyId: prop3.id,
      type: 'purchase',
      date: new Date(2019, 2, 1), // Mar 1, 2019
      title: 'Purchase',
      amount: 530000,
      position: 0,
      color: eventColors.purchase,
      isPPR: true,
    });

    demoEvents.push({
      id: 'demo-event-3-2',
      propertyId: prop3.id,
      type: 'move_in',
      date: new Date(2019, 3, 1), // Apr 1, 2019 - GAP 2 ended
      title: 'Move In',
      position: 0,
      color: eventColors.move_in,
      isPPR: true,
      description: '3 month GAP before moving in',
    });

    demoEvents.push({
      id: 'demo-event-3-3',
      propertyId: prop3.id,
      type: 'move_out',
      date: new Date(2020, 11, 31), // Dec 31, 2020
      title: 'Move Out',
      position: 0,
      color: eventColors.move_out,
      description: 'Moved out temporarily - creates GAP 3 until Jul 1, 2021',
    });

    demoEvents.push({
      id: 'demo-event-3-4',
      propertyId: prop3.id,
      type: 'move_in',
      date: new Date(2021, 6, 1), // Jul 1, 2021 - GAP 3 ended
      title: 'Move In (Return)',
      position: 0,
      color: eventColors.move_in,
      isPPR: true,
      description: 'Moved back in after 6 month GAP',
    });

    demoEvents.push({
      id: 'demo-event-3-5',
      propertyId: prop3.id,
      type: 'improvement',
      date: new Date(2022, 3, 15),
      title: 'Renovation',
      amount: 45000,
      position: 0,
      color: eventColors.improvement,
      description: 'Kitchen and bathroom renovation',
    });

    // Property 4: First Rental Period (2016-2018) - After GAP 1
    const prop4 = {
      id: 'demo-prop-4',
      name: 'First Rental, Qld 4680',
      address: 'Rental Property 1',
      color: propertyColors[3],
      currentStatus: 'living_in_rental' as PropertyStatus,
      isRental: true,
      branch: 3,
    };
    demoProperties.push(prop4);

    demoEvents.push({
      id: 'demo-event-4-1',
      propertyId: prop4.id,
      type: 'living_in_rental_start',
      date: new Date(2016, 6, 1), // Jul 1, 2016 - GAP 1 ended
      title: 'Living in Rental (Start)',
      position: 0,
      color: eventColors.living_in_rental_start,
      description: 'Started living in rental - 6 month GAP before this',
    });

    demoEvents.push({
      id: 'demo-event-4-2',
      propertyId: prop4.id,
      type: 'living_in_rental_end',
      date: new Date(2018, 11, 31), // Dec 31, 2018
      title: 'Living in Rental (End)',
      position: 0,
      color: eventColors.living_in_rental_end,
      description: 'Ended rental - creates GAP 2 until Apr 1, 2019',
    });

    // Set the demo data with 30-year range
    const today = new Date();
    const thirtyYearsAgo = new Date(today);
    thirtyYearsAgo.setFullYear(today.getFullYear() - 30);
    const centerDate = new Date((thirtyYearsAgo.getTime() + today.getTime()) / 2);

    set({
      properties: demoProperties,
      events: demoEvents,
      timelineStart: thirtyYearsAgo,
      timelineEnd: today,
      absoluteStart: new Date(2010, 0, 1), // Updated to match new demo data start
      absoluteEnd: today,
      centerDate: centerDate,
      zoomLevel: '30-years',
    });
  },

  clearAllData: () => {
    set({
      properties: [],
      events: [],
      selectedProperty: null,
      selectedEvent: null,
      lastInteractedEventId: null,
    });
  },

  importTimelineData: (data: any) => {
    try {
      let importedProperties: Property[] = [];
      let importedEvents: TimelineEvent[] = [];

      // Check if it's the simple format (properties and events arrays)
      if (data.properties && data.events) {
        // Simple format with direct properties and events arrays
        importedProperties = data.properties.map((prop: any, index: number) => ({
          id: prop.id || `import-prop-${Date.now()}-${index}`,
          name: prop.name || 'Imported Property',
          address: prop.address || '',
          color: prop.color || propertyColors[index % propertyColors.length],
          purchasePrice: prop.purchasePrice,
          purchaseDate: prop.purchaseDate ? new Date(prop.purchaseDate) : undefined,
          currentValue: prop.currentValue,
          salePrice: prop.salePrice,
          saleDate: prop.saleDate ? new Date(prop.saleDate) : undefined,
          currentStatus: prop.currentStatus || 'ppr',
          branch: prop.branch !== undefined ? prop.branch : index,
          isRental: prop.isRental,
        }));

        importedEvents = data.events.map((event: any, index: number) => {
          // Import new costBases array if it exists, otherwise migrate from legacy fields
          let costBases: any[] | undefined = undefined;

          if (event.costBases && Array.isArray(event.costBases)) {
            // New format with costBases array
            costBases = event.costBases;
          } else {
            // Migrate from legacy fields
            const legacyMappings: Array<{
              value: any;
              definitionId: string;
            }> = [
              { value: event.purchaseLegalFees || event.purchase_legal_fees, definitionId: 'purchase_legal_fees' },
              { value: event.valuationFees || event.valuation_fees, definitionId: 'valuation_fees' },
              { value: event.stampDuty || event.stamp_duty, definitionId: 'stamp_duty' },
              { value: event.purchaseAgentFees || event.purchase_agent_fees, definitionId: 'purchase_agent_fees' },
              { value: event.landTax || event.land_tax, definitionId: 'land_tax' },
              { value: event.insurance, definitionId: 'insurance' },
              { value: event.improvementCost || event.improvement_cost, definitionId: 'renovation_whole_house' },
              { value: event.titleLegalFees || event.title_legal_fees, definitionId: 'title_legal_fees' },
              { value: event.saleLegalFees || event.sale_legal_fees, definitionId: 'sale_legal_fees' },
              { value: event.saleAgentFees || event.sale_agent_fees, definitionId: 'sale_agent_fees' },
            ];

            const migrated: any[] = [];
            legacyMappings.forEach(({ value, definitionId }) => {
              if (value && parseFloat(value) > 0) {
                const { getCostBaseDefinition } = require('../lib/cost-base-definitions');
                const definition = getCostBaseDefinition(definitionId);
                if (definition) {
                  migrated.push({
                    id: `cb-import-${definitionId}-${Date.now()}-${index}`,
                    definitionId: definition.id,
                    name: definition.name,
                    amount: parseFloat(value),
                    category: definition.category,
                    isCustom: false,
                    description: definition.description,
                  });
                }
              }
            });

            if (migrated.length > 0) {
              costBases = migrated;
            }
          }

          return {
            id: event.id || `import-event-${Date.now()}-${index}`,
            propertyId: event.propertyId,
            type: event.type as EventType,
            date: new Date(event.date),
            title: event.title || event.type,
            amount: event.amount,
            description: event.description,
            position: event.position !== undefined ? event.position : 0,
            color: event.color || eventColors[event.type as EventType] || '#3B82F6',
            contractDate: event.contractDate ? new Date(event.contractDate) : undefined,
            settlementDate: event.settlementDate ? new Date(event.settlementDate) : undefined,
            newStatus: event.newStatus,
            isPPR: event.isPPR,
            landPrice: event.landPrice,
            buildingPrice: event.buildingPrice,
            // NEW: Cost bases array
            costBases,
            // DEPRECATED: Keep legacy fields undefined (migration happens to costBases)
            marketValuation: event.marketValuation || event.market_valuation,
          };
        });
      } else if (data.properties && Array.isArray(data.properties)) {
        // Export format with property_history inside properties
        data.properties.forEach((prop: any, propIndex: number) => {
          const propertyId = `import-prop-${Date.now()}-${propIndex}`;

          // Parse address (might be combined with name)
          const addressParts = prop.address ? prop.address.split(', ') : [];
          const name = addressParts[0] || 'Imported Property';
          const address = addressParts.slice(1).join(', ');

          // Determine property status and dates from history
          let purchasePrice: number | undefined;
          let purchaseDate: Date | undefined;
          let salePrice: number | undefined;
          let saleDate: Date | undefined;
          let currentStatus: PropertyStatus = 'ppr';

          const propertyEvents: TimelineEvent[] = [];

          if (prop.property_history && Array.isArray(prop.property_history)) {
            prop.property_history.forEach((historyItem: any, eventIndex: number) => {
              const eventDate = new Date(historyItem.date);
              const eventType = historyItem.event as EventType;

              // Extract property-level info from events
              if (eventType === 'purchase' && !purchaseDate) {
                purchasePrice = historyItem.price || historyItem.land_price + historyItem.building_price;
                purchaseDate = eventDate;
              }
              if (eventType === 'sale') {
                salePrice = historyItem.price;
                saleDate = eventDate;
                currentStatus = 'sold';
              }

              // Import new costBases array if it exists, otherwise migrate from legacy fields
              let costBases: any[] | undefined = undefined;

              if (historyItem.costBases && Array.isArray(historyItem.costBases)) {
                // New format with costBases array
                costBases = historyItem.costBases;
              } else {
                // Migrate from legacy fields
                const legacyMappings: Array<{
                  value: any;
                  definitionId: string;
                }> = [
                  { value: historyItem.purchase_legal_fees, definitionId: 'purchase_legal_fees' },
                  { value: historyItem.valuation_fees, definitionId: 'valuation_fees' },
                  { value: historyItem.stamp_duty, definitionId: 'stamp_duty' },
                  { value: historyItem.purchase_agent_fees, definitionId: 'purchase_agent_fees' },
                  { value: historyItem.land_tax, definitionId: 'land_tax' },
                  { value: historyItem.insurance, definitionId: 'insurance' },
                  { value: historyItem.improvement_cost, definitionId: 'renovation_whole_house' },
                  { value: historyItem.title_legal_fees, definitionId: 'title_legal_fees' },
                  { value: historyItem.sale_legal_fees, definitionId: 'sale_legal_fees' },
                  { value: historyItem.sale_agent_fees, definitionId: 'sale_agent_fees' },
                ];

                const migrated: any[] = [];
                legacyMappings.forEach(({ value, definitionId }) => {
                  if (value && parseFloat(value) > 0) {
                    const { getCostBaseDefinition } = require('../lib/cost-base-definitions');
                    const definition = getCostBaseDefinition(definitionId);
                    if (definition) {
                      migrated.push({
                        id: `cb-import-${definitionId}-${Date.now()}-${propIndex}-${eventIndex}`,
                        definitionId: definition.id,
                        name: definition.name,
                        amount: parseFloat(value),
                        category: definition.category,
                        isCustom: false,
                        description: definition.description,
                      });
                    }
                  }
                });

                if (migrated.length > 0) {
                  costBases = migrated;
                }
              }

              // Create event
              const event: TimelineEvent = {
                id: `import-event-${Date.now()}-${propIndex}-${eventIndex}`,
                propertyId,
                type: eventType,
                date: eventDate,
                title: historyItem.description || eventType.replace('_', ' '),
                amount: historyItem.price,
                description: historyItem.description,
                position: 0,
                color: eventColors[eventType] || '#3B82F6',
                contractDate: historyItem.contract_date ? new Date(historyItem.contract_date) : undefined,
                settlementDate: historyItem.settlement_date ? new Date(historyItem.settlement_date) : undefined,
                newStatus: historyItem.new_status,
                isPPR: historyItem.is_ppr,
                landPrice: historyItem.land_price,
                buildingPrice: historyItem.building_price,
                // NEW: Cost bases array
                costBases,
                // DEPRECATED: Legacy fields are migrated to costBases
                marketValuation: historyItem.market_valuation,
              };

              propertyEvents.push(event);
            });
          }

          // Create property
          const property: Property = {
            id: propertyId,
            name,
            address,
            color: propertyColors[propIndex % propertyColors.length],
            purchasePrice,
            purchaseDate,
            salePrice,
            saleDate,
            currentStatus,
            branch: propIndex,
          };

          importedProperties.push(property);
          importedEvents.push(...propertyEvents);
        });
      }

      // Calculate timeline boundaries
      const allDates = importedEvents.map(e => e.date.getTime());
      const minDate = allDates.length > 0 ? new Date(Math.min(...allDates)) : new Date(2000, 0, 1);
      const maxDate = new Date(); // Always use today as max

      // Set the imported data
      set({
        properties: importedProperties,
        events: importedEvents,
        timelineStart: minDate,
        timelineEnd: maxDate,
        absoluteStart: minDate,
        absoluteEnd: maxDate,
        centerDate: new Date((minDate.getTime() + maxDate.getTime()) / 2),
        zoomLevel: calculateZoomLevel(minDate, maxDate),
        selectedProperty: null,
        selectedEvent: null,
        lastInteractedEventId: null,
      });
    } catch (error) {
      console.error('Error importing timeline data:', error);
      throw error;
    }
  },

  toggleTheme: () => {
    const state = get();
    // Simple toggle between dark and light
    const nextTheme: Theme = state.theme === 'dark' ? 'light' : 'dark';

    set({ theme: nextTheme });

    // Update document class for Tailwind dark mode
    if (typeof window !== 'undefined') {
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  },

  toggleEventDisplayMode: () => {
    const state = get();
    set({ eventDisplayMode: state.eventDisplayMode === 'circle' ? 'card' : 'circle' });
  },

  toggleLockFutureDates: () => {
    const state = get();
    set({ lockFutureDates: !state.lockFutureDates });
  },

  toggleDragEvents: () => {
    const state = get();
    set({ enableDragEvents: !state.enableDragEvents });
  },

  // AI Feedback Action Implementations
  setAIResponse: (response: AIResponse) => {
    const state = get();
    const { getIssuesFromResponse, isSuccessResponse } = require('../types/ai-feedback');
    type AIIssue = import('../types/ai-feedback').AIIssue;

    // Extract issues from response
    const rawIssues = getIssuesFromResponse(response);

    // Map issues to timeline issues with event/property links
    const timelineIssues: TimelineIssue[] = rawIssues.map((issue: AIIssue, index: number) => {
      const timelineIssue: TimelineIssue = {
        id: `issue-${Date.now()}-${index}`,
        severity: issue.severity,
        category: issue.category,
        message: issue.message,
        question: issue.question,
        impact: issue.impact,
        suggestion: issue.suggestion,
        resolved: false,
      };

      // Link to property if property_id exists
      if (issue.property_id) {
        const property = state.properties.find(p => p.address === issue.property_id || p.name === issue.property_id);
        if (property) {
          timelineIssue.propertyId = property.id;

          // Try to link to specific event based on issue field
          if (issue.field) {
            const event = state.events.find(e =>
              e.propertyId === property.id &&
              e.type === issue.field
            );
            if (event) {
              timelineIssue.eventId = event.id;
              console.log('Linked issue to event:', issue.message, '-> event:', event.title, 'ID:', event.id);
            }
          }
        }
      }


      return timelineIssue;
    });

    set({
      aiResponse: response,
      timelineIssues,
    });
  },

  selectIssue: (issueId: string | null) => {
    set({ selectedIssue: issueId });
  },

  resolveIssue: (issueId: string, response: string) => {
    const state = get();
    const updatedIssues = state.timelineIssues.map(issue =>
      issue.id === issueId
        ? { ...issue, userResponse: response, resolved: true }
        : issue
    );
    set({ timelineIssues: updatedIssues, selectedIssue: null });
  },

  clearAIFeedback: () => {
    set({
      aiResponse: null,
      timelineIssues: [],
      selectedIssue: null,
    });
  },

  analyzePortfolio: async () => {
    const state = get();
    set({ isAnalyzing: true });

    try {
      // Transform properties and events to API format
      const requestData = {
        properties: state.properties.map(property => ({
          address: property.address || property.name,
          property_history: state.events
            .filter(e => e.propertyId === property.id)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(event => ({
              date: format(event.date, 'yyyy-MM-dd'),
              event: event.type,
              ...(event.amount && { price: event.amount }),
              ...(event.isPPR !== undefined && { is_ppr: event.isPPR }),
              ...(event.contractDate && { contract_date: format(event.contractDate, 'yyyy-MM-dd') }),
              ...(event.landPrice && { land_price: event.landPrice }),
              ...(event.buildingPrice && { building_price: event.buildingPrice }),
            })),
          notes: property.currentStatus || (property.isRental ? 'rental' : 'ppr'),
        })),
        user_query: "Please analyze my CGT obligations for these properties",
        additional_info: {
          australian_resident: true,
        },
      };

      // Call the API
      const response = await fetch('/api/analyze-cgt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Store the AI response and process it
        get().setAIResponse(result.data);
      } else {
        console.error('API returned error:', result.error);
        throw new Error(result.error || 'Unknown API error');
      }
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      // You might want to add error state here
    } finally {
      set({ isAnalyzing: false });
    }
  },
};
});
