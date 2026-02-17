/**
 * Timeline Tools for OpenAI Realtime API
 *
 * Comprehensive tool definitions for COMPLETE timeline operations via voice commands.
 * This enables the Speech AI to do literally everything on the timeline.
 */

import type { RealtimeTool } from './OpenAIRealtimeClient';
import type { TimelineAction, ActionType } from '@/types/ai-builder';
import type { Property, TimelineEvent, EventType, PropertyStatus, CostBaseItem } from '@/store/timeline';
import type { CostBaseCategory } from '@/lib/cost-base-definitions';

// ============================================================================
// COST BASE DEFINITIONS FOR AI REFERENCE
// ============================================================================

export const COST_BASE_ITEMS = {
  // Element 1: Acquisition Costs & Proceeds
  purchase_price: { category: 'element1', name: 'Purchase Price' },
  land_price: { category: 'element1', name: 'Land Component' },
  building_price: { category: 'element1', name: 'Building Component' },
  sale_price: { category: 'element1', name: 'Sale Price (Proceeds)' },

  // Element 2: Incidental Costs (Acquisition)
  stamp_duty: { category: 'element2_acquisition', name: 'Stamp Duty' },
  purchase_legal_fees: { category: 'element2_acquisition', name: 'Legal Fees (Purchase)' },
  conveyancing_fees_purchase: { category: 'element2_acquisition', name: 'Conveyancing Fees' },
  valuation_fees: { category: 'element2_acquisition', name: 'Valuation Fees' },
  purchase_agent_fees: { category: 'element2_acquisition', name: "Buyer's Agent Fees" },
  building_inspection: { category: 'element2_acquisition', name: 'Building Inspection' },
  pest_inspection: { category: 'element2_acquisition', name: 'Pest Inspection' },
  survey_fees: { category: 'element2_acquisition', name: 'Survey Fees' },
  search_fees: { category: 'element2_acquisition', name: 'Title Search Fees' },
  loan_application_fees: { category: 'element2_acquisition', name: 'Loan Application Fees' },
  accountant_fees_purchase: { category: 'element2_acquisition', name: 'Accountant Fees' },
  loan_establishment: { category: 'element2_acquisition', name: 'Loan Establishment Fees' },
  mortgage_insurance: { category: 'element2_acquisition', name: 'Mortgage Insurance' },

  // Element 2: Incidental Costs (Disposal/Sale)
  sale_legal_fees: { category: 'element2_disposal', name: 'Legal Fees (Sale)' },
  conveyancing_fees_sale: { category: 'element2_disposal', name: 'Conveyancing Fees (Sale)' },
  sale_agent_fees: { category: 'element2_disposal', name: 'Real Estate Agent Commission' },
  advertising_costs: { category: 'element2_disposal', name: 'Advertising Costs' },
  staging_costs: { category: 'element2_disposal', name: 'Staging Costs' },
  auction_fees: { category: 'element2_disposal', name: 'Auction Fees' },
  mortgage_discharge_fees: { category: 'element2_disposal', name: 'Mortgage Discharge Fees' },
  tax_agent_fees_sale: { category: 'element2_disposal', name: 'Tax Agent Fees' },

  // Element 3: Ownership/Holding Costs
  land_tax: { category: 'element3', name: 'Land Tax' },
  council_rates: { category: 'element3', name: 'Council Rates' },
  water_rates: { category: 'element3', name: 'Water Rates' },
  insurance: { category: 'element3', name: 'Insurance' },
  body_corporate_fees: { category: 'element3', name: 'Body Corporate/Strata Fees' },
  interest_on_borrowings: { category: 'element3', name: 'Interest on Borrowings' },
  maintenance_costs: { category: 'element3', name: 'Maintenance Costs' },
  emergency_services_levy: { category: 'element3', name: 'Emergency Services Levy' },

  // Element 4: Capital Improvements
  renovation_kitchen: { category: 'element4', name: 'Kitchen Renovation' },
  renovation_bathroom: { category: 'element4', name: 'Bathroom Renovation' },
  renovation_whole_house: { category: 'element4', name: 'Whole House Renovation' },
  extension: { category: 'element4', name: 'Extension' },
  swimming_pool: { category: 'element4', name: 'Swimming Pool' },
  landscaping: { category: 'element4', name: 'Landscaping' },
  garage_carport: { category: 'element4', name: 'Garage/Carport' },
  fencing: { category: 'element4', name: 'Fencing' },
  deck_patio: { category: 'element4', name: 'Deck/Patio' },
  hvac_system: { category: 'element4', name: 'HVAC System' },
  solar_panels: { category: 'element4', name: 'Solar Panels' },
  structural_changes: { category: 'element4', name: 'Structural Changes' },
  disability_modifications: { category: 'element4', name: 'Disability Modifications' },
  water_tank: { category: 'element4', name: 'Water Tank' },
  shed_outbuilding: { category: 'element4', name: 'Shed/Outbuilding' },
  zoning_change_costs: { category: 'element4', name: 'Zoning Change Costs' },
  asset_installation_costs: { category: 'element4', name: 'Asset Installation' },
  asset_relocation_costs: { category: 'element4', name: 'Asset Relocation' },

  // Element 5: Title Costs
  title_legal_fees: { category: 'element5', name: 'Title Legal Fees' },
  boundary_dispute: { category: 'element5', name: 'Boundary Dispute Costs' },
  title_insurance: { category: 'element5', name: 'Title Insurance' },
  easement_costs: { category: 'element5', name: 'Easement Costs' },
  caveat_costs: { category: 'element5', name: 'Caveat Costs' },
  partition_action: { category: 'element5', name: 'Partition Action Costs' },
  adverse_possession_defense: { category: 'element5', name: 'Adverse Possession Defense' },
};

// ============================================================================
// TOOL DEFINITIONS - COMPREHENSIVE
// ============================================================================

