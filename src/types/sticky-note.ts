/**
 * Sticky Note System Types
 *
 * Provides types for persistent sticky notes on both the timeline
 * and CGT analysis views. Notes maintain their exact positions
 * when shared via links.
 */

// Context where the sticky note is placed
export type StickyNoteContext = 'timeline' | 'analysis';

// Available colors for sticky notes
export type StickyNoteColor =
  | 'yellow'
  | 'pink'
  | 'blue'
  | 'green'
  | 'purple'
  | 'orange';

/**
 * Position on timeline - anchored to a specific date and vertical offset
 */
export interface TimelineNotePosition {
  /** The date on the timeline where the note is anchored (ISO string) */
  anchorDate: string;
  /** Vertical offset from the timeline center in pixels (can be negative for above) */
  verticalOffset: number;
  /** Optional: anchor to a specific property lane */
  propertyId?: string;
  /** Optional: anchor to a specific event */
  eventId?: string;
}

/**
 * Position on analysis view - relative to a specific section/element
 */
export interface AnalysisNotePosition {
  /** Which section of the analysis */
  section: 'summary' | 'property-card' | 'calculation-breakdown' | 'detailed-report' | 'recommendations' | 'what-if' | 'rules' | 'general';
  /** ID of the specific element (e.g., property ID for property cards) */
  elementId?: string;
  /** Relative X position within the element (0-100 percentage) */
  relativeX: number;
  /** Relative Y position within the element (0-100 percentage) */
  relativeY: number;
}

/**
 * Main sticky note interface
 */
export interface StickyNote {
  /** Unique identifier */
  id: string;
  /** Note content/text */
  content: string;
  /** Note color theme */
  color: StickyNoteColor;
  /** When the note was created (ISO string) */
  createdAt: string;
  /** When the note was last updated (ISO string) */
  updatedAt: string;
  /** Context: timeline or analysis */
  context: StickyNoteContext;
  /** Position data (type depends on context) */
  position: TimelineNotePosition | AnalysisNotePosition;
  /** Optional author name */
  author?: string;
  /** Whether the note is minimized/collapsed */
  isMinimized?: boolean;
  /** Z-index for stacking order */
  zIndex?: number;
}

/**
 * Color configuration for each sticky note color
 */
export interface StickyNoteColorConfig {
  /** Light mode background */
  light: string;
  /** Dark mode / header background */
  dark: string;
  /** Border/accent color */
  border: string;
  /** Text color for dark backgrounds */
  text: string;
}

/**
 * Color mappings for all sticky note colors
 */
export const STICKY_NOTE_COLORS: Record<StickyNoteColor, StickyNoteColorConfig> = {
  yellow: {
    light: '#FEF3C7',
    dark: '#FDE68A',
    border: '#F59E0B',
    text: '#92400E',
  },
  pink: {
    light: '#FCE7F3',
    dark: '#F9A8D4',
    border: '#EC4899',
    text: '#9D174D',
  },
  blue: {
    light: '#DBEAFE',
    dark: '#93C5FD',
    border: '#3B82F6',
    text: '#1E40AF',
  },
  green: {
    light: '#D1FAE5',
    dark: '#6EE7B7',
    border: '#10B981',
    text: '#065F46',
  },
  purple: {
    light: '#EDE9FE',
    dark: '#C4B5FD',
    border: '#8B5CF6',
    text: '#5B21B6',
  },
  orange: {
    light: '#FFEDD5',
    dark: '#FDBA74',
    border: '#F97316',
    text: '#9A3412',
  },
};

/**
 * Default color for new sticky notes
 */
export const DEFAULT_STICKY_NOTE_COLOR: StickyNoteColor = 'yellow';

/**
 * Extended shareable data structure that includes sticky notes, drawing annotations, and analysis
 */
export interface ShareableTimelineData {
  /** Schema version for backwards compatibility */
  version: string;
  /** Properties in the timeline */
  properties: any[];
  /** Events in the timeline */
  events: any[];
  /** Timeline notes/feedback text */
  notes?: string;
  /** Sticky notes on the timeline */
  timelineStickyNotes: StickyNote[];
  /** Drawing annotations on the timeline (circles, freehand drawings with notes) */
  timelineDrawingAnnotations?: any[]; // DrawingAnnotation[] - using any for backwards compatibility
  /** Saved analysis data (if analysis has been run) */
  savedAnalysis?: {
    /** The full AI response */
    response: any;
    /** When the analysis was performed (ISO string) */
    analyzedAt: string;
    /** Sticky notes on the analysis */
    analysisStickyNotes: StickyNote[];
    /** Drawing annotations on the analysis */
    analysisDrawingAnnotations?: any[]; // DrawingAnnotation[]
    /** Which LLM provider was used */
    provider?: string;
  };
  /** When the shareable link was created */
  createdAt: string;
  /** When the data was last updated */
  updatedAt: string;
  /** Optional title for the shared timeline */
  title?: string;
  /** Optional description */
  description?: string;
}

/**
 * Helper function to check if a position is a timeline position
 */
export function isTimelinePosition(position: TimelineNotePosition | AnalysisNotePosition): position is TimelineNotePosition {
  return 'anchorDate' in position;
}

/**
 * Helper function to check if a position is an analysis position
 */
export function isAnalysisPosition(position: TimelineNotePosition | AnalysisNotePosition): position is AnalysisNotePosition {
  return 'section' in position;
}

/**
 * Generate a unique ID for a sticky note
 */
export function generateStickyNoteId(): string {
  return `note_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Create a new sticky note with default values
 */
export function createStickyNote(
  context: StickyNoteContext,
  position: TimelineNotePosition | AnalysisNotePosition,
  content: string = '',
  color: StickyNoteColor = DEFAULT_STICKY_NOTE_COLOR
): StickyNote {
  const now = new Date().toISOString();
  return {
    id: generateStickyNoteId(),
    content,
    color,
    createdAt: now,
    updatedAt: now,
    context,
    position,
    isMinimized: false,
    zIndex: 1000,
  };
}
