/**
 * Timeline Tools for OpenAI Realtime API
 *
 * These tools allow the AI to perform all timeline operations via voice commands.
 */

import type { RealtimeTool } from './OpenAIRealtimeClient';
import type { TimelineAction, ActionType } from '@/types/ai-builder';
import type { Property, TimelineEvent, EventType, PropertyStatus } from '@/store/timeline';

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

export const REALTIME_TIMELINE_TOOLS: RealtimeTool[] = [
  // Property Operations
  {
    type: 'function',
    name: 'add_property',
    description: 'Add a new property to the timeline. Use this when the user wants to add a property to track for CGT purposes.',
    parameters: {
      type: 'object',
      properties: {
        address: {
          type: 'string',
          description: 'The full address of the property (e.g., "123 Main Street, Sydney NSW 2000")',
        },
        purchaseDate: {
          type: 'string',
          description: 'The purchase date in ISO format (YYYY-MM-DD)',
        },
        purchasePrice: {
          type: 'number',
          description: 'The purchase price in AUD',
        },
        propertyType: {
          type: 'string',
          description: 'The type of property',
          enum: ['house', 'apartment', 'unit', 'townhouse', 'land', 'commercial', 'other'],
        },
        initialStatus: {
          type: 'string',
          description: 'The initial status when property was acquired',
          enum: ['ppr', 'rental', 'vacant'],
        },
      },
      required: ['address', 'purchaseDate', 'purchasePrice'],
    },
  },
  {
    type: 'function',
    name: 'update_property',
    description: 'Update an existing property details. Use this to modify property information.',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property to update (used to find the property)',
        },
        newAddress: {
          type: 'string',
          description: 'New address if changing',
        },
        propertyType: {
          type: 'string',
          description: 'New property type',
          enum: ['house', 'apartment', 'unit', 'townhouse', 'land', 'commercial', 'other'],
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

  // Event Operations
  {
    type: 'function',
    name: 'add_event',
    description: 'Add an event to a property timeline. Events include purchase, sale, move in/out, renting, improvements, etc.',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property to add the event to',
        },
        eventType: {
          type: 'string',
          description: 'The type of event',
          enum: [
            'purchase',
            'sale',
            'move_in',
            'move_out',
            'rent_start',
            'rent_end',
            'improvement',
            'refinance',
            'status_change',
          ],
        },
        date: {
          type: 'string',
          description: 'The date of the event in ISO format (YYYY-MM-DD)',
        },
        amount: {
          type: 'number',
          description: 'The amount in AUD (for purchase, sale, improvement events)',
        },
        description: {
          type: 'string',
          description: 'Description or notes about the event',
        },
        newStatus: {
          type: 'string',
          description: 'For status_change events, the new status',
          enum: ['ppr', 'rental', 'vacant', 'construction'],
        },
      },
      required: ['propertyAddress', 'eventType', 'date'],
    },
  },
  {
    type: 'function',
    name: 'update_event',
    description: 'Update an existing event on a property timeline.',
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
          description: 'The date of the event to update (to identify it)',
        },
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
          description: 'The date of the event to delete',
        },
      },
      required: ['propertyAddress', 'eventType', 'eventDate'],
    },
  },

  // Query Operations
  {
    type: 'function',
    name: 'get_timeline_summary',
    description: 'Get a summary of all properties and events in the timeline. Use this to understand the current state.',
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
    type: 'function',
    name: 'get_property_details',
    description: 'Get detailed information about a specific property including all its events.',
    parameters: {
      type: 'object',
      properties: {
        propertyAddress: {
          type: 'string',
          description: 'The address of the property',
        },
      },
      required: ['propertyAddress'],
    },
  },

  // Bulk Operations
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
    name: 'load_demo_data',
    description: 'Load demo data to show example properties and events.',
    parameters: {
      type: 'object',
      properties: {
        confirmed: {
          type: 'boolean',
          description: 'Must be true to confirm loading demo data',
        },
      },
      required: ['confirmed'],
    },
  },

  // Navigation
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
    description: 'Zoom the timeline in or out.',
    parameters: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          description: 'Zoom direction',
          enum: ['in', 'out'],
        },
      },
      required: ['direction'],
    },
  },
];

// ============================================================================
// SYSTEM INSTRUCTIONS
// ============================================================================