export const REALTIME_TIMELINE_TOOLS: RealtimeTool[] = [
  // ==========================================================================
  // PROPERTY OPERATIONS
  // ==========================================================================
  {
    type: 'function',
    name: 'add_property',
    description: 'Add a new property to the timeline. Creates the property and optionally a purchase event with full cost base details.',
    parameters: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'The full address of the property (e.g., "123 Main Street, Sydney NSW 2000")',
        },
        purchaseDate: {
          type: 'string',
          description: 'The purchase/settlement date in ISO format (YYYY-MM-DD)',
        },
        purchasePrice: {
          type: 'number',
          description: 'The total purchase price in AUD',
        },
        initialStatus: {
          type: 'string',
          description: 'The initial status when property was acquired',
          enum: ['ppr', 'rental', 'vacant', 'construction'],
        },
        // Land & Building Split
        landPrice: {
          type: 'number',
          description: 'Land component of purchase price (optional, for CGT calculations)',
        },
        buildingPrice: {
          type: 'number',
          description: 'Building component of purchase price (optional, for depreciation)',
        },
        // Property Indicators
        isLandOnly: {
          type: 'boolean',
          description: 'True if property is land only with no building',
        },
        overTwoHectares: {
          type: 'boolean',
          description: 'True if land exceeds 2 hectares (affects main residence exemption)',
        },
        // Cost Base Items
        stampDuty: {
          type: 'number',
          description: 'Stamp duty paid on purchase',
        },
        legalFees: {
          type: 'number',
          description: 'Legal/conveyancing fees for purchase',
        },
        // Multi-Owner Support
        owners: {
          type: 'array',
          description: 'Array of property owners with their ownership percentages',
          items: {
            type: 'object',
          },
        },
        // Mixed Use
        isMixedUse: {
          type: 'boolean',
          description: 'True if property has mixed use (living + rental or business)',
        },
        livingUsePercentage: {
          type: 'number',
          description: 'Percentage used as main residence (0-100)',
        },
        rentalUsePercentage: {
          type: 'number',
          description: 'Percentage used as rental (0-100)',
        },
        businessUsePercentage: {
          type: 'number',
          description: 'Percentage used for business (0-100)',
        },
        // Companion Events
        moveInOnSameDay: {
          type: 'boolean',
          description: 'If true, also create a move_in event on the same date',
        },
      },
      required: ['address'],
    },
  },
  {
    type: 'function',
    name: 'update_property',
    description: 'Update an existing property details including name, address, owners, or status.',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property to update (used to find the property)',
        },
        newName: {
          type: 'string',
          description: 'New name/label for the property',
        },
        newAddress: {
          type: 'string',
          description: 'New address if changing',
        },
        owners: {
          type: 'array',
          description: 'Updated array of owners with name and percentage',
          items: {
            type: 'object',
          },
        },
      },
      required: ['propertyAddress'],
    },
  },
  {
    type: 'function',
    name: 'delete_property',
    description: 'Delete a property and all its events from the timeline. Use with caution.',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property to delete',
        },
        confirmed: {
          type: 'boolean',
          description: 'Must be true to confirm deletion',
        },
      },
      required: ['propertyAddress', 'confirmed'],
    },
  },
  {
    type: 'function',
    name: 'subdivide_property',
    description: 'Subdivide a property into multiple lots. Creates child properties and allocates cost base.',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property to subdivide',
        },
        subdivisionDate: {
          type: 'string',
          description: 'The date of subdivision in ISO format (YYYY-MM-DD)',
        },
        lots: {
          type: 'array',
          description: 'Array of new lots to create',
          items: {
            type: 'object',
          },
        },
        surveyorFees: {
          type: 'number',
          description: 'Surveyor fees for subdivision',
        },
        planningFees: {
          type: 'number',
          description: 'Planning/council fees',
        },
        legalFees: {
          type: 'number',
          description: 'Legal fees for subdivision',
        },
        titleFees: {
          type: 'number',
          description: 'Title registration fees',
        },
      },
      required: ['propertyAddress', 'subdivisionDate', 'lots'],
    },
  },
  {
    type: 'function',
    name: 'set_property_owners',
    description: 'Set or update the owners of a property with their ownership percentages.',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property',
        },
        owners: {
          type: 'array',
          description: 'Array of owners. Each owner should have name (string) and percentage (number, must total 100)',
          items: {
            type: 'object',
          },
        },
      },
      required: ['propertyAddress', 'owners'],
    },
  },

  // ==========================================================================
  // EVENT OPERATIONS - COMPREHENSIVE
  // ==========================================================================
  {
    type: 'function',
    name: 'add_purchase_event',
    description: 'Add a purchase event with full cost base details including stamp duty, legal fees, and property indicators.',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property',
        },
        date: {
          type: 'string',
          description: 'The settlement date (when ownership transferred) in ISO format',
        },
        purchasePrice: {
          type: 'number',
          description: 'Total purchase price in AUD',
        },
        // Land & Building
        landPrice: {
          type: 'number',
          description: 'Land component of purchase price',
        },
        buildingPrice: {
          type: 'number',
          description: 'Building component of purchase price',
        },
        // Property Indicators
        isLandOnly: {
          type: 'boolean',
          description: 'Property is land only (no building)',
        },
        overTwoHectares: {
          type: 'boolean',
          description: 'Land exceeds 2 hectares',
        },
        // Cost Base Items
        stampDuty: {
          type: 'number',
          description: 'Stamp duty amount',
        },
        legalFees: {
          type: 'number',
          description: 'Legal/conveyancing fees',
        },
        valuationFees: {
          type: 'number',
          description: 'Valuation fees',
        },
        buildingInspection: {
          type: 'number',
          description: 'Building inspection cost',
        },
        pestInspection: {
          type: 'number',
          description: 'Pest inspection cost',
        },
        buyersAgentFees: {
          type: 'number',
          description: "Buyer's agent fees",
        },
        loanFees: {
          type: 'number',
          description: 'Loan application/establishment fees',
        },
        mortgageInsurance: {
          type: 'number',
          description: 'Lenders mortgage insurance',
        },
        // Mixed Use
        isMixedUse: {
          type: 'boolean',
          description: 'Property has mixed use',
        },
        livingUsePercentage: {
          type: 'number',
          description: 'Percentage used for living (0-100)',
        },
        rentalUsePercentage: {
          type: 'number',
          description: 'Percentage used for rental (0-100)',
        },
        businessUsePercentage: {
          type: 'number',
          description: 'Percentage used for business (0-100)',
        },
        // Companion Events
        moveInOnSameDay: {
          type: 'boolean',
          description: 'Also create move_in event on same date',
        },
        purchaseAsVacant: {
          type: 'boolean',
          description: 'Property purchased as vacant (not moving in)',
        },
        purchaseAsRental: {
          type: 'boolean',
          description: 'Property purchased as rental investment',
        },
        description: {
          type: 'string',
          description: 'Notes about the purchase',
        },
      },
      required: ['propertyAddress', 'date', 'purchasePrice'],
    },
  },
  {
    type: 'function',
    name: 'add_sale_event',
    description: 'Add a sale event with full details including selling costs, tax settings, and capital proceeds type.',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property being sold',
        },
        contractDate: {
          type: 'string',
          description: 'The contract date (NOT settlement) in ISO format - this is when CGT is triggered',
        },
        settlementDate: {
          type: 'string',
          description: 'The settlement date in ISO format (optional)',
        },
        salePrice: {
          type: 'number',
          description: 'Total sale price (capital proceeds) in AUD',
        },
        // Selling Costs
        agentCommission: {
          type: 'number',
          description: 'Real estate agent commission',
        },
        legalFees: {
          type: 'number',
          description: 'Legal/conveyancing fees for sale',
        },
        advertisingCosts: {
          type: 'number',
          description: 'Marketing/advertising costs',
        },
        stagingCosts: {
          type: 'number',
          description: 'Home staging costs',
        },
        auctionFees: {
          type: 'number',
          description: 'Auctioneer fees if sold at auction',
        },
        mortgageDischarge: {
          type: 'number',
          description: 'Mortgage discharge fees',
        },
        // Tax Settings
        isResident: {
          type: 'boolean',
          description: 'True if seller is Australian resident for tax purposes (affects 50% CGT discount)',
        },
        marginalTaxRate: {
          type: 'number',
          description: 'Marginal tax rate percentage (e.g., 37 for 37%)',
        },
        previousYearLosses: {
          type: 'number',
          description: 'Capital losses from previous years to offset',
        },
        // Capital Proceeds Type
        capitalProceedsType: {
          type: 'string',
          description: 'Type of capital proceeds',
          enum: ['standard', 'insurance', 'compulsory_acquisition', 'gift', 'inheritance'],
        },
        // Exemption Type
        exemptionType: {
          type: 'string',
          description: 'CGT exemption type being claimed',
          enum: ['main_residence', 'partial_main_residence', '6_year_rule', 'none'],
        },
        description: {
          type: 'string',
          description: 'Notes about the sale',
        },
      },
      required: ['propertyAddress', 'contractDate', 'salePrice'],
    },
  },
  {
    type: 'function',
    name: 'add_move_in_event',
    description: 'Add a move-in event when the owner moves into the property (changes status to PPR).',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property',
        },
        date: {
          type: 'string',
          description: 'The move-in date in ISO format',
        },
        description: {
          type: 'string',
          description: 'Notes about moving in',
        },
      },
      required: ['propertyAddress', 'date'],
    },
  },
  {
    type: 'function',
    name: 'add_move_out_event',
    description: 'Add a move-out event when the owner moves out of the property.',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property',
        },
        date: {
          type: 'string',
          description: 'The move-out date in ISO format',
        },
        // Companion Events
        moveOutAsVacant: {
          type: 'boolean',
          description: 'Property will be vacant after moving out',
        },
        moveOutAsRental: {
          type: 'boolean',
          description: 'Property will be rented after moving out (creates rent_start event)',
        },
        description: {
          type: 'string',
          description: 'Notes about moving out',
        },
      },
      required: ['propertyAddress', 'date'],
    },
  },
  {
    type: 'function',
    name: 'add_rent_start_event',
    description: 'Add an event when the property starts being rented to tenants.',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property',
        },
        date: {
          type: 'string',
          description: 'The rental start date in ISO format',
        },
        weeklyRent: {
          type: 'number',
          description: 'Weekly rental amount in AUD (optional)',
        },
        description: {
          type: 'string',
          description: 'Notes about the rental',
        },
      },
      required: ['propertyAddress', 'date'],
    },
  },
  {
    type: 'function',
    name: 'add_rent_end_event',
    description: 'Add an event when tenants move out and rental period ends.',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property',
        },
        date: {
          type: 'string',
          description: 'The rental end date in ISO format',
        },
        // Companion Events
        rentEndAsVacant: {
          type: 'boolean',
          description: 'Property will be vacant after tenants leave',
        },
        rentEndAsMoveIn: {
          type: 'boolean',
          description: 'Owner will move in after tenants leave',
        },
        description: {
          type: 'string',
          description: 'Notes about rental ending',
        },
      },
      required: ['propertyAddress', 'date'],
    },
  },
  {
    type: 'function',
    name: 'add_improvement_event',
    description: 'Add a capital improvement event (renovations, additions, etc.) that adds to cost base.',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property',
        },
        date: {
          type: 'string',
          description: 'The date improvement was completed in ISO format',
        },
        title: {
          type: 'string',
          description: 'Title/name for the improvement (e.g., "Kitchen Renovation")',
        },
        totalAmount: {
          type: 'number',
          description: 'Total cost of the improvement in AUD',
        },
        // Specific improvement types with amounts
        improvementType: {
          type: 'string',
          description: 'Type of improvement',
          enum: [
            'kitchen_renovation',
            'bathroom_renovation',
            'whole_house_renovation',
            'extension',
            'swimming_pool',
            'landscaping',
            'garage_carport',
            'fencing',
            'deck_patio',
            'hvac_system',
            'solar_panels',
            'structural_changes',
            'disability_modifications',
            'water_tank',
            'shed_outbuilding',
            'other',
          ],
        },
        description: {
          type: 'string',
          description: 'Description of the improvement work',
        },
      },
      required: ['propertyAddress', 'date', 'totalAmount'],
    },
  },
  {
    type: 'function',
    name: 'add_status_change_event',
    description: 'Add an event to manually change property status (ppr, rental, vacant, construction).',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property',
        },
        date: {
          type: 'string',
          description: 'The date of status change in ISO format',
        },
        newStatus: {
          type: 'string',
          description: 'The new property status',
          enum: ['ppr', 'rental', 'vacant', 'construction', 'living_in_rental'],
        },
        description: {
          type: 'string',
          description: 'Notes about the status change',
        },
      },
      required: ['propertyAddress', 'date', 'newStatus'],
    },
  },
  {
    type: 'function',
    name: 'add_ownership_change_event',
    description: 'Add an ownership change event when property ownership transfers between people (inheritance, gift, divorce, sale transfer).',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property',
        },
        date: {
          type: 'string',
          description: 'The date of ownership change in ISO format',
        },
        leavingOwners: {
          type: 'array',
          description: 'Array of owner names leaving (e.g., ["John Smith", "Jane Smith"])',
          items: { type: 'string' },
        },
        newOwners: {
          type: 'array',
          description: 'Array of new owners with name and percentage (e.g., [{"name": "Bob Smith", "percentage": 100}])',
          items: { type: 'object' },
        },
        reason: {
          type: 'string',
          description: 'Reason for ownership change',
          enum: ['inheritance', 'gift', 'divorce', 'sale_transfer', 'other'],
        },
        reasonOther: {
          type: 'string',
          description: 'Custom reason if "other" was selected',
        },
        description: {
          type: 'string',
          description: 'Notes about the ownership change',
        },
      },
      required: ['propertyAddress', 'date', 'leavingOwners', 'newOwners', 'reason'],
    },
  },
  {
    type: 'function',
    name: 'add_subdivision_event',
    description: 'Add a subdivision event when a property is subdivided into multiple lots.',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property being subdivided',
        },
        date: {
          type: 'string',
          description: 'The subdivision date in ISO format',
        },
        numberOfLots: {
          type: 'number',
          description: 'Number of lots created (minimum 2)',
        },
        lots: {
          type: 'array',
          description: 'Details of each lot: [{name: "Lot 1", lotSize: 500, allocatedCostBase: 200000}]',
          items: { type: 'object' },
        },
        surveyorFees: {
          type: 'number',
          description: 'Surveyor fees',
        },
        planningFees: {
          type: 'number',
          description: 'Planning/council fees',
        },
        legalFees: {
          type: 'number',
          description: 'Legal fees',
        },
        titleFees: {
          type: 'number',
          description: 'Title registration fees',
        },
        description: {
          type: 'string',
          description: 'Notes about the subdivision',
        },
      },
      required: ['propertyAddress', 'date', 'numberOfLots'],
    },
  },
  {
    type: 'function',
    name: 'add_custom_event',
    description: 'Add a custom event with user-defined title and optional status change.',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property',
        },
        date: {
          type: 'string',
          description: 'The event date in ISO format',
        },
        title: {
          type: 'string',
          description: 'Custom title for the event',
        },
        amount: {
          type: 'number',
          description: 'Optional amount associated with the event',
        },
        color: {
          type: 'string',
          description: 'Event color (hex code or name)',
          enum: ['red', 'orange', 'amber', 'lime', 'emerald', 'cyan', 'blue', 'indigo', 'violet', 'pink', 'gray', 'dark'],
        },
        affectsStatus: {
          type: 'boolean',
          description: 'Does this event change property status?',
        },
        newStatus: {
          type: 'string',
          description: 'If affectsStatus is true, the new status',
          enum: ['ppr', 'rental', 'vacant', 'construction'],
        },
        description: {
          type: 'string',
          description: 'Notes about the event',
        },
      },
      required: ['propertyAddress', 'date', 'title'],
    },
  },
  {
    type: 'function',
    name: 'update_event',
    description: 'Update an existing event on a property timeline. Can update any field.',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property',
        },
        eventType: {
          type: 'string',
          description: 'The type of event to update (to identify it)',
        },
        eventDate: {
          type: 'string',
          description: 'The approximate date of the event to update',
        },
        // Update fields
        newDate: {
          type: 'string',
          description: 'New date for the event',
        },
        newAmount: {
          type: 'number',
          description: 'New amount for the event',
        },
        newDescription: {
          type: 'string',
          description: 'New description for the event',
        },
        newTitle: {
          type: 'string',
          description: 'New title for the event',
        },
      },
      required: ['propertyAddress', 'eventType', 'eventDate'],
    },
  },
  {
    type: 'function',
    name: 'delete_event',
    description: 'Delete an event from a property timeline.',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property',
        },
        eventType: {
          type: 'string',
          description: 'The type of event to delete',
        },
        eventDate: {
          type: 'string',
          description: 'The approximate date of the event to delete',
        },
        confirmed: {
          type: 'boolean',
          description: 'Must be true to confirm deletion',
        },
      },
      required: ['propertyAddress', 'eventType', 'eventDate', 'confirmed'],
    },
  },

  // ==========================================================================
  // COST BASE OPERATIONS
  // ==========================================================================
  {
    type: 'function',
    name: 'add_cost_base_item',
    description: 'Add a cost base item to an event (e.g., stamp duty to purchase, renovation cost to improvement).',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property',
        },
        eventType: {
          type: 'string',
          description: 'The type of event to add cost to',
        },
        eventDate: {
          type: 'string',
          description: 'The approximate date of the event',
        },
        costType: {
          type: 'string',
          description: 'The type of cost (e.g., stamp_duty, legal_fees, renovation_kitchen)',
          enum: Object.keys(COST_BASE_ITEMS),
        },
        amount: {
          type: 'number',
          description: 'The cost amount in AUD',
        },
        customName: {
          type: 'string',
          description: 'Custom name if costType is not in the predefined list',
        },
      },
      required: ['propertyAddress', 'eventType', 'eventDate', 'amount'],
    },
  },
  {
    type: 'function',
    name: 'update_cost_base_item',
    description: 'Update the amount of an existing cost base item on an event.',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property',
        },
        eventType: {
          type: 'string',
          description: 'The type of event',
        },
        eventDate: {
          type: 'string',
          description: 'The approximate date of the event',
        },
        costType: {
          type: 'string',
          description: 'The type of cost to update',
        },
        newAmount: {
          type: 'number',
          description: 'The new cost amount in AUD',
        },
      },
      required: ['propertyAddress', 'eventType', 'eventDate', 'costType', 'newAmount'],
    },
  },
  {
    type: 'function',
    name: 'remove_cost_base_item',
    description: 'Remove a cost base item from an event.',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property',
        },
        eventType: {
          type: 'string',
          description: 'The type of event',
        },
        eventDate: {
          type: 'string',
          description: 'The approximate date of the event',
        },
        costType: {
          type: 'string',
          description: 'The type of cost to remove',
        },
      },
      required: ['propertyAddress', 'eventType', 'eventDate', 'costType'],
    },
  },

  // ==========================================================================
  // QUERY OPERATIONS
  // ==========================================================================
  {
    type: 'function',
    name: 'get_timeline_summary',
    description: 'Get a summary of all properties and events in the timeline.',
    parameters: {
      type: 'object',
      properties: {
        includeEvents: {
          type: 'boolean',
          description: 'Whether to include full event details',
        },
        includeCostBases: {
          type: 'boolean',
          description: 'Whether to include cost base breakdowns',
        },
      },
    },
  },
  {
    type: 'function',
    name: 'get_property_details',
    description: 'Get detailed information about a specific property including all events and cost bases.',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property',
        },
        includeCostBase: {
          type: 'boolean',
          description: 'Include full cost base breakdown',
        },
      },
      required: ['propertyAddress'],
    },
  },
  {
    type: 'function',
    name: 'get_event_details',
    description: 'Get detailed information about a specific event.',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property',
        },
        eventType: {
          type: 'string',
          description: 'The type of event',
        },
        eventDate: {
          type: 'string',
          description: 'The approximate date of the event',
        },
      },
      required: ['propertyAddress', 'eventType', 'eventDate'],
    },
  },
  {
    type: 'function',
    name: 'calculate_cgt_estimate',
    description: 'Calculate an estimated CGT liability for a property sale.',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property',
        },
        proposedSalePrice: {
          type: 'number',
          description: 'The proposed sale price to use for calculation',
        },
        marginalTaxRate: {
          type: 'number',
          description: 'Marginal tax rate percentage (e.g., 37)',
        },
      },
      required: ['propertyAddress'],
    },
  },

  // ==========================================================================
  // GLOBAL SETTINGS
  // ==========================================================================
  {
    type: 'function',
    name: 'set_marginal_tax_rate',
    description: 'Set the global marginal tax rate used for CGT calculations.',
    parameters: {
      type: 'object',
      properties: {
        rate: {
          type: 'number',
          description: 'Marginal tax rate as a percentage (e.g., 37 for 37%)',
        },
      },
      required: ['rate'],
    },
  },

  // ==========================================================================
  // BULK OPERATIONS
  // ==========================================================================
  {
    type: 'function',
    name: 'clear_all_data',
    description: 'Clear all properties and events from the timeline. Use with extreme caution.',
    parameters: {
      type: 'object',
      properties: {
        confirmed: {
          type: 'boolean',
          description: 'Must be true to confirm clearing all data',
        },
      },
      required: ['confirmed'],
    },
  },
  {
    type: 'function',
    name: 'analyze_portfolio',
    description: 'Trigger AI analysis of the entire property portfolio for CGT obligations.',
    parameters: {
      type: 'object',
      properties: {
        confirmed: {
          type: 'boolean',
          description: 'Must be true to trigger analysis',
        },
      },
      required: ['confirmed'],
    },
  },

  // ==========================================================================
  // NAVIGATION & VIEW CONTROLS
  // ==========================================================================
  {
    type: 'function',
    name: 'focus_on_property',
    description: 'Focus the timeline view on a specific property.',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property to focus on',
        },
      },
      required: ['propertyAddress'],
    },
  },
  {
    type: 'function',
    name: 'zoom_timeline',
    description: 'Zoom the timeline in or out, or set a specific zoom level.',
    parameters: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          description: 'Zoom direction',
          enum: ['in', 'out'],
        },
        level: {
          type: 'string',
          description: 'Specific zoom level to set',
          enum: ['30-years', 'decade', 'multi-year', 'years', 'year', 'months', 'month', 'weeks', 'days'],
        },
      },
    },
  },
  {
    type: 'function',
    name: 'pan_to_date',
    description: 'Pan the timeline to center on a specific date.',
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'The date to pan to in ISO format',
        },
      },
      required: ['date'],
    },
  },
  {
    type: 'function',
    name: 'undo_last_action',
    description: 'Undo the last action performed on the timeline.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    type: 'function',
    name: 'redo_last_action',
    description: 'Redo the last undone action.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
];

