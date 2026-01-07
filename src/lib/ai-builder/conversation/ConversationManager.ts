// Conversation Manager - Orchestrates AI conversations
// NOTE: This runs on the CLIENT - all LLM calls go through /api/ai-builder/chat

import type {
  ConversationState,
  ConversationContext,
  ConversationMessage,
  TimelineAction,
} from '@/types/ai-builder';
import type { ChatMessage, ToolCall, MessageAttachment } from '../llm/types';
import { TIMELINE_TOOLS } from '../llm/tools';
import { getContextualSystemPrompt, ERROR_RECOVERY_PROMPTS } from './systemPrompt';
import type { Property, TimelineEvent, CostBaseItem } from '@/store/timeline';
import type { CostBaseCategory } from '@/lib/cost-base-definitions';

export interface ConversationManagerConfig {
  llmProvider: string;
  onMessage: (message: ConversationMessage) => void;
  onAction: (action: TimelineAction) => void;
  onStateChange: (state: ConversationState) => void;
  getProperties: () => Property[];
  getEvents: () => TimelineEvent[];
  executeAction: (action: TimelineAction) => Promise<void>;
}

export class ConversationManager {
  private config: ConversationManagerConfig;
  private context: ConversationContext;
  private messageHistory: ChatMessage[] = [];
  private lastPropertyId: string | null = null;
  private lastEventId: string | null = null;

  constructor(config: ConversationManagerConfig) {
    this.config = config;
    this.context = this.createInitialContext();
  }

  private createInitialContext(): ConversationContext {
    return {
      state: 'idle',
      history: [],
      currentIntent: null,
      pendingActions: [],
      lastProperty: null,
      lastEvent: null,
      confirmationRequired: false,
      errorCount: 0,
    };
  }

  private setState(state: ConversationState): void {
    this.context.state = state;
    this.config.onStateChange(state);
  }

  getState(): ConversationState {
    return this.context.state;
  }

  getContext(): ConversationContext {
    return this.context;
  }

