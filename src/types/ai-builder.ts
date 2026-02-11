// AI Timeline Builder Types

import type { Property, TimelineEvent, PropertyStatus, EventType } from '@/store/timeline';

// ============================================================================
// LLM PROVIDER TYPES
// ============================================================================

export interface LLMProvider {
  id: string;
  name: string;
  model: string;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsToolCalling: boolean;
  costPerInputToken: number;
  costPerOutputToken: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  name?: string;
}

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required?: string[];
  };
}

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  enum?: string[];
  format?: string;
  default?: unknown;
  items?: ToolParameter;
  properties?: Record<string, ToolParameter>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface LLMRequest {
  messages: ChatMessage[];
  tools?: Tool[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
}

// ============================================================================
// VOICE TYPES
// ============================================================================

export type VoiceState = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'error';

export interface VoiceConfig {
  sttProvider: 'deepgram' | 'openai';
  ttsProvider: 'elevenlabs' | 'openai' | 'deepgram';
  voice: string;
  language: string;
  sampleRate: number;
  vadEnabled: boolean;
  bargeInEnabled: boolean;
}

export interface TranscriptEvent {
  text: string;
  isFinal: boolean;
  confidence: number;
  timestamp: number;
}

export interface AudioChunk {
  data: ArrayBuffer;
  timestamp: number;
}

// ============================================================================
// CONVERSATION TYPES
// ============================================================================

export type ConversationState =
  | 'idle'
  | 'listening'
  | 'processing'
  | 'responding'
  | 'waiting_confirmation'
  | 'error_recovery';

export type IntentType =
  | 'add_property'
  | 'add_event'
  | 'edit_property'
  | 'edit_event'
  | 'delete_property'
  | 'delete_event'
  | 'undo'
  | 'redo'
  | 'query'
  | 'clarification'
  | 'confirmation'
  | 'rejection'
  | 'help'
  | 'greeting'
  | 'goodbye'
  | 'calculate_cgt'
  | 'get_summary';

export interface Entity {
  type: string;
  value: unknown;
  confidence: number;
}

export interface Intent {
  type: IntentType;
  confidence: number;
  entities: Entity[];
  requiresConfirmation: boolean;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  isVoice?: boolean;
  intent?: Intent;
  actions?: TimelineAction[];
}

export interface ConversationContext {
  state: ConversationState;
  history: ConversationMessage[];
  currentIntent: Intent | null;
  pendingActions: TimelineAction[];
  lastProperty: Property | null;
  lastEvent: TimelineEvent | null;
  confirmationRequired: boolean;
  errorCount: number;
}

// ============================================================================
// TIMELINE ACTION TYPES
// ============================================================================

export type ActionType =
  | 'ADD_PROPERTY'
  | 'UPDATE_PROPERTY'
  | 'DELETE_PROPERTY'
  | 'ADD_EVENT'
  | 'UPDATE_EVENT'
  | 'DELETE_EVENT'
  | 'BULK_IMPORT'
  | 'CLEAR_ALL'
  // Timeline Navigation & Visualization
  | 'ZOOM_TIMELINE'
  | 'PAN_TO_DATE'
  | 'FOCUS_ON_PROPERTY'
  | 'FOCUS_ON_EVENT'
  // Data Operations
  | 'LOAD_DEMO_DATA'
  // UI State Operations
  | 'TOGGLE_THEME'
  | 'TOGGLE_EVENT_DISPLAY'
  | 'SELECT_PROPERTY'
  | 'SELECT_EVENT'
  // Verification & Analysis
  | 'GET_VERIFICATION_ALERTS'
  | 'RESOLVE_VERIFICATION_ALERT'
  | 'GET_ANALYSIS_RESULTS'
  // Timeline Notes
  | 'SET_TIMELINE_NOTES'
  | 'GET_TIMELINE_NOTES'
  // History Operations
  | 'GET_ACTION_HISTORY'
  // Settings
  | 'UPDATE_SETTINGS';

export interface TimelineAction {
  id: string;
  type: ActionType;
  timestamp: Date;
  payload: ActionPayload;
  description: string;
}

export type ActionPayload =
  | AddPropertyPayload
  | UpdatePropertyPayload
  | DeletePropertyPayload
  | AddEventPayload
  | UpdateEventPayload
  | DeleteEventPayload
  | BulkImportPayload
  | ClearAllPayload
  // Timeline Navigation Payloads
  | ZoomTimelinePayload
  | PanToDatePayload
  | FocusOnPropertyPayload
  | FocusOnEventPayload
  // Data Operations Payloads
  | LoadDemoDataPayload
  // UI State Payloads
  | ToggleThemePayload
  | ToggleEventDisplayPayload
  | SelectPropertyPayload
  | SelectEventPayload
  // Verification & Analysis Payloads
  | GetVerificationAlertsPayload
  | ResolveVerificationAlertPayload
  | GetAnalysisResultsPayload
  // Timeline Notes Payloads
  | SetTimelineNotesPayload
  | GetTimelineNotesPayload
  // History Payloads
  | GetActionHistoryPayload
  // Settings Payload
  | UpdateSettingsPayload;

export interface AddPropertyPayload {
  property: Omit<Property, 'id' | 'branch'>;
}

export interface UpdatePropertyPayload {
  propertyId: string;
  updates: Partial<Property>;
  previousValues: Partial<Property>;
}

export interface DeletePropertyPayload {
  property: Property;
  events: TimelineEvent[];
}

export interface AddEventPayload {
  event: Omit<TimelineEvent, 'id'>;
}

export interface UpdateEventPayload {
  eventId: string;
  updates: Partial<TimelineEvent>;
  previousValues: Partial<TimelineEvent>;
}

export interface DeleteEventPayload {
  event: TimelineEvent;
}

export interface BulkImportPayload {
  properties: Property[];
  events: TimelineEvent[];
  previousProperties: Property[];
  previousEvents: TimelineEvent[];
}

export interface ClearAllPayload {
  previousProperties: Property[];
  previousEvents: TimelineEvent[];
}

// Timeline Navigation Payloads
export interface ZoomTimelinePayload {
  direction?: 'in' | 'out';
  level?: string;
  centerOnDate?: Date;
}

export interface PanToDatePayload {
  date: Date;
}

export interface FocusOnPropertyPayload {
  propertyId: string;
}

export interface FocusOnEventPayload {
  eventId: string;
}

// Data Operations Payloads
export interface LoadDemoDataPayload {
  confirmed?: boolean;
}

// UI State Payloads
export interface ToggleThemePayload {
  theme?: 'light' | 'dark' | 'toggle';
}

export interface ToggleEventDisplayPayload {
  mode?: 'cards' | 'circles' | 'toggle';
}

export interface SelectPropertyPayload {
  propertyId: string | null;
}

export interface SelectEventPayload {
  eventId: string | null;
}

// Verification & Analysis Payloads
export interface GetVerificationAlertsPayload {
  includeResolved?: boolean;
}

export interface ResolveVerificationAlertPayload {
  alertId: string;
  response?: string;
  selectedOption?: string;
}

export interface GetAnalysisResultsPayload {
  propertyId?: string;
  format?: 'summary' | 'detailed' | 'json';
}

// Timeline Notes Payloads
export interface SetTimelineNotesPayload {
  notes: string;
  append?: boolean;
}

export interface GetTimelineNotesPayload {}

// History Payloads
export interface GetActionHistoryPayload {
  limit?: number;
  includeRedoStack?: boolean;
}

// Settings Payload
export interface UpdateSettingsPayload {
  lockFutureDates?: boolean;
  enableDragEvents?: boolean;
  enableAISuggestedQuestions?: boolean;
  apiResponseMode?: string;
}

export interface ActionResult {
  success: boolean;
  entityId?: string;
  message?: string;
  error?: string;
}

export interface StateSnapshot {
  properties: Property[];
  events: TimelineEvent[];
  timestamp: Date;
}

// ============================================================================
// DOCUMENT PROCESSING TYPES
// ============================================================================

export type DocumentType = 'pdf' | 'image' | 'excel' | 'csv' | 'word' | 'text';

export interface DateMention {
  text: string;
  date: Date;
  confidence: number;
  context: string;
}

export interface AmountMention {
  text: string;
  amount: number;
  currency: string;
  confidence: number;
  context: string;
}

export interface AddressMention {
  text: string;
  address: string;
  confidence: number;
}

export interface ExtractedData {
  properties: Partial<Property>[];
  events: Partial<TimelineEvent>[];
  dates: DateMention[];
  amounts: AmountMention[];
  addresses: AddressMention[];
}

export interface ProcessedDocument {
  type: DocumentType;
  filename: string;
  extractedData: ExtractedData;
  confidence: number;
  rawText: string;
  suggestedActions: TimelineAction[];
  base64?: string;
  mimeType?: string;
}

export interface DocumentContext {
  filename: string;
  type: DocumentType;
  rawText: string;
  extractedData: ExtractedData;
  uploadedAt: Date;
  base64?: string;
  mimeType?: string;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface AIBuilderState {
  isOpen: boolean;
  isMinimized: boolean;
  activeTab: 'voice' | 'chat' | 'documents';
  voiceState: VoiceState;
  voiceConfig: VoiceConfig;
  conversationContext: ConversationContext;
  messages: ConversationMessage[];
  isProcessing: boolean;
  isSpeaking: boolean;
  currentTranscript: string;
  selectedLLMProvider: string;
  undoStack: TimelineAction[];
  redoStack: TimelineAction[];
  uploadedDocuments: ProcessedDocument[];
  error: string | null;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface VoiceTokenResponse {
  token: string;
  expiresAt: number;
}

export interface LLMChatResponse {
  success: boolean;
  response: LLMResponse;
  error?: string;
}

export interface DocumentProcessResponse {
  success: boolean;
  document: ProcessedDocument;
  error?: string;
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

export interface AIBuilderEventHandlers {
  onMessage: (message: ConversationMessage) => void;
  onAction: (action: TimelineAction) => void;
  onError: (error: string) => void;
  onVoiceStateChange: (state: VoiceState) => void;
  onTranscript: (transcript: string, isFinal: boolean) => void;
}