// ============================================================================
// SYSTEM INSTRUCTIONS - COMPREHENSIVE
// ============================================================================

export const TIMELINE_SYSTEM_INSTRUCTIONS = `You are an AI assistant for CGT Brain, a comprehensive Capital Gains Tax timeline management application for Australian properties. Your role is to help users build and manage their complete property timelines through natural voice conversation.

## Your Capabilities

You can perform ALL timeline operations including:

### Property Management
- **Add Properties**: Create new property entries with full details (address, purchase info, owners)
- **Update Properties**: Modify property details, change owners, update addresses
- **Delete Properties**: Remove properties (with confirmation)
- **Subdivide Properties**: Split properties into multiple lots with cost base allocation
- **Multi-Owner Support**: Set up properties with multiple owners and their percentages

### Event Management (14 Event Types)
1. **Purchase Events**: Full cost base tracking including:
   - Purchase price with land/building split
   - Stamp duty, legal fees, buyer's agent fees
   - Building and pest inspection costs
   - Loan fees and mortgage insurance
   - Property indicators (land only, over 2 hectares)
   - Mixed-use percentages (living/rental/business)

2. **Sale Events**: Complete selling details including:
   - Sale price and contract/settlement dates
   - Agent commission, legal fees, advertising
   - Staging costs, auction fees, mortgage discharge
   - Tax settings (resident status, marginal tax rate)
   - Capital losses and exemption types

3. **Move In/Out Events**: Track when owner moves in or out
4. **Rent Start/End Events**: Track rental periods
5. **Vacant Start/End Events**: Track vacancy periods
6. **Improvement Events**: Capital improvements that add to cost base
7. **Status Change Events**: Manual property status changes
8. **Ownership Change Events**: Transfer ownership (inheritance, gift, divorce)
9. **Subdivision Events**: Split properties into lots
10. **Custom Events**: User-defined events with optional status change

### Cost Base Management (5 CGT Elements)
- **Element 1**: Acquisition costs (purchase price, land/building)
- **Element 2**: Incidental costs (stamp duty, legal fees, agent fees)
- **Element 3**: Ownership costs (if not deducted)
- **Element 4**: Capital improvements (renovations, additions)
- **Element 5**: Title costs (legal fees for title defense)

### Companion Events (Auto-Creation)
When adding events, you can automatically create related events:
- Purchase + Move In on same day
- Purchase as Vacant or Rental
- Move Out + Vacant or Rent Start
- Rent End + Move In or Vacant
- Vacant End + Move In or Rent Start

### Query Operations
- Get timeline summary
- Get property details with cost base breakdown
- Get specific event details
- Calculate CGT estimates

### Navigation
- Focus on specific properties
- Zoom in/out or set specific zoom levels
- Pan to specific dates
- Undo/redo actions

## Important Australian CGT Concepts

- **PPR (Principal Place of Residence)**: Main home - generally CGT exempt
- **Rental Property**: Rented to tenants - subject to CGT
- **6-Year Absence Rule**: PPR can be rented up to 6 years maintaining exemption
- **50% CGT Discount**: Available for assets held over 12 months (Australian residents only)
- **Cost Base Elements**: 5 elements that make up the CGT cost base
- **Contract Date**: When CGT event is triggered for sales (not settlement)
- **Main Residence Exemption**: Full or partial exemption for your home
- **Mixed Use**: Properties used partially for rental/business have apportioned CGT

## Conversation Style

- Be conversational, helpful, and thorough
- Confirm important actions before executing
- When adding events, summarize what you're creating
- Ask for clarification if information is missing
- Use Australian English and currency conventions
- Express amounts in AUD without needing to specify currency
- Be precise with dates (use DD/MM/YYYY format when speaking)

## Event Type Details

### Purchase Event Fields
- Date (settlement date when ownership transferred)
- Purchase price
- Land/building split (optional)
- Stamp duty, legal fees, inspection costs
- Property type (land only, over 2 hectares)
- Mixed use percentages
- Companion events (move in, vacant, rental)

### Sale Event Fields
- Contract date (CGT trigger date)
- Settlement date (optional)
- Sale price
- Agent commission, legal fees, advertising
- Resident status for 50% discount
- Marginal tax rate
- Previous year losses
- Exemption type

### Improvement Event Fields
- Date completed
- Total cost
- Type (kitchen, bathroom, extension, pool, etc.)
- Description

### Ownership Change Fields
- Date of transfer
- Leaving owners (names)
- New owners (names and percentages)
- Reason (inheritance, gift, divorce, sale transfer)

## Response Guidelines

1. Always acknowledge the user's request clearly
2. Use the appropriate tool to fulfill the request
3. Provide a confirmation of what was done
4. Mention any companion events created
5. Ask if there's anything else to help with
6. If something seems incorrect, ask for clarification first

## Creating Sample Data

When a user asks you to create a property or event but doesn't provide all the details:
- **DO NOT** load or use pre-existing demo data
- **CREATE YOUR OWN** realistic Australian property data
- Generate realistic Australian addresses (e.g., "42 Smith Street, Parramatta NSW 2150")
- Use realistic prices for the Australian market (typically $400,000 - $2,000,000)
- Create realistic dates within reasonable timeframes
- Add appropriate cost base items (stamp duty ~4% of purchase price, legal fees ~$2,000-$5,000)
- Make up sensible details that would be typical for Australian property transactions

For example, if a user says "add a property", create one with:
- A realistic Sydney/Melbourne/Brisbane suburban address
- A purchase date a few years ago
- A realistic purchase price for that area
- Typical stamp duty and legal fees
- An appropriate initial status (PPR if they moved in, rental if they rented it out)

Always tell the user what details you've created so they can correct any that don't match their actual situation.

## Important Notes

- For purchases, record the SETTLEMENT DATE (when ownership transferred)
- For sales, record the CONTRACT DATE (when CGT is triggered)
- Cost base items should be actual costs paid, not estimates
- Mixed use percentages must total 100%
- Ownership percentages for multiple owners must total 100%
- Subdivision creates Lot 1 continuing the parent's CGT history

Remember: You're helping Australian property owners accurately track their CGT obligations. Precision with dates, amounts, and cost base items is essential for correct CGT calculations.`;

