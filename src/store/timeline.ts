import { create } from 'zustand';
import { addDays, format } from 'date-fns';
import type { AIResponse, TimelineIssue, PositionedGap, AIIssue } from '../types/ai-feedback';
import type { VerificationAlert } from '../types/verification-alert';
import type { CostBaseCategory } from '../lib/cost-base-definitions';
import type {
  StickyNote,
  StickyNoteColor,
  TimelineNotePosition,
  AnalysisNotePosition,
  ShareableTimelineData,
} from '../types/sticky-note';
import { generateStickyNoteId, DEFAULT_STICKY_NOTE_COLOR } from '../types/sticky-note';
import { showValidationError, showError } from '../lib/toast-helpers';

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
  | 'vacant_start'  // Property becomes vacant/unoccupied
  | 'vacant_end'    // Property is no longer vacant
  | 'ownership_change'  // Change of ownership event
  | 'subdivision'   // Property subdivision into multiple lots
  | 'living_in_rental_start'  // Start living in rental property
  | 'living_in_rental_end'    // Stop living in rental property
  | 'custom';       // User-defined custom event for any situation

export type PropertyStatus =
  | 'ppr'              // Main Residence (owner lives in it)
  | 'rental'           // Rented to tenants
  | 'vacant'           // Empty/not used
  | 'construction'     // Being built/renovated
  | 'sold'             // Sold
  | 'subdivided'       // Subdivided into child lots (property no longer exists as originally held)
  | 'living_in_rental'; // Owner is living in a rental property (renting from someone else)

export type OwnershipChangeReason =
  | 'divorce'          // Divorce settlement
  | 'sale_transfer'    // Sale or transfer
  | 'gift'             // Gift to family member or other
  | 'other';           // Other reason

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
  newStatus?: PropertyStatus; // For status_change events and custom events that affect status
  isPPR?: boolean;          // Is this event related to Main Residence?
  isResident?: boolean;     // For sale events - Australian resident status for CGT
  previousYearLosses?: number;  // For sale events - previous year capital losses to offset CGT
  capitalProceedsType?: 'standard' | 'insurance' | 'compulsory_acquisition' | 'gift' | 'inheritance';  // For sale events - type of capital proceeds
  exemptionType?: 'main_residence' | 'partial_main_residence' | '6_year_rule' | 'none';  // For sale events - CGT exemption type claimed
  // Price breakdown for purchases (land + building)
  landPrice?: number;       // Price of land component
  buildingPrice?: number;   // Price of building component
  overTwoHectares?: boolean; // For purchase events - property land exceeds 2 hectares (affects main residence exemption per ATO Section 118-120)
  isLandOnly?: boolean;     // For purchase events - property is land only (no building), affects depreciation calculations
  hectares?: number;        // For purchase events - land size in hectares (used when overTwoHectares is true)

  // Custom event fields
  affectsStatus?: boolean;  // For custom events: does this event change property status?

  // Persistent checkbox states from EventDetailsModal
  checkboxState?: {
    moveInOnSameDay?: boolean;        // Purchase: Move in on same day
    purchaseAsVacant?: boolean;       // Purchase: Purchase as vacant
    purchaseAsRent?: boolean;         // Purchase: Purchase as rental/investment
    purchaseAsMixedUse?: boolean;     // Purchase: Mixed-use property
    moveOutAsVacant?: boolean;        // Move Out: Move out as vacant
    moveOutAsRent?: boolean;          // Move Out: Move out as rent start
    rentEndAsVacant?: boolean;        // Rent End: Rent end as vacant
    rentEndAsMoveIn?: boolean;        // Rent End: Rent end as move in
    vacantEndAsMoveIn?: boolean;      // Vacant End: Owner move back in
    vacantEndAsRent?: boolean;        // Vacant End: Vacant end as rental
    hasBusinessUse?: boolean;         // Purchase: Has business use percentage
    hasPartialRental?: boolean;       // Purchase: Has partial rental percentage
    isNonResident?: boolean;          // Sale: Non-resident status
  };

  // NEW: Dynamic Cost Base Items
  costBases?: CostBaseItem[];  // Array of cost base items for this event

  // NEW: Ownership and Usage Splits
  businessUsePercentage?: number;  // Percentage of property used for business (0-100)
  rentalUsePercentage?: number;    // Percentage of property used for rental/investment (0-100)
  livingUsePercentage?: number;    // Percentage of property used as owner-occupied/main residence (0-100)
  rentalUseStartDate?: Date;       // Date when rental use started
  businessUseStartDate?: Date;     // Date when business use started
  mixedUseMoveInDate?: Date;       // For mixed-use properties: date when owner moved in (if different from purchase)
  floorAreaData?: {
    total: number;      // Total floor area in sqm
    exclusive: number;  // Exclusive rental area in sqm (e.g., bedroom)
    shared: number;     // Shared area in sqm (e.g., kitchen, bathroom)
  };

  // NEW: Ownership Change fields
  leavingOwners?: string[];  // Array of owner names who are leaving
  newOwners?: Array<{name: string; percentage: number}>;  // New owners being added
  ownershipChangeReason?: OwnershipChangeReason;  // Reason for ownership change
  ownershipChangeReasonOther?: string;  // Custom reason if "other" selected

  // NEW: Subdivision fields
  subdivisionDetails?: {
    parentPropertyId: string;              // Original property being subdivided
    childProperties: Array<{
      id: string;                          // New property ID
      name: string;                        // e.g., "Lot 1", "Lot 2"
      lotNumber?: string;                  // Lot/parcel number
      lotSize?: number;                    // Size in sqm for cost base allocation
      allocatedCostBase?: number;          // Portion of parent cost base
    }>;
    totalLots: number;                     // Total number of lots created
    surveyorFees?: number;                 // Surveyor costs
    planningFees?: number;                 // Planning/council fees
    legalFees?: number;                    // Legal fees
    titleFees?: number;                    // Title registration fees
    allocationMethod: 'equal' | 'by_lot_size' | 'manual';  // How cost base was split
  };

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

  // For synthetic "Not Sold" markers - appreciation/future value
  appreciationValue?: number;      // Future/appreciation value
  appreciationDate?: Date;         // Date for appreciation value
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

  // NEW: Multi-owner support
  owners?: Array<{
    name: string;
    percentage: number;  // Ownership percentage (must total 100%)
  }>;

  // NEW: Subdivision tracking
  parentPropertyId?: string;      // Links back to parent if this is a subdivided lot
  subdivisionDate?: Date;         // Date this property was created via subdivision
  subdivisionGroup?: string;      // UUID linking all lots from same subdivision
  lotNumber?: string;             // e.g., "Lot 1", "Lot 2"
  lotSize?: number;               // Size in sqm or hectares
  initialCostBase?: number;       // Allocated cost base for subdivided lots
  isMainLotContinuation?: boolean; // True if this lot continues parent's CGT history (typically Lot 1)
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

// Analysis display mode: 'auto' follows response type, 'json-sections' forces beautiful JSON view, 'markdown' forces markdown view
export type AnalysisDisplayMode = 'auto' | 'json-sections' | 'markdown';

// API Response Mode: determines which endpoint to call
// 'markdown' → /calculate-cgt/ (returns markdown string)
// 'json' → /calculate-cgt-json/ (returns structured JSON)
export type APIResponseMode = 'markdown' | 'json';

// LLM Provider types
export interface LLMProviders {
  [key: string]: string;
}

