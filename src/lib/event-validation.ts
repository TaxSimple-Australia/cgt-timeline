import { TimelineEvent } from '@/store/timeline';
import { format } from 'date-fns';

export type EventType = TimelineEvent['type'];

export interface ValidationResult {
  valid: boolean;
  error?: string;
  suggestion?: {
    type: 'createPurchase' | 'createSale' | 'createMoveIn' | 'createRentStart';
    suggestedDate?: Date;
    message?: string;
  };
}

/**
 * Validates that an event can be added based on logical business rules
 * SIMPLIFIED: Only validates critical rule - no events after sale
 */
export function validateEvent(
  newEvent: Omit<TimelineEvent, 'id'>,
  existingEvents: TimelineEvent[]
): ValidationResult {
  // Only validate: no events after sale (critical business rule)
  const saleValidation = validateEventAgainstSale(newEvent, existingEvents);
  if (!saleValidation.valid) return saleValidation;

  return { valid: true };
}

/**
 * Critical Rule: No events after sale (except new purchase - could buy it back)
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
 * Get human-readable label for event type
 */
function getEventLabel(type: EventType): string {
  const labels: Record<EventType, string> = {
    purchase: 'Purchase',
    building_start: 'Building Start',
    building_end: 'Building End',
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
    ownership_change: 'Ownership Change',
    subdivision: 'Subdivision',
    custom: 'Custom Event',
  };

  return labels[type] || type;
}