// ============================================================================
// TOOL EXECUTOR - COMPREHENSIVE
// ============================================================================

export interface ToolExecutorContext {
  properties: Property[];
  events: TimelineEvent[];
  addProperty: (property: Omit<Property, 'id' | 'branch'>) => void;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  deleteProperty: (id: string) => void;
  addEvent: (event: Omit<TimelineEvent, 'id'>) => void;
  updateEvent: (id: string, updates: Partial<TimelineEvent>) => void;
  deleteEvent: (id: string) => void;
  clearAllData: () => void;
  setSelectedPropertyId?: (id: string | null) => void;
  selectProperty?: (id: string | null) => void;
  zoomIn?: () => void;
  zoomOut?: () => void;
  setZoomByIndex?: (index: number) => void;
  panToDate?: (date: Date) => void;
  setMarginalTaxRate?: (rate: number) => void;
  analyzePortfolio?: () => Promise<void>;
  undo?: () => void;
  redo?: () => void;
}

// Event type to color mapping
const EVENT_COLORS: Record<string, string> = {
  purchase: '#3B82F6',      // Blue
  sale: '#8B5CF6',          // Purple
  move_in: '#10B981',       // Green
  move_out: '#EF4444',      // Red
  rent_start: '#F59E0B',    // Amber
  rent_end: '#F97316',      // Orange
  improvement: '#06B6D4',   // Cyan
  refinance: '#6366F1',     // Indigo
  status_change: '#A855F7', // Purple
  ownership_change: '#A855F7', // Purple
  subdivision: '#EC4899',   // Pink
  living_in_rental_start: '#F472B6', // Pink
  living_in_rental_end: '#F472B6',
  custom: '#6B7280',        // Gray
};

