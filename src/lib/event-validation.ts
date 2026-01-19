import { TimelineEvent } from '@/store/timeline';
import { format } from 'date-fns';

export type EventType = TimelineEvent['type'];

export interface ValidationResult {
  valid: boolean;
  error?: string;
  suggestion?: {
    type: 'createPurchase' | 'createSale' | 'createMoveIn' | 'createRentStart' | 'createVacantStart';
    suggestedDate?: Date;
    message?: string;
  };
}

/**
 * Event types that require a purchase event to exist first
 */
const REQUIRES_PURCHASE: EventType[] = [
  'move_in',
  'move_out',
  'rent_start',
  'rent_end',
  'improvement',
  'refinance',
  'vacant_start',
  'vacant_end',
  'sale',
];

/**
 * Validates that an event can be added based on logical business rules
 * Only validates absolute impossibilities - no edge cases
 */
export function validateEvent(
  newEvent: Omit<TimelineEvent, 'id'>,
  existingEvents: TimelineEvent[]
): ValidationResult {
  // 1. Validate purchase prerequisite
  const purchaseValidation = validateEventAgainstPurchase(newEvent, existingEvents);
  if (!purchaseValidation.valid) return purchaseValidation;

  // 2. Validate not after sale
  const saleValidation = validateEventAgainstSale(newEvent, existingEvents);
  if (!saleValidation.valid) return saleValidation;

  // 3. Validate paired events
  const pairedValidation = validatePairedEvent(newEvent, existingEvents);
  if (!pairedValidation.valid) return pairedValidation;

  // 4. Validate multiple purchase
  const multiplePurchaseValidation = validateMultiplePurchase(newEvent, existingEvents);
  if (!multiplePurchaseValidation.valid) return multiplePurchaseValidation;

  return { valid: true };
}

/**
 * Rule 1: Purchase must exist and event must be on or after purchase date
 */
function validateEventAgainstPurchase(
  newEvent: Omit<TimelineEvent, 'id'>,
  existingEvents: TimelineEvent[]
): ValidationResult {
  // Skip if this is a purchase event or doesn't require purchase
  if (newEvent.type === 'purchase' || !REQUIRES_PURCHASE.includes(newEvent.type)) {
    return { valid: true };
  }

  // Find purchase event
  const purchaseEvent = existingEvents.find((e) => e.type === 'purchase');

  // No purchase exists
  if (!purchaseEvent) {
    const eventLabel = getEventLabel(newEvent.type);
    return {
      valid: false,
      error: `Cannot add ${eventLabel} event without a purchase event.`,
      suggestion: {
        type: 'createPurchase',
        suggestedDate: newEvent.date,
        message: `This property needs a purchase event first. Would you like to create one now?`,
      },
    };
  }

  // Event is before purchase date
  if (newEvent.date < purchaseEvent.date) {
    const eventLabel = getEventLabel(newEvent.type);
    return {
      valid: false,
      error: `Cannot add ${eventLabel} event before purchase date.\n\nPurchase date: ${format(
        purchaseEvent.date,
        'dd/MM/yyyy'
      )}\nEvent date: ${format(newEvent.date, 'dd/MM/yyyy')}`,
    };
  }

  return { valid: true };
}

/**
 * Rule 2: No events after sale (except new purchase - could buy it back)
 */
function validateEventAgainstSale(
  newEvent: Omit<TimelineEvent, 'id'>,
  existingEvents: TimelineEvent[]
): ValidationResult {
  // Allow new purchase after sale (could buy property back)
  if (newEvent.type === 'purchase') {
    return { valid: true };
  }

  // Find sale event
  const saleEvent = existingEvents.find((e) => e.type === 'sale');

  // No sale exists - valid
  if (!saleEvent) {
    return { valid: true };
  }

  // Event is after sale date
  if (newEvent.date > saleEvent.date) {
    const eventLabel = getEventLabel(newEvent.type);
    return {
      valid: false,
      error: `Cannot add ${eventLabel} event after sale date.\n\nSale date: ${format(
        saleEvent.date,
        'dd/MM/yyyy'
      )}\n\nThe property was sold on this date and is no longer owned.`,
    };
  }

  return { valid: true };
}

