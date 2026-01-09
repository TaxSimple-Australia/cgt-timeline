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

  // ============================================================================
  // TIMELINE NAVIGATION & VISUALIZATION TOOLS
  // ============================================================================
  {
    name: 'zoom_timeline',
    description: `Control timeline zoom level. Use to help user see more or less detail.

Zoom levels (from widest to most detailed):
- "30-years": See 30+ years at once
- "decade": See about 10 years
- "multi-year": See 5-10 years
- "years": See 2-5 years
- "year": See 1-2 years
- "months": See 6-12 months
- "month": See 3-6 months
- "weeks": See 1-3 months
- "days": See less than 1 month

Examples:
- "zoom in" → direction="in"
- "show me the whole timeline" → level="30-years"
- "focus on 2020" → direction="in" + use pan_to_date`,
    parameters: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: ['in', 'out'],
          description: 'Zoom in for more detail, out for wider view',
        },
        level: {
          type: 'string',
          enum: ['30-years', 'decade', 'multi-year', 'years', 'year', 'months', 'month', 'weeks', 'days'],
          description: 'Set specific zoom level directly',
        },
        centerOnDate: {
          type: 'string',
          description: 'Date to center the view on after zooming (ISO format)',
        },
      },
    },
  },
  {
    name: 'pan_to_date',
    description: `Navigate/scroll the timeline to center on a specific date. Use when user wants to see a particular time period.

Examples:
- "show me 2018" → date="2018-06-01"
- "go to when I bought it" → Use purchase date of property
- "jump to the sale" → Use sale date of property`,
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date to center the timeline on (ISO format or natural language)',
        },
        propertyId: {
          type: 'string',
          description: 'If provided, pan to this property\'s key event',
        },
      },
      required: ['date'],
    },
  },
  {
    name: 'focus_on_property',
    description: 'Select and focus the timeline view on a specific property. Centers view on property\'s events.',
    parameters: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'ID of property to focus on. Use "last" for most recent.',
        },
        propertyAddress: {
          type: 'string',
          description: 'Address of property to focus on',
        },
      },
    },
  },
  {
    name: 'focus_on_event',
    description: 'Select and focus the timeline view on a specific event. Zooms and pans to show the event.',
    parameters: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'ID of event to focus on. Use "last" for most recent.',
        },
        propertyAddress: {
          type: 'string',
          description: 'Address of property containing the event',
        },
        eventType: {
          type: 'string',
          description: 'Type of event to focus on (finds first matching)',
        },
      },
    },
  },

  // ============================================================================
  // DATA OPERATIONS
  // ============================================================================
  {
    name: 'clear_all_data',
    description: `Clear ALL data from the timeline (all properties, events, analysis). DESTRUCTIVE - always confirm with user first!

Only use when user explicitly asks to:
- "clear everything"
- "start fresh"
- "delete all properties"
- "reset the timeline"`,
    parameters: {
      type: 'object',
      properties: {
        confirmed: {
          type: 'boolean',
          description: 'Must be true - user must explicitly confirm they want to delete everything',
        },
      },
      required: ['confirmed'],
    },
  },
  {
    name: 'load_demo_data',
    description: `Load sample/demo data into the timeline. Useful for:
- Showing examples of how timelines work
- Testing features
- Training users

Replaces current data with demo properties and events.`,
    parameters: {
      type: 'object',
      properties: {
        confirmed: {
          type: 'boolean',
          description: 'Confirm loading demo data (will replace current data)',
        },
      },
    },
  },
  {
    name: 'export_timeline_data',
    description: 'Export the current timeline as JSON data. Returns the full timeline structure that can be saved or shared.',
    parameters: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['json', 'summary'],
          description: 'Export format: json for full data, summary for readable overview',
        },
        includeAnalysis: {
          type: 'boolean',
          description: 'Whether to include CGT analysis results in export',
        },
      },
    },
  },
  {
    name: 'import_timeline_data',
    description: `Import timeline data from JSON. Use when user provides timeline data to load.

Accepts two formats:
1. Simple: { properties: [...], events: [...] }
2. Export: { properties: [{ address, property_history: [...] }] }`,
    parameters: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          description: 'The timeline data object to import',
        },
        merge: {
          type: 'boolean',
          description: 'If true, merge with existing data. If false, replace all data.',
        },
      },
      required: ['data'],
    },
  },

  // ============================================================================
  // ENHANCED PROPERTY OPERATIONS
  // ============================================================================
  {
    name: 'duplicate_property',
    description: 'Create a copy of an existing property with all its events. Useful for creating similar properties or what-if scenarios.',
    parameters: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'ID of property to duplicate',
        },
        propertyAddress: {
          type: 'string',
          description: 'Address of property to duplicate',
        },
        newAddress: {
          type: 'string',
          description: 'Address for the new property copy',
        },
        newName: {
          type: 'string',
          description: 'Name for the new property copy',
        },
      },
      required: ['newAddress'],
    },
  },
  {
    name: 'get_property_details',
    description: 'Get complete details of a property including all events, cost bases, status periods, and calculated values.',
    parameters: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'ID of property. Use "last" for most recent.',
        },
        propertyAddress: {
          type: 'string',
          description: 'Address of property',
        },
        includeEvents: {
          type: 'boolean',
          description: 'Include full event details (default: true)',
        },
        includeCostBases: {
          type: 'boolean',
          description: 'Include cost base breakdown (default: true)',
        },
        includeStatusPeriods: {
          type: 'boolean',
          description: 'Include status period calculations (default: true)',
        },
      },
    },
  },

  // ============================================================================
  // ENHANCED EVENT OPERATIONS
  // ============================================================================
  {
    name: 'move_event',
    description: `Move an event to a new date. This is like dragging an event on the timeline.

IMPORTANT: For sale events, this also updates contractDate and settlementDate to stay in sync.

Examples:
- "move the sale to December" → Move sale event to new date
- "change the move-in to March 2016" → Update move_in event date`,
    parameters: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'ID of event to move. Use "last" for most recent.',
        },
        propertyAddress: {
          type: 'string',
          description: 'Address of property containing the event',
        },
        eventType: {
          type: 'string',
          description: 'Type of event to find (if eventId not provided)',
        },
        newDate: {
          type: 'string',
          description: 'New date for the event (ISO format or natural language)',
        },
      },
      required: ['newDate'],
    },
  },
  {
    name: 'duplicate_event',
    description: 'Create a copy of an existing event. Useful for adding similar events or creating templates.',
    parameters: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'ID of event to duplicate',
        },
        propertyAddress: {
          type: 'string',
          description: 'Address of property containing the event',
        },
        eventType: {
          type: 'string',
          description: 'Type of event to duplicate',
        },
        newDate: {
          type: 'string',
          description: 'Date for the duplicate event (defaults to same date)',
        },
        targetPropertyId: {
          type: 'string',
          description: 'Copy event to a different property (optional)',
        },
      },
    },
  },
  {
    name: 'get_event_details',
    description: 'Get complete details of a specific event including all cost bases and metadata.',
    parameters: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'ID of event. Use "last" for most recent.',
        },
        propertyAddress: {
          type: 'string',
          description: 'Address of property containing the event',
        },
        eventType: {
          type: 'string',
          description: 'Type of event to find',
        },
      },
    },
  },

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================
  {
    name: 'bulk_add_events',
    description: `Add multiple events at once. Efficient for building complete property timelines.

Example: Add purchase, move-in, renovations, and sale all at once for a property.`,
    parameters: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'ID of property. Use "last" for most recent.',
        },
        propertyAddress: {
          type: 'string',
          description: 'Address of property',
        },
        events: {
          type: 'array',
          description: 'Array of events to add',
          items: {
            type: 'object',
            properties: {
              eventType: { type: 'string' },
              date: { type: 'string' },
              amount: { type: 'number' },
              description: { type: 'string' },
              newStatus: { type: 'string' },
              marketValuation: { type: 'number' },
            },
          },
        },
      },
      required: ['events'],
    },
  },
  {
    name: 'bulk_delete_events',
    description: 'Delete multiple events at once. Requires confirmation.',
    parameters: {
      type: 'object',
      properties: {
        eventIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of event IDs to delete',
        },
        propertyAddress: {
          type: 'string',
          description: 'Delete all events for this property (alternative to eventIds)',
        },
        eventTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Delete all events of these types from property',
        },
        confirmed: {
          type: 'boolean',
          description: 'User must confirm bulk deletion',
        },
      },
      required: ['confirmed'],
    },
  },

  // ============================================================================
  // COST BASE OPERATIONS
  // ============================================================================
  {
    name: 'update_cost_base_item',
    description: 'Update an existing cost base item on an event.',
    parameters: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'ID of event containing the cost base',
        },
        costBaseId: {
          type: 'string',
          description: 'ID of the cost base item to update',
        },
        updates: {
          type: 'object',
          description: 'Fields to update',
          properties: {
            name: { type: 'string' },
            amount: { type: 'number' },
            description: { type: 'string' },
          },
        },
      },
      required: ['eventId', 'costBaseId', 'updates'],
    },
  },
  {
    name: 'delete_cost_base_item',
    description: 'Remove a cost base item from an event.',
    parameters: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'ID of event containing the cost base',
        },
        costBaseId: {
          type: 'string',
          description: 'ID of the cost base item to delete',
        },
        costBaseName: {
          type: 'string',
          description: 'Name of cost base to delete (if ID not known)',
        },
      },
      required: ['eventId'],
    },
  },
  {
    name: 'get_cost_base_summary',
    description: 'Get a breakdown of all cost bases for a property or event, organized by CGT element.',
    parameters: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'Get cost bases for entire property',
        },
        propertyAddress: {
          type: 'string',
          description: 'Address of property',
        },
        eventId: {
          type: 'string',
          description: 'Get cost bases for specific event only',
        },
      },
    },
  },

  // ============================================================================
  // UI STATE OPERATIONS
  // ============================================================================
  {
    name: 'toggle_theme',
    description: 'Switch between light and dark theme for the timeline display.',
    parameters: {
      type: 'object',
      properties: {
        theme: {
          type: 'string',
          enum: ['light', 'dark', 'toggle'],
          description: 'Set specific theme or toggle current',
        },
      },
    },
  },
  {
    name: 'toggle_event_display',
    description: 'Switch between circle and card display mode for events on the timeline.',
    parameters: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: ['circle', 'card', 'toggle'],
          description: 'Set specific mode or toggle current',
        },
      },
    },
  },
  {
    name: 'select_property',
    description: 'Select a property in the UI to highlight it and show its details panel.',
    parameters: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'ID of property to select. Use null to deselect.',
        },
        propertyAddress: {
          type: 'string',
          description: 'Address of property to select',
        },
      },
    },
  },
  {
    name: 'select_event',
    description: 'Select an event in the UI to highlight it and show its details.',
    parameters: {
      type: 'object',
      properties: {
        eventId: {
          type: 'string',
          description: 'ID of event to select. Use null to deselect.',
        },
        propertyAddress: {
          type: 'string',
          description: 'Address of property containing event',
        },
        eventType: {
          type: 'string',
          description: 'Type of event to select',
        },
      },
    },
  },

  // ============================================================================
  // VERIFICATION & ANALYSIS
  // ============================================================================
  {
    name: 'get_verification_alerts',
    description: 'Get current verification alerts and timeline issues that need user attention.',
    parameters: {
      type: 'object',
      properties: {
        includeResolved: {
          type: 'boolean',
          description: 'Include already resolved alerts',
        },
      },
    },
  },
  {
    name: 'resolve_verification_alert',
    description: 'Provide an answer to a verification question/alert to resolve the timeline issue.',
    parameters: {
      type: 'object',
      properties: {
        alertId: {
          type: 'string',
          description: 'ID of the alert to resolve',
        },
        response: {
          type: 'string',
          description: 'User\'s response/answer to the verification question',
        },
        selectedOption: {
          type: 'string',
          description: 'Selected option if alert has predefined choices',
        },
      },
      required: ['alertId', 'response'],
    },
  },
  {
    name: 'get_analysis_results',
    description: 'Get the current CGT analysis results if available.',
    parameters: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'Get results for specific property only',
        },
        format: {
          type: 'string',
          enum: ['summary', 'detailed', 'json'],
          description: 'Level of detail to return',
        },
      },
    },
  },

  // ============================================================================
  // TIMELINE NOTES
  // ============================================================================
  {
    name: 'set_timeline_notes',
    description: 'Add or update notes/comments for the entire timeline. Useful for recording assumptions, reminders, or context.',
    parameters: {
      type: 'object',
      properties: {
        notes: {
          type: 'string',
          description: 'The notes content',
        },
        append: {
          type: 'boolean',
          description: 'If true, append to existing notes. If false, replace.',
        },
      },
      required: ['notes'],
    },
  },
  {
    name: 'get_timeline_notes',
    description: 'Get the current notes/comments saved for the timeline.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },

  // ============================================================================
  // HISTORY OPERATIONS
  // ============================================================================
  {
    name: 'get_action_history',
    description: 'Get the history of actions performed on the timeline. Shows what can be undone/redone.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of history entries to return',
        },
        includeRedoStack: {
          type: 'boolean',
          description: 'Include actions that can be redone',
        },
      },
    },
  },

  // ============================================================================
  // CUSTOM EVENT (ENHANCED)
  // ============================================================================
  {
    name: 'add_custom_event',
    description: `Add a custom event with full control over all options. Use when standard event types don't fit.

Features:
- Custom title and description
- Custom color from palette
- Optional status change
- Any cost bases from all 5 CGT elements

Example: "Add a note that we got council approval in May 2019"
→ Custom event with title "Council Approval", no status change, no amount`,
    parameters: {
      type: 'object',
      properties: {
        propertyId: {
          type: 'string',
          description: 'ID of property. Use "last" for most recent.',
        },
        propertyAddress: {
          type: 'string',
          description: 'Address of property',
        },
        date: {
          type: 'string',
          description: 'Event date (ISO format or natural language)',
        },
        title: {
          type: 'string',
          description: 'Event title (required for custom events)',
        },
        description: {
          type: 'string',
          description: 'Detailed description',
        },
        amount: {
          type: 'number',
          description: 'Optional amount',
        },
        color: {
          type: 'string',
          enum: ['red', 'orange', 'amber', 'lime', 'emerald', 'cyan', 'blue', 'indigo', 'violet', 'pink', 'gray', 'dark'],
          description: 'Event color',
        },
        affectsStatus: {
          type: 'boolean',
          description: 'Does this event change property status?',
        },
        newStatus: {
          type: 'string',
          enum: ['ppr', 'rental', 'vacant', 'construction', 'sold'],
          description: 'New status if affectsStatus is true',
        },
        costBases: {
          type: 'array',
          description: 'Cost base items to add',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              amount: { type: 'number' },
              category: {
                type: 'string',
                enum: ['first_element', 'incidental_acquire', 'capital_improvements', 'incidental_ownership', 'selling_costs'],
              },
            },
          },
        },
      },
      required: ['date', 'title'],
    },
  },

  // ============================================================================
  // SETTINGS & PREFERENCES
  // ============================================================================
  {
    name: 'update_timeline_settings',
    description: 'Update timeline settings and preferences.',
    parameters: {
      type: 'object',
      properties: {
        lockFutureDates: {
          type: 'boolean',
          description: 'Prevent panning/events beyond today',
        },
        enableDragEvents: {
          type: 'boolean',
          description: 'Allow dragging events to change dates',
        },
        enableAISuggestedQuestions: {
          type: 'boolean',
          description: 'Show AI-suggested questions',
        },
        apiResponseMode: {
          type: 'string',
          enum: ['markdown', 'json'],
          description: 'CGT analysis response format preference',
        },
      },
    },
  },
];

export function getToolByName(name: string): Tool | undefined {
  return TIMELINE_TOOLS.find((tool) => tool.name === name);
}

export function getToolNames(): string[] {
  return TIMELINE_TOOLS.map((tool) => tool.name);
}