export const TIMELINE_SYSTEM_INSTRUCTIONS = `You are an AI assistant for CGT Brain, a Capital Gains Tax timeline management application for Australian properties. Your role is to help users build and manage their property timelines through natural voice conversation.

## Your Capabilities

You can help users with:
1. **Adding Properties**: Create new property entries with purchase details
2. **Recording Events**: Add timeline events like move-in/out, renting, improvements, sales
3. **Updating Information**: Modify existing property or event details
4. **Querying Data**: Provide summaries and details about the timeline
5. **Navigation**: Focus on specific properties or adjust the view

## Important CGT Concepts

- **PPR (Principal Place of Residence)**: The main home where the owner lives - generally CGT exempt
- **Rental Property**: Property rented to tenants - subject to CGT
- **6-Year Absence Rule**: A PPR can be rented for up to 6 years while maintaining CGT exemption
- **Cost Base**: Includes purchase price, stamp duty, legal fees, and capital improvements

## Conversation Style

- Be conversational and helpful
- Confirm important actions before executing
- When adding properties or events, summarize what you're about to do
- If information is missing, ask for clarification
- Use Australian English spelling and conventions
- Express amounts in AUD without needing to specify the currency

## Event Types

- **purchase**: When the property was bought
- **sale**: When the property was sold
- **move_in**: When the owner moved into the property
- **move_out**: When the owner moved out
- **rent_start**: When the property started being rented
- **rent_end**: When tenants moved out
- **improvement**: Capital improvements (renovations, additions)
- **refinance**: Mortgage refinancing
- **status_change**: Change in property status

## Response Guidelines

1. Always acknowledge the user's request
2. Use the appropriate function to fulfill the request
3. Provide a brief confirmation of what was done
4. Ask if there's anything else you can help with

Remember: You're helping Australian property owners manage their CGT obligations. Be accurate with dates and amounts, and always prioritize clarity in your responses.`;