  private createMessage(
    role: 'user' | 'assistant' | 'system',
    content: string,
    isVoice = false
  ): ConversationMessage {
    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      role,
      content,
      timestamp: new Date(),
      isVoice,
    };
  }

  private getSystemPrompt(): string {
    const properties = this.config.getProperties();
    const events = this.config.getEvents();

    // Build rich property context with all relevant details
    const propertyList = properties.map((p) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      purchasePrice: p.purchasePrice,
      purchaseDate: p.purchaseDate?.toISOString().split('T')[0],
      currentStatus: p.currentStatus,
      salePrice: p.salePrice,
      saleDate: p.saleDate?.toISOString().split('T')[0],
    }));

    // Get ALL events sorted by date (oldest first for proper timeline view)
    const allEvents = events
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((e) => {
        const property = properties.find(p => p.id === e.propertyId);
        return {
          id: e.id,
          type: e.type,
          propertyId: e.propertyId,
          propertyAddress: property?.address,
          date: e.date.toISOString().split('T')[0],
          amount: e.amount,
          title: e.title,
        };
      });

    return getContextualSystemPrompt(propertyList, allEvents);
  }

  async processUserInput(
    input: string,
    isVoice = false,
    attachments?: MessageAttachment[]
  ): Promise<string> {
    if (!input.trim() && (!attachments || attachments.length === 0)) {
      return '';
    }

    this.setState('processing');

    // Build attachment description for display in conversation history
    let displayContent = input;
    if (attachments && attachments.length > 0) {
      const attachmentNames = attachments.map(a => `📎 ${a.name}`).join(', ');
      displayContent = attachments.length > 0
        ? `${attachmentNames}\n\n${input || 'Please analyze these files.'}`
        : input;
    }

    // Add user message to history
    const userMessage = this.createMessage('user', displayContent, isVoice);
    this.context.history.push(userMessage);
    this.config.onMessage(userMessage);

    // Build message history for LLM with attachments
    const chatMessage: ChatMessage = {
      role: 'user',
      content: input || 'Please analyze these files and extract any relevant property or CGT information.',
    };

    // Add attachments to the message if provided
    if (attachments && attachments.length > 0) {
      chatMessage.attachments = attachments;
      console.log('📎 Adding attachments to message:', attachments.map(a => `${a.name} (${a.type}, ${Math.round(a.data.length / 1024)}KB)`));
    }

    this.messageHistory.push(chatMessage);

    try {
      // Prepare messages with system prompt
      const messages: ChatMessage[] = [
        { role: 'system', content: this.getSystemPrompt() },
        ...this.messageHistory,
      ];

      // Call LLM through API endpoint (server-side has the API keys)
      console.log('📤 Sending to LLM, messages:', messages.length, attachments?.length ? `with ${attachments.length} attachments` : '');
      let response = await this.callChatAPI(messages);
      console.log('📥 LLM response:', {
        hasContent: !!response.content,
        contentPreview: response.content?.substring(0, 100),
        toolCallsCount: response.toolCalls?.length || 0,
        toolNames: response.toolCalls?.map(tc => tc.name),
      });

      // Handle tool calls
      while (response.toolCalls && response.toolCalls.length > 0) {
        const toolResults = await this.executeToolCalls(response.toolCalls);

        // Add assistant message with tool calls to history
        // IMPORTANT: Must include toolCalls so LLMs know tool results correspond to this message
        this.messageHistory.push({
          role: 'assistant',
          content: response.content || '',
          toolCalls: response.toolCalls,
        });

        // Add tool results to history
        for (const result of toolResults) {
          this.messageHistory.push({
            role: 'tool',
            content: result.result,
            toolCallId: result.toolCallId,
            name: result.name,
          });
        }

        // Get next response with tool results
        response = await this.callChatAPI([
          { role: 'system', content: this.getSystemPrompt() },
          ...this.messageHistory,
        ]);
      }

      // Add final assistant message
      const assistantContent = response.content || 'I completed the action.';
      this.messageHistory.push({
        role: 'assistant',
        content: assistantContent,
      });

      const assistantMessage = this.createMessage('assistant', assistantContent);
      this.context.history.push(assistantMessage);
      this.config.onMessage(assistantMessage);

      this.context.errorCount = 0;
      this.setState('idle');

      return assistantContent;
    } catch (error) {
      console.error('Conversation error:', error);
      this.context.errorCount++;

      const errorMessage =
        this.context.errorCount >= 3
          ? ERROR_RECOVERY_PROMPTS.connectionError()
          : ERROR_RECOVERY_PROMPTS.generalError();

      const assistantMessage = this.createMessage('assistant', errorMessage);
      this.context.history.push(assistantMessage);
      this.config.onMessage(assistantMessage);

      this.setState('error_recovery');

      return errorMessage;
    }
  }

  // Call the server-side chat API endpoint
  private async callChatAPI(messages: ChatMessage[]): Promise<{ content: string; toolCalls?: ToolCall[] }> {
    const response = await fetch('/api/ai-builder/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        provider: this.config.llmProvider,
        tools: TIMELINE_TOOLS,
        temperature: 0.7,
        maxTokens: 2048,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.content || '',
      toolCalls: data.toolCalls,
    };
  }

  private async executeToolCalls(
    toolCalls: ToolCall[]
  ): Promise<Array<{ toolCallId: string; name: string; result: string }>> {
    console.log('🔧 Executing tool calls:', toolCalls.length, 'tools');
    toolCalls.forEach((tc, i) => {
      console.log(`🔧 Tool ${i + 1}:`, tc.name, JSON.stringify(tc.arguments));
    });

    const results: Array<{ toolCallId: string; name: string; result: string }> = [];

    for (const toolCall of toolCalls) {
      console.log(`🔧 Executing: ${toolCall.name}`);
      try {
        const result = await this.executeToolCall(toolCall);
        console.log(`✅ ${toolCall.name} result:`, result);
        results.push({
          toolCallId: toolCall.id,
          name: toolCall.name,
          result: JSON.stringify(result),
        });
      } catch (error) {
        console.error(`❌ ${toolCall.name} error:`, error);
        results.push({
          toolCallId: toolCall.id,
          name: toolCall.name,
          result: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        });
      }
    }

    console.log('🔧 All tool calls complete. Results:', results.length);
    return results;
  }

  private async executeToolCall(toolCall: ToolCall): Promise<unknown> {
    const { name, arguments: args } = toolCall;

    switch (name) {
      case 'add_property':
        return this.handleAddProperty(args);

      case 'add_event':
        return this.handleAddEvent(args);

      case 'edit_property':
        return this.handleEditProperty(args);

      case 'edit_event':
        return this.handleEditEvent(args);

      case 'delete_property':
        return this.handleDeleteProperty(args);

      case 'delete_event':
        return this.handleDeleteEvent(args);

      case 'undo_action':
        return this.handleUndo(args);

      case 'redo_action':
        return this.handleRedo(args);

      case 'get_timeline_summary':
        return this.handleGetSummary(args);

      case 'calculate_cgt':
        return this.handleCalculateCGT(args);

      case 'search_property':
        return this.handleSearchProperty(args);

      case 'add_cost_base_item':
        return this.handleAddCostBaseItem(args);

      case 'set_property_status':
        return this.handleSetPropertyStatus(args);

      default:
        return { success: false, error: `Unknown tool: ${name}` };
    }
  }

  /**
   * Create a CostBaseItem from tool arguments
   */
  private createCostBaseItem(
    definitionId: string,
    name: string,
    amount: number,
    category: CostBaseCategory,
    description?: string
  ): CostBaseItem {
    return {
      id: `cb-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      definitionId,
      name,
      amount,
      category,
      isCustom: false,
      description,
    };
  }

  /**
   * Build cost base items from purchase tool arguments
   * Includes Element 1 (purchase price / land+building split) and Element 2 (incidental costs)
   */
  private buildPurchaseCostBases(args: Record<string, unknown>): CostBaseItem[] {
    const costBases: CostBaseItem[] = [];
    const purchasePrice = args.purchasePrice as number;
    const landPrice = args.landPrice as number;
    const buildingPrice = args.buildingPrice as number;

    // Element 1: Acquisition Costs
    // If land and building prices are both specified, use those as the breakdown
    // Otherwise use the total purchase price
    if (landPrice && landPrice > 0 && buildingPrice && buildingPrice > 0) {
      costBases.push(this.createCostBaseItem(
        'land_price', 'Land Price', landPrice, 'element1', 'Land component of purchase'
      ));
      costBases.push(this.createCostBaseItem(
        'building_price', 'Building Price', buildingPrice, 'element1', 'Building component of purchase'
      ));
    } else if (purchasePrice && purchasePrice > 0) {
      // Use total purchase price as Element 1
      costBases.push(this.createCostBaseItem(
        'purchase_price', 'Purchase Price', purchasePrice, 'element1', 'Total acquisition cost'
      ));
    }

    // Element 2: Incidental Costs (Acquisition)
    if (args.stampDuty && typeof args.stampDuty === 'number' && args.stampDuty > 0) {
      costBases.push(this.createCostBaseItem(
        'stamp_duty', 'Stamp Duty', args.stampDuty, 'element2', 'State transfer duty'
      ));
    }
    if (args.legalFees && typeof args.legalFees === 'number' && args.legalFees > 0) {
      costBases.push(this.createCostBaseItem(
        'purchase_legal_fees', 'Legal Fees (Purchase)', args.legalFees, 'element2', 'Solicitor/conveyancer fees'
      ));
    }
    if (args.buildingInspection && typeof args.buildingInspection === 'number' && args.buildingInspection > 0) {
      costBases.push(this.createCostBaseItem(
        'building_inspection', 'Building Inspection Fees', args.buildingInspection, 'element2'
      ));
    }
    if (args.pestInspection && typeof args.pestInspection === 'number' && args.pestInspection > 0) {
      costBases.push(this.createCostBaseItem(
        'pest_inspection', 'Pest Inspection Fees', args.pestInspection, 'element2'
      ));
    }
    if (args.valuationFees && typeof args.valuationFees === 'number' && args.valuationFees > 0) {
      costBases.push(this.createCostBaseItem(
        'valuation_fees', 'Valuation Fees', args.valuationFees, 'element2'
      ));
    }
    if (args.surveyFees && typeof args.surveyFees === 'number' && args.surveyFees > 0) {
      costBases.push(this.createCostBaseItem(
        'survey_fees', 'Survey Fees', args.surveyFees, 'element2'
      ));
    }
    if (args.loanEstablishment && typeof args.loanEstablishment === 'number' && args.loanEstablishment > 0) {
      costBases.push(this.createCostBaseItem(
        'loan_establishment', 'Loan Establishment Fees', args.loanEstablishment, 'element2',
        'Only if not claimed as tax deduction'
      ));
    }
    if (args.mortgageInsurance && typeof args.mortgageInsurance === 'number' && args.mortgageInsurance > 0) {
      costBases.push(this.createCostBaseItem(
        'mortgage_insurance', "Lender's Mortgage Insurance", args.mortgageInsurance, 'element2'
      ));
    }
    if (args.buyersAgentFees && typeof args.buyersAgentFees === 'number' && args.buyersAgentFees > 0) {
      costBases.push(this.createCostBaseItem(
        'purchase_agent_fees', "Buyer's Agent Commission", args.buyersAgentFees, 'element2'
      ));
    }

    return costBases;
  }

  /**
   * Build cost base items from sale event tool arguments
   * Includes sale proceeds (Element 1 for tracking) and Element 2 (disposal costs)
   */
  private buildSaleCostBases(args: Record<string, unknown>): CostBaseItem[] {
    const costBases: CostBaseItem[] = [];
    const salePrice = args.amount as number;

    // Sale Proceeds (tracked as Element 1 for display/calculation purposes)
    // This is the capital proceeds, not technically a "cost" but tracked in costBases for completeness
    if (salePrice && salePrice > 0) {
      costBases.push(this.createCostBaseItem(
        'sale_price', 'Sale Price', salePrice, 'element1', 'Capital proceeds from sale'
      ));
    }

    // Element 2: Incidental Costs (Disposal)
    if (args.agentFees && typeof args.agentFees === 'number' && args.agentFees > 0) {
      costBases.push(this.createCostBaseItem(
        'sale_agent_fees', 'Real Estate Agent Commission', args.agentFees, 'element2'
      ));
    }
    if (args.legalFees && typeof args.legalFees === 'number' && args.legalFees > 0) {
      costBases.push(this.createCostBaseItem(
        'sale_legal_fees', 'Legal Fees (Sale)', args.legalFees, 'element2'
      ));
    }
    if (args.advertisingCosts && typeof args.advertisingCosts === 'number' && args.advertisingCosts > 0) {
      costBases.push(this.createCostBaseItem(
        'advertising_costs', 'Advertising Costs', args.advertisingCosts, 'element2'
      ));
    }
    if (args.stagingCosts && typeof args.stagingCosts === 'number' && args.stagingCosts > 0) {
      costBases.push(this.createCostBaseItem(
        'staging_costs', 'Property Staging Costs', args.stagingCosts, 'element2'
      ));
    }
    if (args.auctionFees && typeof args.auctionFees === 'number' && args.auctionFees > 0) {
      costBases.push(this.createCostBaseItem(
        'auction_fees', 'Auction Fees', args.auctionFees, 'element2'
      ));
    }
    if (args.mortgageDischargeFees && typeof args.mortgageDischargeFees === 'number' && args.mortgageDischargeFees > 0) {
      costBases.push(this.createCostBaseItem(
        'mortgage_discharge_fees', 'Mortgage Discharge Fees', args.mortgageDischargeFees, 'element2'
      ));
    }
    if (args.valuationFees && typeof args.valuationFees === 'number' && args.valuationFees > 0) {
      costBases.push(this.createCostBaseItem(
        'valuation_fees', 'Valuation Fees', args.valuationFees, 'element2'
      ));
    }

    return costBases;
  }

  /**
   * Build cost base item for improvements
   */
  private buildImprovementCostBase(args: Record<string, unknown>): CostBaseItem | null {
    const amount = args.amount as number;
    if (!amount || amount <= 0) return null;

    const improvementType = args.improvementType as string;

    // Map improvement types to cost base definition IDs
    const typeMap: Record<string, { id: string; name: string }> = {
      kitchen: { id: 'renovation_kitchen', name: 'Kitchen Renovation' },
      bathroom: { id: 'renovation_bathroom', name: 'Bathroom Renovation' },
      whole_house: { id: 'renovation_whole_house', name: 'Whole House Renovation' },
      extension: { id: 'extension', name: 'Extension' },
      pool: { id: 'swimming_pool', name: 'Swimming Pool' },
      landscaping: { id: 'landscaping', name: 'Capital Landscaping' },
      garage: { id: 'garage_carport', name: 'Garage/Carport' },
      fencing: { id: 'fencing', name: 'Fencing' },
      deck: { id: 'deck_patio', name: 'Deck/Patio' },
      hvac: { id: 'hvac_system', name: 'Heating/Cooling System' },
      solar: { id: 'solar_panels', name: 'Solar Panels' },
      structural: { id: 'structural_changes', name: 'Structural Changes' },
    };

    const mapping = typeMap[improvementType] || { id: 'extension', name: `Capital Improvement (${improvementType || 'other'})` };

    return this.createCostBaseItem(
      mapping.id,
      mapping.name,
      amount,
      'element4',
      args.description as string
    );
  }

  private async handleAddProperty(args: Record<string, unknown>): Promise<unknown> {
    console.log('📍 handleAddProperty called with args:', JSON.stringify(args, null, 2));

    const purchaseDate = this.parseDate(args.purchaseDate as string);
    const purchasePrice = args.purchasePrice as number;

    console.log('📍 Parsed date:', purchaseDate.toISOString(), '| Price:', purchasePrice);

    // Step 1: Add the property
    const propertyAction: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'ADD_PROPERTY',
      timestamp: new Date(),
      payload: {
        property: {
          name: (args.name as string) || '',
          address: args.address as string,
          purchasePrice: purchasePrice,
          purchaseDate: purchaseDate,
          color: '',
          isRental: args.isRental as boolean,
        },
      },
      description: `Add property: ${args.address}`,
    };

    console.log('📍 Executing add property action...');
    await this.config.executeAction(propertyAction);
    this.config.onAction(propertyAction);

    // Track last property
    const properties = this.config.getProperties();
    console.log('📍 Properties after add:', properties.length);
    const newProperty = properties[properties.length - 1];
    if (newProperty) {
      console.log('✅ Property created:', newProperty.id, newProperty.address);
      this.lastPropertyId = newProperty.id;
      this.context.lastProperty = newProperty;

      // Build cost bases from args
      const purchaseCostBases = this.buildPurchaseCostBases(args);
      console.log('📍 Created cost bases:', purchaseCostBases.length, purchaseCostBases.map(cb => `${cb.name}: $${cb.amount}`));

      // Step 2: Automatically create purchase event with cost bases
      console.log('📍 Creating auto purchase event for property:', newProperty.id);
      const purchaseEventAction: TimelineAction = {
        id: `action-${Date.now()}-purchase`,
        type: 'ADD_EVENT',
        timestamp: new Date(),
        payload: {
          event: {
            propertyId: newProperty.id,
            type: 'purchase' as const,
            date: purchaseDate,
            title: 'Property Purchase',
            description: `Purchased ${args.address}`,
            amount: purchasePrice,
            position: 0,
            color: this.getEventColor('purchase'),
            // Land/building split
            landPrice: args.landPrice as number | undefined,
            buildingPrice: args.buildingPrice as number | undefined,
            // Contract dates
            contractDate: args.contractDate ? this.parseDate(args.contractDate as string) : undefined,
            settlementDate: args.settlementDate ? this.parseDate(args.settlementDate as string) : undefined,
            // Cost bases array
            costBases: purchaseCostBases.length > 0 ? purchaseCostBases : undefined,
          },
        },
        description: `Add purchase event for ${args.address}`,
      };

      await this.config.executeAction(purchaseEventAction);
      this.config.onAction(purchaseEventAction);

      // Track the purchase event as last event
      const events = this.config.getEvents();
      console.log('📍 Events after purchase event:', events.length);
      const purchaseEvent = events[events.length - 1];
      if (purchaseEvent) {
        this.lastEventId = purchaseEvent.id;
        this.context.lastEvent = purchaseEvent;
        console.log('✅ Purchase event created:', purchaseEvent.id, 'with', purchaseCostBases.length, 'cost bases');
      }
    } else {
      console.log('⚠️ Property not found after add - stale state issue?');
    }

    const costBaseSummary = this.buildPurchaseCostBases(args).map(cb => `${cb.name}: $${cb.amount.toLocaleString()}`).join(', ');

    return {
      success: true,
      propertyId: this.lastPropertyId,
      message: `Added property at ${args.address} with purchase event on ${purchaseDate.toLocaleDateString('en-AU')} for $${purchasePrice?.toLocaleString() || 0}${costBaseSummary ? `. Cost bases: ${costBaseSummary}` : ''}`,
      eventsCreated: ['purchase'],
      costBasesAdded: this.buildPurchaseCostBases(args).length,
    };
  }

  private async handleAddEvent(args: Record<string, unknown>): Promise<unknown> {
    console.log('📍 handleAddEvent called with args:', JSON.stringify(args, null, 2));

    // Resolve property ID
    let propertyId = args.propertyId as string;
    console.log('📍 Initial propertyId:', propertyId, '| lastPropertyId:', this.lastPropertyId);

    if (propertyId === 'last' || !propertyId) {
      if (args.propertyAddress) {
        const property = this.findPropertyByAddress(args.propertyAddress as string);
        console.log('📍 Found property by address:', property?.id, property?.address);
        if (property) {
          propertyId = property.id;
        }
      } else if (this.lastPropertyId) {
        propertyId = this.lastPropertyId;
        console.log('📍 Using lastPropertyId:', propertyId);
      }
    }

    // Also try to find by looking at current properties if still no propertyId
    if (!propertyId) {
      const currentProperties = this.config.getProperties();
      console.log('📍 Current properties count:', currentProperties.length);
      if (currentProperties.length > 0) {
        // Use the most recently added property
        propertyId = currentProperties[currentProperties.length - 1].id;
        console.log('📍 Using most recent property:', propertyId);
      }
    }

    if (!propertyId) {
      console.log('❌ No propertyId found - cannot add event');
      return {
        success: false,
        error: 'Could not determine which property to add the event to. Please add a property first.',
      };
    }

    const eventDate = this.parseDate(args.date as string);
    const eventType = args.eventType as string;

    // Build cost bases based on event type
    let costBases: CostBaseItem[] = [];
    if (eventType === 'sale') {
      costBases = this.buildSaleCostBases(args);
      console.log('📍 Sale cost bases:', costBases.length, costBases.map(cb => `${cb.name}: $${cb.amount}`));
    } else if (eventType === 'improvement') {
      const improvementCostBase = this.buildImprovementCostBase(args);
      if (improvementCostBase) {
        costBases = [improvementCostBase];
        console.log('📍 Improvement cost base:', improvementCostBase.name, `$${improvementCostBase.amount}`);
      }
    }

    console.log('📍 Creating event:', { propertyId, eventType, date: eventDate.toISOString(), amount: args.amount, costBasesCount: costBases.length });

    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'ADD_EVENT',
      timestamp: new Date(),
      payload: {
        event: {
          propertyId,
          type: eventType as TimelineEvent['type'],
          date: eventDate,
          title: (args.title as string) || this.getDefaultEventTitle(eventType),
          description: args.description as string,
          amount: args.amount as number,
          newStatus: args.newStatus as TimelineEvent['newStatus'],
          position: 0,
          color: this.getEventColor(eventType),
          // Market valuation for PPR→Rental transitions (move_out, rent_start)
          marketValuation: args.marketValuation as number | undefined,
          // Contract dates for sales
          contractDate: args.contractDate ? this.parseDate(args.contractDate as string) : undefined,
          settlementDate: args.settlementDate ? this.parseDate(args.settlementDate as string) : undefined,
          // Cost bases
          costBases: costBases.length > 0 ? costBases : undefined,
        },
      },
      description: `Add ${eventType} event`,
    };

    console.log('📍 Executing action:', action.type, action.payload);
    await this.config.executeAction(action);
    this.config.onAction(action);

    // Track last event
    const events = this.config.getEvents();
    console.log('📍 Events after add:', events.length);
    const newEvent = events[events.length - 1];
    if (newEvent) {
      this.lastEventId = newEvent.id;
      this.context.lastEvent = newEvent;
      console.log('✅ Event added successfully:', newEvent.id, newEvent.type, 'with', costBases.length, 'cost bases');
    } else {
      console.log('⚠️ No new event found after add');
    }

    // Build message with cost base summary
    let message = `Added ${eventType} event on ${eventDate.toLocaleDateString()}`;
    if (args.amount) {
      message += ` for $${(args.amount as number).toLocaleString()}`;
    }
    if (args.marketValuation) {
      message += `. Market valuation: $${(args.marketValuation as number).toLocaleString()}`;
    }
    if (costBases.length > 0) {
      const costBaseSummary = costBases.map(cb => `${cb.name}: $${cb.amount.toLocaleString()}`).join(', ');
      message += `. Cost bases: ${costBaseSummary}`;
    }

    return {
      success: true,
      eventId: this.lastEventId,
      message,
      costBasesAdded: costBases.length,
      hasMarketValuation: !!args.marketValuation,
    };
  }

  private async handleEditProperty(args: Record<string, unknown>): Promise<unknown> {
    let propertyId = args.propertyId as string;
    if (propertyId === 'last' || !propertyId) {
      if (args.propertyAddress) {
        const property = this.findPropertyByAddress(args.propertyAddress as string);
        if (property) {
          propertyId = property.id;
        }
      } else if (this.lastPropertyId) {
        propertyId = this.lastPropertyId;
      }
    }

    if (!propertyId) {
      return { success: false, error: 'Property not found' };
    }

    const property = this.config.getProperties().find((p) => p.id === propertyId);
    if (!property) {
      return { success: false, error: 'Property not found' };
    }

    const updates = args.updates as Record<string, unknown>;
    const processedUpdates: Partial<Property> = {};

    if (updates.address) processedUpdates.address = updates.address as string;
    if (updates.name) processedUpdates.name = updates.name as string;
    if (updates.purchasePrice) processedUpdates.purchasePrice = updates.purchasePrice as number;
    if (updates.purchaseDate)
      processedUpdates.purchaseDate = this.parseDate(updates.purchaseDate as string);
    if (updates.currentValue) processedUpdates.currentValue = updates.currentValue as number;
    if (updates.salePrice) processedUpdates.salePrice = updates.salePrice as number;
    if (updates.saleDate) processedUpdates.saleDate = this.parseDate(updates.saleDate as string);

    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'UPDATE_PROPERTY',
      timestamp: new Date(),
      payload: {
        propertyId,
        updates: processedUpdates,
        previousValues: property,
      },
      description: `Edit property: ${property.address}`,
    };

    await this.config.executeAction(action);
    this.config.onAction(action);

    return { success: true, message: `Updated property at ${property.address}` };
  }

  private async handleEditEvent(args: Record<string, unknown>): Promise<unknown> {
    let eventId = args.eventId as string;
    if (eventId === 'last' || !eventId) {
      if (this.lastEventId) {
        eventId = this.lastEventId;
      }
    }

    if (!eventId) {
      return { success: false, error: 'Event not found' };
    }

    const event = this.config.getEvents().find((e) => e.id === eventId);
    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    const updates = args.updates as Record<string, unknown>;
    const processedUpdates: Partial<TimelineEvent> = {};

    if (updates.date) processedUpdates.date = this.parseDate(updates.date as string);
    if (updates.title) processedUpdates.title = updates.title as string;
    if (updates.description) processedUpdates.description = updates.description as string;
    if (updates.amount) processedUpdates.amount = updates.amount as number;
    if (updates.newStatus) processedUpdates.newStatus = updates.newStatus as TimelineEvent['newStatus'];

    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'UPDATE_EVENT',
      timestamp: new Date(),
      payload: {
        eventId,
        updates: processedUpdates,
        previousValues: event,
      },
      description: `Edit ${event.type} event`,
    };

    await this.config.executeAction(action);
    this.config.onAction(action);

    return { success: true, message: `Updated ${event.type} event` };
  }

  private async handleDeleteProperty(args: Record<string, unknown>): Promise<unknown> {
    if (!args.confirmed) {
      return {
        success: false,
        requiresConfirmation: true,
        message: 'Please confirm you want to delete this property and all its events.',
      };
    }

    let propertyId = args.propertyId as string;
    if (!propertyId && args.propertyAddress) {
      const property = this.findPropertyByAddress(args.propertyAddress as string);
      if (property) {
        propertyId = property.id;
      }
    }

    if (!propertyId) {
      return { success: false, error: 'Property not found' };
    }

    const property = this.config.getProperties().find((p) => p.id === propertyId);
    if (!property) {
      return { success: false, error: 'Property not found' };
    }

    const propertyEvents = this.config.getEvents().filter((e) => e.propertyId === propertyId);

    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'DELETE_PROPERTY',
      timestamp: new Date(),
      payload: {
        property,
        events: propertyEvents,
      },
      description: `Delete property: ${property.address}`,
    };

    await this.config.executeAction(action);
    this.config.onAction(action);

    return { success: true, message: `Deleted property at ${property.address}` };
  }

  private async handleDeleteEvent(args: Record<string, unknown>): Promise<unknown> {
    let eventId = args.eventId as string;
    if (!eventId && args.propertyAddress && args.eventType) {
      const property = this.findPropertyByAddress(args.propertyAddress as string);
      if (property) {
        const event = this.config
          .getEvents()
          .find((e) => e.propertyId === property.id && e.type === args.eventType);
        if (event) {
          eventId = event.id;
        }
      }
    }

    if (!eventId) {
      return { success: false, error: 'Event not found' };
    }

    const event = this.config.getEvents().find((e) => e.id === eventId);
    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'DELETE_EVENT',
      timestamp: new Date(),
      payload: { event },
      description: `Delete ${event.type} event`,
    };

    await this.config.executeAction(action);
    this.config.onAction(action);

    return { success: true, message: `Deleted ${event.type} event` };
  }

  private async handleUndo(_args: Record<string, unknown>): Promise<unknown> {
    // Undo is handled by the action executor
    return { success: true, message: 'Undo functionality will be handled by the timeline' };
  }

  private async handleRedo(_args: Record<string, unknown>): Promise<unknown> {
    // Redo is handled by the action executor
    return { success: true, message: 'Redo functionality will be handled by the timeline' };
  }

  private async handleGetSummary(_args: Record<string, unknown>): Promise<unknown> {
    const properties = this.config.getProperties();
    const events = this.config.getEvents();

    const summary = {
      totalProperties: properties.length,
      properties: properties.map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        purchasePrice: p.purchasePrice,
        purchaseDate: p.purchaseDate?.toISOString().split('T')[0],
        status: p.currentStatus,
        eventCount: events.filter((e) => e.propertyId === p.id).length,
      })),
      totalEvents: events.length,
    };

    return { success: true, summary };
  }

  private async handleCalculateCGT(args: Record<string, unknown>): Promise<unknown> {
    // This will trigger the CGT calculation in the main app
    return {
      success: true,
      message: 'CGT calculation will be triggered',
      propertyId: args.propertyId || args.propertyAddress,
    };
  }

  private async handleSearchProperty(args: Record<string, unknown>): Promise<unknown> {
    const query = (args.query as string)?.toLowerCase() || '';
    const properties = this.config.getProperties();

    const matches = properties.filter(
      (p) =>
        p.address.toLowerCase().includes(query) || p.name.toLowerCase().includes(query)
    );

    return {
      success: true,
      matches: matches.map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
      })),
    };
  }

  private async handleAddCostBaseItem(args: Record<string, unknown>): Promise<unknown> {
    // Cost base items are added to events, typically purchase or improvement events
    return {
      success: true,
      message: 'Cost base item will be added to the event',
      itemType: args.itemType,
      amount: args.amount,
    };
  }

  private async handleSetPropertyStatus(args: Record<string, unknown>): Promise<unknown> {
    // This creates a status_change event
    return this.handleAddEvent({
      ...args,
      eventType: 'status_change',
      date: args.effectiveDate || new Date().toISOString(),
      newStatus: args.status,
    });
  }

  private findPropertyByAddress(address: string): Property | undefined {
    const properties = this.config.getProperties();
    const normalizedAddress = address.toLowerCase().trim();

    return properties.find(
      (p) =>
        p.address.toLowerCase().includes(normalizedAddress) ||
        normalizedAddress.includes(p.address.toLowerCase())
    );
  }

  private parseDate(dateStr: string): Date {
    if (!dateStr) return new Date();

    // Try ISO format first
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    // Try natural language formats
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december',
    ];

    const normalized = dateStr.toLowerCase().trim();

    // "March 2015" format
    const monthYearMatch = normalized.match(/(\w+)\s+(\d{4})/);
    if (monthYearMatch) {
      const monthIndex = monthNames.indexOf(monthYearMatch[1].toLowerCase());
      if (monthIndex !== -1) {
        return new Date(parseInt(monthYearMatch[2]), monthIndex, 1);
      }
    }

    // "2015" format
    const yearOnly = normalized.match(/^(\d{4})$/);
    if (yearOnly) {
      return new Date(parseInt(yearOnly[1]), 0, 1);
    }

    // Default to current date
    return new Date();
  }

  private getDefaultEventTitle(eventType: string): string {
    const titles: Record<string, string> = {
      purchase: 'Property Purchase',
      sale: 'Property Sale',
      move_in: 'Moved In',
      move_out: 'Moved Out',
      rent_start: 'Started Renting',
      rent_end: 'Stopped Renting',
      improvement: 'Capital Improvement',
      refinance: 'Refinanced',
      status_change: 'Status Change',
      living_in_rental_start: 'Moved into Rental',
      living_in_rental_end: 'Moved out of Rental',
    };
    return titles[eventType] || eventType;
  }

  private getEventColor(eventType: string): string {
    const colors: Record<string, string> = {
      purchase: '#3B82F6',
      move_in: '#10B981',
      move_out: '#EF4444',
      rent_start: '#F59E0B',
      rent_end: '#F97316',
      sale: '#8B5CF6',
      improvement: '#06B6D4',
      refinance: '#6366F1',
      status_change: '#A855F7',
      living_in_rental_start: '#F472B6',
      living_in_rental_end: '#FB923C',
    };
    return colors[eventType] || '#6B7280';
  }

  clearHistory(): void {
    this.context = this.createInitialContext();
    this.messageHistory = [];
    this.lastPropertyId = null;
    this.lastEventId = null;
  }
}