// Event type to default title mapping
const EVENT_TITLES: Record<string, string> = {
  purchase: 'Purchase',
  sale: 'Sale',
  move_in: 'Move In',
  move_out: 'Move Out',
  rent_start: 'Rent Start',
  rent_end: 'Rent End',
  improvement: 'Improvement',
  refinance: 'Inherit',
  status_change: 'Status Change',
  ownership_change: 'Ownership Change',
  subdivision: 'Subdivision',
  living_in_rental_start: 'Living in Rental (Start)',
  living_in_rental_end: 'Living in Rental (End)',
  custom: 'Custom Event',
};

// Color name to hex mapping
const COLOR_NAME_TO_HEX: Record<string, string> = {
  red: '#EF4444',
  orange: '#F97316',
  amber: '#F59E0B',
  lime: '#84CC16',
  emerald: '#10B981',
  cyan: '#06B6D4',
  blue: '#3B82F6',
  indigo: '#6366F1',
  violet: '#8B5CF6',
  pink: '#EC4899',
  gray: '#6B7280',
  dark: '#1F2937',
};

// Zoom level name to index mapping
const ZOOM_LEVEL_INDEX: Record<string, number> = {
  '30-years': 0,
  'decade': 1,
  'multi-year': 2,
  'years': 3,
  'year': 4,
  'months': 5,
  'month': 6,
  'weeks': 7,
  'days': 8,
};

export class RealtimeToolExecutor {
  private context: ToolExecutorContext;

  constructor(context: ToolExecutorContext) {
    this.context = context;
  }

