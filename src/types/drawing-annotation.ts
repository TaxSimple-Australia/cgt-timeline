/**
 * Drawing Annotation System Types
 *
 * Provides types for freehand drawing annotations on both the timeline
 * and CGT analysis views. Drawings maintain their exact positions
 * when shared via links, just like sticky notes.
 *
 * Each annotation consists of:
 * - A freehand drawing (path of points)
 * - An attached note with content
 * - An automatic arrow connecting the note to the drawing
 */

import type { StickyNoteColor, TimelineNotePosition, AnalysisNotePosition } from './sticky-note';

// Context where the drawing annotation is placed
export type DrawingAnnotationContext = 'timeline' | 'analysis';

/**
 * A single point in a drawing path, relative to the anchor position
 */
export interface DrawingPoint {
  /** X offset from anchor in pixels */
  x: number;
  /** Y offset from anchor in pixels */
  y: number;
}

/**
 * Position of a drawing on the timeline
 * The anchor determines where the drawing is placed on the timeline
 * All path points are relative to this anchor
 */
export interface TimelineDrawingPosition {
  /** The date on the timeline where the drawing is anchored (ISO string) */
  anchorDate: string;
  /** Vertical offset from the timeline center in pixels */
  verticalOffset: number;
  /** Optional: anchor to a specific property lane */
  propertyId?: string;
  /** Optional: anchor to a specific event */
  eventId?: string;
}

/**
 * Position of a drawing on analysis view
 * Similar to AnalysisNotePosition but for drawings
 */
export interface AnalysisDrawingPosition {
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
 * Stroke style for drawings
 */
export interface DrawingStrokeStyle {
  /** Stroke color (CSS color string) */
  color: string;
  /** Stroke width in pixels */
  width: number;
  /** Optional opacity (0-1) */
  opacity?: number;
}

/**
 * The attached note for a drawing annotation
 */
export interface DrawingNote {
  /** Note content/text */
  content: string;
  /** Note color theme (reuses sticky note colors) */
  color: StickyNoteColor;
  /** Position of the note (can be moved independently) */
  position: TimelineNotePosition | AnalysisNotePosition;
  /** Whether the note is minimized/collapsed */
  isMinimized?: boolean;
}

/**
 * Arrow style connecting note to drawing
 */
export interface ArrowStyle {
  /** Arrow color (defaults to note border color) */
  color?: string;
  /** Arrow width in pixels */
  width?: number;
  /** Arrow head size */
  headSize?: number;
}

/**
 * Main drawing annotation interface
 * Combines a freehand drawing with an attached note and connecting arrow
 */
export interface DrawingAnnotation {
  /** Unique identifier */
  id: string;

  /** Context: timeline or analysis */
  context: DrawingAnnotationContext;

  /** The freehand drawing path - array of points relative to anchor */
  path: DrawingPoint[];

  /** Stroke style for the drawing */
  stroke: DrawingStrokeStyle;

  /** Position of the drawing anchor (determines where path is rendered) */
  drawingPosition: TimelineDrawingPosition | AnalysisDrawingPosition;

  /** The attached note */
  note: DrawingNote;

  /** Optional custom arrow style */
  arrowStyle?: ArrowStyle;

  /** Z-index for stacking order */
  zIndex?: number;

  /** When the annotation was created (ISO string) */
  createdAt: string;

  /** When the annotation was last updated (ISO string) */
  updatedAt: string;

  /** Optional author name */
  author?: string;
}

/**
 * Default stroke styles for drawings
 */
export const DEFAULT_DRAWING_STROKE: DrawingStrokeStyle = {
  color: '#EF4444', // Red for visibility
  width: 3,
  opacity: 1,
};

/**
 * Available stroke colors for drawings
 */
export const DRAWING_STROKE_COLORS = [
  { color: '#EF4444', name: 'Red' },
  { color: '#F97316', name: 'Orange' },
  { color: '#EAB308', name: 'Yellow' },
  { color: '#22C55E', name: 'Green' },
  { color: '#3B82F6', name: 'Blue' },
  { color: '#8B5CF6', name: 'Purple' },
  { color: '#EC4899', name: 'Pink' },
  { color: '#64748B', name: 'Gray' },
] as const;

/**
 * Available stroke widths
 */
export const DRAWING_STROKE_WIDTHS = [2, 3, 4, 6, 8] as const;

/**
 * Generate a unique ID for a drawing annotation
 */
export function generateDrawingAnnotationId(): string {
  return `drawing_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Helper function to check if a position is a timeline drawing position
 */
export function isTimelineDrawingPosition(
  position: TimelineDrawingPosition | AnalysisDrawingPosition
): position is TimelineDrawingPosition {
  return 'anchorDate' in position;
}

/**
 * Helper function to check if a position is an analysis drawing position
 */
export function isAnalysisDrawingPosition(
  position: TimelineDrawingPosition | AnalysisDrawingPosition
): position is AnalysisDrawingPosition {
  return 'section' in position;
}

/**
 * Calculate the center point of a drawing path
 */
export function calculatePathCenter(path: DrawingPoint[]): DrawingPoint {
  if (path.length === 0) return { x: 0, y: 0 };

  const sum = path.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 }
  );

  return {
    x: sum.x / path.length,
    y: sum.y / path.length,
  };
}

/**
 * Calculate the bounding box of a drawing path
 */
export function calculatePathBounds(path: DrawingPoint[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (path.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  const xs = path.map((p) => p.x);
  const ys = path.map((p) => p.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Convert path points to SVG path data string
 */
export function pathToSvgD(path: DrawingPoint[]): string {
  if (path.length === 0) return '';
  if (path.length === 1) {
    // Single point - draw a small circle
    return `M ${path[0].x} ${path[0].y} m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0`;
  }

  const [first, ...rest] = path;
  let d = `M ${first.x} ${first.y}`;

  // Use quadratic bezier curves for smooth lines
  for (let i = 0; i < rest.length; i++) {
    const current = rest[i];
    const prev = i === 0 ? first : rest[i - 1];

    // Use quadratic curve with midpoint as control point for smoothness
    const midX = (prev.x + current.x) / 2;
    const midY = (prev.y + current.y) / 2;

    if (i === 0) {
      d += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`;
    } else {
      d += ` Q ${prev.x} ${prev.y} ${midX} ${midY}`;
    }

    // Connect to final point
    if (i === rest.length - 1) {
      d += ` L ${current.x} ${current.y}`;
    }
  }

  return d;
}

/**
 * Create a new drawing annotation with default values
 */
export function createDrawingAnnotation(
  context: DrawingAnnotationContext,
  path: DrawingPoint[],
  drawingPosition: TimelineDrawingPosition | AnalysisDrawingPosition,
  notePosition: TimelineNotePosition | AnalysisNotePosition,
  noteContent: string = '',
  strokeStyle: Partial<DrawingStrokeStyle> = {}
): DrawingAnnotation {
  const now = new Date().toISOString();
  return {
    id: generateDrawingAnnotationId(),
    context,
    path,
    stroke: { ...DEFAULT_DRAWING_STROKE, ...strokeStyle },
    drawingPosition,
    note: {
      content: noteContent,
      color: 'yellow',
      position: notePosition,
      isMinimized: false,
    },
    zIndex: 1000,
    createdAt: now,
    updatedAt: now,
  };
}