// ============================================================================
// TOOL EXECUTOR
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
  loadDemoData?: () => void;
  setSelectedPropertyId?: (id: string | null) => void;
  zoomIn?: () => void;
  zoomOut?: () => void;
}

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
    console.log('Executing tool:', name, args);

    switch (name) {
      case 'add_property':
        return this.addProperty(args);
      case 'update_property':
        return this.updateProperty(args);
      case 'delete_property':
        return this.deleteProperty(args);
      case 'add_event':
        return this.addEvent(args);
      case 'update_event':
        return this.updateEvent(args);
      case 'delete_event':
        return this.deleteEvent(args);
      case 'get_timeline_summary':
        return this.getTimelineSummary(args);
      case 'get_property_details':
        return this.getPropertyDetails(args);
      case 'clear_all_data':
        return this.clearAllData(args);
      case 'load_demo_data':
        return this.loadDemoData(args);
      case 'focus_on_property':
        return this.focusOnProperty(args);
      case 'zoom_timeline':
        return this.zoomTimeline(args);
      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  }

  private findPropertyByAddress(address: string): Property | undefined {
    const normalizedSearch = address.toLowerCase().trim();
    return this.context.properties.find(
      (p) => p.address.toLowerCase().includes(normalizedSearch) ||
             normalizedSearch.includes(p.address.toLowerCase())
    );
  }

  private addProperty(args: Record<string, unknown>): unknown {
    try {
      const address = args.address as string;
      const purchaseDate = new Date(args.purchaseDate as string);
      const purchasePrice = args.purchasePrice as number;
      const initialStatus = (args.initialStatus as PropertyStatus) || 'ppr';

      const property = {
        name: address.split(',')[0].trim(), // Use first part of address as name
        address: address,
        purchaseDate: purchaseDate,
        purchasePrice: purchasePrice,
        currentStatus: initialStatus,
        color: this.generatePropertyColor(),
      };

      this.context.addProperty(property);

      // Also add purchase event
      const newProperty = this.context.properties[this.context.properties.length - 1];
      if (newProperty) {
        this.context.addEvent({
          propertyId: newProperty.id,
          type: 'purchase',
          date: purchaseDate,
          title: 'Purchase',
          amount: purchasePrice,
          description: `Purchased for $${purchasePrice.toLocaleString()}`,
          color: '#10B981', // Green for purchase
          position: 0,
        });
      }

      return {
        success: true,
        message: `Added property at ${property.address}`,
        propertyId: newProperty?.id,
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  private updateProperty(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    const updates: Partial<Property> = {};
    if (args.newAddress) {
      updates.address = args.newAddress as string;
      updates.name = (args.newAddress as string).split(',')[0].trim();
    }

    this.context.updateProperty(property.id, updates);
    return { success: true, message: `Updated property at ${property.address}` };
  }

  private deleteProperty(args: Record<string, unknown>): unknown {
    if (!args.confirmed) {
      return { success: false, error: 'Deletion not confirmed' };
    }

    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    // Delete all events for this property first
    const propertyEvents = this.context.events.filter((e) => e.propertyId === property.id);
    propertyEvents.forEach((e) => this.context.deleteEvent(e.id));

    this.context.deleteProperty(property.id);
    return { success: true, message: `Deleted property at ${property.address}` };
  }

  private addEvent(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    const eventType = args.eventType as EventType;
    const event = {
      propertyId: property.id,
      type: eventType,
      date: new Date(args.date as string),
      title: this.getEventTitle(eventType),
      color: this.getEventColor(eventType),
      position: 0,
      amount: args.amount as number | undefined,
      description: args.description as string | undefined,
      newStatus: args.newStatus as PropertyStatus | undefined,
    };

    this.context.addEvent(event);
    return {
      success: true,
      message: `Added ${event.type} event to ${property.address}`,
    };
  }

  private getEventTitle(type: EventType): string {
    const titles: Record<EventType, string> = {
      purchase: 'Purchase',
      sale: 'Sale',
      move_in: 'Move In',
      move_out: 'Move Out',
      rent_start: 'Rent Start',
      rent_end: 'Rent End',
      improvement: 'Improvement',
      refinance: 'Refinance',
      status_change: 'Status Change',
      vacant_start: 'Vacant Start',
      vacant_end: 'Vacant End',
      custom: 'Custom Event',
    };
    return titles[type] || type;
  }

  private getEventColor(type: EventType): string {
    const colors: Record<EventType, string> = {
      purchase: '#10B981',      // Green
      sale: '#EF4444',          // Red
      move_in: '#3B82F6',       // Blue
      move_out: '#6B7280',      // Gray
      rent_start: '#8B5CF6',    // Purple
      rent_end: '#6B7280',      // Gray
      improvement: '#F59E0B',   // Amber
      refinance: '#06B6D4',     // Cyan
      status_change: '#EC4899', // Pink
      vacant_start: '#9CA3AF',  // Gray
      vacant_end: '#6B7280',    // Gray
      custom: '#64748B',        // Slate
    };
    return colors[type] || '#6B7280';
  }

  private updateEvent(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    const eventDate = new Date(args.eventDate as string);
    const event = this.context.events.find(
      (e) =>
        e.propertyId === property.id &&
        e.type === args.eventType &&
        Math.abs(new Date(e.date).getTime() - eventDate.getTime()) < 86400000 // Within 1 day
    );

    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    const updates: Partial<TimelineEvent> = {};
    if (args.newDate) updates.date = new Date(args.newDate as string);
    if (args.newAmount !== undefined) updates.amount = args.newAmount as number;
    if (args.newDescription) updates.description = args.newDescription as string;

    this.context.updateEvent(event.id, updates);
    return { success: true, message: 'Event updated' };
  }

  private deleteEvent(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    const eventDate = new Date(args.eventDate as string);
    const event = this.context.events.find(
      (e) =>
        e.propertyId === property.id &&
        e.type === args.eventType &&
        Math.abs(new Date(e.date).getTime() - eventDate.getTime()) < 86400000
    );

    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    this.context.deleteEvent(event.id);
    return { success: true, message: `Deleted ${event.type} event` };
  }

  private getTimelineSummary(args: Record<string, unknown>): unknown {
    const includeEvents = args.includeEvents !== false;

    const summary = {
      totalProperties: this.context.properties.length,
      totalEvents: this.context.events.length,
      properties: this.context.properties.map((p) => {
        const propertyEvents = this.context.events.filter((e) => e.propertyId === p.id);
        const result: Record<string, unknown> = {
          address: p.address,
          status: p.currentStatus,
          purchaseDate: p.purchaseDate,
          purchasePrice: p.purchasePrice,
          eventCount: propertyEvents.length,
        };

        if (includeEvents) {
          result.events = propertyEvents.map((e) => ({
            type: e.type,
            date: e.date,
            amount: e.amount,
            description: e.description,
          }));
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

    return {
      success: true,
      data: {
        ...property,
        events: propertyEvents,
      },
    };
  }

  private clearAllData(args: Record<string, unknown>): unknown {
    if (!args.confirmed) {
      return { success: false, error: 'Please confirm you want to clear all data' };
    }

    this.context.clearAllData();
    return { success: true, message: 'All data cleared' };
  }

  private loadDemoData(args: Record<string, unknown>): unknown {
    if (!args.confirmed) {
      return { success: false, error: 'Please confirm you want to load demo data' };
    }

    if (this.context.loadDemoData) {
      this.context.loadDemoData();
      return { success: true, message: 'Demo data loaded' };
    }

    return { success: false, error: 'Demo data loading not available' };
  }

  private focusOnProperty(args: Record<string, unknown>): unknown {
    const property = this.findPropertyByAddress(args.propertyAddress as string);
    if (!property) {
      return { success: false, error: `Property not found: ${args.propertyAddress}` };
    }

    if (this.context.setSelectedPropertyId) {
      this.context.setSelectedPropertyId(property.id);
    }

    return { success: true, message: `Focused on ${property.address}` };
  }

  private zoomTimeline(args: Record<string, unknown>): unknown {
    const direction = args.direction as string;

    if (direction === 'in' && this.context.zoomIn) {
      this.context.zoomIn();
    } else if (direction === 'out' && this.context.zoomOut) {
      this.context.zoomOut();
    }

    return { success: true, message: `Zoomed ${direction}` };
  }

  private generatePropertyColor(): string {
    const colors = [
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#EC4899', // Pink
      '#06B6D4', // Cyan
      '#F97316', // Orange
    ];
    return colors[this.context.properties.length % colors.length];
  }
}
