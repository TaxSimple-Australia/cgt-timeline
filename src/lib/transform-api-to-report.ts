/**
 * Transforms CGT API response data into the report display format
 * This is a 1:1 mapping - no data inference or calculation
 */

import type {
  TimelineEvent,
  CalculationStep,
  ApplicableRule,
  ReportDisplayData,
  MissingField,
  TransformationResult
} from '@/types/report-display';

/**
 * Format currency for display
 */
const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
};

/**
 * Format date for display
 */
const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

/**
 * Build timeline events from API response data
 */
function buildTimelineEvents(property: any, calculations: any): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const missingFields: string[] = [];

  // Extract data from API response
  const periodBreakdown = property?.period_breakdown;
  const mainResidencePeriods = periodBreakdown?.main_residence_periods || [];
  const rentalPeriods = periodBreakdown?.rental_periods || [];
  const costBaseDetails = property?.cost_base_details;
  const costBaseBreakdown = calculations?.cost_base_breakdown;
  const purchasePrice = property?.purchase_price || costBaseBreakdown?.original_cost;
  const salePrice = property?.sale_price || calculations?.capital_proceeds;

  // PURCHASE EVENT
  if (mainResidencePeriods.length > 0 || purchasePrice) {
    const purchaseDate = mainResidencePeriods[0]?.start;

    if (purchaseDate) {
      let purchaseDetails = '';

      // Add purchase price
      if (purchasePrice) {
        purchaseDetails = formatCurrency(purchasePrice);
      }

      // Add acquisition costs
      const acquisitionCosts = costBaseDetails?.acquisition_costs || {};
      const costItems: string[] = [];

      if (acquisitionCosts.stamp_duty) {
        costItems.push(`stamp duty: ${formatCurrency(acquisitionCosts.stamp_duty)}`);
      }
      if (acquisitionCosts.purchase_legal_fees) {
        costItems.push(`legal fees: ${formatCurrency(acquisitionCosts.purchase_legal_fees)}`);
      }
      if (acquisitionCosts.valuation_fees) {
        costItems.push(`valuation fees: ${formatCurrency(acquisitionCosts.valuation_fees)}`);
      }
      if (acquisitionCosts.purchase_agent_fees) {
        costItems.push(`agent fees: ${formatCurrency(acquisitionCosts.purchase_agent_fees)}`);
      }
      if (acquisitionCosts.title_legal_fees) {
        costItems.push(`title fees: ${formatCurrency(acquisitionCosts.title_legal_fees)}`);
      }

      if (costItems.length > 0) {
        purchaseDetails += ' + ' + costItems.join(' + ');
      }

      events.push({
        date: purchaseDate,
        event: 'Purchase',
        details: purchaseDetails || 'Property purchased',
        sortOrder: 1
      });
    } else {
      missingFields.push('period_breakdown.main_residence_periods[0].start');
    }
  }

  // MOVE IN EVENT
  if (mainResidencePeriods.length > 0) {
    const moveInDate = mainResidencePeriods[0]?.start;
    if (moveInDate) {
      events.push({
        date: moveInDate,
        event: 'Move In',
        details: 'Established as main residence',
        sortOrder: 2
      });
    }
  }

  // CAPITAL IMPROVEMENTS
  const capitalImprovements = costBaseBreakdown?.capital_improvements || [];
  capitalImprovements.forEach((improvement: any, index: number) => {
    if (improvement.date && improvement.amount) {
      events.push({
        date: improvement.date,
        event: 'Improvement',
        details: `${improvement.description || 'Capital improvement'}: ${formatCurrency(improvement.amount)}`,
        sortOrder: 5
      });
    }
  });

  // MOVE OUT EVENT
  if (mainResidencePeriods.length > 0 && mainResidencePeriods[0]?.end) {
    const moveOutDate = mainResidencePeriods[0].end;
    let moveOutDetails = 'Ceased as main residence';

    // Add market value if available (for s118-192)
    if (costBaseBreakdown?.market_value_at_first_rental) {
      moveOutDetails += ` (Market value: ${formatCurrency(costBaseBreakdown.market_value_at_first_rental)})`;
    }

    events.push({
      date: moveOutDate,
      event: 'Move Out',
      details: moveOutDetails,
      sortOrder: 3
    });
  }

  // RENT START EVENT
  if (rentalPeriods.length > 0) {
    const rentStartDate = rentalPeriods[0]?.start;
    if (rentStartDate) {
      events.push({
        date: rentStartDate,
        event: 'Rent Start',
        details: 'Tenant moves in',
        sortOrder: 4
      });
    }
  }

  // RENT END / SALE EVENT
  if (rentalPeriods.length > 0) {
    const lastRentalPeriod = rentalPeriods[rentalPeriods.length - 1];
    const rentEndDate = lastRentalPeriod?.end;

    if (rentEndDate && property?.status === 'sold') {
      // This is a sale event
      let saleDetails = '';

      if (salePrice) {
        saleDetails = formatCurrency(salePrice);
      }

      // Add disposal costs
      const disposalCosts = costBaseDetails?.disposal_costs || {};
      const dispCostItems: string[] = [];

      if (disposalCosts.agent_fees) {
        dispCostItems.push(`agent fees: ${formatCurrency(disposalCosts.agent_fees)}`);
      }
      if (disposalCosts.legal_fees) {
        dispCostItems.push(`legal fees: ${formatCurrency(disposalCosts.legal_fees)}`);
      }

      if (dispCostItems.length > 0) {
        saleDetails += ' (' + dispCostItems.join(', ') + ')';
      }

      events.push({
        date: rentEndDate,
        event: 'Sale',
        details: saleDetails || 'Property sold',
        sortOrder: 6
      });
    } else if (rentEndDate) {
      // Just rent end
      events.push({
        date: rentEndDate,
        event: 'Rent End',
        details: 'Tenant moves out',
        sortOrder: 6
      });
    }
  }

  // Sort events by date, then by sortOrder
  events.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();

    if (dateA !== dateB) {
      return dateA - dateB;
    }

    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });

  return events;
}