export interface LLMProvidersResponse {
  providers: LLMProviders;
  default: string;
}

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
  enableAISuggestedQuestions: boolean; // Enable AI-generated question suggestions
  analysisDisplayMode: AnalysisDisplayMode; // Toggle between JSON sections view and markdown view
  apiResponseMode: APIResponseMode; // Determines which API endpoint to call (markdown or json)

  // LLM Provider State
  selectedLLMProvider: string; // Currently selected LLM provider (e.g., 'claude', 'openai')
  availableLLMProviders: LLMProviders; // Available LLM providers from API
  isLoadingProviders: boolean; // Loading state for fetching providers

  // AI Feedback State
  aiResponse: AIResponse | null; // Latest AI analysis response
  timelineIssues: TimelineIssue[]; // Processed issues for UI display
  positionedGaps: PositionedGap[]; // Gaps with timeline positions
  residenceGapIssues: AIIssue[]; // Timeline gap issues from AI response
  selectedIssue: string | null; // Currently viewing issue details
  isAnalyzing: boolean; // Loading state during AI analysis

  // Verification Alerts State (from GilbertBranch)
  verificationAlerts: VerificationAlert[]; // Alert bars for failed verifications
  currentAlertIndex: number; // Index of currently resolving alert (-1 means none)

  // Timeline Notes State
  timelineNotes: string; // User notes/feedback for the timeline
  isNotesModalOpen: boolean; // Whether the notes modal is open

  // Marginal Tax Rate State (Global for all properties)
  marginalTaxRate: number; // User's marginal tax rate (default: 37%)

  // Subdivision Collapse State
  collapsedSubdivisions: string[]; // Array of subdivision group IDs that are collapsed

  // Logo/Branding State
  currentLogoVariant: string; // Currently selected logo variant ID (e.g., 'text-current', 'logo-1')

  // Actions
  addProperty: (property: Omit<Property, 'id' | 'branch'>) => void;
  updateProperty: (id: string, property: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  subdivideProperty: (config: {
    parentPropertyId: string;
    subdivisionDate: Date;
    lots: Array<{
      name: string;
      address?: string;
      lotSize: number;  // Required for proportional allocation
    }>;
    fees: {
      surveyorFees?: number;
      planningFees?: number;
      legalFees?: number;
      titleFees?: number;
    };
  }) => void;

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
  loadDemoData: () => Promise<void>; // Load demo data from JSON file
  migrateSaleEventTitles: () => void; // Migrate sale events with marginal tax rate in title
  clearAllData: () => void; // Clear all properties and events
  importTimelineData: (data: any) => void; // Import timeline data from JSON
  toggleTheme: () => void; // Cycle through themes: light -> dark -> golden -> light
  toggleEventDisplayMode: () => void; // Toggle between circle and card display
  toggleLockFutureDates: () => void; // Toggle lock future dates setting
  toggleDragEvents: () => void; // Toggle event dragging functionality
  toggleAISuggestedQuestions: () => void; // Toggle AI-generated question suggestions
  setAnalysisDisplayMode: (mode: AnalysisDisplayMode) => void; // Set analysis display mode
  setLogoVariant: (variantId: string) => void; // Set the current logo variant
  cycleAnalysisDisplayMode: () => void; // Cycle through display modes: auto -> json-sections -> markdown
  setAPIResponseMode: (mode: APIResponseMode) => void; // Set which API endpoint to use

  // LLM Provider Actions
  setSelectedLLMProvider: (provider: string) => void; // Set the selected LLM provider
  fetchLLMProviders: () => Promise<void>; // Fetch available LLM providers from API

  // AI Feedback Actions
  setAIResponse: (response: AIResponse) => void; // Store AI analysis response
  selectIssue: (issueId: string | null) => void; // Select issue for viewing
  resolveIssue: (issueId: string, response: string) => void; // Mark issue resolved with user response
  clearAIFeedback: () => void; // Clear all AI feedback
  analyzePortfolio: () => Promise<void>; // Trigger AI analysis of current timeline

  // Verification Alert Actions (from GilbertBranch)
  setVerificationAlerts: (alerts: VerificationAlert[]) => void;
  clearVerificationAlerts: () => void;
  resolveVerificationAlert: (alertId: string, userResponse: string) => void;
  getAllVerificationAlertsResolved: () => boolean;
  getUnresolvedAlerts: () => VerificationAlert[];
  getCurrentAlert: () => VerificationAlert | null;
  moveToNextAlert: () => void;
  setCurrentAlertIndex: (index: number) => void;
  panToDate: (date: Date) => void;

  // Timeline Notes Actions
  setTimelineNotes: (notes: string) => void;
  openNotesModal: () => void;
  closeNotesModal: () => void;

  // Marginal Tax Rate Actions
  setMarginalTaxRate: (rate: number) => void;
  initializeMarginalTaxRate: () => void; // Extract rate from existing sale events

  // Subdivision Collapse Actions
  toggleSubdivisionCollapse: (subdivisionGroup: string) => void;

  // Sticky Notes State
  timelineStickyNotes: StickyNote[];
  analysisStickyNotes: StickyNote[];
  savedAnalysis: {
    response: AIResponse | null;
    analyzedAt: string | null;
    provider: string | null;
  } | null;

  // Sticky Notes Actions - Timeline
  addTimelineStickyNote: (note: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateTimelineStickyNote: (id: string, updates: Partial<StickyNote>) => void;
  deleteTimelineStickyNote: (id: string) => void;
  moveTimelineStickyNote: (id: string, newPosition: TimelineNotePosition) => void;
  clearTimelineStickyNotes: () => void;

  // Sticky Notes Actions - Analysis
  addAnalysisStickyNote: (note: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateAnalysisStickyNote: (id: string, updates: Partial<StickyNote>) => void;
  deleteAnalysisStickyNote: (id: string) => void;
  moveAnalysisStickyNote: (id: string, newPosition: AnalysisNotePosition) => void;
  clearAnalysisStickyNotes: () => void;

  // Analysis Saving Actions
  saveCurrentAnalysis: () => void;
  clearSavedAnalysis: () => void;

  // Enhanced Export/Import for Sharing
  exportShareableData: () => ShareableTimelineData;
  importShareableData: (data: ShareableTimelineData) => void;
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
  vacant_start: '#9CA3AF',   // Gray-400 - Property becomes vacant
  vacant_end: '#6B7280',     // Gray-500 - Property no longer vacant
  ownership_change: '#A855F7',  // Purple - Change of ownership
  subdivision: '#EC4899',    // Pink - Property subdivision
  living_in_rental_start: '#EC4899',  // Pink - Start living in rental
  living_in_rental_end: '#DB2777',    // Darker pink - Stop living in rental
  custom: '#6B7280',         // Gray - Custom event (user can change)
};

// Status colors for visualization
export const statusColors: Record<PropertyStatus, string> = {
  ppr: '#10B981',         // Green - Main Residence
  rental: '#3B82F6',      // Blue - Rental/Investment
  vacant: '#9CA3AF',      // Gray - Vacant/Unoccupied
  construction: '#F59E0B', // Orange - Under construction
  sold: '#8B5CF6',        // Purple - Sold
  subdivided: '#6B7280',  // Dark Gray - Subdivided (property retired/no longer exists)
  living_in_rental: '#F472B6', // Pink - Living in rental property (renting from someone else)
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
  console.log('🔍 calculateStatusPeriods called with events:', events.map(e => ({ type: e.type, date: e.date, title: e.title })));
  const periods: StatusPeriod[] = [];

  // Event priority for same-date events (higher number = processed later = takes precedence)
  // Restructured into logical hierarchy to prevent status conflicts
  const eventPriority: Record<string, number> = {
    // Priority 0 - Non-status events (lowest)
    'improvement': 0,
    'refinance': 0,
    'custom': 0,

    // Priority 1 - Initial acquisition
    'purchase': 1,

    // Priority 2 - Ending events (remove/end a status)
    'move_out': 2,
    'rent_end': 2,
    'vacant_start': 2,
    'living_in_rental_end': 2,

    // Priority 3 - Transitional events
    'vacant_end': 3,

    // Priority 4 - Active use events (establish new status)
    'move_in': 4,
    'rent_start': 4,
    'living_in_rental_start': 4,

    // Priority 5 - Explicit user overrides
    'status_change': 5,
    'ownership_change': 5,

    // Priority 6 - Terminal states (highest priority)
    'sale': 6,
    'subdivision': 6,
  };

  // Sort events by date, then by priority for same-date events
  const sortedEvents = [...events].sort((a, b) => {
    const timeDiff = a.date.getTime() - b.date.getTime();
    if (timeDiff !== 0) return timeDiff;

    // Same date - sort by priority (lower priority processed first)
    const priorityDiff = (eventPriority[a.type] || 0) - (eventPriority[b.type] || 0);
    if (priorityDiff !== 0) return priorityDiff;

    // Same date and priority - sort by ID for deterministic ordering
    return a.id.localeCompare(b.id);
  });

  let currentStatus: PropertyStatus | null = null;
  let currentStartDate: Date | null = null;

  for (const event of sortedEvents) {
    // Determine status change from event
    let newStatus: PropertyStatus | null = null;

    switch (event.type) {
      case 'purchase':
        // Purchase sets vacant but won't show label
        newStatus = 'vacant';
        break;
      case 'move_in':
        // Move in sets property as Main Residence (PPR)
        newStatus = 'ppr';
        break;
      case 'move_out':
        // After moving out, property is vacant but won't show label
        newStatus = 'vacant';
        break;
      case 'rent_start':
        newStatus = 'rental';
        break;
      case 'rent_end':
        newStatus = 'vacant';
        break;
      case 'vacant_start':
        // Property becomes vacant
        newStatus = 'vacant';
        break;
      case 'vacant_end':
        // Property is no longer vacant - default to ppr, subsequent events will override
        newStatus = 'ppr';
        break;
      case 'living_in_rental_start':
        // Living in a rental property (renting from someone else while owning this property)
        newStatus = 'living_in_rental';
        break;
      case 'living_in_rental_end':
        // No longer living in rental - property becomes vacant
        newStatus = 'vacant';
        break;
      case 'sale':
        newStatus = 'sold';
        break;
      case 'subdivision':
        // Subdivision means property no longer exists as originally held
        newStatus = 'subdivided';
        break;
      case 'status_change':
        newStatus = event.newStatus || null;
        break;
    }

    // If status changed, close previous period and start new one
    if (newStatus && newStatus !== currentStatus) {
      console.log(`  📊 Status change: ${currentStatus} → ${newStatus} at ${event.date.toISOString().split('T')[0]} (${event.type})`);
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

  console.log('✅ Calculated status periods:', periods.map(p => ({ status: p.status, start: p.startDate.toISOString().split('T')[0], end: p.endDate ? p.endDate.toISOString().split('T')[0] : 'ongoing' })));
  return periods;
};

const defaultAbsoluteStart = new Date(1900, 0, 1);
const defaultAbsoluteEnd = new Date();
defaultAbsoluteEnd.setFullYear(defaultAbsoluteEnd.getFullYear() + 3);

export const useTimelineStore = create<TimelineState>((set, get) => {
  // Calculate initial 30-year range
  const today = new Date();
  const thirtyYearsAgo = new Date(today);
  thirtyYearsAgo.setFullYear(today.getFullYear() - 30);
  const threeYearsFromNow = new Date();
  threeYearsFromNow.setFullYear(threeYearsFromNow.getFullYear() + 3);

  return {
    properties: [],
    events: [],
    selectedProperty: null,
    selectedEvent: null,
    lastInteractedEventId: null,
    timelineStart: thirtyYearsAgo,
    timelineEnd: threeYearsFromNow,
    absoluteStart: defaultAbsoluteStart,
    absoluteEnd: defaultAbsoluteEnd,
    zoom: 1,
    zoomLevel: calculateZoomLevel(thirtyYearsAgo, threeYearsFromNow),
    centerDate: new Date(
      (thirtyYearsAgo.getTime() + threeYearsFromNow.getTime()) / 2
    ),
    theme: 'dark',
    eventDisplayMode: 'circle',
    lockFutureDates: false,
    enableDragEvents: true,
    enableAISuggestedQuestions: true, // Default enabled
    analysisDisplayMode: 'auto', // Default: auto-detect based on response type
    apiResponseMode: 'json', // Default: View 2 (json endpoint)

    // LLM Provider Initial State
    selectedLLMProvider: 'deepseek', // Default provider (prefer Deepseek)
    availableLLMProviders: { deepseek: 'Deepseek' }, // Default fallback
    isLoadingProviders: false,

    // AI Feedback Initial State
    aiResponse: null,
    timelineIssues: [],
    positionedGaps: [],
    residenceGapIssues: [],
    selectedIssue: null,
    isAnalyzing: false,

    // Verification Alerts initial state
    verificationAlerts: [],
    currentAlertIndex: -1,

    // Timeline Notes initial state
    timelineNotes: '',
    isNotesModalOpen: false,

    // Marginal Tax Rate initial state
    marginalTaxRate: 37,

    // Subdivision Collapse initial state
    collapsedSubdivisions: [],

    // Logo/Branding initial state
    currentLogoVariant: typeof window !== 'undefined' && localStorage.getItem('logoVariant') || 'logo-1',

    // Sticky Notes initial state
    timelineStickyNotes: [],
    analysisStickyNotes: [],
    savedAnalysis: null,

  addProperty: (property) => {
    const properties = get().properties;

    // Determine color: use provided color or find first unused color from palette
    let selectedColor = property.color;
    if (!selectedColor) {
      // Get colors currently in use
      const usedColors = new Set(properties.map(p => p.color.toUpperCase()));

      // Find first unused color from palette
      selectedColor = propertyColors[0];
      for (const color of propertyColors) {
        if (!usedColors.has(color.toUpperCase())) {
          selectedColor = color;
          break;
        }
      }

      // If all colors are used, cycle through them
      if (usedColors.size >= propertyColors.length) {
        selectedColor = propertyColors[properties.length % propertyColors.length];
      }
    }

    const newProperty: Property = {
      ...property,
      id: `prop-${Date.now()}`,
      color: selectedColor,
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
    set((state) => {
      const property = state.properties.find((p) => p.id === id);

      if (!property) {
        console.error('Property not found:', id);
        return state;
      }

      // Case 1: Deleting a parent property - delete all children too
      if (!property.parentPropertyId) {
        const children = state.properties.filter((p) => p.parentPropertyId === id);
        const allIdsToDelete = [id, ...children.map((c) => c.id)];

        return {
          properties: state.properties.filter((p) => !allIdsToDelete.includes(p.id!)),
          events: state.events.filter((e) => !allIdsToDelete.includes(e.propertyId)),
          // Clear AI analysis and verification alerts when property is deleted
          aiResponse: null,
          timelineIssues: [],
          positionedGaps: [],
          residenceGapIssues: [],
          selectedIssue: null,
          verificationAlerts: [],
          currentAlertIndex: -1,
        };
      }

      // Case 2: Deleting a child lot from a subdivision
      if (property.parentPropertyId && property.subdivisionGroup) {
        const parent = state.properties.find((p) => p.id === property.parentPropertyId);

        if (!parent) {
          // Orphaned child, just delete it
          console.warn('Orphaned child property found, deleting:', id);
          return {
            properties: state.properties.filter((p) => p.id !== id),
            events: state.events.filter((e) => e.propertyId !== id),
            aiResponse: null,
            timelineIssues: [],
            positionedGaps: [],
            residenceGapIssues: [],
            selectedIssue: null,
            verificationAlerts: [],
            currentAlertIndex: -1,
          };
        }

        // Count sibling lots (excluding Lot 1 - main continuation)
        const nonLot1Siblings = state.properties.filter(
          (p) =>
            p.parentPropertyId === parent.id &&
            p.subdivisionGroup === property.subdivisionGroup &&
            !p.isMainLotContinuation
        );

        // If this is the LAST non-Lot-1 lot, UNDO the entire subdivision
        if (nonLot1Siblings.length === 1 && nonLot1Siblings[0].id === id) {
          console.log('🔄 Undoing subdivision - last non-Lot-1 lot being deleted');

          // Find Lot 1 (main continuation)
          const lot1 = state.properties.find(
            (p) => p.parentPropertyId === parent.id && p.isMainLotContinuation
          );

          // Restore parent property - remove subdivision markers
          const restoredParent = {
            ...parent,
            subdivisionDate: undefined,
            subdivisionGroup: undefined,
          };

          // Merge Lot 1's events back to parent (only events AFTER subdivision)
          let mergedEvents: TimelineEvent[] = [];
          if (lot1 && lot1.subdivisionDate) {
            const lot1EventsAfterSubdivision = state.events.filter(
              (e) => e.propertyId === lot1.id && e.date >= lot1.subdivisionDate!
            );
            mergedEvents = lot1EventsAfterSubdivision.map((e) => ({
              ...e,
              propertyId: parent.id,
            }));
          }

          // Find all lots to delete (including Lot 1)
          const allLotsToDelete = state.properties.filter(
            (p) =>
              p.parentPropertyId === parent.id &&
              p.subdivisionGroup === property.subdivisionGroup
          );
          const lotIdsToDelete = allLotsToDelete.map((l) => l.id!);

          // Find subdivision event to remove
          const subdivisionEvent = state.events.find(
            (e) =>
              e.propertyId === parent.id &&
              e.type === 'subdivision' &&
              e.subdivisionDetails?.parentPropertyId === parent.id
          );

          return {
            properties: state.properties
              .filter((p) => !lotIdsToDelete.includes(p.id!))
              .map((p) => (p.id === parent.id ? restoredParent : p)),

            events: state.events
              .filter((e) => !lotIdsToDelete.includes(e.propertyId))
              .filter((e) => e.id !== subdivisionEvent?.id)
              .concat(mergedEvents),

            // Clear AI analysis and verification alerts
            aiResponse: null,
            timelineIssues: [],
            positionedGaps: [],
            residenceGapIssues: [],
            selectedIssue: null,
            verificationAlerts: [],
            currentAlertIndex: -1,
          };
        } else {
          // Not the last lot, just delete this one lot normally
          console.log('🗑️ Deleting single lot (subdivision remains)');
          return {
            properties: state.properties.filter((p) => p.id !== id),
            events: state.events.filter((e) => e.propertyId !== id),
            aiResponse: null,
            timelineIssues: [],
            positionedGaps: [],
            residenceGapIssues: [],
            selectedIssue: null,
            verificationAlerts: [],
            currentAlertIndex: -1,
          };
        }
      }

      // Case 3: Regular non-subdivided property (fallback)
      return {
        properties: state.properties.filter((p) => p.id !== id),
        events: state.events.filter((e) => e.propertyId !== id),
        aiResponse: null,
        timelineIssues: [],
        positionedGaps: [],
        residenceGapIssues: [],
        selectedIssue: null,
        verificationAlerts: [],
        currentAlertIndex: -1,
      };
    });
  },

  subdivideProperty: (config) => {
    const { parentPropertyId, subdivisionDate, lots, fees } = config;
    const state = get();
    const parentProperty = state.properties.find((p) => p.id === parentPropertyId);

    if (!parentProperty) {
      console.error('Parent property not found:', parentPropertyId);
      return;
    }

    // Generate subdivision group ID
    const subdivisionGroup = `subdiv-${Date.now()}`;

    // Calculate total lot size for proportional allocation
    const totalLotSize = lots.reduce((sum, lot) => sum + lot.lotSize, 0);

    // Calculate parent's cost base (purchase price + improvements before subdivision)
    const parentPurchasePrice = parentProperty.purchasePrice || 0;
    const parentImprovements = state.events
      .filter((e) => e.propertyId === parentPropertyId && e.type === 'improvement' && e.date < subdivisionDate)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    const parentCostBase = parentPurchasePrice + parentImprovements;

    // Calculate total subdivision fees
    const totalFees = (fees.surveyorFees || 0) + (fees.planningFees || 0) + (fees.legalFees || 0) + (fees.titleFees || 0);
    const feePerLot = totalFees / lots.length;

    // Create child properties with allocated cost bases
    const childProperties: Property[] = lots.map((lot, index) => {
      // Proportional allocation based on lot size
      const proportion = lot.lotSize / totalLotSize;
      const allocatedCostBase = parentCostBase * proportion + feePerLot;

      // Lot 1 (index 0) continues the main property's CGT timeline
      const isMainLot = index === 0;

      return {
        id: `prop-${Date.now()}-${index}`,
        name: lot.name,
        address: lot.address || parentProperty.address,
        color: propertyColors[(state.properties.length + index) % propertyColors.length],
        branch: state.properties.length + index, // Will be recalculated by layout
        parentPropertyId,
        subdivisionDate,
        subdivisionGroup,
        lotNumber: `Lot ${index + 1}`,
        lotSize: lot.lotSize,
        purchasePrice: allocatedCostBase,
        purchaseDate: isMainLot ? parentProperty.purchaseDate : subdivisionDate, // Main lot inherits original purchase date
        owners: parentProperty.owners, // Inherit ownership
        isMainLotContinuation: isMainLot, // Mark Lot 1 as main timeline continuation
      };
    });

    // Get parent events before subdivision date to copy to Lot 1
    const parentEventsBeforeSubdivision = state.events.filter(
      (e) => e.propertyId === parentPropertyId && e.date < subdivisionDate
    );

    // Create copies of parent events for Lot 1 (main lot continuation)
    // Remove amount and costBases from inherited events
    const lot1Id = childProperties[0]?.id;
    const copiedEventsForLot1: TimelineEvent[] = lot1Id
      ? parentEventsBeforeSubdivision.map((event) => {
          const { amount, costBases, ...eventWithoutFinancials } = event;
          return {
            ...eventWithoutFinancials,
            id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            propertyId: lot1Id,
          };
        })
      : [];

    // Create subdivision event on parent
    const subdivisionEvent: TimelineEvent = {
      id: `event-${Date.now()}`,
      propertyId: parentPropertyId,
      type: 'subdivision',
      date: subdivisionDate,
      title: `Subdivided into ${lots.length} lots`,
      position: 0, // Position will be calculated
      color: '#EC4899',
      subdivisionDetails: {
        parentPropertyId,
        childProperties: childProperties.map((cp, i) => ({
          id: cp.id,
          name: cp.name,
          lotSize: lots[i].lotSize,
          allocatedCostBase: cp.purchasePrice,
        })),
        totalLots: lots.length,
        ...fees,
        allocationMethod: 'by_lot_size',
      },
    };

    // Update state
    // - Lot 1 inherits parent's events before subdivision (continues CGT timeline)
    // - Lot 2+ start fresh from subdivision date
    // - Parent property is marked with subdivisionDate
    set({
      properties: [
        ...state.properties.map(p =>
          p.id === parentPropertyId
            ? { ...p, subdivisionDate, subdivisionGroup }
            : p
        ),
        ...childProperties
      ],
      events: [...state.events, subdivisionEvent, ...copiedEventsForLot1],
    });

    console.log(`✅ Subdivided ${parentProperty.name} into ${lots.length} lots`);
    console.log(`📋 Lot 1 inherited ${copiedEventsForLot1.length} events from parent timeline`);
  },

  addEvent: (event) => {
    const state = get();

    // Validate event against business logic (only critical rules now)
    if (event.propertyId) {
      const { validateEvent } = require('@/lib/event-validation');
      const propertyEvents = state.events.filter(e => e.propertyId === event.propertyId);
      const validation = validateEvent(event, propertyEvents);

      if (!validation.valid) {
        console.warn('❌ Event validation failed:', validation.error);

        // Show error with optional guidance
        if (validation.suggestion) {
          showValidationError(validation.error, {
            suggestion: {
              label: validation.suggestion.message.includes('Would you like')
                ? 'Yes, create it'
                : 'Create prerequisite',
              action: () => {
                // User wants to create prerequisite event - dispatch custom event
                window.dispatchEvent(new CustomEvent('create-prerequisite-event', {
                  detail: {
                    type: validation.suggestion.type,
                    propertyId: event.propertyId,
                    suggestedDate: validation.suggestion.suggestedDate,
                    followUpEvent: event, // Save the original event to create after prerequisite
                  }
                }));
              }
            },
            description: validation.suggestion.message,
          });
        } else {
          showError('Validation Error', validation.error);
        }

        return; // Block the event from being added
      }
    }

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
    const state = get();
    const event = state.events.find(e => e.id === id);

    if (!event) return;

    // Validate: Prevent updating event date past subdivision date
    if (updates.date && event.propertyId) {
      const property = state.properties.find(p => p.id === event.propertyId);
      if (property) {
        const subdivisionEvent = state.events.find(e =>
          e.propertyId === property.id && e.type === 'subdivision'
        );

        if (subdivisionEvent && updates.date >= subdivisionEvent.date) {
          console.warn('❌ Cannot update event date past subdivision date');
          showError(
            'Cannot set event date past subdivision',
            'This property was subdivided and no longer exists after that date.'
          );
          return; // Block the update
        }
      }

      // NEW: Validate event updates against business logic
      const { validateEvent } = require('@/lib/event-validation');
      const propertyEvents = state.events.filter(e => e.propertyId === event.propertyId && e.id !== id);
      const updatedEvent = { ...event, ...updates };
      const validation = validateEvent(updatedEvent, propertyEvents);

      if (!validation.valid) {
        console.warn('❌ Event update validation failed:', validation.error);
        showError('Validation Error', validation.error);
        return; // Block the update
      }
    }

    set((state) => {
      const updatedEvents = state.events.map((e) => {
        if (e.id !== id) return e;

        // Start with basic updates
        let finalUpdates = { ...updates };

        // If updating the date of a sale event, also update contractDate
        // This keeps contractDate in sync when dragging sale events
        if (updates.date && e.type === 'sale') {
          finalUpdates.contractDate = updates.date;
          console.log('📅 updateEvent: Syncing contractDate for sale event:', {
            eventId: e.id,
            newDate: updates.date,
            newContractDate: updates.date,
          });
        }

        // If updating the date and settlementDate was same as old date, sync it too
        if (updates.date && e.settlementDate && e.date &&
            e.settlementDate.getTime() === e.date.getTime()) {
          finalUpdates.settlementDate = updates.date;
        }

        return { ...e, ...finalUpdates };
      });
      const updatedEvent = updatedEvents.find(e => e.id === id);
      return {
        events: updatedEvents,
        lastInteractedEventId: id,
        centerDate: updatedEvent?.date || state.centerDate
      };
    });
  },
  
  deleteEvent: (id) => {
    const state = get();
    const eventToDelete = state.events.find((e) => e.id === id);

    // If deleting a sale event, also clear the property's sale-related fields
    if (eventToDelete?.type === 'sale') {
      const propertyId = eventToDelete.propertyId;
      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
        properties: state.properties.map((p) =>
          p.id === propertyId
            ? { ...p, currentStatus: 'vacant' as const, saleDate: undefined }
            : p
        ),
      }));
    } else {
      set((state) => ({
        events: state.events.filter((e) => e.id !== id),
      }));
    }
  },
  
  moveEvent: (id, newPosition) => {
    const state = get();
    const event = state.events.find((e) => e.id === id);
    if (!event) return;

    const timelineRange = state.timelineEnd.getTime() - state.timelineStart.getTime();
    const newTime = state.timelineStart.getTime() + (newPosition / 100) * timelineRange;
    const newDate = new Date(newTime);

    // Validate: Prevent moving events on subdivided parent properties past subdivision date
    if (event.propertyId) {
      const property = state.properties.find(p => p.id === event.propertyId);
      if (property) {
        const subdivisionEvent = state.events.find(e =>
          e.propertyId === property.id && e.type === 'subdivision'
        );

        if (subdivisionEvent && newDate >= subdivisionEvent.date) {
          console.warn('❌ Cannot move event past subdivision date');
          showError(
            'Cannot move event past subdivision',
            'This property was subdivided and no longer exists after that date.'
          );
          return; // Block the move
        }
      }

      // NEW: Validate dragged event position against business logic
      const { validateEvent } = require('@/lib/event-validation');
      const propertyEvents = state.events.filter(e => e.propertyId === event.propertyId && e.id !== id);
      const movedEvent = { ...event, date: newDate };
      const validation = validateEvent(movedEvent, propertyEvents);

      if (!validation.valid) {
        console.warn('❌ Event drag validation failed:', validation.error);
        showError('Validation Error', validation.error);
        return; // Block the move
      }
    }

    // Debug logging
    console.log('🔄 moveEvent called:', {
      id,
      eventType: event.type,
      oldDate: event.date,
      newDate,
      hasContractDate: !!event.contractDate,
      oldContractDate: event.contractDate,
    });

    set((state) => ({
      events: state.events.map((e) => {
        if (e.id !== id) return e;

        // Update the event with new position and date
        const updatedEvent: typeof e = { ...e, position: newPosition, date: newDate };

        // For sale events, also update contractDate to match the new date
        // This keeps contractDate in sync with the event date when dragged
        if (e.type === 'sale') {
          updatedEvent.contractDate = newDate;
          console.log('📅 Updated contractDate for sale event:', {
            eventId: e.id,
            newContractDate: newDate,
          });
        }

        // Also update settlementDate if it exists and matches the original date
        if (e.settlementDate && e.settlementDate.getTime() === e.date.getTime()) {
          updatedEvent.settlementDate = newDate;
        }

        return updatedEvent;
      }),
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

  loadDemoData: async () => {
    try {
      // Load simple complete demo data with no gaps
      // This includes proper property transitions to avoid verification alerts
      const response = await fetch('/NewRequestsAndResponses/simple_complete_demo.json');
      const data = await response.json();
      const store = get();
      store.importTimelineData(data);
      console.log('✅ Loaded simple complete demo timeline data');
    } catch (error) {
      console.error('❌ Failed to load default timeline data:', error);
      // Fallback to hardcoded demo data if JSON file fails
      const demoProperties: Property[] = [];
      const demoEvents: TimelineEvent[] = [];

    // Property 1: 45 Collard Road, Humpty Doo (COMPLETE - NO GAPS)
    const prop1 = {
      id: 'demo-prop-1',
      name: 'Humpty Doo, NT 0836',
      address: '45 Collard Road',
      color: propertyColors[0],
      purchasePrice: 106000,
      purchaseDate: new Date(2003, 0, 1),
      salePrice: 450000,
      saleDate: new Date(2023, 6, 14),
      currentStatus: 'sold' as PropertyStatus,
      branch: 0,
    };
    demoProperties.push(prop1);

    // Events for Property 1 - Complete timeline with no gaps
    demoEvents.push({
      id: 'demo-event-1-1',
      propertyId: prop1.id,
      type: 'purchase',
      date: new Date(2003, 0, 1),
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
      date: new Date(2003, 0, 1),
      title: 'Move In',
      position: 0,
      color: eventColors.move_in,
      isPPR: true,
    });

    // FIXED: Added move_out event to close the gap
    demoEvents.push({
      id: 'demo-event-1-3',
      propertyId: prop1.id,
      type: 'move_out',
      date: new Date(2019, 11, 31), // Dec 31, 2019
      title: 'Move Out',
      position: 0,
      color: eventColors.move_out,
      isPPR: true,
    });

    demoEvents.push({
      id: 'demo-event-1-4',
      propertyId: prop1.id,
      type: 'rent_start',
      date: new Date(2020, 0, 1), // Jan 1, 2020 - next day after move out
      title: 'Start Rent',
      position: 0,
      color: eventColors.rent_start,
    });

    // FIXED: Added rent_end event before sale
    demoEvents.push({
      id: 'demo-event-1-5',
      propertyId: prop1.id,
      type: 'rent_end',
      date: new Date(2023, 5, 30), // Jun 30, 2023
      title: 'End Rent',
      position: 0,
      color: eventColors.rent_end,
    });

    demoEvents.push({
      id: 'demo-event-1-6',
      propertyId: prop1.id,
      type: 'sale',
      date: new Date(2023, 6, 14), // Jul 14, 2023
      title: 'Sold',
      amount: 450000,
      position: 0,
      color: eventColors.sale,
      isPPR: true,
      contractDate: new Date(2023, 6, 14),
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

    // Property 3: 5 Wanda Dr, Boyne Island
    const prop3 = {
      id: 'demo-prop-3',
      name: 'Boyne Island, Qld 4680',
      address: '5 Wanda Dr',
      color: propertyColors[2],
      purchasePrice: 530000,
      purchaseDate: new Date(2021, 8, 30),
      currentStatus: 'ppr' as PropertyStatus,
      branch: 2,
    };
    demoProperties.push(prop3);

    demoEvents.push({
      id: 'demo-event-3-1',
      propertyId: prop3.id,
      type: 'purchase',
      date: new Date(2021, 8, 30),
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
      date: new Date(2021, 8, 30),
      title: 'Move In',
      position: 0,
      color: eventColors.move_in,
      isPPR: true,
    });

    demoEvents.push({
      id: 'demo-event-3-3',
      propertyId: prop3.id,
      type: 'improvement',
      date: new Date(2022, 3, 15),
      title: 'Renovation',
      amount: 45000,
      position: 0,
      color: eventColors.improvement,
      description: 'Kitchen and bathroom renovation',
    });

    // Property 4: Investment Property (Vacant Period)
    const prop4 = {
      id: 'demo-prop-4',
      name: 'Boyne Island Property, Qld 4680',
      address: 'Investment Property',
      color: propertyColors[3],
      currentStatus: 'vacant' as PropertyStatus,
      isRental: false,
      branch: 3,
    };
    demoProperties.push(prop4);

    demoEvents.push({
      id: 'demo-event-4-1',
      propertyId: prop4.id,
      type: 'vacant_start',
      date: new Date(2020, 0, 1),
      title: 'Vacant (Start)',
      position: 0,
      color: eventColors.vacant_start,
      description: 'Property became vacant',
    });

    demoEvents.push({
      id: 'demo-event-4-2',
      propertyId: prop4.id,
      type: 'vacant_end',
      date: new Date(2021, 8, 29), // September 29, 2021
      title: 'Vacant (End)',
      position: 0,
      color: eventColors.vacant_end,
      description: 'Property no longer vacant',
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
      absoluteStart: new Date(2003, 0, 1),
      absoluteEnd: today,
      centerDate: centerDate,
      zoomLevel: '30-years',
    });
    }
  },

  // Migrate sale events with marginal tax rate in title to description
  migrateSaleEventTitles: () => {
    const events = get().events;
    let migratedCount = 0;

    const migratedEvents = events.map((event) => {
      // Only migrate sale events with "Marginal tax rate" in the title
      if (event.type === 'sale' && event.title && event.title.includes('Marginal tax rate:')) {
        migratedCount++;

        // Extract the marginal tax rate from title
        const match = event.title.match(/Marginal tax rate: ([\d.]+)%/);
        const taxRateValue = match ? match[1] : null;

        // Build the new description
        let newDescription = event.description || '';

        // Add marginal tax rate to description if we extracted it and it's not already there
        if (taxRateValue && !newDescription.includes('Marginal tax rate:')) {
          const taxRateNote = `Marginal tax rate: ${taxRateValue}%`;
          newDescription = newDescription
            ? `${newDescription}. ${taxRateNote}`
            : taxRateNote;
        }

        console.log(`📝 Migration: Fixed sale event title from "${event.title}" to "Sold"`, {
          eventId: event.id,
          oldTitle: event.title,
          newTitle: 'Sold',
          extractedTaxRate: taxRateValue,
          newDescription
        });

        return {
          ...event,
          title: 'Sold',
          description: newDescription
        };
      }
      return event;
    });

    if (migratedCount > 0) {
      console.log(`✅ Migration complete: Fixed ${migratedCount} sale event title(s)`);
      set({ events: migratedEvents });
    }
  },

  clearAllData: () => {
    set({
      properties: [],
      events: [],
      selectedProperty: null,
      selectedEvent: null,
      lastInteractedEventId: null,
      // Clear AI analysis and verification alerts when all data is cleared
      aiResponse: null,
      timelineIssues: [],
      positionedGaps: [],
      residenceGapIssues: [],
      selectedIssue: null,
      verificationAlerts: [],
      currentAlertIndex: -1,
      // Clear sticky notes
      timelineStickyNotes: [],
      analysisStickyNotes: [],
      savedAnalysis: null,
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

          // Calculate amount from cost bases if they exist
          let calculatedAmount = event.amount;
          if (costBases && costBases.length > 0) {
            // For purchase and improvement events, sum all cost bases
            // For sale events, use the sale price (not the sum of selling costs)
            if (event.type === 'sale') {
              calculatedAmount = event.amount; // Keep the sale price
            } else {
              calculatedAmount = costBases.reduce((sum: number, cb: any) => sum + (cb.amount || 0), 0);
            }
          }

          return {
            id: event.id || `import-event-${Date.now()}-${index}`,
            propertyId: event.propertyId,
            type: event.type as EventType,
            date: new Date(event.date),
            title: event.title || event.type,
            amount: calculatedAmount,
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
            // Mixed-use percentages and dates
            checkboxState: event.checkboxState,
            livingUsePercentage: event.livingUsePercentage,
            rentalUsePercentage: event.rentalUsePercentage,
            businessUsePercentage: event.businessUsePercentage,
            mixedUseMoveInDate: event.mixedUseMoveInDate ? new Date(event.mixedUseMoveInDate) : undefined,
            rentalUseStartDate: event.rentalUseStartDate ? new Date(event.rentalUseStartDate) : undefined,
            businessUseStartDate: event.businessUseStartDate ? new Date(event.businessUseStartDate) : undefined,
            floorAreaData: event.floorAreaData,
            // CGT flags and property details
            overTwoHectares: event.overTwoHectares,
            isLandOnly: event.isLandOnly,
            hectares: event.hectares,
            capitalProceedsType: event.capitalProceedsType,
            exemptionType: event.exemptionType,
            isResident: event.isResident,
            previousYearLosses: event.previousYearLosses,
            affectsStatus: event.affectsStatus,
            // Ownership change data
            leavingOwners: event.leavingOwners,
            newOwners: event.newOwners,
            ownershipChangeReason: event.ownershipChangeReason,
            ownershipChangeReasonOther: event.ownershipChangeReasonOther,
            // Subdivision details
            subdivisionDetails: event.subdivisionDetails,
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
                }> = [];

                // Add purchase price to costBases for purchase events
                if (eventType === 'purchase' && historyItem.price) {
                  legacyMappings.push({ value: historyItem.price, definitionId: 'purchase_price' });
                }
                // Add land/building prices if specified separately
                if (eventType === 'purchase' && historyItem.land_price) {
                  legacyMappings.push({ value: historyItem.land_price, definitionId: 'land_price' });
                }
                if (eventType === 'purchase' && historyItem.building_price) {
                  legacyMappings.push({ value: historyItem.building_price, definitionId: 'building_price' });
                }
                // Add sale price to costBases for sale events
                if (eventType === 'sale' && historyItem.price) {
                  legacyMappings.push({ value: historyItem.price, definitionId: 'sale_price' });
                }

                // Add all other cost base items
                legacyMappings.push(
                  { value: historyItem.purchase_legal_fees, definitionId: 'purchase_legal_fees' },
                  { value: historyItem.valuation_fees, definitionId: 'valuation_fees' },
                  { value: historyItem.stamp_duty, definitionId: 'stamp_duty' },
                  { value: historyItem.purchase_agent_fees, definitionId: 'purchase_agent_fees' },
                  { value: historyItem.land_tax, definitionId: 'land_tax' },
                  { value: historyItem.insurance, definitionId: 'insurance' },
                  { value: historyItem.improvement_cost, definitionId: 'renovation_whole_house' },
                  { value: historyItem.title_legal_fees, definitionId: 'title_legal_fees' },
                  { value: historyItem.sale_legal_fees || historyItem.legal_fees, definitionId: 'sale_legal_fees' },
                  { value: historyItem.sale_agent_fees || historyItem.agent_fees, definitionId: 'sale_agent_fees' },
                );

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

              // Use the price from the JSON as the main transaction amount
              // Do NOT sum cost bases - the price field is the actual transaction price
              let calculatedAmount = historyItem.price;

              // For purchase events, try land_price + building_price if no price specified
              if (eventType === 'purchase' && !calculatedAmount) {
                if (historyItem.land_price || historyItem.building_price) {
                  calculatedAmount = (historyItem.land_price || 0) + (historyItem.building_price || 0);
                }
              }

              // For improvement events with no price, sum improvement cost bases
              if (eventType === 'improvement' && !calculatedAmount && costBases && costBases.length > 0) {
                calculatedAmount = costBases.reduce((sum: number, cb: any) => sum + (cb.amount || 0), 0);
              }

              // Create event
              const event: TimelineEvent = {
                id: `import-event-${Date.now()}-${propIndex}-${eventIndex}`,
                propertyId,
                type: eventType,
                date: eventDate,
                title: historyItem.description || eventType.replace('_', ' '),
                amount: calculatedAmount,
                description: historyItem.description,
                position: 0,
                color: eventColors[eventType] || '#3B82F6',
                contractDate: historyItem.contract_date ? new Date(historyItem.contract_date) : undefined,
                settlementDate: historyItem.settlement_date ? new Date(historyItem.settlement_date) : undefined,
                newStatus: historyItem.new_status,
                isPPR: historyItem.is_ppr,
                landPrice: historyItem.land_price,
                buildingPrice: historyItem.building_price,
                // Cost bases array
                costBases,
                // Market valuation for move_out events (supports both field names for backwards compatibility)
                marketValuation: historyItem.market_value || historyItem.market_valuation || historyItem.market_value_at_first_income,
                // Mixed-use percentages and dates
                checkboxState: historyItem.checkboxState,
                livingUsePercentage: historyItem.livingUsePercentage,
                rentalUsePercentage: historyItem.rentalUsePercentage,
                businessUsePercentage: historyItem.businessUsePercentage,
                mixedUseMoveInDate: historyItem.mixedUseMoveInDate ? new Date(historyItem.mixedUseMoveInDate) : undefined,
                rentalUseStartDate: historyItem.rentalUseStartDate ? new Date(historyItem.rentalUseStartDate) : undefined,
                businessUseStartDate: historyItem.businessUseStartDate ? new Date(historyItem.businessUseStartDate) : undefined,
                floorAreaData: historyItem.floorAreaData,
                // CGT flags and property details
                overTwoHectares: historyItem.overTwoHectares,
                isLandOnly: historyItem.isLandOnly,
                hectares: historyItem.hectares,
                capitalProceedsType: historyItem.capitalProceedsType,
                exemptionType: historyItem.exemptionType,
                isResident: historyItem.isResident,
                previousYearLosses: historyItem.previousYearLosses,
                affectsStatus: historyItem.affectsStatus,
                // Ownership change data
                leavingOwners: historyItem.leavingOwners,
                newOwners: historyItem.newOwners,
                ownershipChangeReason: historyItem.ownershipChangeReason,
                ownershipChangeReasonOther: historyItem.ownershipChangeReasonOther,
                // Subdivision details
                subdivisionDetails: historyItem.subdivisionDetails,
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

      // Migrate market valuation from move_out to rent_start events
      // For each property, find move_out events with marketValuation and corresponding rent_start events
      importedProperties.forEach(property => {
        const propertyEvents = importedEvents.filter(e => e.propertyId === property.id);

        // Find all move_out events with market valuation
        const moveOutEvents = propertyEvents.filter(e =>
          e.type === 'move_out' && e.marketValuation !== undefined && e.marketValuation > 0
        );

        moveOutEvents.forEach(moveOutEvent => {
          // Find rent_start event on or near the same date (within 30 days)
          const rentStartEvent = propertyEvents.find(e =>
            e.type === 'rent_start' &&
            Math.abs(e.date.getTime() - moveOutEvent.date.getTime()) < 30 * 24 * 60 * 60 * 1000 // 30 days
          );

          if (rentStartEvent) {
            // Move market valuation from move_out to rent_start
            console.log(`📊 Migrating market valuation from move_out to rent_start for ${property.name}:`, {
              moveOutDate: moveOutEvent.date,
              rentStartDate: rentStartEvent.date,
              marketValuation: moveOutEvent.marketValuation
            });

            rentStartEvent.marketValuation = moveOutEvent.marketValuation;
            delete moveOutEvent.marketValuation;
          }
        });
      });

      // Calculate timeline boundaries
      const allDates = importedEvents.map(e => e.date.getTime());
      const minDate = allDates.length > 0 ? new Date(Math.min(...allDates)) : new Date(2000, 0, 1);
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 3); // Default to 3 years from now

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

      // Initialize marginal tax rate from imported events
      get().initializeMarginalTaxRate();
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

  setLogoVariant: (variantId: string) => {
    set({ currentLogoVariant: variantId });
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('logoVariant', variantId);
    }
  },

  toggleLockFutureDates: () => {
    const state = get();
    set({ lockFutureDates: !state.lockFutureDates });
  },

  toggleDragEvents: () => {
    const state = get();
    set({ enableDragEvents: !state.enableDragEvents });
  },

  toggleAISuggestedQuestions: () => {
    const state = get();
    set({ enableAISuggestedQuestions: !state.enableAISuggestedQuestions });
  },

  setAnalysisDisplayMode: (mode: AnalysisDisplayMode) => {
    set({ analysisDisplayMode: mode });
  },

  cycleAnalysisDisplayMode: () => {
    const state = get();
    const modes: AnalysisDisplayMode[] = ['auto', 'json-sections', 'markdown'];
    const currentIndex = modes.indexOf(state.analysisDisplayMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    set({ analysisDisplayMode: modes[nextIndex] });
  },

  setAPIResponseMode: (mode: APIResponseMode) => {
    set({ apiResponseMode: mode });
    console.log(`🔄 API Response Mode changed to: ${mode}`);
  },

  // LLM Provider Action Implementations
  setSelectedLLMProvider: (provider: string) => {
    set({ selectedLLMProvider: provider });
    console.log(`🤖 LLM Provider changed to: ${provider}`);
  },

  fetchLLMProviders: async () => {
    set({ isLoadingProviders: true });

    try {
      console.log('🔄 Fetching LLM providers...');
      const response = await fetch('/api/llm-providers');

      if (!response.ok) {
        throw new Error(`Failed to fetch providers: ${response.statusText}`);
      }

      const data: LLMProvidersResponse = await response.json();
      console.log('✅ LLM providers fetched:', data);

      // Determine the selected provider:
      // 1. Prefer 'deepseek' if available
      // 2. Otherwise keep current selection if it's in the list
      // 3. Fall back to API default
      const currentSelection = get().selectedLLMProvider;
      let selectedProvider: string;

      if ('deepseek' in data.providers) {
        selectedProvider = 'deepseek';
      } else if (currentSelection in data.providers) {
        selectedProvider = currentSelection;
      } else {
        selectedProvider = data.default;
      }

      set({
        availableLLMProviders: data.providers,
        selectedLLMProvider: selectedProvider,
        isLoadingProviders: false,
      });
    } catch (error) {
      console.error('❌ Error fetching LLM providers:', error);
      // Keep default providers on error
      set({ isLoadingProviders: false });
    }
  },

  // AI Feedback Action Implementations
  setAIResponse: (response: AIResponse) => {
    const state = get();
    const { getIssuesFromResponse, getGapsFromResponse, isSuccessResponse } = require('../types/ai-feedback');
    type AIIssue = import('../types/ai-feedback').AIIssue;
    type TimelineGap = import('../types/ai-feedback').TimelineGap;

    // Extract issues and gaps from response
    const rawIssues = getIssuesFromResponse(response);
    const gaps = getGapsFromResponse(response);

    // Map issues to timeline issues with event/property links
    const timelineIssues: TimelineIssue[] = rawIssues.map((issue: AIIssue, index: number) => {
      const timelineIssue: TimelineIssue = {
        id: `issue-${Date.now()}-${index}`,
        severity: issue.severity,
        category: issue.category,
        message: issue.message,
        question: issue.question || issue.clarification_question || '',
        impact: issue.impact || '',
        suggestion: issue.suggestion || issue.suggested_resolution || null,
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

      // For timeline gap issues, add date information
      if (issue.category === 'timeline_gap') {
        const relatedGap = gaps.find((gap: TimelineGap) => issue.message.includes(gap.start_date));
        if (relatedGap) {
          timelineIssue.startDate = new Date(relatedGap.start_date);
          timelineIssue.endDate = new Date(relatedGap.end_date);
          timelineIssue.duration = relatedGap.duration_days;
          timelineIssue.gapId = `gap-${relatedGap.start_date}-${relatedGap.end_date}`;
        }
      }

      return timelineIssue;
    });

    // Calculate positioned gaps for timeline visualization
    const { timelineStart, timelineEnd } = state;
    const timelineRange = timelineEnd.getTime() - timelineStart.getTime();

    const positionedGaps: PositionedGap[] = gaps.map((gap: TimelineGap, index: number) => {
      const gapStart = new Date(gap.start_date);
      const gapEnd = new Date(gap.end_date);

      // Calculate x position relative to visible timeline
      const startOffset = gapStart.getTime() - timelineStart.getTime();
      const endOffset = gapEnd.getTime() - timelineStart.getTime();

      // Convert to percentage (0-100)
      const xPercent = (startOffset / timelineRange) * 100;
      const widthPercent = ((endOffset - startOffset) / timelineRange) * 100;

      // Find related issue for this gap
      const relatedIssue = rawIssues.find((issue: AIIssue) =>
        issue.category === 'timeline_gap' &&
        issue.message.includes(gap.start_date)
      );

      // Map owned_properties addresses to property IDs
      const propertyIds = gap.owned_properties
        .map((address: string) => {
          const property = state.properties.find(
            p => p.address === address || p.name === address
          );
          console.log('Gap mapping:', address, '-> property:', property?.name, 'ID:', property?.id);
          return property?.id;
        })
        .filter((id): id is string => id !== undefined);

      console.log('Created positioned gap:', {
        start: gap.start_date,
        end: gap.end_date,
        addresses: gap.owned_properties,
        propertyIds,
        x: xPercent,
        width: widthPercent,
      });

      return {
        ...gap,
        id: `gap-${gap.start_date}-${gap.end_date}`,
        x: xPercent,
        width: widthPercent,
        relatedIssue: relatedIssue || undefined,
        propertyIds,
      };
    });

    // Extract residence gap issues (category === 'timeline_gap')
    const residenceGapIssues = rawIssues.filter((issue: AIIssue) =>
      issue.category === 'timeline_gap' && issue.affected_period
    );

    console.log('📍 Extracted residence gap issues:', residenceGapIssues.length);
    residenceGapIssues.forEach((gap: AIIssue) => {
      console.log('  Gap:', gap.affected_period?.start, 'to', gap.affected_period?.end,
                  '(', gap.affected_period?.days, 'days)',
                  'Severity:', gap.severity);
    });

    set({
      aiResponse: response,
      timelineIssues,
      positionedGaps,
      residenceGapIssues,
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
      positionedGaps: [],
      residenceGapIssues: [],
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

      // Call the Next.js API route
      const response = await fetch('/api/calculate-cgt', {
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

  // Verification Alert Methods (from GilbertBranch)
  setVerificationAlerts: (alerts: VerificationAlert[]) => {
    const firstUnresolvedIndex = alerts.findIndex(alert => !alert.resolved);

    // Convert verification alerts to positioned gaps for red triangle visualization
    const state = get();
    const { properties, timelineStart, timelineEnd } = state;

    const positionedGaps: PositionedGap[] = alerts.map((alert, index) => {
      const gapStart = new Date(alert.startDate);
      const gapEnd = new Date(alert.endDate);
      const timelineRange = timelineEnd.getTime() - timelineStart.getTime();
      const startOffset = gapStart.getTime() - timelineStart.getTime();
      const x = (startOffset / timelineRange) * 100; // Percentage position

      // Calculate duration in days
      const durationMs = gapEnd.getTime() - gapStart.getTime();
      const duration_days = Math.round(durationMs / (1000 * 60 * 60 * 24));

      // Find matching property IDs
      const matchingProperty = properties.find(p =>
        alert.propertyId === p.id ||
        alert.propertyAddress.toLowerCase().includes(p.name.toLowerCase()) ||
        alert.propertyAddress.toLowerCase().includes(p.address.toLowerCase())
      );

      // Calculate width as percentage of timeline
      const endOffset = gapEnd.getTime() - timelineStart.getTime();
      const width = ((endOffset - startOffset) / timelineRange) * 100;

      return {
        id: alert.id,
        start_date: alert.startDate,
        end_date: alert.endDate,
        duration_days,
        owned_properties: [alert.propertyAddress], // Property address involved in the gap
        propertyIds: matchingProperty ? [matchingProperty.id] : [],
        x, // Position on timeline (percentage)
        width, // Width of gap (percentage)
      };
    });

    console.log('🔴 Setting verification alerts and creating positioned gaps:', {
      alertsCount: alerts.length,
      positionedGapsCount: positionedGaps.length,
      alerts: alerts.map(a => ({
        id: a.id,
        propertyAddress: a.propertyAddress,
        startDate: a.startDate,
        endDate: a.endDate,
      })),
      positionedGaps: positionedGaps.map(g => ({
        id: g.id,
        propertyIds: g.propertyIds,
        start_date: g.start_date,
        end_date: g.end_date,
        duration_days: g.duration_days,
        x: g.x,
      })),
    });

    set({
      verificationAlerts: alerts,
      currentAlertIndex: firstUnresolvedIndex >= 0 ? firstUnresolvedIndex : -1,
      positionedGaps, // Update positioned gaps for red triangle visualization
    });
  },

  clearVerificationAlerts: () => {
    set({
      verificationAlerts: [],
      currentAlertIndex: -1,
      positionedGaps: [], // Clear red triangle gaps too
    });
  },

  resolveVerificationAlert: (alertId: string, userResponse: string) => {
    const state = get();
    const resolvedAlert = state.verificationAlerts.find(a => a.id === alertId);

    console.log('💾 Store: Resolving TIMELINE verification alert:', {
      alertId,
      questionId: resolvedAlert?.questionId,
      propertyAddress: resolvedAlert?.propertyAddress,
      period: {
        start: resolvedAlert?.startDate,
        end: resolvedAlert?.endDate,
      },
      question: resolvedAlert?.clarificationQuestion,
      userResponse,
      timestamp: new Date().toISOString(),
    });

    const updatedAlerts = state.verificationAlerts.map(alert =>
      alert.id === alertId
        ? {
            ...alert,
            resolved: true,
            userResponse,
            resolvedAt: new Date().toISOString(),
          }
        : alert
    );

    // Also update positioned gaps to mark this gap as resolved
    const updatedGaps = state.positionedGaps.map(gap =>
      gap.id === alertId
        ? { ...gap, resolved: true }
        : gap
    );

    set({
      verificationAlerts: updatedAlerts,
      positionedGaps: updatedGaps,
    });

    // Auto-move to next unresolved alert
    setTimeout(() => get().moveToNextAlert(), 100);
  },

  getAllVerificationAlertsResolved: () => {
    const state = get();
    return state.verificationAlerts.length > 0 && state.verificationAlerts.every(alert => alert.resolved);
  },

  getUnresolvedAlerts: () => {
    const state = get();
    return state.verificationAlerts.filter(alert => !alert.resolved);
  },

  getCurrentAlert: () => {
    const state = get();
    if (state.currentAlertIndex >= 0 && state.currentAlertIndex < state.verificationAlerts.length) {
      return state.verificationAlerts[state.currentAlertIndex];
    }
    return null;
  },

  moveToNextAlert: () => {
    const state = get();
    const unresolvedAlerts = state.verificationAlerts.filter(alert => !alert.resolved);

    if (unresolvedAlerts.length > 0) {
      // Find the index of the first unresolved alert
      const nextIndex = state.verificationAlerts.findIndex(alert => !alert.resolved);
      set({ currentAlertIndex: nextIndex });
      console.log(`📍 Moved to alert ${nextIndex + 1}/${state.verificationAlerts.length}`);
    } else {
      // No more unresolved alerts
      set({ currentAlertIndex: -1 });
      console.log('✅ All alerts resolved!');
    }
  },

  setCurrentAlertIndex: (index: number) => {
    set({ currentAlertIndex: index });
  },

  panToDate: (date: Date) => {
    const state = get();
    const viewDuration = state.timelineEnd.getTime() - state.timelineStart.getTime();
    const newStart = new Date(date.getTime() - viewDuration / 2);
    const newEnd = new Date(date.getTime() + viewDuration / 2);

    set({
      timelineStart: newStart,
      timelineEnd: newEnd,
      centerDate: date,
    });
  },

  // Timeline Notes Actions
  setTimelineNotes: (notes: string) => {
    set({ timelineNotes: notes });
  },

  openNotesModal: () => {
    set({ isNotesModalOpen: true });
  },

  closeNotesModal: () => {
    set({ isNotesModalOpen: false });
  },

  // Marginal Tax Rate Actions
  setMarginalTaxRate: (rate: number) => {
    set({ marginalTaxRate: rate });

    // Update all sale events to reflect the new global tax rate
    const state = get();
    const updatedEvents = state.events.map(event => {
      if (event.type === 'sale') {
        let updatedDescription = event.description || '';
        const taxRateNote = `\n\nMarginal tax rate: ${rate}%`;

        // Update or add tax rate to description
        if (updatedDescription.includes('Marginal tax rate:')) {
          updatedDescription = updatedDescription.replace(
            /Marginal tax rate: [\d.]+%/g,
            `Marginal tax rate: ${rate}%`
          );
        } else {
          updatedDescription += taxRateNote;
        }

        return { ...event, description: updatedDescription };
      }
      return event;
    });

    set({ events: updatedEvents });
  },

  initializeMarginalTaxRate: () => {
    const state = get();

    // Scan all sale events for existing marginal tax rates
    const saleEvents = state.events.filter(e => e.type === 'sale');

    for (const event of saleEvents) {
      if (event.description) {
        const match = event.description.match(/Marginal tax rate: ([\d.]+)%/);
        if (match && match[1]) {
          const extractedRate = parseFloat(match[1]);
          // If any non-37% rate is found, use it as the global rate
          if (!isNaN(extractedRate) && extractedRate !== 37) {
            set({ marginalTaxRate: extractedRate });
            console.log(`📊 Initialized marginal tax rate from sale event: ${extractedRate}%`);
            return;
          }
        }
      }
    }

    // If no non-37% rate found, keep the default of 37%
    console.log('📊 Using default marginal tax rate: 37%');
  },

  // Subdivision Collapse Actions
  toggleSubdivisionCollapse: (subdivisionGroup: string) => {
    set((state) => {
      const isCollapsed = state.collapsedSubdivisions.includes(subdivisionGroup);

      if (isCollapsed) {
        // Remove from collapsed list (expand)
        return {
          collapsedSubdivisions: state.collapsedSubdivisions.filter(id => id !== subdivisionGroup)
        };
      } else {
        // Add to collapsed list (collapse)
        return {
          collapsedSubdivisions: [...state.collapsedSubdivisions, subdivisionGroup]
        };
      }
    });
  },

  // ========================================================================
  // STICKY NOTES - Timeline
  // ========================================================================

  addTimelineStickyNote: (noteData) => {
    const id = generateStickyNoteId();
    const now = new Date().toISOString();
    const note: StickyNote = {
      ...noteData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({
      timelineStickyNotes: [...state.timelineStickyNotes, note],
    }));
    console.log('📝 Added timeline sticky note:', { id, content: note.content.substring(0, 50) });
    return id;
  },

  updateTimelineStickyNote: (id, updates) => {
    set((state) => ({
      timelineStickyNotes: state.timelineStickyNotes.map((note) =>
        note.id === id
          ? { ...note, ...updates, updatedAt: new Date().toISOString() }
          : note
      ),
    }));
    console.log('📝 Updated timeline sticky note:', id);
  },

  deleteTimelineStickyNote: (id) => {
    set((state) => ({
      timelineStickyNotes: state.timelineStickyNotes.filter((note) => note.id !== id),
    }));
    console.log('🗑️ Deleted timeline sticky note:', id);
  },

  moveTimelineStickyNote: (id, newPosition) => {
    set((state) => ({
      timelineStickyNotes: state.timelineStickyNotes.map((note) =>
        note.id === id
          ? { ...note, position: newPosition, updatedAt: new Date().toISOString() }
          : note
      ),
    }));
    console.log('📍 Moved timeline sticky note:', { id, newPosition });
  },

  clearTimelineStickyNotes: () => {
    set({ timelineStickyNotes: [] });
    console.log('🧹 Cleared all timeline sticky notes');
  },

  // ========================================================================
  // STICKY NOTES - Analysis
  // ========================================================================

  addAnalysisStickyNote: (noteData) => {
    const id = generateStickyNoteId();
    const now = new Date().toISOString();
    const note: StickyNote = {
      ...noteData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({
      analysisStickyNotes: [...state.analysisStickyNotes, note],
    }));
    console.log('📝 Added analysis sticky note:', { id, content: note.content.substring(0, 50) });
    return id;
  },

  updateAnalysisStickyNote: (id, updates) => {
    set((state) => ({
      analysisStickyNotes: state.analysisStickyNotes.map((note) =>
        note.id === id
          ? { ...note, ...updates, updatedAt: new Date().toISOString() }
          : note
      ),
    }));
    console.log('📝 Updated analysis sticky note:', id);
  },

  deleteAnalysisStickyNote: (id) => {
    set((state) => ({
      analysisStickyNotes: state.analysisStickyNotes.filter((note) => note.id !== id),
    }));
    console.log('🗑️ Deleted analysis sticky note:', id);
  },

  moveAnalysisStickyNote: (id, newPosition) => {
    set((state) => ({
      analysisStickyNotes: state.analysisStickyNotes.map((note) =>
        note.id === id
          ? { ...note, position: newPosition, updatedAt: new Date().toISOString() }
          : note
      ),
    }));
    console.log('📍 Moved analysis sticky note:', { id, newPosition });
  },

  clearAnalysisStickyNotes: () => {
    set({ analysisStickyNotes: [] });
    console.log('🧹 Cleared all analysis sticky notes');
  },

  // ========================================================================
  // ANALYSIS SAVING
  // ========================================================================

  saveCurrentAnalysis: () => {
    const { aiResponse, selectedLLMProvider } = get();
    if (aiResponse) {
      set({
        savedAnalysis: {
          response: aiResponse,
          analyzedAt: new Date().toISOString(),
          provider: selectedLLMProvider || null,
        },
      });
      console.log('💾 Saved current analysis');
    }
  },

  clearSavedAnalysis: () => {
    set({
      savedAnalysis: null,
      analysisStickyNotes: [],
    });
    console.log('🧹 Cleared saved analysis');
  },

  // ========================================================================
  // SHAREABLE DATA EXPORT/IMPORT
  // ========================================================================

  exportShareableData: () => {
    const state = get();
    const now = new Date().toISOString();

    // Serialize properties
    const serializedProperties = state.properties.map((p) => ({
      ...p,
      purchaseDate: p.purchaseDate?.toISOString(),
      saleDate: p.saleDate?.toISOString(),
    }));

    // Serialize events
    const serializedEvents = state.events.map((e) => ({
      ...e,
      date: e.date.toISOString(),
      contractDate: e.contractDate?.toISOString(),
      settlementDate: e.settlementDate?.toISOString(),
      appreciationDate: e.appreciationDate?.toISOString(),
    }));

    const shareableData: ShareableTimelineData = {
      version: '2.2.0', // Bumped version - removed drawing annotations
      properties: serializedProperties,
      events: serializedEvents,
      notes: state.timelineNotes || undefined,
      timelineStickyNotes: state.timelineStickyNotes,
      savedAnalysis: state.savedAnalysis?.response ? {
        response: state.savedAnalysis.response,
        analyzedAt: state.savedAnalysis.analyzedAt || now,
        analysisStickyNotes: state.analysisStickyNotes,
        provider: state.savedAnalysis.provider || undefined,
      } : (state.aiResponse ? {
        response: state.aiResponse,
        analyzedAt: now,
        analysisStickyNotes: state.analysisStickyNotes,
        provider: state.selectedLLMProvider || undefined,
      } : undefined),
      createdAt: now,
      updatedAt: now,
    };

    console.log('📤 Exported shareable data:', {
      properties: shareableData.properties.length,
      events: shareableData.events.length,
      timelineStickyNotes: shareableData.timelineStickyNotes.length,
      hasAnalysis: !!shareableData.savedAnalysis,
      analysisStickyNotes: shareableData.savedAnalysis?.analysisStickyNotes?.length || 0,
    });

    return shareableData;
  },

  importShareableData: (data) => {
    try {
      console.log('📥 Importing shareable data:', {
        version: data.version,
        properties: data.properties?.length,
        events: data.events?.length,
        timelineStickyNotes: data.timelineStickyNotes?.length,
        hasAnalysis: !!data.savedAnalysis,
      });

      // Deserialize properties
      const properties = (data.properties || []).map((p: any) => ({
        ...p,
        purchaseDate: p.purchaseDate ? new Date(p.purchaseDate) : undefined,
        saleDate: p.saleDate ? new Date(p.saleDate) : undefined,
      }));

      // Deserialize events
      const events = (data.events || []).map((e: any) => ({
        ...e,
        date: new Date(e.date),
        contractDate: e.contractDate ? new Date(e.contractDate) : undefined,
        settlementDate: e.settlementDate ? new Date(e.settlementDate) : undefined,
        appreciationDate: e.appreciationDate ? new Date(e.appreciationDate) : undefined,
      }));

      // Calculate timeline boundaries
      const allDates = events.map((e: any) => e.date.getTime());
      const minDate = allDates.length > 0 ? new Date(Math.min(...allDates)) : new Date(2000, 0, 1);
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 3);

      // Set the imported data
      set({
        properties,
        events,
        timelineNotes: data.notes || '',
        timelineStickyNotes: data.timelineStickyNotes || [],
        analysisStickyNotes: data.savedAnalysis?.analysisStickyNotes || [],
        aiResponse: data.savedAnalysis?.response || null,
        savedAnalysis: data.savedAnalysis ? {
          response: data.savedAnalysis.response,
          analyzedAt: data.savedAnalysis.analyzedAt,
          provider: data.savedAnalysis.provider || null,
        } : null,
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

      // Initialize marginal tax rate from imported events
      get().initializeMarginalTaxRate();

      console.log('✅ Successfully imported shareable data');
    } catch (error) {
      console.error('❌ Error importing shareable data:', error);
      throw error;
    }
  },
};
});