/**
 * Rule 3: Paired events - end events require start event to exist first
 */
function validatePairedEvent(
  newEvent: Omit<TimelineEvent, 'id'>,
  existingEvents: TimelineEvent[]
): ValidationResult {
  // Filter events before the new event date
  const eventsBeforeNew = existingEvents.filter((e) => e.date < newEvent.date);

  // Move out requires move in
  if (newEvent.type === 'move_out') {
    const moveInCount = eventsBeforeNew.filter((e) => e.type === 'move_in').length;
    const moveOutCount = eventsBeforeNew.filter((e) => e.type === 'move_out').length;

    if (moveOutCount >= moveInCount) {
      return {
        valid: false,
        error: 'Cannot move out - no active move-in period exists.',
        suggestion: {
          type: 'createMoveIn',
          suggestedDate: newEvent.date,
          message: 'Would you like to create a move-in event first?',
        },
      };
    }
  }

  // Rent end requires rent start
  if (newEvent.type === 'rent_end') {
    const rentStartCount = eventsBeforeNew.filter((e) => e.type === 'rent_start').length;
    const rentEndCount = eventsBeforeNew.filter((e) => e.type === 'rent_end').length;

    if (rentEndCount >= rentStartCount) {
      return {
        valid: false,
        error: 'Cannot end rental - no active rental period exists.',
        suggestion: {
          type: 'createRentStart',
          suggestedDate: newEvent.date,
          message: 'Would you like to create a rent start event first?',
        },
      };
    }
  }

  // Vacant end requires vacant start
  if (newEvent.type === 'vacant_end') {
    const vacantStartCount = eventsBeforeNew.filter((e) => e.type === 'vacant_start').length;
    const vacantEndCount = eventsBeforeNew.filter((e) => e.type === 'vacant_end').length;

    if (vacantEndCount >= vacantStartCount) {
      return {
        valid: false,
        error: 'Cannot end vacancy - no active vacancy period exists.',
        suggestion: {
          type: 'createVacantStart',
          suggestedDate: newEvent.date,
          message: 'Would you like to create a vacant start event first?',
        },
      };
    }
  }

  return { valid: true };
}

/**
 * Rule 4: Cannot purchase property twice without sale in between
 */
function validateMultiplePurchase(
  newEvent: Omit<TimelineEvent, 'id'>,
  existingEvents: TimelineEvent[]
): ValidationResult {
  if (newEvent.type !== 'purchase') {
    return { valid: true };
  }

  // Find existing purchase
  const existingPurchase = existingEvents.find((e) => e.type === 'purchase');

  if (!existingPurchase) {
    return { valid: true };
  }

  // Check if there's a sale between existing purchase and new purchase
  const salesBetween = existingEvents.filter(
    (e) =>
      e.type === 'sale' &&
      e.date >= existingPurchase.date &&
      e.date <= newEvent.date
  );

  if (salesBetween.length === 0) {
    return {
      valid: false,
      error: `Property already purchased on ${format(existingPurchase.date, 'dd/MM/yyyy')}.\n\nCannot purchase the same property twice.`,
      suggestion: {
        type: 'createSale',
        suggestedDate: newEvent.date,
        message: 'Did you mean to add a sale event first?',
      },
    };
  }

  return { valid: true };
}

/**
 * Get human-readable label for event type
 */
function getEventLabel(type: EventType): string {
  const labels: Record<EventType, string> = {
    purchase: 'Purchase',
    sale: 'Sale',
    move_in: 'Move In',
    move_out: 'Move Out',
    rent_start: 'Rent Start',
    rent_end: 'Rent End',
    improvement: 'Improvement',
    refinance: 'Refinance',
    status_change: 'Status Change',
    living_in_rental_start: 'Living in Rental Start',
    living_in_rental_end: 'Living in Rental End',
    vacant_start: 'Vacant Start',
    vacant_end: 'Vacant End',
    ownership_change: 'Ownership Change',
    subdivision: 'Subdivision',
    custom: 'Custom Event',
  };

  return labels[type] || type;
}
