// Conversation Manager - Orchestrates AI conversations
// NOTE: This runs on the CLIENT - all LLM calls go through /api/ai-builder/chat

import type {
  ConversationState,
  ConversationContext,
  ConversationMessage,
  TimelineAction,
  DocumentContext,
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
  getDocumentContexts?: () => DocumentContext[];
}

export class ConversationManager {
  private config: ConversationManagerConfig;
  private context: ConversationContext;
  private messageHistory: ChatMessage[] = [];
  private lastPropertyId: string | null = null;
  private lastEventId: string | null = null;
  private documentContexts: DocumentContext[] = [];

  constructor(config: ConversationManagerConfig) {
    this.config = config;
    this.context = this.createInitialContext();
  }

  /**
   * Add a document context for inclusion in the system prompt
   */
  addDocumentContext(context: DocumentContext): void {
    this.documentContexts.push(context);
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

    let prompt = getContextualSystemPrompt(propertyList, allEvents);

    // Append document context if any documents have been uploaded
    const docContexts = this.documentContexts.length > 0
      ? this.documentContexts
      : (this.config.getDocumentContexts?.() || []);

    if (docContexts.length > 0) {
      const MAX_TOTAL_CHARS = 15000;
      const MAX_PER_DOC = 5000;
      let totalChars = 0;

      prompt += '\n\n## Uploaded Document Context\n';
      prompt += 'The user has uploaded the following documents. Use this information when answering questions.\n\n';

      for (const doc of docContexts) {
        if (totalChars >= MAX_TOTAL_CHARS) break;

        const remaining = MAX_TOTAL_CHARS - totalChars;
        const truncatedText = doc.rawText.substring(0, Math.min(MAX_PER_DOC, remaining));
        totalChars += truncatedText.length;

        prompt += `### Document: ${doc.filename} (${doc.type})\n`;
        prompt += `Uploaded: ${doc.uploadedAt instanceof Date ? doc.uploadedAt.toLocaleString() : 'recently'}\n\n`;

        // Include extracted data summary
        const data = doc.extractedData;
        if (data) {
          if (data.properties?.length > 0) {
            prompt += `Found ${data.properties.length} propert${data.properties.length === 1 ? 'y' : 'ies'}\n`;
          }
          if (data.events?.length > 0) {
            prompt += `Found ${data.events.length} event(s)\n`;
          }
        }

        prompt += `\nRaw text:\n${truncatedText}\n\n`;
      }
    }

    return prompt;
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

      // Timeline Navigation & Visualization
      case 'zoom_timeline':
        return this.handleZoomTimeline(args);
      case 'pan_to_date':
        return this.handlePanToDate(args);
      case 'focus_on_property':
        return this.handleFocusOnProperty(args);
      case 'focus_on_event':
        return this.handleFocusOnEvent(args);

      // Data Operations
      case 'clear_all_data':
        return this.handleClearAllData(args);
      case 'load_demo_data':
        return this.handleLoadDemoData(args);
      case 'export_timeline_data':
        return this.handleExportTimelineData(args);
      case 'import_timeline_data':
        return this.handleImportTimelineData(args);

      // Enhanced Property Operations
      case 'duplicate_property':
        return this.handleDuplicateProperty(args);
      case 'get_property_details':
        return this.handleGetPropertyDetails(args);

      // Enhanced Event Operations
      case 'move_event':
        return this.handleMoveEvent(args);
      case 'duplicate_event':
        return this.handleDuplicateEvent(args);
      case 'get_event_details':
        return this.handleGetEventDetails(args);

      // Bulk Operations
      case 'bulk_add_events':
        return this.handleBulkAddEvents(args);
      case 'bulk_delete_events':
        return this.handleBulkDeleteEvents(args);

      // Cost Base Operations
      case 'update_cost_base_item':
        return this.handleUpdateCostBaseItem(args);
      case 'delete_cost_base_item':
        return this.handleDeleteCostBaseItem(args);
      case 'get_cost_base_summary':
        return this.handleGetCostBaseSummary(args);

      // UI State Operations
      case 'toggle_theme':
        return this.handleToggleTheme(args);
      case 'toggle_event_display':
        return this.handleToggleEventDisplay(args);
      case 'select_property':
        return this.handleSelectProperty(args);
      case 'select_event':
        return this.handleSelectEvent(args);

      // Verification & Analysis
      case 'get_verification_alerts':
        return this.handleGetVerificationAlerts(args);
      case 'resolve_verification_alert':
        return this.handleResolveVerificationAlert(args);
      case 'get_analysis_results':
        return this.handleGetAnalysisResults(args);

      // Timeline Notes
      case 'set_timeline_notes':
        return this.handleSetTimelineNotes(args);
      case 'get_timeline_notes':
        return this.handleGetTimelineNotes(args);

      // History Operations
      case 'get_action_history':
        return this.handleGetActionHistory(args);

      // Custom Event
      case 'add_custom_event':
        return this.handleAddCustomEvent(args);

      // Settings
      case 'update_timeline_settings':
        return this.handleUpdateTimelineSettings(args);

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

  // ============================================================================
  // TIMELINE NAVIGATION & VISUALIZATION HANDLERS
  // ============================================================================

  private async handleZoomTimeline(args: Record<string, unknown>): Promise<unknown> {
    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'ZOOM_TIMELINE',
      timestamp: new Date(),
      payload: {
        direction: args.direction as string,
        level: args.level as string,
        centerOnDate: args.centerOnDate ? this.parseDate(args.centerOnDate as string) : undefined,
      },
      description: args.level ? `Set zoom to ${args.level}` : `Zoom ${args.direction}`,
    };

    await this.config.executeAction(action);
    this.config.onAction(action);

    return {
      success: true,
      message: args.level ? `Zoomed to ${args.level} view` : `Zoomed ${args.direction}`,
    };
  }

