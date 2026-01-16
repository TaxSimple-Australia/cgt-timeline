import type { Property as TimelineProperty, TimelineEvent } from '@/store/timeline';
import type { CGTModelResponse, Property, PropertyHistoryEvent } from '@/types/model-response';
import type { VerificationAlert } from '@/types/verification-alert';
import { sanitizeDateForAPI } from '@/lib/date-utils';

/**
 * Verification response format for the API
 */
export interface VerificationResponse {
  gap_id: string;
  property_address: string;
  issue_period: {
    start_date: string;
    end_date: string;
  };
  resolution_question: string;
  user_response: string;
  resolved_at: string;
}

/**
 * Transform resolved verification alerts to API verification_responses format
 */
export function transformVerificationAlertsToResponses(
  alerts: VerificationAlert[]
): VerificationResponse[] {
  return alerts
    .filter(alert => alert.resolved && alert.userResponse)
    .map(alert => ({
      gap_id: alert.questionId || alert.id,
      property_address: alert.propertyAddress,
      issue_period: {
        start_date: alert.startDate,
        end_date: alert.endDate,
      },
      resolution_question: alert.clarificationQuestion || `Please clarify the period from ${alert.startDate} to ${alert.endDate}`,
      user_response: alert.userResponse || '',
      resolved_at: alert.resolvedAt || new Date().toISOString(),
    }));
}

/**
 * Transform timeline data to CGT model API request format
 */
