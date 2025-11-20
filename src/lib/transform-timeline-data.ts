import type { Property as TimelineProperty, TimelineEvent } from '@/store/timeline';
import type { CGTModelResponse, Property, PropertyHistoryEvent } from '@/types/model-response';

/**
 * Transform timeline data to CGT model API request format
 */
export function transformTimelineToAPIFormat(
  properties: TimelineProperty[],
  events: TimelineEvent[],
  customQuery?: string
) {
  const apiProperties: Property[] = properties.map((property) => {
    // Get all events for this property
    const propertyEvents = events
      .filter((e) => e.propertyId === property.id)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // Transform events to API format
    const property_history: PropertyHistoryEvent[] = propertyEvents.map((event) => {
      const historyEvent: PropertyHistoryEvent = {
        date: event.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        event: event.type,
        description: event.description,
      };

      // Add price if available
      if (event.amount) {
        historyEvent.price = event.amount;
      }

      // Add contract date for sale events
      if (event.contractDate) {
        historyEvent.contract_date = event.contractDate.toISOString().split('T')[0];
      }

      // Extract cost base items from the costBases array
      if (event.costBases && event.costBases.length > 0) {
        event.costBases.forEach((costBase) => {
          // Map cost base items to API fields based on their definitionId
          switch (costBase.definitionId) {
            case 'purchase_legal_fees':
              historyEvent.purchase_legal_fees = costBase.amount;
              break;
            case 'valuation_fees':
              historyEvent.valuation_fees = costBase.amount;
              break;
            case 'stamp_duty':
              historyEvent.stamp_duty = costBase.amount;
              break;
            case 'purchase_agent_fees':
              historyEvent.purchase_agent_fees = costBase.amount;
              break;
            case 'building_inspection':
              historyEvent.building_inspection = costBase.amount;
              break;
            case 'pest_inspection':
              historyEvent.pest_inspection = costBase.amount;
              break;
            case 'title_legal_fees':
              historyEvent.title_legal_fees = costBase.amount;
              break;
            case 'loan_establishment':
              historyEvent.loan_establishment = costBase.amount;
              break;
            case 'mortgage_insurance':
              historyEvent.mortgage_insurance = costBase.amount;
              break;
            case 'conveyancing_fees':
              historyEvent.conveyancing_fees = costBase.amount;
              break;
            case 'sale_legal_fees':
            case 'legal_fees': // Handle both variations
              historyEvent.legal_fees = costBase.amount;
              break;
            case 'sale_agent_fees':
            case 'agent_fees': // Handle both variations
              historyEvent.agent_fees = costBase.amount;
              break;
            case 'advertising_costs':
              historyEvent.advertising_costs = costBase.amount;
              break;
            case 'staging_costs':
              historyEvent.staging_costs = costBase.amount;
              break;
            case 'auction_costs':
            case 'auction_fees':
              historyEvent.auction_costs = costBase.amount;
              break;
            case 'survey_fees':
              historyEvent.survey_fees = costBase.amount;
              break;
            case 'search_fees':
              historyEvent.search_fees = costBase.amount;
              break;
            case 'loan_application_fees':
              historyEvent.loan_application_fees = costBase.amount;
              break;
            case 'mortgage_discharge_fees':
              historyEvent.mortgage_discharge_fees = costBase.amount;
              break;
            // Improvement costs
            case 'renovation_whole_house':
            case 'renovation_kitchen':
            case 'renovation_bathroom':
            case 'extension':
            case 'new_structure':
            case 'landscaping_major':
            case 'swimming_pool':
            case 'tennis_court':
            case 'garage':
            case 'shed':
              // For improvements, use the price field or improvement_cost
              if (!historyEvent.price) {
                historyEvent.price = costBase.amount;
              }
              historyEvent.improvement_cost = costBase.amount;
              break;
            default:
              // For custom or unrecognized cost bases, log a warning
              console.warn(`Unknown cost base definition: ${costBase.definitionId}`, costBase);
          }
        });
      }

      return historyEvent;
    });

    return {
      address: `${property.name}, ${property.address}`,
      property_history,
      notes: '', // Can be populated from property notes if available
    };
  });

  return {
    properties: apiProperties,
    user_query: customQuery || 'What is my total CGT liability?',
    additional_info: {
      australian_resident: true,
      other_property_owned: properties.length > 1,
      land_size_hectares: 0,
      marginal_tax_rate: 37, // Default, should be configurable
    },
    use_claude: true,
  };
}