  /**
   * Update context with fresh state
   */
  updateContext(context: Partial<ToolExecutorContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Execute a tool call and return the result
   */
  async execute(name: string, args: Record<string, unknown>): Promise<unknown> {
    console.log('🔧 Executing tool:', name, args);

    try {
      switch (name) {
        // Property Operations
        case 'add_property':
          return this.addProperty(args);
        case 'update_property':
          return this.updateProperty(args);
        case 'delete_property':
          return this.deleteProperty(args);
        case 'subdivide_property':
          return this.subdivideProperty(args);
        case 'set_property_owners':
          return this.setPropertyOwners(args);

        // Event Operations - Specific Types
        case 'add_purchase_event':
          return this.addPurchaseEvent(args);
        case 'add_sale_event':
          return this.addSaleEvent(args);
        case 'add_move_in_event':
          return this.addMoveInEvent(args);
        case 'add_move_out_event':
          return this.addMoveOutEvent(args);
        case 'add_rent_start_event':
          return this.addRentStartEvent(args);
        case 'add_rent_end_event':
          return this.addRentEndEvent(args);
        case 'add_improvement_event':
          return this.addImprovementEvent(args);
        case 'add_status_change_event':
          return this.addStatusChangeEvent(args);
        case 'add_ownership_change_event':
          return this.addOwnershipChangeEvent(args);
        case 'add_subdivision_event':
          return this.addSubdivisionEvent(args);
        case 'add_custom_event':
          return this.addCustomEvent(args);
        case 'update_event':
          return this.updateEvent(args);
        case 'delete_event':
          return this.deleteEvent(args);

        // Cost Base Operations
        case 'add_cost_base_item':
          return this.addCostBaseItem(args);
        case 'update_cost_base_item':
          return this.updateCostBaseItem(args);
        case 'remove_cost_base_item':
          return this.removeCostBaseItem(args);

        // Query Operations
        case 'get_timeline_summary':
          return this.getTimelineSummary(args);
        case 'get_property_details':
          return this.getPropertyDetails(args);
        case 'get_event_details':
          return this.getEventDetails(args);
        case 'calculate_cgt_estimate':
          return this.calculateCGTEstimate(args);

        // Global Settings
        case 'set_marginal_tax_rate':
          return this.setMarginalTaxRate(args);

        // Bulk Operations
        case 'clear_all_data':
          return this.clearAllData(args);
        case 'analyze_portfolio':
          return this.analyzePortfolio(args);

        // Navigation
        case 'focus_on_property':
          return this.focusOnProperty(args);
        case 'zoom_timeline':
          return this.zoomTimeline(args);
        case 'pan_to_date':
          return this.panToDate(args);
        case 'undo_last_action':
          return this.undoLastAction();
        case 'redo_last_action':
          return this.redoLastAction();

        default:
          return { success: false, error: `Unknown tool: ${name}` };
      }
    } catch (error) {
      console.error('❌ Tool execution error:', error);
      return { success: false, error: String(error) };
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private findPropertyByAddress(address: string): Property | undefined {
    const normalizedSearch = address.toLowerCase().trim();
    return this.context.properties.find(
      (p) =>
        p.name?.toLowerCase().includes(normalizedSearch) ||
        p.address?.toLowerCase().includes(normalizedSearch) ||
        normalizedSearch.includes(p.name?.toLowerCase() || '') ||
        normalizedSearch.includes(p.address?.toLowerCase() || '')
    );
  }

  private findEvent(propertyId: string, eventType: string, eventDate: string): TimelineEvent | undefined {
    const targetDate = new Date(eventDate);
    return this.context.events.find(
      (e) =>
        e.propertyId === propertyId &&
        e.type === eventType &&
        Math.abs(new Date(e.date).getTime() - targetDate.getTime()) < 86400000 * 7 // Within 7 days
    );
  }

  private generatePropertyColor(): string {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
    return colors[this.context.properties.length % colors.length];
  }

  private createCostBaseItem(
    definitionId: string,
    amount: number,
    customName?: string
  ): CostBaseItem {
    const definition = COST_BASE_ITEMS[definitionId as keyof typeof COST_BASE_ITEMS];
    return {
      id: `cb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      definitionId: definition ? definitionId : 'custom',
      name: customName || definition?.name || definitionId,
      amount,
      category: (definition?.category || 'element2_acquisition') as CostBaseCategory,
      isCustom: !definition,
    };
  }

  private mapOwnershipReason(reason: string): 'divorce' | 'sale_transfer' | 'gift' | 'other' {
    // Map voice input reasons to valid OwnershipChangeReason types
    const reasonMap: Record<string, 'divorce' | 'sale_transfer' | 'gift' | 'other'> = {
      'divorce': 'divorce',
      'sale_transfer': 'sale_transfer',
      'sale': 'sale_transfer',
      'transfer': 'sale_transfer',
      'gift': 'gift',
      'inheritance': 'other', // Map inheritance to 'other' with description
      'other': 'other',
    };
    return reasonMap[reason.toLowerCase()] || 'other';
  }

  // ============================================================================
  // PROPERTY OPERATIONS
  // ============================================================================

  private addProperty(args: Record<string, unknown>): unknown {
    const address = args.address as string;
    const purchaseDate = args.purchaseDate ? new Date(args.purchaseDate as string) : undefined;
    const purchasePrice = args.purchasePrice as number | undefined;
    const initialStatus = (args.initialStatus as PropertyStatus) || 'ppr';

    // Create property
    const property: Omit<Property, 'id' | 'branch'> = {
      name: address.split(',')[0].trim(),
      address: address,
      color: this.generatePropertyColor(),
      purchaseDate,
      purchasePrice,
      currentStatus: initialStatus,
      owners: args.owners as Array<{ name: string; percentage: number }> | undefined,
    };

    this.context.addProperty(property);

    // Get the newly created property
    const newProperty = this.context.properties[this.context.properties.length - 1];
    if (!newProperty) {
      return { success: false, error: 'Failed to create property' };
    }

    // Create purchase event if purchase details provided
    if (purchaseDate && purchasePrice) {
      const costBases: CostBaseItem[] = [
        this.createCostBaseItem('purchase_price', purchasePrice),
      ];

      // Add optional cost base items
      if (args.landPrice) {
        costBases.push(this.createCostBaseItem('land_price', args.landPrice as number));
      }
      if (args.buildingPrice) {
        costBases.push(this.createCostBaseItem('building_price', args.buildingPrice as number));
      }
      if (args.stampDuty) {
        costBases.push(this.createCostBaseItem('stamp_duty', args.stampDuty as number));
      }
      if (args.legalFees) {
        costBases.push(this.createCostBaseItem('purchase_legal_fees', args.legalFees as number));
      }

      this.context.addEvent({
        propertyId: newProperty.id,
        type: 'purchase',
        date: purchaseDate,
        title: 'Purchase',
        amount: purchasePrice,
        color: EVENT_COLORS.purchase,
        position: 0,
        costBases,
        isLandOnly: args.isLandOnly as boolean | undefined,
        overTwoHectares: args.overTwoHectares as boolean | undefined,
        businessUsePercentage: args.businessUsePercentage as number | undefined,
      });

      // Create companion move_in event if requested
      if (args.moveInOnSameDay) {
        this.context.addEvent({
          propertyId: newProperty.id,
          type: 'move_in',
          date: purchaseDate,
          title: 'Move In',
          color: EVENT_COLORS.move_in,
          position: 0,
        });
      }
    }

    return {
      success: true,
      message: `Added property at ${address}${purchaseDate ? ' with purchase event' : ''}${args.moveInOnSameDay ? ' and move-in event' : ''}`,
      propertyId: newProperty.id,
    };
  }

  private updateProperty(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    const updates: Partial<Property> = {};
    if (args.newName) updates.name = args.newName as string;
    if (args.newAddress) {
      updates.address = args.newAddress as string;
      if (!args.newName) updates.name = (args.newAddress as string).split(',')[0].trim();
    }
    if (args.owners) updates.owners = args.owners as Array<{ name: string; percentage: number }>;

    this.context.updateProperty(property.id, updates);
    return { success: true, message: `Updated property at ${property.address}` };
  }

  private deleteProperty(args: Record<string, unknown>): unknown {
    if (!args.confirmed) {
      return { success: false, error: 'Deletion not confirmed. Please confirm to delete.' };
    }

    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    // Delete all events for this property
    const propertyEvents = this.context.events.filter((e) => e.propertyId === property.id);
    propertyEvents.forEach((e) => this.context.deleteEvent(e.id));

    this.context.deleteProperty(property.id);
    return { success: true, message: `Deleted property at ${property.address} and ${propertyEvents.length} events` };
  }

  private subdivideProperty(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    const subdivisionDate = new Date(args.subdivisionDate as string);
    const lots = args.lots as Array<{ name: string; address?: string; lotSize?: number }>;

    if (!lots || lots.length < 2) {
      return { success: false, error: 'Subdivision requires at least 2 lots' };
    }

    // Create subdivision event on parent
    this.context.addEvent({
      propertyId: property.id,
      type: 'subdivision',
      date: subdivisionDate,
      title: 'Subdivision',
      color: EVENT_COLORS.subdivision,
      position: 0,
      description: `Subdivided into ${lots.length} lots`,
    });

    // Update parent property status
    this.context.updateProperty(property.id, { currentStatus: 'subdivided' as PropertyStatus });

    // Create child properties
    const childPropertyIds: string[] = [];
    lots.forEach((lot, index) => {
      const isMainLot = index === 0;
      this.context.addProperty({
        name: lot.name || `${property.name} - Lot ${index + 1}`,
        address: lot.address || `${property.address} (Lot ${index + 1})`,
        color: property.color,
        parentPropertyId: property.id,
        isMainLotContinuation: isMainLot,
        subdivisionDate,
        lotNumber: `Lot ${index + 1}`,
        lotSize: lot.lotSize,
      });
      const newProp = this.context.properties[this.context.properties.length - 1];
      if (newProp) childPropertyIds.push(newProp.id);
    });

    return {
      success: true,
      message: `Subdivided ${property.address} into ${lots.length} lots`,
      childPropertyIds,
    };
  }

  private setPropertyOwners(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    const owners = args.owners as Array<{ name: string; percentage: number }>;
    if (!owners || owners.length === 0) {
      return { success: false, error: 'At least one owner is required' };
    }

    const totalPercentage = owners.reduce((sum, o) => sum + (o.percentage || 0), 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return { success: false, error: `Owner percentages must total 100% (currently ${totalPercentage}%)` };
    }

    this.context.updateProperty(property.id, { owners });
    return { success: true, message: `Updated owners for ${property.address}` };
  }

  // ============================================================================
  // EVENT OPERATIONS - SPECIFIC TYPES
  // ============================================================================

  private addPurchaseEvent(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    const date = new Date(args.date as string);
    const purchasePrice = args.purchasePrice as number;

    // Build cost bases array
    const costBases: CostBaseItem[] = [
      this.createCostBaseItem('purchase_price', purchasePrice),
    ];

    if (args.landPrice) costBases.push(this.createCostBaseItem('land_price', args.landPrice as number));
    if (args.buildingPrice) costBases.push(this.createCostBaseItem('building_price', args.buildingPrice as number));
    if (args.stampDuty) costBases.push(this.createCostBaseItem('stamp_duty', args.stampDuty as number));
    if (args.legalFees) costBases.push(this.createCostBaseItem('purchase_legal_fees', args.legalFees as number));
    if (args.valuationFees) costBases.push(this.createCostBaseItem('valuation_fees', args.valuationFees as number));
    if (args.buildingInspection) costBases.push(this.createCostBaseItem('building_inspection', args.buildingInspection as number));
    if (args.pestInspection) costBases.push(this.createCostBaseItem('pest_inspection', args.pestInspection as number));
    if (args.buyersAgentFees) costBases.push(this.createCostBaseItem('purchase_agent_fees', args.buyersAgentFees as number));
    if (args.loanFees) costBases.push(this.createCostBaseItem('loan_application_fees', args.loanFees as number));
    if (args.mortgageInsurance) costBases.push(this.createCostBaseItem('mortgage_insurance', args.mortgageInsurance as number));

    this.context.addEvent({
      propertyId: property.id,
      type: 'purchase',
      date,
      title: 'Purchase',
      amount: purchasePrice,
      color: EVENT_COLORS.purchase,
      position: 0,
      costBases,
      isLandOnly: args.isLandOnly as boolean | undefined,
      overTwoHectares: args.overTwoHectares as boolean | undefined,
      businessUsePercentage: args.businessUsePercentage as number | undefined,
      description: args.description as string | undefined,
    });

    const companionEvents: string[] = [];

    // Companion events
    if (args.moveInOnSameDay) {
      this.context.addEvent({
        propertyId: property.id,
        type: 'move_in',
        date,
        title: 'Move In',
        color: EVENT_COLORS.move_in,
        position: 0,
      });
      companionEvents.push('Move In');
    }

    if (args.purchaseAsVacant) {
      this.context.addEvent({
        propertyId: property.id,
        type: 'status_change',
        date,
        title: 'Status: Vacant',
        color: EVENT_COLORS.status_change,
        position: 0,
        newStatus: 'vacant',
      });
      companionEvents.push('Vacant status');
    }

    if (args.purchaseAsRental) {
      this.context.addEvent({
        propertyId: property.id,
        type: 'rent_start',
        date,
        title: 'Rent Start',
        color: EVENT_COLORS.rent_start,
        position: 0,
      });
      companionEvents.push('Rent Start');
    }

    return {
      success: true,
      message: `Added purchase event for ${property.address} ($${purchasePrice.toLocaleString()})${companionEvents.length ? ' with ' + companionEvents.join(', ') : ''}`,
    };
  }

  private addSaleEvent(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    const contractDate = new Date(args.contractDate as string);
    const salePrice = args.salePrice as number;

    // Build cost bases for selling costs
    const costBases: CostBaseItem[] = [
      this.createCostBaseItem('sale_price', salePrice),
    ];

    if (args.agentCommission) costBases.push(this.createCostBaseItem('sale_agent_fees', args.agentCommission as number));
    if (args.legalFees) costBases.push(this.createCostBaseItem('sale_legal_fees', args.legalFees as number));
    if (args.advertisingCosts) costBases.push(this.createCostBaseItem('advertising_costs', args.advertisingCosts as number));
    if (args.stagingCosts) costBases.push(this.createCostBaseItem('staging_costs', args.stagingCosts as number));
    if (args.auctionFees) costBases.push(this.createCostBaseItem('auction_fees', args.auctionFees as number));
    if (args.mortgageDischarge) costBases.push(this.createCostBaseItem('mortgage_discharge_fees', args.mortgageDischarge as number));

    // Set marginal tax rate if provided
    if (args.marginalTaxRate && this.context.setMarginalTaxRate) {
      this.context.setMarginalTaxRate(args.marginalTaxRate as number);
    }

    this.context.addEvent({
      propertyId: property.id,
      type: 'sale',
      date: contractDate,
      title: 'Sale',
      amount: salePrice,
      color: EVENT_COLORS.sale,
      position: 0,
      costBases,
      isResident: args.isResident !== false,
      previousYearLosses: args.previousYearLosses as number | undefined,
      settlementDate: args.settlementDate ? new Date(args.settlementDate as string) : undefined,
      description: args.description as string | undefined,
    });

    // Update property status
    this.context.updateProperty(property.id, { currentStatus: 'sold', salePrice, saleDate: contractDate });

    return {
      success: true,
      message: `Added sale event for ${property.address} ($${salePrice.toLocaleString()})`,
    };
  }

  private addMoveInEvent(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    this.context.addEvent({
      propertyId: property.id,
      type: 'move_in',
      date: new Date(args.date as string),
      title: 'Move In',
      color: EVENT_COLORS.move_in,
      position: 0,
      description: args.description as string | undefined,
    });

    return { success: true, message: `Added move-in event for ${property.address}` };
  }

  private addMoveOutEvent(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    const date = new Date(args.date as string);

    this.context.addEvent({
      propertyId: property.id,
      type: 'move_out',
      date,
      title: 'Move Out',
      color: EVENT_COLORS.move_out,
      position: 0,
      description: args.description as string | undefined,
    });

    const companionEvents: string[] = [];

    if (args.moveOutAsRental) {
      this.context.addEvent({
        propertyId: property.id,
        type: 'rent_start',
        date,
        title: 'Rent Start',
        color: EVENT_COLORS.rent_start,
        position: 0,
      });
      companionEvents.push('Rent Start');
    }

    return {
      success: true,
      message: `Added move-out event for ${property.address}${companionEvents.length ? ' with ' + companionEvents.join(', ') : ''}`,
    };
  }

  private addRentStartEvent(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    this.context.addEvent({
      propertyId: property.id,
      type: 'rent_start',
      date: new Date(args.date as string),
      title: 'Rent Start',
      color: EVENT_COLORS.rent_start,
      position: 0,
      amount: args.weeklyRent as number | undefined,
      description: args.description as string | undefined,
    });

    return { success: true, message: `Added rent start event for ${property.address}` };
  }

  private addRentEndEvent(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    const date = new Date(args.date as string);

    this.context.addEvent({
      propertyId: property.id,
      type: 'rent_end',
      date,
      title: 'Rent End',
      color: EVENT_COLORS.rent_end,
      position: 0,
      description: args.description as string | undefined,
    });

    const companionEvents: string[] = [];

    if (args.rentEndAsMoveIn) {
      this.context.addEvent({
        propertyId: property.id,
        type: 'move_in',
        date,
        title: 'Move In',
        color: EVENT_COLORS.move_in,
        position: 0,
      });
      companionEvents.push('Move In');
    }

    return {
      success: true,
      message: `Added rent end event for ${property.address}${companionEvents.length ? ' with ' + companionEvents.join(', ') : ''}`,
    };
  }

  private addImprovementEvent(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    const totalAmount = args.totalAmount as number;
    const improvementType = args.improvementType as string || 'other';

    // Map improvement type to cost base definition
    const improvementTypeMap: Record<string, string> = {
      kitchen_renovation: 'renovation_kitchen',
      bathroom_renovation: 'renovation_bathroom',
      whole_house_renovation: 'renovation_whole_house',
      extension: 'extension',
      swimming_pool: 'swimming_pool',
      landscaping: 'landscaping',
      garage_carport: 'garage_carport',
      fencing: 'fencing',
      deck_patio: 'deck_patio',
      hvac_system: 'hvac_system',
      solar_panels: 'solar_panels',
      structural_changes: 'structural_changes',
      disability_modifications: 'disability_modifications',
      water_tank: 'water_tank',
      shed_outbuilding: 'shed_outbuilding',
    };

    const costBaseType = improvementTypeMap[improvementType] || 'renovation_whole_house';
    const costBases: CostBaseItem[] = [
      this.createCostBaseItem(costBaseType, totalAmount, args.title as string),
    ];

    this.context.addEvent({
      propertyId: property.id,
      type: 'improvement',
      date: new Date(args.date as string),
      title: (args.title as string) || EVENT_TITLES.improvement,
      amount: totalAmount,
      color: EVENT_COLORS.improvement,
      position: 0,
      costBases,
      description: args.description as string | undefined,
    });

    return {
      success: true,
      message: `Added improvement event for ${property.address} ($${totalAmount.toLocaleString()})`,
    };
  }

  private addStatusChangeEvent(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    const newStatus = args.newStatus as PropertyStatus;

    this.context.addEvent({
      propertyId: property.id,
      type: 'status_change',
      date: new Date(args.date as string),
      title: `Status: ${newStatus.toUpperCase()}`,
      color: EVENT_COLORS.status_change,
      position: 0,
      newStatus,
      description: args.description as string | undefined,
    });

    return { success: true, message: `Added status change event for ${property.address} (now ${newStatus})` };
  }

  private addOwnershipChangeEvent(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    const leavingOwners = args.leavingOwners as string[];
    const newOwners = args.newOwners as Array<{ name: string; percentage: number }>;

    if (!leavingOwners || leavingOwners.length === 0) {
      return { success: false, error: 'At least one leaving owner is required' };
    }

    if (!newOwners || newOwners.length === 0) {
      return { success: false, error: 'At least one new owner is required' };
    }

    this.context.addEvent({
      propertyId: property.id,
      type: 'ownership_change',
      date: new Date(args.date as string),
      title: 'Ownership Change',
      color: EVENT_COLORS.ownership_change,
      position: 0,
      leavingOwners,
      newOwners,
      ownershipChangeReason: this.mapOwnershipReason(args.reason as string),
      ownershipChangeReasonOther: args.reasonOther as string | undefined,
      description: args.description as string | undefined,
    });

    // Update property owners
    this.context.updateProperty(property.id, { owners: newOwners });

    return {
      success: true,
      message: `Added ownership change event for ${property.address} (${leavingOwners.join(', ')} → ${newOwners.map(o => o.name).join(', ')})`,
    };
  }

  private addSubdivisionEvent(args: Record<string, unknown>): unknown {
    return this.subdivideProperty(args);
  }

  private addCustomEvent(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    const colorName = args.color as string;
    const color = COLOR_NAME_TO_HEX[colorName] || colorName || EVENT_COLORS.custom;

    this.context.addEvent({
      propertyId: property.id,
      type: 'custom',
      date: new Date(args.date as string),
      title: args.title as string,
      amount: args.amount as number | undefined,
      color,
      position: 0,
      newStatus: args.affectsStatus ? (args.newStatus as PropertyStatus) : undefined,
      description: args.description as string | undefined,
    });

    return { success: true, message: `Added custom event "${args.title}" for ${property.address}` };
  }

  private updateEvent(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    const event = this.findEvent(property.id, args.eventType as string, args.eventDate as string);
    if (!event) {
      return { success: false, error: `Event not found: ${args.eventType} on ${args.eventDate}` };
    }

    const updates: Partial<TimelineEvent> = {};
    if (args.newDate) updates.date = new Date(args.newDate as string);
    if (args.newAmount !== undefined) updates.amount = args.newAmount as number;
    if (args.newDescription) updates.description = args.newDescription as string;
    if (args.newTitle) updates.title = args.newTitle as string;

    this.context.updateEvent(event.id, updates);
    return { success: true, message: `Updated ${event.type} event for ${property.address}` };
  }

  private deleteEvent(args: Record<string, unknown>): unknown {
    if (!args.confirmed) {
      return { success: false, error: 'Deletion not confirmed. Please confirm to delete.' };
    }

    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    const event = this.findEvent(property.id, args.eventType as string, args.eventDate as string);
    if (!event) {
      return { success: false, error: `Event not found: ${args.eventType} on ${args.eventDate}` };
    }

    this.context.deleteEvent(event.id);
    return { success: true, message: `Deleted ${event.type} event from ${property.address}` };
  }

  // ============================================================================
  // COST BASE OPERATIONS
  // ============================================================================

  private addCostBaseItem(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    const event = this.findEvent(property.id, args.eventType as string, args.eventDate as string);
    if (!event) {
      return { success: false, error: `Event not found: ${args.eventType} on ${args.eventDate}` };
    }

    const costBases = event.costBases || [];
    const newItem = this.createCostBaseItem(
      (args.costType as string) || 'custom',
      args.amount as number,
      args.customName as string
    );
    costBases.push(newItem);

    this.context.updateEvent(event.id, { costBases });
    return {
      success: true,
      message: `Added ${newItem.name} ($${(args.amount as number).toLocaleString()}) to ${event.type} event`,
    };
  }

  private updateCostBaseItem(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    const event = this.findEvent(property.id, args.eventType as string, args.eventDate as string);
    if (!event) {
      return { success: false, error: `Event not found: ${args.eventType} on ${args.eventDate}` };
    }

    const costBases = event.costBases || [];
    const itemIndex = costBases.findIndex(
      (cb) => cb.definitionId === args.costType || cb.name.toLowerCase().includes((args.costType as string).toLowerCase())
    );

    if (itemIndex === -1) {
      return { success: false, error: `Cost base item not found: ${args.costType}` };
    }

    costBases[itemIndex] = { ...costBases[itemIndex], amount: args.newAmount as number };
    this.context.updateEvent(event.id, { costBases });

    return {
      success: true,
      message: `Updated ${costBases[itemIndex].name} to $${(args.newAmount as number).toLocaleString()}`,
    };
  }

  private removeCostBaseItem(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    const event = this.findEvent(property.id, args.eventType as string, args.eventDate as string);
    if (!event) {
      return { success: false, error: `Event not found: ${args.eventType} on ${args.eventDate}` };
    }

    const costBases = event.costBases || [];
    const itemIndex = costBases.findIndex(
      (cb) => cb.definitionId === args.costType || cb.name.toLowerCase().includes((args.costType as string).toLowerCase())
    );

    if (itemIndex === -1) {
      return { success: false, error: `Cost base item not found: ${args.costType}` };
    }

    const removedItem = costBases[itemIndex];
    costBases.splice(itemIndex, 1);
    this.context.updateEvent(event.id, { costBases });

    return { success: true, message: `Removed ${removedItem.name} from ${event.type} event` };
  }

  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  private getTimelineSummary(args: Record<string, unknown>): unknown {
    const includeEvents = args.includeEvents !== false;
    const includeCostBases = args.includeCostBases === true;

    const summary = {
      totalProperties: this.context.properties.length,
      totalEvents: this.context.events.length,
      properties: this.context.properties.map((p) => {
        const propertyEvents = this.context.events.filter((e) => e.propertyId === p.id);
        const result: Record<string, unknown> = {
          name: p.name,
          address: p.address,
          status: p.currentStatus,
          purchaseDate: p.purchaseDate,
          purchasePrice: p.purchasePrice,
          eventCount: propertyEvents.length,
          owners: p.owners,
        };

        if (includeEvents) {
          result.events = propertyEvents.map((e) => {
            const eventResult: Record<string, unknown> = {
              type: e.type,
              title: e.title,
              date: e.date,
              amount: e.amount,
            };
            if (includeCostBases && e.costBases) {
              eventResult.costBases = e.costBases;
            }
            return eventResult;
          });
        }

        return result;
      }),
    };

    return { success: true, data: summary };
  }

  private getPropertyDetails(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    const propertyEvents = this.context.events
      .filter((e) => e.propertyId === property.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate total cost base
    let totalCostBase = 0;
    const costBaseBreakdown: Record<string, number> = {};

    propertyEvents.forEach((event) => {
      if (event.costBases) {
        event.costBases.forEach((cb) => {
          if (cb.category !== 'element1' || cb.definitionId !== 'sale_price') {
            totalCostBase += cb.amount;
            costBaseBreakdown[cb.category] = (costBaseBreakdown[cb.category] || 0) + cb.amount;
          }
        });
      }
      // Division 43 (Capital Works) deductions reduce cost base
      if (event.type === 'sale' && event.division43Deductions) {
        totalCostBase -= event.division43Deductions;
      }
    });

    return {
      success: true,
      data: {
        ...property,
        events: propertyEvents,
        totalCostBase,
        costBaseBreakdown: args.includeCostBase ? costBaseBreakdown : undefined,
      },
    };
  }

  private getEventDetails(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    const event = this.findEvent(property.id, args.eventType as string, args.eventDate as string);
    if (!event) {
      return { success: false, error: `Event not found: ${args.eventType} on ${args.eventDate}` };
    }

    return { success: true, data: event };
  }

  private calculateCGTEstimate(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    const propertyEvents = this.context.events.filter((e) => e.propertyId === property.id);

    // Find purchase event
    const purchaseEvent = propertyEvents.find((e) => e.type === 'purchase');
    if (!purchaseEvent) {
      return { success: false, error: 'No purchase event found for this property' };
    }

    // Calculate cost base
    let costBase = 0;
    propertyEvents.forEach((event) => {
      if (event.costBases) {
        event.costBases.forEach((cb) => {
          if (cb.category !== 'element1' || cb.definitionId !== 'sale_price') {
            costBase += cb.amount;
          }
        });
      }
      // Add legacy amount for improvements without costBases
      if (event.type === 'improvement' && event.amount && (!event.costBases || event.costBases.length === 0)) {
        costBase += event.amount;
      }
    });

    const proposedSalePrice = (args.proposedSalePrice as number) || property.currentValue || 0;
    const capitalGain = proposedSalePrice - costBase;
    const marginalTaxRate = (args.marginalTaxRate as number) || 37;

    // Check ownership period for 50% discount
    const purchaseDate = new Date(purchaseEvent.date);
    const today = new Date();
    const ownershipMonths = (today.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    const eligibleForDiscount = ownershipMonths >= 12;

    const taxableGain = eligibleForDiscount ? capitalGain * 0.5 : capitalGain;
    const estimatedTax = taxableGain > 0 ? taxableGain * (marginalTaxRate / 100) : 0;

    return {
      success: true,
      data: {
        purchasePrice: purchaseEvent.amount || property.purchasePrice,
        costBase,
        proposedSalePrice,
        capitalGain,
        ownershipMonths: Math.floor(ownershipMonths),
        eligibleForDiscount,
        discountedGain: eligibleForDiscount ? taxableGain : null,
        marginalTaxRate,
        estimatedTax: Math.round(estimatedTax),
        note: capitalGain <= 0 ? 'No CGT payable - capital loss' : undefined,
      },
    };
  }

  // ============================================================================
  // GLOBAL SETTINGS
  // ============================================================================

  private setMarginalTaxRate(args: Record<string, unknown>): unknown {
    const rate = args.rate as number;
    if (rate < 0 || rate > 100) {
      return { success: false, error: 'Tax rate must be between 0 and 100' };
    }

    if (this.context.setMarginalTaxRate) {
      this.context.setMarginalTaxRate(rate);
    }

    return { success: true, message: `Set marginal tax rate to ${rate}%` };
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  private clearAllData(args: Record<string, unknown>): unknown {
    if (!args.confirmed) {
      return { success: false, error: 'Please confirm you want to clear all data' };
    }

    this.context.clearAllData();
    return { success: true, message: 'All data cleared' };
  }

  private async analyzePortfolio(args: Record<string, unknown>): Promise<unknown> {
    if (!args.confirmed) {
      return { success: false, error: 'Please confirm you want to analyze the portfolio' };
    }

    if (this.context.analyzePortfolio) {
      await this.context.analyzePortfolio();
      return { success: true, message: 'Portfolio analysis triggered' };
    }

    return { success: false, error: 'Portfolio analysis not available' };
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  private focusOnProperty(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    if (this.context.selectProperty) {
      this.context.selectProperty(property.id);
    } else if (this.context.setSelectedPropertyId) {
      this.context.setSelectedPropertyId(property.id);
    }

    return { success: true, message: `Focused on ${property.address}` };
  }

  private zoomTimeline(args: Record<string, unknown>): unknown {
    if (args.level) {
      const levelIndex = ZOOM_LEVEL_INDEX[args.level as string];
      if (levelIndex !== undefined && this.context.setZoomByIndex) {
        this.context.setZoomByIndex(levelIndex);
        return { success: true, message: `Set zoom level to ${args.level}` };
      }
    }

    if (args.direction === 'in' && this.context.zoomIn) {
      this.context.zoomIn();
      return { success: true, message: 'Zoomed in' };
    }

    if (args.direction === 'out' && this.context.zoomOut) {
      this.context.zoomOut();
      return { success: true, message: 'Zoomed out' };
    }

    return { success: false, error: 'Invalid zoom operation' };
  }

  private panToDate(args: Record<string, unknown>): unknown {
    const date = new Date(args.date as string);

    if (this.context.panToDate) {
      this.context.panToDate(date);
      return { success: true, message: `Panned to ${date.toLocaleDateString()}` };
    }

    return { success: false, error: 'Pan operation not available' };
  }

  private undoLastAction(): unknown {
    if (this.context.undo) {
      this.context.undo();
      return { success: true, message: 'Undid last action' };
    }
    return { success: false, error: 'Undo not available' };
  }

  private redoLastAction(): unknown {
    if (this.context.redo) {
      this.context.redo();
      return { success: true, message: 'Redid last action' };
    }
    return { success: false, error: 'Redo not available' };
  }
}