export function transformTimelineToAPIFormat(
  properties: TimelineProperty[],
  events: TimelineEvent[],
  customQuery?: string,
  verificationAlerts?: VerificationAlert[]
) {
  const apiProperties: Property[] = properties.map((property) => {
    // Get all events for this property
    const propertyEvents = events
      .filter((e) => e.propertyId === property.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Debug logging to verify event order
    console.log(`📅 Events for ${property.name} (sorted):`, propertyEvents.map(e => ({
      type: e.type,
      date: new Date(e.date).toISOString().split('T')[0]
    })));

    // Transform events to API format
    const property_history: PropertyHistoryEvent[] = propertyEvents.map((event) => {
      // Use sanitizeDateForAPI for robust date handling
      const sanitizedDate = sanitizeDateForAPI(event.date);
      if (!sanitizedDate) {
        console.error('❌ Transform: Invalid event date, skipping event:', event);
        return null;
      }

      const historyEvent: PropertyHistoryEvent = {
        date: sanitizedDate, // Already in YYYY-MM-DD format from sanitization
        event: event.type,
        // For custom events, use the title as description if no description is set
        description: event.type === 'custom'
          ? (event.description || `Custom event: ${event.title}`)
          : event.description,
      };

      // For custom events that affect status, include the new status info
      if (event.type === 'custom' && event.affectsStatus && event.newStatus) {
        historyEvent.description = `${historyEvent.description || event.title}. Property status changed to: ${event.newStatus}`;
      }

      // Add price if available
      if (event.amount) {
        historyEvent.price = event.amount;
      } else if (event.type === 'sale' && event.costBases) {
        // Fallback: Extract sale_price from costBases for sale events
        const salePriceItem = event.costBases.find(cb => cb.definitionId === 'sale_price');
        if (salePriceItem && salePriceItem.amount > 0) {
          historyEvent.price = salePriceItem.amount;
          console.log('📍 Transform: Extracted sale price from costBases:', salePriceItem.amount);
        }
      } else if (event.type === 'purchase' && event.costBases) {
        // Fallback: Extract purchase_price from costBases for purchase events
        const purchasePriceItem = event.costBases.find(cb => cb.definitionId === 'purchase_price');
        if (purchasePriceItem && purchasePriceItem.amount > 0) {
          historyEvent.price = purchasePriceItem.amount;
          console.log('📍 Transform: Extracted purchase price from costBases:', purchasePriceItem.amount);
        }
      }

      // Add over 2 hectares flag for purchase events (affects main residence exemption)
      if (event.type === 'purchase' && event.overTwoHectares) {
        // Add to description to alert the CGT calculator about land size limitation
        const landSizeNote = ' [Land exceeds 2 hectares - main residence exemption limited to dwelling + 2 hectares per ATO Section 118-120]';
        historyEvent.description = (historyEvent.description || event.title) + landSizeNote;
        console.log('📍 Transform: Over 2 hectares flag detected for purchase event');
      }

      // Add land-only flag for purchase events (affects depreciation)
      if (event.type === 'purchase' && event.isLandOnly) {
        // Add to description to alert the CGT calculator about no building depreciation
        const landOnlyNote = ' [Land only property - no building depreciation available]';
        historyEvent.description = (historyEvent.description || event.title) + landOnlyNote;
        console.log('📍 Transform: Land-only flag detected for purchase event');
      }

      // Add contract date for sale events
      // For sale events, always include contract_date (use event date if not set)
      if (event.type === 'sale') {
        const contractDateValue = event.contractDate || event.date;
        const sanitizedContractDate = sanitizeDateForAPI(contractDateValue);
        if (sanitizedContractDate) {
          historyEvent.contract_date = sanitizedContractDate;
          console.log('📋 Transform: Sale event contract_date:', {
            eventDate: event.date,
            contractDate: event.contractDate,
            outputContractDate: historyEvent.contract_date,
          });
        }

        // Add Australian resident status for sale events
        if (event.isResident !== undefined) {
          historyEvent.is_resident = event.isResident;
        }

        // Add previous year losses for sale events
        if (event.previousYearLosses !== undefined && event.previousYearLosses > 0) {
          historyEvent.previous_year_losses = event.previousYearLosses;
        }
      } else if (event.contractDate) {
        // For other event types, only include if explicitly set
        const sanitizedContractDate = sanitizeDateForAPI(event.contractDate);
        if (sanitizedContractDate) {
          historyEvent.contract_date = sanitizedContractDate;
        }
      }

      // Add settlement date if available
      if (event.settlementDate) {
        const sanitizedSettlementDate = sanitizeDateForAPI(event.settlementDate);
        if (sanitizedSettlementDate) {
          historyEvent.settlement_date = sanitizedSettlementDate;
        }
      }

      // Add market value for move_out events (used for CGT apportionment)
      if (event.marketValuation !== undefined) {
        historyEvent.market_value = event.marketValuation;
      }

      // NEW: Add split data to description so AI can read it (Gilbert's contextual approach)
      const additionalInfo: string[] = [];

      // Check for Mixed-Use split percentages (new approach)
      if (event.livingUsePercentage !== undefined || event.rentalUsePercentage !== undefined) {
        const living = event.livingUsePercentage || 0;
        const rental = event.rentalUsePercentage || 0;
        const business = event.businessUsePercentage || 0;

        const parts: string[] = [];
        if (living > 0) parts.push(`${living}% owner-occupied`);
        if (rental > 0) parts.push(`${rental}% rental`);
        if (business > 0) parts.push(`${business}% business`);

        additionalInfo.push(`Mixed-Use property: ${parts.join(', ')}`);
        console.log('📊 Transform: Mixed-Use percentages:', { living, rental, business }, '(added to description)');
      } else if (event.businessUsePercentage !== undefined && event.businessUsePercentage > 0) {
        // Fallback to old business use approach if no living/rental percentages
        additionalInfo.push(`Business use: ${event.businessUsePercentage}% of property used for business/rental purposes`);
        console.log('📊 Transform: Business use percentage:', event.businessUsePercentage, '(added to description)');
      }

      // NEW: Add ownership change information (contextual approach for AI)
      if (event.type === 'ownership_change') {
        const ownershipParts: string[] = [];

        // Add reason
        if (event.ownershipChangeReason) {
          const reasonLabels = {
            divorce: 'Divorce',
            sale_transfer: 'Sale/Transfer',
            gift: 'Gift',
            other: event.ownershipChangeReasonOther || 'Other'
          };
          ownershipParts.push(`Reason: ${reasonLabels[event.ownershipChangeReason]}`);
        }

        // Add leaving owners
        if (event.leavingOwners && event.leavingOwners.length > 0) {
          ownershipParts.push(`Leaving owner(s): ${event.leavingOwners.join(', ')}`);
        }

        // Add new owners with percentages
        if (event.newOwners && event.newOwners.length > 0) {
          const newOwnersList = event.newOwners
            .map(owner => `${owner.name} (${owner.percentage}%)`)
            .join(', ');
          ownershipParts.push(`New owner(s): ${newOwnersList}`);
        }

        if (ownershipParts.length > 0) {
          additionalInfo.push(`Ownership Change - ${ownershipParts.join('. ')}`);
          console.log('👥 Transform: Ownership change details added to description');
        }
      }

      // NEW: Add subdivision information (contextual approach for AI)
      if (event.type === 'subdivision' && event.subdivisionDetails) {
        const subdivisionParts: string[] = [];

        subdivisionParts.push(`Property subdivided into ${event.subdivisionDetails.totalLots} lots`);

        // Add child property details
        if (event.subdivisionDetails.childProperties && event.subdivisionDetails.childProperties.length > 0) {
          const childDetails = event.subdivisionDetails.childProperties
            .map((child, idx) => {
              const parts = [`Lot ${idx + 1}: ${child.name}`];
              if (child.lotNumber) parts.push(`(${child.lotNumber})`);
              if (child.lotSize) parts.push(`${child.lotSize.toFixed(0)} sqm`);
              if (child.allocatedCostBase) parts.push(`Cost base: $${child.allocatedCostBase.toLocaleString('en-AU')}`);
              return parts.join(' ');
            })
            .join('; ');
          subdivisionParts.push(childDetails);
        }

        // Add allocation method
        if (event.subdivisionDetails.allocationMethod) {
          const methodLabels = {
            by_lot_size: 'by lot size',
            equal: 'equally',
            manual: 'manually',
          };
          subdivisionParts.push(`Cost base allocated ${methodLabels[event.subdivisionDetails.allocationMethod] || 'proportionally'}`);
        }

        if (subdivisionParts.length > 0) {
          additionalInfo.push(`Subdivision - ${subdivisionParts.join('. ')}`);
          console.log('🏘️ Transform: Subdivision details added to description');
        }
      }

      if (event.floorAreaData) {
        const { total, exclusive, shared } = event.floorAreaData;
        const exclusivePercent = (exclusive / total) * 100;
        const sharedPercent = (shared / total) * 50;
        const totalPercent = exclusivePercent + sharedPercent;

        additionalInfo.push(
          `Partial rental: Total floor area ${total}sqm, exclusive rental area ${exclusive}sqm, shared area ${shared}sqm. ` +
          `Income-producing percentage: ${totalPercent.toFixed(2)}% (calculated as exclusive ${exclusivePercent.toFixed(2)}% + shared ${sharedPercent.toFixed(2)}%)`
        );

        console.log('📐 Transform: Floor areas:', {
          total,
          exclusive,
          shared,
          calculatedPercentage: totalPercent.toFixed(2) + '%',
          addedTo: 'description'
        });
      }

      // Append split information to description so AI can understand it
      if (additionalInfo.length > 0) {
        const splitInfo = additionalInfo.join('. ');
        historyEvent.description = historyEvent.description
          ? `${historyEvent.description}. ${splitInfo}`
          : splitInfo;
        console.log('✅ Transform: Split data added to description:', splitInfo);
      }

      // Extract cost base items from the costBases array
      if (event.costBases && event.costBases.length > 0) {
        event.costBases.forEach((costBase) => {
          // Map cost base items to API fields based on their definitionId
          switch (costBase.definitionId) {
            // Element 1: Acquisition/Sale Price
            case 'purchase_price':
              if (!historyEvent.price) {
                historyEvent.price = costBase.amount;
              }
              console.log('📍 Transform: Mapped purchase_price from costBases:', costBase.amount);
              break;
            case 'sale_price':
              if (!historyEvent.price) {
                historyEvent.price = costBase.amount;
              }
              console.log('📍 Transform: Mapped sale_price from costBases:', costBase.amount);
              break;
            // Element 2: Incidental Costs (Acquisition)
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
            case 'conveyancing_fees_purchase':
            case 'conveyancing_fees_sale':
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
            case 'accountant_fees_purchase':
              historyEvent.accountant_fees_purchase = costBase.amount;
              break;
            case 'tax_agent_fees_sale':
              historyEvent.tax_agent_fees_sale = costBase.amount;
              break;
            // Element 3: Holding/Ownership Costs
            case 'land_tax':
              historyEvent.land_tax = costBase.amount;
              break;
            case 'council_rates':
              historyEvent.council_rates = costBase.amount;
              break;
            case 'water_rates':
              historyEvent.water_rates = costBase.amount;
              break;
            case 'insurance':
              historyEvent.insurance = costBase.amount;
              break;
            case 'body_corporate_fees':
              historyEvent.body_corporate_fees = costBase.amount;
              break;
            case 'interest_on_borrowings':
              historyEvent.interest_on_borrowings = costBase.amount;
              break;
            case 'maintenance_costs':
              historyEvent.maintenance_costs = costBase.amount;
              break;
            case 'emergency_services_levy':
              historyEvent.emergency_services_levy = costBase.amount;
              break;
            // Element 5: Title Costs
            case 'boundary_dispute':
              historyEvent.boundary_dispute = costBase.amount;
              break;
            case 'title_insurance':
              historyEvent.title_insurance = costBase.amount;
              break;
            case 'easement_costs':
              historyEvent.easement_costs = costBase.amount;
              break;
            case 'caveat_costs':
              historyEvent.caveat_costs = costBase.amount;
              break;
            case 'partition_action':
              historyEvent.partition_action = costBase.amount;
              break;
            case 'adverse_possession_defense':
              historyEvent.adverse_possession_defense = costBase.amount;
              break;
            // Improvement costs
            case 'renovation_whole_house':
            case 'renovation_kitchen':
            case 'renovation_bathroom':
            case 'extension':
            case 'new_structure':
            case 'landscaping_major':
            case 'landscaping':
            case 'swimming_pool':
            case 'tennis_court':
            case 'garage':
            case 'garage_carport':
            case 'shed':
            case 'shed_outbuilding':
            case 'fencing':
            case 'deck_patio':
            case 'hvac_system':
            case 'solar_panels':
            case 'structural_changes':
            case 'disability_modifications':
            case 'water_tank':
              // For improvements, use the price field or improvement_cost
              if (!historyEvent.price) {
                historyEvent.price = costBase.amount;
              }
              historyEvent.improvement_cost = costBase.amount;
              break;
            // Element 4: Capital Costs (Non-improvement)
            case 'zoning_change_costs':
              historyEvent.zoning_change_costs = costBase.amount;
              break;
            case 'asset_installation_costs':
              historyEvent.asset_installation_costs = costBase.amount;
              break;
            case 'asset_relocation_costs':
              historyEvent.asset_relocation_costs = costBase.amount;
              break;
            default:
              // Handle custom cost base items by mapping them to appropriate fallback fields
              if (costBase.isCustom) {
                console.log(`🔧 Processing custom cost base: "${costBase.name}" (${costBase.category}, ${costBase.amount})`);

                switch (costBase.category) {
                  case 'element2':
                    // Element 2: Incidental Costs - map to appropriate field based on event type
                    if (event.type === 'sale') {
                      // Sale events: aggregate to tax_agent_fees_sale
                      historyEvent.tax_agent_fees_sale = (historyEvent.tax_agent_fees_sale || 0) + costBase.amount;
                      console.log(`  ✅ Added to tax_agent_fees_sale (sale event): ${costBase.amount}`);
                    } else if (event.type === 'purchase') {
                      // Purchase events: aggregate to accountant_fees_purchase
                      historyEvent.accountant_fees_purchase = (historyEvent.accountant_fees_purchase || 0) + costBase.amount;
                      console.log(`  ✅ Added to accountant_fees_purchase (purchase event): ${costBase.amount}`);
                    } else {
                      // Other events: default to accountant_fees_purchase
                      historyEvent.accountant_fees_purchase = (historyEvent.accountant_fees_purchase || 0) + costBase.amount;
                      console.log(`  ✅ Added to accountant_fees_purchase (other event): ${costBase.amount}`);
                    }
                    break;

                  case 'element3':
                    // Element 3: Ownership/Holding Costs - aggregate to maintenance_costs
                    historyEvent.maintenance_costs = (historyEvent.maintenance_costs || 0) + costBase.amount;
                    console.log(`  ✅ Added to maintenance_costs: ${costBase.amount}`);
                    break;

                  case 'element4':
                    // Element 4: Capital Improvements - aggregate to improvement_cost (generic field)
                    historyEvent.improvement_cost = (historyEvent.improvement_cost || 0) + costBase.amount;
                    console.log(`  ✅ Added to improvement_cost: ${costBase.amount}`);
                    break;

                  case 'element5':
                    // Element 5: Title Costs - aggregate to title_legal_fees
                    historyEvent.title_legal_fees = (historyEvent.title_legal_fees || 0) + costBase.amount;
                    console.log(`  ✅ Added to title_legal_fees: ${costBase.amount}`);
                    break;

                  case 'element1':
                    // Element 1: Acquisition costs cannot be safely added to price
                    // Log warning but don't modify the price field
                    console.warn(`  ⚠️ Cannot safely map custom Element 1 cost "${costBase.name}" (${costBase.amount}) to API. Element 1 costs should use predefined fields only.`);
                    break;

                  default:
                    console.warn(`  ⚠️ Unknown category "${costBase.category}" for custom cost base "${costBase.name}" (${costBase.amount})`);
                }
              } else {
                // For non-custom unrecognized cost bases, log a warning
                console.warn(`⚠️ Cost base '${costBase.definitionId}' not mapped to API field (amount: ${costBase.amount}). This is preserved in timeline data but won't be sent to the API.`, costBase);
              }
          }
        });
      }

      // Add improvement amount to description for AI context (for improvement events)
      if (event.type === 'improvement' && historyEvent.improvement_cost && historyEvent.improvement_cost > 0) {
        const amountInfo = `Improvement cost: $${historyEvent.improvement_cost.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        historyEvent.description = historyEvent.description
          ? `${historyEvent.description}. ${amountInfo}`
          : amountInfo;
        console.log('💰 Transform: Added improvement amount to description:', historyEvent.improvement_cost);
      }

      // Handle subdivision fees (stored in subdivisionDetails, not costBases)
      if (event.type === 'subdivision' && event.subdivisionDetails) {
        const fees = event.subdivisionDetails;

        // Map subdivision fees to appropriate API fields
        if (fees.surveyorFees && fees.surveyorFees > 0) {
          historyEvent.survey_fees = (historyEvent.survey_fees || 0) + fees.surveyorFees;
          console.log('📐 Transform: Added subdivision surveyor fees:', fees.surveyorFees);
        }

        if (fees.planningFees && fees.planningFees > 0) {
          // Planning fees can be added to legal fees or search fees
          historyEvent.search_fees = (historyEvent.search_fees || 0) + fees.planningFees;
          console.log('📋 Transform: Added subdivision planning fees:', fees.planningFees);
        }

        if (fees.legalFees && fees.legalFees > 0) {
          historyEvent.legal_fees = (historyEvent.legal_fees || 0) + fees.legalFees;
          console.log('⚖️ Transform: Added subdivision legal fees:', fees.legalFees);
        }

        if (fees.titleFees && fees.titleFees > 0) {
          historyEvent.title_legal_fees = (historyEvent.title_legal_fees || 0) + fees.titleFees;
          console.log('📜 Transform: Added subdivision title fees:', fees.titleFees);
        }

        // Add total subdivision costs to description for AI context
        const totalFees = (fees.surveyorFees || 0) + (fees.planningFees || 0) + (fees.legalFees || 0) + (fees.titleFees || 0);
        if (totalFees > 0) {
          const feesInfo = `Total subdivision costs: $${totalFees.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          historyEvent.description = historyEvent.description
            ? `${historyEvent.description}. ${feesInfo}`
            : feesInfo;
          console.log('💰 Transform: Added total subdivision costs to description:', totalFees);
        }
      }

      return historyEvent;
    }).filter((event): event is PropertyHistoryEvent => event !== null); // Filter out null entries from invalid dates

    return {
      address: `${property.name}, ${property.address}`,
      property_history,
      notes: property.owners && property.owners.length > 0
        ? `Owners: ${property.owners.map(o => `${o.name} (${o.percentage}%)`).join(', ')}`
        : '', // Multi-owner data serialized to notes field for API
    };
  });

  // Build the base request object
  const request: any = {
    properties: apiProperties,
    user_query: customQuery || 'What is my total CGT liability?',
    additional_info: {
      australian_resident: true,
      other_property_owned: properties.length > 1,
      land_size_hectares: 0,
      marginal_tax_rate: 37, // Default, should be configurable
    },
  };

  // Add verification_responses if there are resolved alerts
  if (verificationAlerts && verificationAlerts.length > 0) {
    const resolvedResponses = transformVerificationAlertsToResponses(verificationAlerts);
    if (resolvedResponses.length > 0) {
      request.verification_responses = resolvedResponses;
      console.log('📋 Including verification_responses:', resolvedResponses.length);
    }
  }

  return request;
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
