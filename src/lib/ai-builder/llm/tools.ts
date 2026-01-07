// Timeline Tools for LLM Function Calling

import type { Tool } from './types';

export const TIMELINE_TOOLS: Tool[] = [
  {
    name: 'add_property',
    description: `Add a new property to the CGT timeline. This AUTOMATICALLY creates a "purchase" event with cost bases.

IMPORTANT: Include ALL cost bases the user mentions:
- stampDuty: State transfer duty (very common, often $10k-$50k+)
- legalFees: Solicitor/conveyancer fees ($1,500-$5,000)
- buildingInspection: Building inspection fees ($300-$800)
- pestInspection: Pest inspection fees ($200-$400)
- loanEstablishment: Mortgage setup fees (if not claimed as deduction)
- mortgageInsurance: LMI if paid

If user says "bought for $500k plus stamp duty $20k and legal fees $2k", capture ALL these amounts.`,
    parameters: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'Full property address including street, suburb, state and postcode',
        },
        name: {
          type: 'string',
          description: 'Short name for the property (e.g., "Beach House", "Investment Unit")',
        },
        purchaseDate: {
          type: 'string',
          description: 'Purchase date in ISO format (YYYY-MM-DD) or natural language (e.g., "March 2015")',
        },
        purchasePrice: {
          type: 'number',
          description: 'Purchase price in AUD',
        },
        propertyType: {
          type: 'string',
          enum: ['house', 'unit', 'land', 'commercial', 'townhouse', 'apartment'],
          description: 'Type of property',
        },
        isRental: {
          type: 'boolean',
          description: 'Whether this is a rental property the user does not own',
        },
        // Cost base items for purchase
        stampDuty: {
          type: 'number',
          description: 'Stamp duty (transfer duty) paid on purchase - VERY IMPORTANT for CGT',
        },
        legalFees: {
          type: 'number',
          description: 'Legal/conveyancing fees for purchase',
        },
        buildingInspection: {
          type: 'number',
          description: 'Building inspection fees',
        },
        pestInspection: {
          type: 'number',
          description: 'Pest/termite inspection fees',
        },
        valuationFees: {
          type: 'number',
          description: 'Property valuation fees',
        },
        surveyFees: {
          type: 'number',
          description: 'Land survey fees',
        },
        loanEstablishment: {
          type: 'number',
          description: 'Loan establishment fees (only if NOT claimed as tax deduction)',
        },
        mortgageInsurance: {
          type: 'number',
          description: "Lender's mortgage insurance (LMI) premium",
        },
        buyersAgentFees: {
          type: 'number',
          description: "Buyer's agent commission (if used)",
        },
        // Land/building split
        landPrice: {
          type: 'number',
          description: 'Land component of purchase price (if known)',
        },
        buildingPrice: {
          type: 'number',
          description: 'Building component of purchase price (if known)',
        },
        // Dates
        contractDate: {
          type: 'string',
          description: 'Contract exchange date (if different from purchase date)',
        },
        settlementDate: {
          type: 'string',
          description: 'Settlement date (if different from purchase date)',
        },
      },
      required: ['address', 'purchaseDate', 'purchasePrice'],
    },
  },
  {
    name: 'add_event',
    description: `Add an event to an existing property timeline. IMPORTANT: Use propertyId="last" to add events to the most recently created/mentioned property.

Event types and their cost bases:

**move_in**: Owner moves in (status → PPR)
**move_out**: Owner moves out (status → vacant)
  - marketValuation: Get market value if converting PPR to rental (important for CGT!)

**rent_start**: Start renting to tenants (status → rental)
  - marketValuation: If was PPR before, this is the cost base for rental period

**rent_end**: Tenants leave (status → vacant)

**sale**: Property sold (status → sold)
  - amount: Sale price (REQUIRED)
  - agentFees: Real estate agent commission (typically 2-3%)
  - legalFees: Solicitor fees for sale
  - advertisingCosts: Marketing/advertising
  - stagingCosts: Property staging
  - auctionFees: Auctioneer fees
  - contractDate: Contract exchange date

**improvement**: Capital improvements
  - amount: Total cost (REQUIRED)
  - improvementType: kitchen/bathroom/extension/pool/landscaping/etc

**refinance**: Loan refinancing
  - amount: New loan amount
  - valuationFees: If revalued

**status_change**: Manual status change
  - newStatus: ppr/rental/vacant/construction
  - marketValuation: If changing to/from rental

Examples:
- "sold for $1.2M, agent got $30k" → add_event(eventType="sale", amount=1200000, agentFees=30000)
- "moved out in 2020, worth about $900k then" → add_event(eventType="move_out", date="2020-01-01", marketValuation=900000)
- "$80k kitchen reno" → add_event(eventType="improvement", amount=80000, improvementType="kitchen")`,
    parameters: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'ID of the property. Use "last" for most recently mentioned property.',
        },
        propertyAddress: {
          type: 'string',
          description: 'Address of property (fuzzy matched if propertyId not provided)',
        },
        eventType: {
          type: 'string',
          enum: [
            'purchase',
            'move_in',
            'move_out',
            'rent_start',
            'rent_end',
            'sale',
            'improvement',
            'refinance',
            'status_change',
            'living_in_rental_start',
            'living_in_rental_end',
          ],
          description: 'Type of event',
        },
        date: {
          type: 'string',
          description: 'Event date (ISO or natural language)',
        },
        title: {
          type: 'string',
          description: 'Short title (auto-generated if not provided)',
        },
        description: {
          type: 'string',
          description: 'Detailed description',
        },
        amount: {
          type: 'number',
          description: 'Main amount: sale price, improvement cost, etc.',
        },
        newStatus: {
          type: 'string',
          enum: ['ppr', 'rental', 'vacant', 'construction', 'sold', 'living_in_rental'],
          description: 'New status (for status_change events)',
        },
        // Market valuation - critical for PPR→Rental transitions
        marketValuation: {
          type: 'number',
          description: 'Market value at this date. CRITICAL for move_out/rent_start when converting PPR to rental.',
        },
        // Sale cost bases
        agentFees: {
          type: 'number',
          description: 'Real estate agent commission (for sale events)',
        },
        legalFees: {
          type: 'number',
          description: 'Legal/conveyancing fees (for sale events)',
        },
        advertisingCosts: {
          type: 'number',
          description: 'Marketing/advertising costs (for sale events)',
        },
        stagingCosts: {
          type: 'number',
          description: 'Property staging costs (for sale events)',
        },
        auctionFees: {
          type: 'number',
          description: 'Auctioneer fees if sold at auction',
        },
        mortgageDischargeFees: {
          type: 'number',
          description: 'Mortgage discharge fees (for sale events)',
        },
        // Improvement details
        improvementType: {
          type: 'string',
          enum: ['kitchen', 'bathroom', 'whole_house', 'extension', 'pool', 'landscaping', 'garage', 'fencing', 'deck', 'hvac', 'solar', 'structural', 'other'],
          description: 'Type of capital improvement',
        },
        // Dates
        contractDate: {
          type: 'string',
          description: 'Contract date (for sales - may differ from settlement)',
        },
        settlementDate: {
          type: 'string',
          description: 'Settlement date',
        },
        // Valuation
        valuationFees: {
          type: 'number',
          description: 'Property valuation fees',
        },
      },
      required: ['eventType', 'date'],
    },
  },
  {
    name: 'edit_property',
    description: 'Edit an existing property details such as address, name, or purchase information.',
    parameters: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'ID of the property to edit. Use "last" for most recent.',
        },
        propertyAddress: {
          type: 'string',
          description: 'Address of the property (used if propertyId is not provided)',
        },
        updates: {
          type: 'object',
          description: 'Fields to update',
          properties: {
            address: { type: 'string' },
            name: { type: 'string' },
            purchasePrice: { type: 'number' },
            purchaseDate: { type: 'string' },
            currentValue: { type: 'number' },
            salePrice: { type: 'number' },
            saleDate: { type: 'string' },
          },
        },
      },
      required: ['updates'],
    },
  },
  {
    name: 'edit_event',
    description: 'Edit an existing event details such as date, amount, or description.',
    parameters: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'ID of the event to edit. Use "last" for most recent.',
        },
        propertyAddress: {
          type: 'string',
          description: 'Address of the property the event belongs to',
        },
        eventType: {
          type: 'string',
          description: 'Type of event to find (if eventId not provided)',
        },
        updates: {
          type: 'object',
          description: 'Fields to update',
          properties: {
            date: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            amount: { type: 'number' },
            newStatus: { type: 'string' },
          },
        },
      },
      required: ['updates'],
    },
  },
  {
    name: 'delete_property',
    description: 'Delete a property and all its events from the timeline. Always confirm with user before deleting.',
    parameters: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'ID of the property to delete',
        },
        propertyAddress: {
          type: 'string',
          description: 'Address of the property to delete',
        },
        confirmed: {
          type: 'boolean',
          description: 'Whether the user has confirmed the deletion',
        },
      },
      required: ['confirmed'],
    },
  },
  {
    name: 'delete_event',
    description: 'Delete an event from a property timeline.',
    parameters: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'ID of the event to delete',
        },
        propertyAddress: {
          type: 'string',
          description: 'Address of the property the event belongs to',
        },
        eventType: {
          type: 'string',
          description: 'Type of event to delete',
        },
        eventDate: {
          type: 'string',
          description: 'Date of the event to delete',
        },
      },
    },
  },
  {
    name: 'undo_action',
    description: 'Undo the last action performed on the timeline.',
    parameters: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: 'Number of actions to undo (default: 1)',
        },
      },
    },
  },
  {
    name: 'redo_action',
    description: 'Redo a previously undone action.',
    parameters: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: 'Number of actions to redo (default: 1)',
        },
      },
    },
  },
  {
    name: 'get_timeline_summary',
    description: 'Get a summary of the current timeline including all properties and their events.',
    parameters: {
      type: 'object',
      properties: {
        includeEvents: {
          type: 'boolean',
          description: 'Whether to include event details',
        },
      },
    },
  },
  {
    name: 'calculate_cgt',
    description: 'Calculate Capital Gains Tax for a specific property or the entire portfolio.',
    parameters: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'ID of the property to calculate CGT for. Omit for entire portfolio.',
        },
        propertyAddress: {
          type: 'string',
          description: 'Address of the property',
        },
      },
    },
  },
  {
    name: 'add_cost_base_item',
    description: 'Add a cost base item to a property event (e.g., stamp duty, legal fees, improvements).',
    parameters: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'ID of the event to add cost base to',
        },
        propertyAddress: {
          type: 'string',
          description: 'Address of the property',
        },
        itemType: {
          type: 'string',
          enum: [
            'stamp_duty',
            'legal_fees',
            'agent_fees',
            'valuation_fees',
            'improvement_cost',
            'advertising_costs',
            'loan_establishment',
            'conveyancing_fees',
            'building_inspection',
            'pest_inspection',
            'survey_fees',
            'council_rates',
            'insurance',
            'body_corporate_fees',
            'custom',
          ],
          description: 'Type of cost base item',
        },
        name: {
          type: 'string',
          description: 'Custom name for the cost base item',
        },
        amount: {
          type: 'number',
          description: 'Amount in AUD',
        },
        description: {
          type: 'string',
          description: 'Description of the cost',
        },
      },
      required: ['amount'],
    },
  },
  {
    name: 'search_property',
    description: 'Search for a property by address or name.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (address or name)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'set_property_status',
    description: 'Set the current status of a property.',
    parameters: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'ID of the property',
        },
        propertyAddress: {
          type: 'string',
          description: 'Address of the property',
        },
        status: {
          type: 'string',
          enum: ['ppr', 'rental', 'vacant', 'construction', 'sold', 'living_in_rental'],
          description: 'New status for the property',
        },
        effectiveDate: {
          type: 'string',
          description: 'Date the status change takes effect',
        },
      },
      required: ['status'],
    },
  },
];

export function getToolByName(name: string): Tool | undefined {
  return TIMELINE_TOOLS.find((tool) => tool.name === name);
}

export function getToolNames(): string[] {
  return TIMELINE_TOOLS.map((tool) => tool.name);
}
