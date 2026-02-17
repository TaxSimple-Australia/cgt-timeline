/**
 * Shared cost base calculation utilities
 *
 * These functions ensure consistent cost base calculations across all components
 * by properly filtering out element1 items (purchase_price, sale_price, etc.)
 * that should not be double-counted in cost summations.
 */

import type { TimelineEvent, CostBaseItem } from '@/store/timeline';

// Cost base items that are NOT incidental costs (element1 items to exclude from cost sums)
// These are acquisition/disposal amounts tracked separately, not additional costs
const EXCLUDE_FROM_COST_SUMS = ['purchase_price', 'land_price', 'building_price', 'sale_price'];

/**
 * Calculate purchase incidental costs from an event's costBases
 * Excludes purchase_price, land_price, building_price which are the acquisition amount, not additional costs
 */
export function calculatePurchaseIncidentalCosts(purchaseEvent: TimelineEvent | undefined): number {
  if (!purchaseEvent?.costBases) return 0;

  return purchaseEvent.costBases.reduce((sum, cb) => {
    if (EXCLUDE_FROM_COST_SUMS.includes(cb.definitionId)) return sum;
    return sum + cb.amount;
  }, 0);
}

/**
 * Calculate improvement costs from improvement events
 * Uses the getImprovementAmount helper which checks both event.amount and costBases
 * This handles cases where the improvement cost is stored in either location
 */
export function calculateImprovementCosts(improvementEvents: TimelineEvent[]): number {
  return improvementEvents.reduce((sum, e) => {
    // Use helper that checks both amount and costBases
    return sum + getImprovementAmountInternal(e);
  }, 0);
}

// Internal helper for calculateImprovementCosts (avoids circular dependency)
function getImprovementAmountInternal(e: TimelineEvent): number {
  if (!e) return 0;

  // First check event.amount
  if (e.amount && e.amount > 0) {
    return e.amount;
  }

  // Fall back to costBases - sum all improvement-related items
  if (e.costBases && e.costBases.length > 0) {
    return e.costBases.reduce((sum, cb) => {
      // Exclude element1 items
      if (EXCLUDE_FROM_COST_SUMS.includes(cb.definitionId)) return sum;
      return sum + cb.amount;
    }, 0);
  }

  return 0;
}

/**
 * Calculate selling/disposal costs from a sale event's costBases
 * Excludes sale_price which is proceeds, not a cost
 */
export function calculateSellingCosts(saleEvent: TimelineEvent | undefined): number {
  if (!saleEvent?.costBases) return 0;

  return saleEvent.costBases.reduce((sum, cb) => {
    if (EXCLUDE_FROM_COST_SUMS.includes(cb.definitionId)) return sum;
    return sum + cb.amount;
  }, 0);
}

/**
 * Calculate display total for an event's cost bases (for UI display purposes)
 * This includes ALL cost bases for showing the full breakdown
 * Use this when displaying cost base totals, not when calculating CGT
 */
export function calculateEventCostBasesTotal(event: TimelineEvent | undefined): number {
  if (!event?.costBases) return 0;
  return event.costBases.reduce((sum, cb) => sum + cb.amount, 0);
}

/**
 * Get purchase price from event
 * Checks event.amount first, then looks in costBases for purchase_price, land_price, building_price
 * This handles cases where the price is stored in costBases instead of event.amount
 */
export function getPurchasePrice(purchaseEvent: TimelineEvent | undefined): number {
  if (!purchaseEvent) return 0;

  // First check event.amount
  if (purchaseEvent.amount && purchaseEvent.amount > 0) {
    return purchaseEvent.amount;
  }

  // Fall back to costBases - look for purchase_price, or sum of land_price + building_price
  if (purchaseEvent.costBases && purchaseEvent.costBases.length > 0) {
    const purchasePriceCb = purchaseEvent.costBases.find(cb => cb.definitionId === 'purchase_price');
    if (purchasePriceCb && purchasePriceCb.amount > 0) {
      return purchasePriceCb.amount;
    }

    // Try land_price + building_price
    const landPriceCb = purchaseEvent.costBases.find(cb => cb.definitionId === 'land_price');
    const buildingPriceCb = purchaseEvent.costBases.find(cb => cb.definitionId === 'building_price');
    const landPrice = landPriceCb?.amount || 0;
    const buildingPrice = buildingPriceCb?.amount || 0;
    if (landPrice > 0 || buildingPrice > 0) {
      return landPrice + buildingPrice;
    }
  }

  return 0;
}

/**
 * Get sale price from event
 * Checks event.amount first, then looks in costBases for sale_price
 * This handles cases where the price is stored in costBases instead of event.amount
 */
export function getSalePrice(saleEvent: TimelineEvent | undefined): number {
  if (!saleEvent) return 0;

  // First check event.amount
  if (saleEvent.amount && saleEvent.amount > 0) {
    return saleEvent.amount;
  }

  // Fall back to costBases - look for sale_price
  if (saleEvent.costBases && saleEvent.costBases.length > 0) {
    const salePriceCb = saleEvent.costBases.find(cb => cb.definitionId === 'sale_price');
    if (salePriceCb && salePriceCb.amount > 0) {
      return salePriceCb.amount;
    }
  }

  return 0;
}

/**
 * Get improvement cost from event
 * Checks event.amount first, then looks in costBases for improvement-related items
 */
export function getImprovementAmount(improvementEvent: TimelineEvent | undefined): number {
  if (!improvementEvent) return 0;

  // First check event.amount
  if (improvementEvent.amount && improvementEvent.amount > 0) {
    return improvementEvent.amount;
  }

  // Fall back to costBases - sum all improvement-related items
  if (improvementEvent.costBases && improvementEvent.costBases.length > 0) {
    return improvementEvent.costBases.reduce((sum, cb) => {
      // Exclude element1 items
      if (EXCLUDE_FROM_COST_SUMS.includes(cb.definitionId)) return sum;
      return sum + cb.amount;
    }, 0);
  }

  return 0;
}

/**
 * Get Division 43 (Capital Works) deductions from a sale event
 * These deductions reduce the property's cost base
 * Note: Division 40 (Depreciating Assets) does NOT reduce cost base
 */
export function getDivision43Deductions(saleEvent: TimelineEvent | undefined): number {
  return saleEvent?.division43Deductions || 0;
}

/**
 * Calculate complete cost base for CGT calculations
 */
export function calculateTotalCostBase(
  purchaseEvent: TimelineEvent | undefined,
  improvementEvents: TimelineEvent[],
  saleEvent: TimelineEvent | undefined
): number {
  const purchasePrice = getPurchasePrice(purchaseEvent);
  const purchaseCosts = calculatePurchaseIncidentalCosts(purchaseEvent);
  const improvementCosts = calculateImprovementCosts(improvementEvents);
  const sellingCosts = calculateSellingCosts(saleEvent);
  const div43Deductions = getDivision43Deductions(saleEvent);

  return purchasePrice + purchaseCosts + improvementCosts + sellingCosts - div43Deductions;
}

/**
 * Calculate capital gain/loss
 */
export function calculateCapitalGain(
  purchaseEvent: TimelineEvent | undefined,
  improvementEvents: TimelineEvent[],
  saleEvent: TimelineEvent | undefined
): number {
  if (!saleEvent) return 0;

  const salePrice = getSalePrice(saleEvent);
  const totalCostBase = calculateTotalCostBase(purchaseEvent, improvementEvents, saleEvent);

  return salePrice - totalCostBase;
}