/**
 * Map calculation steps from API response
 */
function mapCalculationSteps(calculations: any): CalculationStep[] {
  const steps = calculations?.calculation_steps || [];

  return steps.map((step: any) => ({
    step: step.step,
    description: step.description || '',
    calculation: step.calculation,
    result: step.result,
    details: step.details,
    note: step.note,
    ato_reference: step.ato_reference
  }));
}

/**
 * Map applicable rules from API response - ONLY from knowledge_base_rules
 */
function mapApplicableRules(calculations: any, validation: any): ApplicableRule[] {
  const rules: ApplicableRule[] = [];

  // ONLY source: knowledge_base_rules from validation
  const knowledgeBaseRules = validation?.knowledge_base_rules || [];

  knowledgeBaseRules.forEach((rule: any) => {
    rules.push({
      section: rule.rule_id || '',
      name: rule.rule_title || '',
      description: rule.summary || ''
    });
  });

  // If empty, return empty array - no fallbacks
  return rules;
}

/**
 * Main transformation function - converts API response to report display format
 */
export function transformPropertyToReport(
  property: any,
  calculations: any,
  validation?: any
): TransformationResult {
  const missingFields: MissingField[] = [];
  const warnings: string[] = [];

  // Build timeline events
  const timelineEvents = buildTimelineEvents(property, calculations);

  if (timelineEvents.length === 0) {
    warnings.push('No timeline events could be generated from the API response');
    missingFields.push({
      fieldPath: 'property.period_breakdown',
      expectedIn: 'property',
      impact: 'timeline'
    });
  }

  // Map calculation steps
  const calculationSteps = mapCalculationSteps(calculations);

  if (calculationSteps.length === 0) {
    warnings.push('No calculation steps found in API response');
    missingFields.push({
      fieldPath: 'calculations.calculation_steps',
      expectedIn: 'calculations',
      impact: 'calculations'
    });
  }

  // Map applicable rules
  const applicableRules = mapApplicableRules(calculations, validation);

  if (applicableRules.length === 0) {
    warnings.push('No applicable rules found in API response');
  }

  // Extract summary metrics
  const reportData: ReportDisplayData = {
    propertyAddress: property?.address || 'Unknown Property',
    timelineEvents,
    calculationSteps,
    applicableRules,
    purchasePrice: property?.purchase_price || calculations?.cost_base_breakdown?.original_cost,
    salePrice: property?.sale_price || calculations?.capital_proceeds,
    costBase: calculations?.cost_base,
    capitalGain: calculations?.raw_capital_gain,
    netCapitalGain: calculations?.net_capital_gain,
    exemptionType: property?.exemption_type,
    exemptPercentage: property?.exempt_percentage
  };

  return {
    reportData,
    missingFields,
    warnings
  };
}

/**
 * Transform multiple properties at once
 */
export function transformPortfolioToReports(
  apiProperties: any[],
  calculationsPerProperty: any[],
  validation?: any
): TransformationResult[] {
  return apiProperties.map(property => {
    // Find matching calculations by address
    const propertyCalc = calculationsPerProperty.find(
      calc =>
        calc.property_id === property.property_id ||
        calc.property_id === property.address ||
        calc.property_address === property.address
    );

    return transformPropertyToReport(property, propertyCalc, validation);
  });
}
