import { Property } from '@/store/timeline';

/**
 * Calculate vertical positions for properties in a subdivision hierarchy
 * Returns a map of property IDs to their vertical branch positions
 */
export interface BranchPosition {
  propertyId: string;
  level: number;        // 0 for parent, 1+ for children
  yOffset: number;      // Vertical offset in pixels
  parentId?: string;    // Reference to parent property
  siblingIndex: number; // Index among siblings (0-based)
  totalSiblings: number;
}

const BRANCH_VERTICAL_SPACING = 130; // Pixels between sibling branches (increased from 100 for better readability)
const PARENT_CHILD_VERTICAL_GAP = 60; // Pixels from parent to first child (increased from 40 for better gap)

/**
 * Calculate branch positions for all properties including subdivisions
 */
export function calculateBranchPositions(properties: Property[]): Map<string, BranchPosition> {
  const positionMap = new Map<string, BranchPosition>();

  // Find all parent properties (no parentPropertyId)
  const parentProperties = properties.filter(p => !p.parentPropertyId);

  // Process each parent and its children
  let currentYOffset = 0;

  parentProperties.forEach((parent) => {
    // Add parent position
    positionMap.set(parent.id!, {
      propertyId: parent.id!,
      level: 0,
      yOffset: currentYOffset,
      siblingIndex: 0,
      totalSiblings: 1,
    });

    // Find all children of this parent
    const children = properties.filter(p => p.parentPropertyId === parent.id);

    if (children.length > 0) {
      // Sort children by lotNumber or creation order
      const sortedChildren = [...children].sort((a, b) => {
        if (a.lotNumber && b.lotNumber) {
          return a.lotNumber.localeCompare(b.lotNumber);
        }
        return 0;
      });

      // Position children below parent
      sortedChildren.forEach((child, index) => {
        positionMap.set(child.id!, {
          propertyId: child.id!,
          level: 1,
          yOffset: currentYOffset + PARENT_CHILD_VERTICAL_GAP + (index * BRANCH_VERTICAL_SPACING),
          parentId: parent.id,
          siblingIndex: index,
          totalSiblings: sortedChildren.length,
        });
      });

      // Move offset past all children for next parent
      currentYOffset += PARENT_CHILD_VERTICAL_GAP + (sortedChildren.length * BRANCH_VERTICAL_SPACING);
    } else {
      // No children, just move to next parent position
      currentYOffset += BRANCH_VERTICAL_SPACING;
    }
  });

  return positionMap;
}

/**
 * Get the subdivision event date for a parent property
 */
export function getSubdivisionDate(parentProperty: Property): Date | null {
  return parentProperty.subdivisionDate || null;
}

/**
 * Check if a property has been subdivided
 */
export function isSubdivided(property: Property, allProperties: Property[]): boolean {
  return allProperties.some(p => p.parentPropertyId === property.id);
}

/**
 * Get all child properties of a parent
 */
export function getChildProperties(parentId: string, allProperties: Property[]): Property[] {
  return allProperties.filter(p => p.parentPropertyId === parentId);
}

/**
 * Get the parent property of a child
 */
export function getParentProperty(childProperty: Property, allProperties: Property[]): Property | null {
  if (!childProperty.parentPropertyId) return null;
  return allProperties.find(p => p.id === childProperty.parentPropertyId) || null;
}

/**
 * Calculate the visual connection points for subdivision branching
 * Returns coordinates for drawing the split lines
 */
export interface SubdivisionConnection {
  parentId: string;
  childId: string;
  splitDate: Date;
  splitPosition: number; // Timeline position where split occurs
  parentY: number;
  childY: number;
}

export function calculateSubdivisionConnections(
  properties: Property[],
  branchPositions: Map<string, BranchPosition>,
  events: any[], // TimelineEvent[] - events array to find subdivision event
  dateToPosition: (date: Date) => number
): SubdivisionConnection[] {
  const connections: SubdivisionConnection[] = [];

  properties.forEach((child) => {
    if (!child.parentPropertyId || !child.subdivisionDate) return;

    const parent = properties.find(p => p.id === child.parentPropertyId);
    if (!parent) return;

    const parentPos = branchPositions.get(parent.id!);
    const childPos = branchPositions.get(child.id!);

    if (!parentPos || !childPos) return;

    // Find subdivision event on parent to get authoritative date
    // This ensures pink lines align with the SPLIT event badge position
    const subdivisionEvent = events.find(e =>
      e.propertyId === parent.id &&
      e.type === 'subdivision' &&
      e.subdivisionDetails?.childProperties?.some((cp: any) => cp.id === child.id)
    );

    // Use subdivision event date as authoritative source, fallback to child.subdivisionDate
    const splitDate = subdivisionEvent?.date || child.subdivisionDate;
    const splitPosition = dateToPosition(splitDate);

    connections.push({
      parentId: parent.id!,
      childId: child.id!,
      splitDate: splitDate,
      splitPosition: splitPosition,
      parentY: parentPos.yOffset,
      childY: childPos.yOffset,
    });
  });

  return connections;
}