/**
 * Mock response generator for testing (can be removed once API is connected)
 */
export function generateMockResponse(
  properties: TimelineProperty[],
  events: TimelineEvent[]
): CGTModelResponse {
  const apiData = transformTimelineToAPIFormat(properties, events);

  // Calculate some basic metrics from the timeline data
  const totalPurchasePrice = properties.reduce(
    (sum, prop) => sum + (prop.purchasePrice || 0),
    0
  );
  const totalSalePrice = properties.reduce(
    (sum, prop) => sum + (prop.salePrice || 0),
    0
  );
  const capitalGain = totalSalePrice - totalPurchasePrice;
  const discountApplied = capitalGain * 0.5; // 50% CGT discount
  const taxableGain = capitalGain - discountApplied;
  const taxPayable = taxableGain * 0.37; // Using marginal tax rate

  // Generate issues based on missing data
  const issues: any[] = [];

  properties.forEach((property) => {
    const propertyEvents = events.filter((e) => e.propertyId === property.id);
    const hasPurchase = propertyEvents.some((e) => e.type === 'purchase');
    const hasSale = propertyEvents.some((e) => e.type === 'sale');
    const hasImprovement = propertyEvents.some((e) => e.type === 'improvement');

    if (!hasPurchase) {
      issues.push({
        type: 'missing_data',
        field: property.address,
        message: `No purchase event found for ${property.name}. Add purchase date and price for accurate CGT calculation.`,
        severity: 'high',
      });
    }

    if (!property.purchasePrice) {
      issues.push({
        type: 'missing_data',
        field: property.address,
        message: `Purchase price not set for ${property.name}. This is required for CGT calculation.`,
        severity: 'high',
      });
    }

    if (!hasSale && !property.salePrice) {
      issues.push({
        type: 'info',
        field: property.address,
        message: `${property.name} has not been sold yet. CGT will be calculated when you add a sale event.`,
        severity: 'low',
      });
    }

    if (hasImprovement) {
      issues.push({
        type: 'info',
        field: property.address,
        message: `${property.name} has improvement costs that can reduce your CGT liability.`,
        severity: 'low',
      });
    }
  });

  return {
    ...apiData,
    response: {
      summary:
        totalSalePrice > 0
          ? `Your estimated CGT liability is approximately AUD ${taxPayable.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0 })}. This is based on a capital gain of AUD ${capitalGain.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', minimumFractionDigits: 0 })}, with the 50% CGT discount applied.`
          : 'No properties have been sold yet. CGT will be calculated when you add sale events to your properties.',
      recommendation:
        'Consider applying the 50% CGT discount since you held the property for more than 12 months. You may also be able to reduce your tax liability by claiming capital works deductions and depreciation.',
      issues: issues.length > 0 ? issues : undefined,
      visual_metrics: {
        data_completeness: Math.min(
          100,
          Math.round(
            (properties.filter((p) => p.purchasePrice && p.purchaseDate).length /
              properties.length) *
              100
          )
        ),
        confidence_score: 0.85,
      },
      detailed_breakdown:
        totalSalePrice > 0
          ? {
              capital_gain: capitalGain,
              cost_base: totalPurchasePrice,
              discount_applied: discountApplied,
              tax_payable: taxPayable,
            }
          : undefined,
    },
  };
}