  private async handlePanToDate(args: Record<string, unknown>): Promise<unknown> {
    const date = this.parseDate(args.date as string);

    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'PAN_TO_DATE',
      timestamp: new Date(),
      payload: { date },
      description: `Pan to ${date.toLocaleDateString()}`,
    };

    await this.config.executeAction(action);
    this.config.onAction(action);

    return {
      success: true,
      message: `Timeline centered on ${date.toLocaleDateString('en-AU')}`,
    };
  }

  private async handleFocusOnProperty(args: Record<string, unknown>): Promise<unknown> {
    let propertyId = args.propertyId as string;
    if (propertyId === 'last' || !propertyId) {
      if (args.propertyAddress) {
        const property = this.findPropertyByAddress(args.propertyAddress as string);
        if (property) propertyId = property.id;
      } else if (this.lastPropertyId) {
        propertyId = this.lastPropertyId;
      }
    }

    if (!propertyId) {
      return { success: false, error: 'Property not found' };
    }

    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'FOCUS_ON_PROPERTY',
      timestamp: new Date(),
      payload: { propertyId },
      description: `Focus on property`,
    };

    await this.config.executeAction(action);
    this.config.onAction(action);

    return { success: true, message: 'Focused on property', propertyId };
  }

  private async handleFocusOnEvent(args: Record<string, unknown>): Promise<unknown> {
    let eventId = args.eventId as string;
    if (eventId === 'last' || !eventId) {
      if (this.lastEventId) {
        eventId = this.lastEventId;
      }
    }

    if (!eventId) {
      return { success: false, error: 'Event not found' };
    }

    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'FOCUS_ON_EVENT',
      timestamp: new Date(),
      payload: { eventId },
      description: `Focus on event`,
    };

    await this.config.executeAction(action);
    this.config.onAction(action);

    return { success: true, message: 'Focused on event', eventId };
  }

  // ============================================================================
  // DATA OPERATIONS HANDLERS
  // ============================================================================

  private async handleClearAllData(args: Record<string, unknown>): Promise<unknown> {
    if (!args.confirmed) {
      return {
        success: false,
        requiresConfirmation: true,
        message: 'Please confirm you want to clear ALL data from the timeline.',
      };
    }

    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'CLEAR_ALL',
      timestamp: new Date(),
      payload: {},
      description: 'Clear all timeline data',
    };

    await this.config.executeAction(action);
    this.config.onAction(action);
    this.lastPropertyId = null;
    this.lastEventId = null;

    return { success: true, message: 'All timeline data has been cleared' };
  }

  private async handleLoadDemoData(args: Record<string, unknown>): Promise<unknown> {
    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'LOAD_DEMO_DATA',
      timestamp: new Date(),
      payload: { confirmed: args.confirmed },
      description: 'Load demo data',
    };

    await this.config.executeAction(action);
    this.config.onAction(action);

    return { success: true, message: 'Demo data has been loaded' };
  }

  private async handleExportTimelineData(args: Record<string, unknown>): Promise<unknown> {
    const properties = this.config.getProperties();
    const events = this.config.getEvents();

    const exportData = {
      exportedAt: new Date().toISOString(),
      format: args.format || 'json',
      properties: properties.map(p => ({
        ...p,
        purchaseDate: p.purchaseDate?.toISOString(),
        saleDate: p.saleDate?.toISOString(),
      })),
      events: events.map(e => ({
        ...e,
        date: e.date.toISOString(),
        contractDate: e.contractDate?.toISOString(),
        settlementDate: e.settlementDate?.toISOString(),
      })),
    };

    if (args.format === 'summary') {
      return {
        success: true,
        summary: {
          totalProperties: properties.length,
          totalEvents: events.length,
          properties: properties.map(p => ({
            address: p.address,
            purchasePrice: p.purchasePrice,
            status: p.currentStatus,
            eventCount: events.filter(e => e.propertyId === p.id).length,
          })),
        },
      };
    }

    return { success: true, data: exportData };
  }

  private async handleImportTimelineData(args: Record<string, unknown>): Promise<unknown> {
    const data = args.data as Record<string, unknown>;
    if (!data) {
      return { success: false, error: 'No data provided to import' };
    }

    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'BULK_IMPORT',
      timestamp: new Date(),
      payload: { data, merge: args.merge },
      description: 'Import timeline data',
    };

    await this.config.executeAction(action);
    this.config.onAction(action);

    return { success: true, message: 'Timeline data imported successfully' };
  }

  // ============================================================================
  // ENHANCED PROPERTY OPERATIONS HANDLERS
  // ============================================================================

  private async handleDuplicateProperty(args: Record<string, unknown>): Promise<unknown> {
    let sourcePropertyId = args.propertyId as string;
    if (!sourcePropertyId && args.propertyAddress) {
      const property = this.findPropertyByAddress(args.propertyAddress as string);
      if (property) sourcePropertyId = property.id;
    }

    if (!sourcePropertyId) {
      return { success: false, error: 'Source property not found' };
    }

    const sourceProperty = this.config.getProperties().find(p => p.id === sourcePropertyId);
    if (!sourceProperty) {
      return { success: false, error: 'Source property not found' };
    }

    const sourceEvents = this.config.getEvents().filter(e => e.propertyId === sourcePropertyId);

    // Add new property
    const newPropertyAction: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'ADD_PROPERTY',
      timestamp: new Date(),
      payload: {
        property: {
          name: (args.newName as string) || `${sourceProperty.name} (Copy)`,
          address: args.newAddress as string,
          purchasePrice: sourceProperty.purchasePrice,
          purchaseDate: sourceProperty.purchaseDate,
          color: '',
        },
      },
      description: `Duplicate property: ${sourceProperty.address}`,
    };

    await this.config.executeAction(newPropertyAction);
    this.config.onAction(newPropertyAction);

    const properties = this.config.getProperties();
    const newProperty = properties[properties.length - 1];

    if (newProperty && sourceEvents.length > 0) {
      // Copy all events to the new property
      for (const event of sourceEvents) {
        const eventAction: TimelineAction = {
          id: `action-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          type: 'ADD_EVENT',
          timestamp: new Date(),
          payload: {
            event: {
              ...event,
              id: undefined, // Let the store generate a new ID
              propertyId: newProperty.id,
            },
          },
          description: `Copy ${event.type} event`,
        };
        await this.config.executeAction(eventAction);
      }
    }

    this.lastPropertyId = newProperty?.id || null;

    return {
      success: true,
      message: `Property duplicated to ${args.newAddress}`,
      newPropertyId: newProperty?.id,
      eventsCopied: sourceEvents.length,
    };
  }

  private async handleGetPropertyDetails(args: Record<string, unknown>): Promise<unknown> {
    let propertyId = args.propertyId as string;
    if (propertyId === 'last' || !propertyId) {
      if (args.propertyAddress) {
        const property = this.findPropertyByAddress(args.propertyAddress as string);
        if (property) propertyId = property.id;
      } else if (this.lastPropertyId) {
        propertyId = this.lastPropertyId;
      }
    }

    const property = this.config.getProperties().find(p => p.id === propertyId);
    if (!property) {
      return { success: false, error: 'Property not found' };
    }

    const events = this.config.getEvents()
      .filter(e => e.propertyId === propertyId)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const result: Record<string, unknown> = {
      success: true,
      property: {
        id: property.id,
        name: property.name,
        address: property.address,
        purchasePrice: property.purchasePrice,
        purchaseDate: property.purchaseDate?.toISOString().split('T')[0],
        currentStatus: property.currentStatus,
        salePrice: property.salePrice,
        saleDate: property.saleDate?.toISOString().split('T')[0],
      },
    };

    if (args.includeEvents !== false) {
      result.events = events.map(e => ({
        id: e.id,
        type: e.type,
        date: e.date.toISOString().split('T')[0],
        title: e.title,
        amount: e.amount,
        costBasesCount: e.costBases?.length || 0,
      }));
    }

    if (args.includeCostBases !== false) {
      const allCostBases: CostBaseItem[] = [];
      events.forEach(e => {
        if (e.costBases) {
          allCostBases.push(...e.costBases);
        }
      });

      const byCategory: Record<string, number> = {};
      allCostBases.forEach(cb => {
        byCategory[cb.category] = (byCategory[cb.category] || 0) + cb.amount;
      });

      result.costBaseSummary = {
        totalItems: allCostBases.length,
        totalAmount: allCostBases.reduce((sum, cb) => sum + cb.amount, 0),
        byCategory,
      };
    }

    return result;
  }

  // ============================================================================
  // ENHANCED EVENT OPERATIONS HANDLERS
  // ============================================================================

  private async handleMoveEvent(args: Record<string, unknown>): Promise<unknown> {
    let eventId = args.eventId as string;
    if (eventId === 'last' || !eventId) {
      if (this.lastEventId) {
        eventId = this.lastEventId;
      }
    }

    if (!eventId) {
      return { success: false, error: 'Event not found' };
    }

    const newDate = this.parseDate(args.newDate as string);

    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'UPDATE_EVENT',
      timestamp: new Date(),
      payload: {
        eventId,
        updates: {
          date: newDate,
          contractDate: newDate, // Sync for sale events
        },
      },
      description: `Move event to ${newDate.toLocaleDateString()}`,
    };

    await this.config.executeAction(action);
    this.config.onAction(action);

    return {
      success: true,
      message: `Event moved to ${newDate.toLocaleDateString('en-AU')}`,
    };
  }

  private async handleDuplicateEvent(args: Record<string, unknown>): Promise<unknown> {
    let eventId = args.eventId as string;
    if (eventId === 'last' || !eventId) {
      if (this.lastEventId) {
        eventId = this.lastEventId;
      }
    }

    const event = this.config.getEvents().find(e => e.id === eventId);
    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    const newDate = args.newDate ? this.parseDate(args.newDate as string) : event.date;
    const targetPropertyId = (args.targetPropertyId as string) || event.propertyId;

    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'ADD_EVENT',
      timestamp: new Date(),
      payload: {
        event: {
          ...event,
          id: undefined,
          propertyId: targetPropertyId,
          date: newDate,
        },
      },
      description: `Duplicate ${event.type} event`,
    };

    await this.config.executeAction(action);
    this.config.onAction(action);

    const events = this.config.getEvents();
    const newEvent = events[events.length - 1];
    this.lastEventId = newEvent?.id || null;

    return {
      success: true,
      message: `Event duplicated`,
      newEventId: newEvent?.id,
    };
  }

  private async handleGetEventDetails(args: Record<string, unknown>): Promise<unknown> {
    let eventId = args.eventId as string;
    if (eventId === 'last' || !eventId) {
      if (this.lastEventId) {
        eventId = this.lastEventId;
      }
    }

    const event = this.config.getEvents().find(e => e.id === eventId);
    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    const property = this.config.getProperties().find(p => p.id === event.propertyId);

    return {
      success: true,
      event: {
        id: event.id,
        type: event.type,
        date: event.date.toISOString().split('T')[0],
        title: event.title,
        description: event.description,
        amount: event.amount,
        newStatus: event.newStatus,
        contractDate: event.contractDate?.toISOString().split('T')[0],
        settlementDate: event.settlementDate?.toISOString().split('T')[0],
        costBases: event.costBases,
      },
      propertyAddress: property?.address,
    };
  }

  // ============================================================================
  // BULK OPERATIONS HANDLERS
  // ============================================================================

  private async handleBulkAddEvents(args: Record<string, unknown>): Promise<unknown> {
    let propertyId = args.propertyId as string;
    if (propertyId === 'last' || !propertyId) {
      if (args.propertyAddress) {
        const property = this.findPropertyByAddress(args.propertyAddress as string);
        if (property) propertyId = property.id;
      } else if (this.lastPropertyId) {
        propertyId = this.lastPropertyId;
      }
    }

    if (!propertyId) {
      return { success: false, error: 'Property not found' };
    }

    const events = args.events as Array<Record<string, unknown>>;
    if (!events || events.length === 0) {
      return { success: false, error: 'No events provided' };
    }

    let addedCount = 0;
    for (const eventData of events) {
      const action: TimelineAction = {
        id: `action-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        type: 'ADD_EVENT',
        timestamp: new Date(),
        payload: {
          event: {
            propertyId,
            type: eventData.eventType as TimelineEvent['type'],
            date: this.parseDate(eventData.date as string),
            title: (eventData.title as string) || this.getDefaultEventTitle(eventData.eventType as string),
            description: eventData.description as string,
            amount: eventData.amount as number,
            newStatus: eventData.newStatus as TimelineEvent['newStatus'],
            marketValuation: eventData.marketValuation as number,
            position: 0,
            color: this.getEventColor(eventData.eventType as string),
          },
        },
        description: `Add ${eventData.eventType} event`,
      };

      await this.config.executeAction(action);
      this.config.onAction(action);
      addedCount++;
    }

    return {
      success: true,
      message: `Added ${addedCount} events`,
      eventsAdded: addedCount,
    };
  }

  private async handleBulkDeleteEvents(args: Record<string, unknown>): Promise<unknown> {
    if (!args.confirmed) {
      return {
        success: false,
        requiresConfirmation: true,
        message: 'Please confirm bulk deletion of events.',
      };
    }

    const eventIds = args.eventIds as string[];
    let deletedCount = 0;

    if (eventIds && eventIds.length > 0) {
      for (const eventId of eventIds) {
        const event = this.config.getEvents().find(e => e.id === eventId);
        if (event) {
          const action: TimelineAction = {
            id: `action-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            type: 'DELETE_EVENT',
            timestamp: new Date(),
            payload: { event },
            description: `Delete ${event.type} event`,
          };
          await this.config.executeAction(action);
          this.config.onAction(action);
          deletedCount++;
        }
      }
    }

    return {
      success: true,
      message: `Deleted ${deletedCount} events`,
      eventsDeleted: deletedCount,
    };
  }

  // ============================================================================
  // COST BASE OPERATIONS HANDLERS
  // ============================================================================

  private async handleUpdateCostBaseItem(args: Record<string, unknown>): Promise<unknown> {
    const eventId = args.eventId as string;
    const costBaseId = args.costBaseId as string;
    const updates = args.updates as Record<string, unknown>;

    const event = this.config.getEvents().find(e => e.id === eventId);
    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    if (!event.costBases) {
      return { success: false, error: 'Event has no cost bases' };
    }

    const costBase = event.costBases.find(cb => cb.id === costBaseId);
    if (!costBase) {
      return { success: false, error: 'Cost base item not found' };
    }

    const updatedCostBases = event.costBases.map(cb => {
      if (cb.id === costBaseId) {
        return {
          ...cb,
          name: (updates.name as string) || cb.name,
          amount: (updates.amount as number) ?? cb.amount,
          description: (updates.description as string) || cb.description,
        };
      }
      return cb;
    });

    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'UPDATE_EVENT',
      timestamp: new Date(),
      payload: {
        eventId,
        updates: { costBases: updatedCostBases },
      },
      description: `Update cost base item`,
    };

    await this.config.executeAction(action);
    this.config.onAction(action);

    return { success: true, message: 'Cost base item updated' };
  }

  private async handleDeleteCostBaseItem(args: Record<string, unknown>): Promise<unknown> {
    const eventId = args.eventId as string;
    const costBaseId = args.costBaseId as string;
    const costBaseName = args.costBaseName as string;

    const event = this.config.getEvents().find(e => e.id === eventId);
    if (!event || !event.costBases) {
      return { success: false, error: 'Event or cost bases not found' };
    }

    const updatedCostBases = event.costBases.filter(cb => {
      if (costBaseId) return cb.id !== costBaseId;
      if (costBaseName) return cb.name.toLowerCase() !== costBaseName.toLowerCase();
      return true;
    });

    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'UPDATE_EVENT',
      timestamp: new Date(),
      payload: {
        eventId,
        updates: { costBases: updatedCostBases },
      },
      description: `Delete cost base item`,
    };

    await this.config.executeAction(action);
    this.config.onAction(action);

    return { success: true, message: 'Cost base item deleted' };
  }

  private async handleGetCostBaseSummary(args: Record<string, unknown>): Promise<unknown> {
    let events: TimelineEvent[] = [];

    if (args.eventId) {
      const event = this.config.getEvents().find(e => e.id === args.eventId);
      if (event) events = [event];
    } else if (args.propertyId || args.propertyAddress) {
      let propertyId = args.propertyId as string;
      if (!propertyId && args.propertyAddress) {
        const property = this.findPropertyByAddress(args.propertyAddress as string);
        if (property) propertyId = property.id;
      }
      if (propertyId) {
        events = this.config.getEvents().filter(e => e.propertyId === propertyId);
      }
    } else {
      events = this.config.getEvents();
    }

    const allCostBases: Array<CostBaseItem & { eventType: string; eventDate: string }> = [];
    events.forEach(e => {
      if (e.costBases) {
        e.costBases.forEach(cb => {
          allCostBases.push({
            ...cb,
            eventType: e.type,
            eventDate: e.date.toISOString().split('T')[0],
          });
        });
      }
    });

    const byCategory: Record<string, { items: typeof allCostBases; total: number }> = {};
    allCostBases.forEach(cb => {
      if (!byCategory[cb.category]) {
        byCategory[cb.category] = { items: [], total: 0 };
      }
      byCategory[cb.category].items.push(cb);
      byCategory[cb.category].total += cb.amount;
    });

    return {
      success: true,
      summary: {
        totalItems: allCostBases.length,
        totalAmount: allCostBases.reduce((sum, cb) => sum + cb.amount, 0),
        byCategory,
        items: allCostBases,
      },
    };
  }

  // ============================================================================
  // UI STATE OPERATIONS HANDLERS
  // ============================================================================

  private async handleToggleTheme(args: Record<string, unknown>): Promise<unknown> {
    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'TOGGLE_THEME',
      timestamp: new Date(),
      payload: { theme: args.theme },
      description: args.theme === 'toggle' ? 'Toggle theme' : `Set theme to ${args.theme}`,
    };

    await this.config.executeAction(action);
    this.config.onAction(action);

    return { success: true, message: 'Theme updated' };
  }

  private async handleToggleEventDisplay(args: Record<string, unknown>): Promise<unknown> {
    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'TOGGLE_EVENT_DISPLAY',
      timestamp: new Date(),
      payload: { mode: args.mode },
      description: args.mode === 'toggle' ? 'Toggle event display' : `Set display to ${args.mode}`,
    };

    await this.config.executeAction(action);
    this.config.onAction(action);

    return { success: true, message: 'Event display mode updated' };
  }

  private async handleSelectProperty(args: Record<string, unknown>): Promise<unknown> {
    let propertyId = args.propertyId as string;
    if (args.propertyAddress) {
      const property = this.findPropertyByAddress(args.propertyAddress as string);
      if (property) propertyId = property.id;
    }

    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'SELECT_PROPERTY',
      timestamp: new Date(),
      payload: { propertyId },
      description: propertyId ? 'Select property' : 'Deselect property',
    };

    await this.config.executeAction(action);
    this.config.onAction(action);

    return { success: true, message: propertyId ? 'Property selected' : 'Property deselected' };
  }

  private async handleSelectEvent(args: Record<string, unknown>): Promise<unknown> {
    let eventId = args.eventId as string;

    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'SELECT_EVENT',
      timestamp: new Date(),
      payload: { eventId },
      description: eventId ? 'Select event' : 'Deselect event',
    };

    await this.config.executeAction(action);
    this.config.onAction(action);

    return { success: true, message: eventId ? 'Event selected' : 'Event deselected' };
  }

  // ============================================================================
  // VERIFICATION & ANALYSIS HANDLERS
  // ============================================================================

  private async handleGetVerificationAlerts(_args: Record<string, unknown>): Promise<unknown> {
    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'GET_VERIFICATION_ALERTS',
      timestamp: new Date(),
      payload: { includeResolved: _args.includeResolved },
      description: 'Get verification alerts',
    };

    await this.config.executeAction(action);

    return {
      success: true,
      message: 'Verification alerts retrieved. Check the timeline for any issues that need attention.',
    };
  }

  private async handleResolveVerificationAlert(args: Record<string, unknown>): Promise<unknown> {
    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'RESOLVE_VERIFICATION_ALERT',
      timestamp: new Date(),
      payload: {
        alertId: args.alertId,
        response: args.response,
        selectedOption: args.selectedOption,
      },
      description: 'Resolve verification alert',
    };

    await this.config.executeAction(action);
    this.config.onAction(action);

    return { success: true, message: 'Verification alert resolved' };
  }

  private async handleGetAnalysisResults(args: Record<string, unknown>): Promise<unknown> {
    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'GET_ANALYSIS_RESULTS',
      timestamp: new Date(),
      payload: {
        propertyId: args.propertyId,
        format: args.format,
      },
      description: 'Get CGT analysis results',
    };

    await this.config.executeAction(action);

    return {
      success: true,
      message: 'Analysis results retrieved. If no analysis has been run yet, please use calculate_cgt first.',
    };
  }

  // ============================================================================
  // TIMELINE NOTES HANDLERS
  // ============================================================================

  private async handleSetTimelineNotes(args: Record<string, unknown>): Promise<unknown> {
    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'SET_TIMELINE_NOTES',
      timestamp: new Date(),
      payload: {
        notes: args.notes,
        append: args.append,
      },
      description: 'Update timeline notes',
    };

    await this.config.executeAction(action);
    this.config.onAction(action);

    return { success: true, message: 'Timeline notes updated' };
  }

  private async handleGetTimelineNotes(_args: Record<string, unknown>): Promise<unknown> {
    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'GET_TIMELINE_NOTES',
      timestamp: new Date(),
      payload: {},
      description: 'Get timeline notes',
    };

    await this.config.executeAction(action);

    return {
      success: true,
      message: 'Timeline notes retrieved. Check the Notes section in the UI.',
    };
  }

  // ============================================================================
  // HISTORY OPERATIONS HANDLERS
  // ============================================================================

  private async handleGetActionHistory(args: Record<string, unknown>): Promise<unknown> {
    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'GET_ACTION_HISTORY',
      timestamp: new Date(),
      payload: {
        limit: args.limit,
        includeRedoStack: args.includeRedoStack,
      },
      description: 'Get action history',
    };

    await this.config.executeAction(action);

    return {
      success: true,
      message: 'Action history retrieved. You can use undo_action or redo_action to navigate history.',
    };
  }

  // ============================================================================
  // CUSTOM EVENT HANDLER
  // ============================================================================

  private async handleAddCustomEvent(args: Record<string, unknown>): Promise<unknown> {
    let propertyId = args.propertyId as string;
    if (propertyId === 'last' || !propertyId) {
      if (args.propertyAddress) {
        const property = this.findPropertyByAddress(args.propertyAddress as string);
        if (property) propertyId = property.id;
      } else if (this.lastPropertyId) {
        propertyId = this.lastPropertyId;
      }
    }

    if (!propertyId) {
      return { success: false, error: 'Property not found' };
    }

    // Map color names to hex values
    const colorMap: Record<string, string> = {
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

    const eventColor = colorMap[(args.color as string) || 'gray'] || '#6B7280';

    // Build cost bases if provided
    const costBases: CostBaseItem[] = [];
    if (args.costBases && Array.isArray(args.costBases)) {
      (args.costBases as Array<{ name: string; amount: number; category: string }>).forEach((cb, idx) => {
        costBases.push({
          id: `cb-${Date.now()}-${idx}`,
          definitionId: 'custom',
          name: cb.name,
          amount: cb.amount,
          category: (cb.category as CostBaseCategory) || 'element4',
          isCustom: true,
        });
      });
    }

    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'ADD_EVENT',
      timestamp: new Date(),
      payload: {
        event: {
          propertyId,
          type: 'custom' as const,
          date: this.parseDate(args.date as string),
          title: args.title as string,
          description: args.description as string,
          amount: args.amount as number,
          color: eventColor,
          affectsStatus: args.affectsStatus as boolean,
          newStatus: args.newStatus as TimelineEvent['newStatus'],
          position: 0,
          costBases: costBases.length > 0 ? costBases : undefined,
        },
      },
      description: `Add custom event: ${args.title}`,
    };

    await this.config.executeAction(action);
    this.config.onAction(action);

    const events = this.config.getEvents();
    const newEvent = events[events.length - 1];
    this.lastEventId = newEvent?.id || null;

    return {
      success: true,
      message: `Added custom event: ${args.title}`,
      eventId: newEvent?.id,
    };
  }

  // ============================================================================
  // SETTINGS HANDLER
  // ============================================================================

  private async handleUpdateTimelineSettings(args: Record<string, unknown>): Promise<unknown> {
    const action: TimelineAction = {
      id: `action-${Date.now()}`,
      type: 'UPDATE_SETTINGS',
      timestamp: new Date(),
      payload: {
        lockFutureDates: args.lockFutureDates,
        enableDragEvents: args.enableDragEvents,
        enableAISuggestedQuestions: args.enableAISuggestedQuestions,
        apiResponseMode: args.apiResponseMode,
      },
      description: 'Update timeline settings',
    };

    await this.config.executeAction(action);
    this.config.onAction(action);

    return { success: true, message: 'Timeline settings updated' };
  }

  clearHistory(): void {
    this.context = this.createInitialContext();
    this.messageHistory = [];
    this.lastPropertyId = null;
    this.lastEventId = null;
    this.documentContexts = [];
  }
}
