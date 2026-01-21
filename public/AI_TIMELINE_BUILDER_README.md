# AI-Powered Timeline Builder - Implementation Plan

## Executive Summary

This document outlines the comprehensive implementation plan for an AI-powered Timeline Builder feature that enables users to create, edit, and manage CGT timelines through natural voice conversations, text chat, and document upload. The system will support seamless real-time interaction with interruption handling, dynamic LLM switching, and full timeline manipulation capabilities.

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Voice Integration Strategy](#voice-integration-strategy)
3. [LLM Integration Strategy](#llm-integration-strategy)
4. [Conversation Flow Design](#conversation-flow-design)
5. [Timeline Action System](#timeline-action-system)
6. [Document Processing Pipeline](#document-processing-pipeline)
7. [UI/UX Design](#uiux-design)
8. [Technical Implementation](#technical-implementation)
9. [Security Considerations](#security-considerations)
10. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
11. [API Requirements](#api-requirements)
12. [Cost Analysis](#cost-analysis)

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AI TIMELINE BUILDER                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │   Voice Input   │  │   Text Input    │  │ Document Upload │             │
│  │  (Microphone)   │  │   (Chat Box)    │  │   (PDF/Images)  │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                    │                       │
│           ▼                    ▼                    ▼                       │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │                    INPUT PROCESSING LAYER                       │        │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │        │
│  │  │   Speech-    │  │    Text      │  │   Document   │          │        │
│  │  │   to-Text    │  │  Processing  │  │   Parser     │          │        │
│  │  │  (Deepgram)  │  │              │  │ (PDF/OCR)    │          │        │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                │                                            │
│                                ▼                                            │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │                    CONVERSATION ORCHESTRATOR                    │        │
│  │  ┌──────────────────────────────────────────────────────────┐  │        │
│  │  │  • Context Management    • Intent Recognition            │  │        │
│  │  │  • Conversation History  • Interruption Handling         │  │        │
│  │  │  • State Machine         • Error Recovery                │  │        │
│  │  └──────────────────────────────────────────────────────────┘  │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                │                                            │
│                                ▼                                            │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │                    LLM ABSTRACTION LAYER                        │        │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │        │
│  │  │ Deepseek │  │  Claude  │  │  GPT-4   │  │  Gemini  │       │        │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                │                                            │
│                                ▼                                            │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │                    TIMELINE ACTION ENGINE                       │        │
│  │  ┌──────────────────────────────────────────────────────────┐  │        │
│  │  │  • Add Property/Event    • Edit Property/Event           │  │        │
│  │  │  • Delete Property/Event • Undo/Redo Operations          │  │        │
│  │  │  • Bulk Operations       • Validation & Verification     │  │        │
│  │  └──────────────────────────────────────────────────────────┘  │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                │                                            │
│                                ▼                                            │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │                    OUTPUT GENERATION LAYER                      │        │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │        │
│  │  │   Text-to-   │  │    Text      │  │   Timeline   │          │        │
│  │  │   Speech     │  │   Response   │  │   Updates    │          │        │
│  │  │ (ElevenLabs) │  │              │  │   (Zustand)  │          │        │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| **Input Processing Layer** | Handle all input modalities (voice, text, documents) |
| **Conversation Orchestrator** | Manage conversation state, context, and flow |
| **LLM Abstraction Layer** | Provide unified interface to multiple LLM providers |
| **Timeline Action Engine** | Execute timeline operations based on AI commands |
| **Output Generation Layer** | Generate voice, text, and visual responses |

---

## Voice Integration Strategy

### Recommended Architecture: Hybrid Cascading Approach

Based on extensive research, we recommend a **hybrid cascading architecture** that combines the best-in-class components:

```
┌─────────────────────────────────────────────────────────────────┐
│                    VOICE PIPELINE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Speech ──▶ [Deepgram Nova-3] ──▶ Transcript               │
│                      STT                                        │
│                                                                 │
│  Transcript ──▶ [LLM Layer] ──▶ Response Text                   │
│                                                                 │
│  Response Text ──▶ [ElevenLabs Flash v2.5] ──▶ Audio Output     │
│                         TTS                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Voice Provider Selection

#### Primary: Deepgram Voice Agent API (Recommended)

**Why Deepgram for STT:**
- **Nova-3 Model**: Industry-leading 6.84% Word Error Rate (WER)
- **Latency**: Sub-300ms response time
- **Languages**: 36+ languages supported
- **Noise Robustness**: Excellent performance in real-world conditions
- **Pricing**: $4.50/hour ($0.075/min) - most cost-effective
- **Features**: Built-in barge-in detection, turn-taking prediction, function calling

**Integration Method:**
```javascript
// WebSocket connection to Deepgram Voice Agent API
const ws = new WebSocket('wss://agent.deepgram.com/v1/agent/converse', {
  headers: {
    'Authorization': `Token ${DEEPGRAM_API_KEY}`
  }
});

// Settings configuration
const settings = {
  type: 'SettingsConfiguration',
  audio: {
    input: {
      encoding: 'linear16',
      sample_rate: 16000
    },
    output: {
      encoding: 'linear16',
      sample_rate: 24000,
      container: 'raw'
    }
  },
  agent: {
    listen: {
      model: 'nova-2',
      language: 'en'
    },
    think: {
      provider: { type: 'custom' },  // We'll handle LLM separately
      model: 'custom'
    },
    speak: {
      provider: 'elevenlabs',
      voice: 'Rachel'
    }
  }
};
```

#### Secondary: ElevenLabs Conversational AI

**Why ElevenLabs for TTS:**
- **Voice Quality**: Industry-leading natural voice synthesis
- **Voice Library**: 5,000+ voices across languages
- **Custom Voices**: Voice cloning capability
- **Flash v2.5**: 75ms latency with 32 language support
- **Turn-Taking**: Proprietary model with prosodic cue analysis

**Alternative: OpenAI Realtime API**

**Pros:**
- Speech-to-speech architecture (500ms latency)
- Integrated with GPT models
- Natural interruption handling

**Cons:**
- Limited to 10 preset voices
- No external LLM integration
- Higher cost ($0.10-0.20/minute)
- Less control over intermediate processing

### Interruption Handling Strategy

```typescript
interface InterruptionHandler {
  // Voice Activity Detection (VAD)
  vadEnabled: boolean;

  // Barge-in detection threshold
  bargeInThreshold: number; // 0-1 sensitivity

  // Truncation handling
  truncateOnInterrupt: boolean;

  // Context preservation
  preserveLastContext: boolean;
}

const interruptionConfig: InterruptionHandler = {
  vadEnabled: true,
  bargeInThreshold: 0.7,
  truncateOnInterrupt: true,
  preserveLastContext: true
};
```

**Interruption Flow:**
1. User begins speaking while AI is responding
2. VAD detects voice activity
3. AI audio playback is immediately stopped
4. Unplayed audio is truncated from conversation context
5. New user input is processed
6. AI responds naturally, aware of where it was interrupted

---

## LLM Integration Strategy

### Dynamic LLM Abstraction Layer

We'll implement a provider-agnostic LLM layer that allows seamless switching between models:

```typescript
// src/lib/llm/types.ts
interface LLMProvider {
  id: string;
  name: string;
  model: string;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsToolCalling: boolean;
  costPerInputToken: number;
  costPerOutputToken: number;
}

interface LLMRequest {
  messages: ChatMessage[];
  tools?: Tool[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

interface LLMResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
  finishReason: 'stop' | 'tool_calls' | 'length';
}

// Base interface for all providers
interface ILLMService {
  chat(request: LLMRequest): Promise<LLMResponse>;
  streamChat(request: LLMRequest): AsyncGenerator<string>;
  getProviderInfo(): LLMProvider;
}
```

### Supported Providers

```typescript
// src/lib/llm/providers/index.ts
const LLM_PROVIDERS: Record<string, LLMProvider> = {
  deepseek: {
    id: 'deepseek',
    name: 'Deepseek V3',
    model: 'deepseek-chat',
    maxTokens: 128000,
    supportsStreaming: true,
    supportsToolCalling: true,
    costPerInputToken: 0.00000014,  // $0.14/1M
    costPerOutputToken: 0.00000028  // $0.28/1M
  },
  claude: {
    id: 'claude',
    name: 'Claude Sonnet 4',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 200000,
    supportsStreaming: true,
    supportsToolCalling: true,
    costPerInputToken: 0.000003,   // $3/1M
    costPerOutputToken: 0.000015   // $15/1M
  },
  gpt4: {
    id: 'gpt4',
    name: 'GPT-4 Turbo',
    model: 'gpt-4-turbo',
    maxTokens: 128000,
    supportsStreaming: true,
    supportsToolCalling: true,
    costPerInputToken: 0.00001,    // $10/1M
    costPerOutputToken: 0.00003    // $30/1M
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini 2.0 Flash',
    model: 'gemini-2.0-flash-exp',
    maxTokens: 1000000,
    supportsStreaming: true,
    supportsToolCalling: true,
    costPerInputToken: 0.0000001,  // $0.10/1M
    costPerOutputToken: 0.0000004  // $0.40/1M
  }
};
```

### Provider Factory Pattern

```typescript
// src/lib/llm/LLMFactory.ts
class LLMFactory {
  private static instances: Map<string, ILLMService> = new Map();

  static getProvider(providerId: string): ILLMService {
    if (!this.instances.has(providerId)) {
      switch (providerId) {
        case 'deepseek':
          this.instances.set(providerId, new DeepseekService());
          break;
        case 'claude':
          this.instances.set(providerId, new ClaudeService());
          break;
        case 'gpt4':
          this.instances.set(providerId, new OpenAIService());
          break;
        case 'gemini':
          this.instances.set(providerId, new GeminiService());
          break;
        default:
          throw new Error(`Unknown provider: ${providerId}`);
      }
    }
    return this.instances.get(providerId)!;
  }

  static switchProvider(from: string, to: string): void {
    // Transfer conversation context if needed
    console.log(`Switching from ${from} to ${to}`);
  }
}
```

### Tool Calling Schema

```typescript
// src/lib/llm/tools.ts
const TIMELINE_TOOLS: Tool[] = [
  {
    name: 'add_property',
    description: 'Add a new property to the timeline',
    parameters: {
      type: 'object',
      properties: {
        address: { type: 'string', description: 'Property address' },
        purchaseDate: { type: 'string', format: 'date' },
        purchasePrice: { type: 'number' },
        propertyType: {
          type: 'string',
          enum: ['house', 'unit', 'land', 'commercial']
        }
      },
      required: ['address', 'purchaseDate', 'purchasePrice']
    }
  },
  {
    name: 'add_event',
    description: 'Add an event to an existing property',
    parameters: {
      type: 'object',
      properties: {
        propertyId: { type: 'string' },
        eventType: {
          type: 'string',
          enum: ['purchase', 'move_in', 'move_out', 'rent_start',
                 'rent_end', 'sale', 'improvement', 'refinance',
                 'status_change', 'living_in_rental_start',
                 'living_in_rental_end']
        },
        date: { type: 'string', format: 'date' },
        description: { type: 'string' },
        amount: { type: 'number' }
      },
      required: ['propertyId', 'eventType', 'date']
    }
  },
  {
    name: 'edit_property',
    description: 'Edit an existing property',
    parameters: {
      type: 'object',
      properties: {
        propertyId: { type: 'string' },
        updates: {
          type: 'object',
          properties: {
            address: { type: 'string' },
            purchasePrice: { type: 'number' },
            status: { type: 'string' }
          }
        }
      },
      required: ['propertyId', 'updates']
    }
  },
  {
    name: 'edit_event',
    description: 'Edit an existing event',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string' },
        updates: {
          type: 'object',
          properties: {
            date: { type: 'string', format: 'date' },
            description: { type: 'string' },
            amount: { type: 'number' }
          }
        }
      },
      required: ['eventId', 'updates']
    }
  },
  {
    name: 'delete_property',
    description: 'Delete a property and all its events',
    parameters: {
      type: 'object',
      properties: {
        propertyId: { type: 'string' },
        confirmation: { type: 'boolean' }
      },
      required: ['propertyId', 'confirmation']
    }
  },
  {
    name: 'delete_event',
    description: 'Delete an event from a property',
    parameters: {
      type: 'object',
      properties: {
        eventId: { type: 'string' }
      },
      required: ['eventId']
    }
  },
  {
    name: 'undo_action',
    description: 'Undo the last action',
    parameters: {
      type: 'object',
      properties: {
        count: { type: 'number', default: 1 }
      }
    }
  },
  {
    name: 'redo_action',
    description: 'Redo a previously undone action',
    parameters: {
      type: 'object',
      properties: {
        count: { type: 'number', default: 1 }
      }
    }
  },
  {
    name: 'get_timeline_summary',
    description: 'Get a summary of the current timeline',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'calculate_cgt',
    description: 'Calculate CGT for a specific property sale',
    parameters: {
      type: 'object',
      properties: {
        propertyId: { type: 'string' }
      },
      required: ['propertyId']
    }
  }
];
```

---

## Conversation Flow Design

### Conversation State Machine

```typescript
enum ConversationState {
  IDLE = 'idle',
  LISTENING = 'listening',
  PROCESSING = 'processing',
  RESPONDING = 'responding',
  WAITING_CONFIRMATION = 'waiting_confirmation',
  ERROR_RECOVERY = 'error_recovery'
}

interface ConversationContext {
  state: ConversationState;
  history: Message[];
  currentIntent: Intent | null;
  pendingActions: TimelineAction[];
  lastProperty: Property | null;
  lastEvent: TimelineEvent | null;
  confirmationRequired: boolean;
  errorCount: number;
}
```

### Intent Recognition

```typescript
interface Intent {
  type: IntentType;
  confidence: number;
  entities: Entity[];
  requiresConfirmation: boolean;
}

enum IntentType {
  ADD_PROPERTY = 'add_property',
  ADD_EVENT = 'add_event',
  EDIT_PROPERTY = 'edit_property',
  EDIT_EVENT = 'edit_event',
  DELETE_PROPERTY = 'delete_property',
  DELETE_EVENT = 'delete_event',
  UNDO = 'undo',
  REDO = 'redo',
  QUERY = 'query',
  CLARIFICATION = 'clarification',
  CONFIRMATION = 'confirmation',
  REJECTION = 'rejection',
  HELP = 'help',
  GREETING = 'greeting',
  GOODBYE = 'goodbye'
}
```

### Sample Conversation Flows

**Flow 1: Adding a Property via Voice**
```
User: "I bought a house at 42 Smith Street, Sydney in March 2015 for $800,000"

AI (thinking):
  - Intent: ADD_PROPERTY
  - Entities: address="42 Smith Street, Sydney", date="March 2015", price=800000
  - Missing: None (all required fields present)

AI (speaking): "I've added a property at 42 Smith Street, Sydney.
               Purchased in March 2015 for $800,000.
               Would you like to add any events to this property?"

[Timeline Updated: New property card appears]

User: "Yes, we moved in right away"

AI (thinking):
  - Intent: ADD_EVENT
  - Context: Last property = "42 Smith Street"
  - Event type: move_in
  - Date: March 2015 (same as purchase)

AI (speaking): "I've recorded that you moved into the property in March 2015.
               Is this your main residence?"

User: "Yes"

AI (speaking): "Perfect. The property is now marked as your principal place of
               residence from March 2015. What else would you like to add?"

[Timeline Updated: Move-in event added, property status = PPR]
```

**Flow 2: Complex Multi-Property Scenario**
```
User: "Actually, we also had an investment property on Beach Road that
       we sold last year"

AI (thinking):
  - Intent: ADD_PROPERTY (with sale)
  - Requires: More details

AI (speaking): "I'd like to add the Beach Road investment property.
               Could you tell me:
               1. The full address?
               2. When you originally purchased it?
               3. How much you paid?"

User: "It was 15 Beach Road, Bondi. We bought it in 2010 for $500,000
       and sold it in October 2024 for $1.2 million"

AI (thinking):
  - Property: "15 Beach Road, Bondi"
  - Purchase: 2010, $500,000
  - Sale: October 2024, $1,200,000
  - Type: Investment (user said "investment property")

AI (speaking): "I've added 15 Beach Road, Bondi as an investment property:
               - Purchased in 2010 for $500,000
               - Sold in October 2024 for $1,200,000

               Did you make any capital improvements during ownership?"

[Timeline Updated: Property added with purchase and sale events]
```

**Flow 3: Interruption Handling**
```
AI (speaking): "So for the property at 42 Smith Street, I've calculated
               that the capital gain would be—"

User (interrupts): "Wait, I forgot to mention we did a renovation"

AI (stops immediately)
AI (thinking):
  - User interrupted
  - Truncate unspoken content
  - New intent: ADD_EVENT (improvement)
  - Context: 42 Smith Street

AI (speaking): "No problem. Tell me about the renovation -
               when was it done and how much did it cost?"

User: "We spent $50,000 on a kitchen renovation in 2018"

AI (speaking): "Got it. I've added a $50,000 kitchen renovation
               in 2018 to the cost base.
               Now, as I was saying, the capital gain calculation..."
```

### Error Recovery Patterns

```typescript
const ERROR_RECOVERY_PROMPTS = {
  missingEntity: (entity: string) =>
    `I need a bit more information. Could you tell me the ${entity}?`,

  ambiguousProperty: (properties: string[]) =>
    `I found multiple properties. Did you mean ${properties.join(' or ')}?`,

  invalidDate: () =>
    `I didn't catch the date clearly. Could you repeat that?`,

  confirmAction: (action: string) =>
    `Just to confirm, you want me to ${action}. Is that correct?`,

  noPropertiesFound: () =>
    `You don't have any properties in your timeline yet.
     Would you like to add one?`,

  generalError: () =>
    `I'm sorry, I didn't quite understand that.
     Could you rephrase or try again?`
};
```

---

## Timeline Action System

### Action Types and Schema

```typescript
// src/lib/actions/types.ts
interface TimelineAction {
  id: string;
  type: ActionType;
  timestamp: Date;
  payload: ActionPayload;
  previousState: StateSnapshot;
  result: ActionResult;
}

enum ActionType {
  ADD_PROPERTY = 'ADD_PROPERTY',
  UPDATE_PROPERTY = 'UPDATE_PROPERTY',
  DELETE_PROPERTY = 'DELETE_PROPERTY',
  ADD_EVENT = 'ADD_EVENT',
  UPDATE_EVENT = 'UPDATE_EVENT',
  DELETE_EVENT = 'DELETE_EVENT',
  BULK_IMPORT = 'BULK_IMPORT',
  CLEAR_ALL = 'CLEAR_ALL'
}

interface StateSnapshot {
  properties: Property[];
  events: TimelineEvent[];
  timestamp: Date;
}
```

### Undo/Redo System

```typescript
// src/lib/actions/UndoManager.ts
class UndoManager {
  private undoStack: TimelineAction[] = [];
  private redoStack: TimelineAction[] = [];
  private maxStackSize = 50;

  recordAction(action: TimelineAction): void {
    this.undoStack.push(action);
    this.redoStack = []; // Clear redo stack on new action

    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
  }

  undo(): TimelineAction | null {
    const action = this.undoStack.pop();
    if (action) {
      this.redoStack.push(action);
      return action;
    }
    return null;
  }

  redo(): TimelineAction | null {
    const action = this.redoStack.pop();
    if (action) {
      this.undoStack.push(action);
      return action;
    }
    return null;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getUndoDescription(): string | null {
    const action = this.undoStack[this.undoStack.length - 1];
    return action ? this.describeAction(action) : null;
  }

  private describeAction(action: TimelineAction): string {
    switch (action.type) {
      case ActionType.ADD_PROPERTY:
        return `Add property "${action.payload.property.address}"`;
      case ActionType.ADD_EVENT:
        return `Add ${action.payload.event.type} event`;
      case ActionType.DELETE_PROPERTY:
        return `Delete property "${action.payload.property.address}"`;
      // ... etc
      default:
        return 'Unknown action';
    }
  }
}
```

### Action Executor

```typescript
// src/lib/actions/ActionExecutor.ts
class ActionExecutor {
  private store: TimelineStore;
  private undoManager: UndoManager;

  constructor(store: TimelineStore) {
    this.store = store;
    this.undoManager = new UndoManager();
  }

  async execute(action: TimelineAction): Promise<ActionResult> {
    // Take snapshot before execution
    const previousState = this.takeSnapshot();

    try {
      // Execute the action
      const result = await this.executeAction(action);

      // Record for undo
      this.undoManager.recordAction({
        ...action,
        previousState,
        result
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async executeAction(action: TimelineAction): Promise<ActionResult> {
    switch (action.type) {
      case ActionType.ADD_PROPERTY:
        this.store.addProperty(action.payload.property);
        return { success: true, entityId: action.payload.property.id };

      case ActionType.ADD_EVENT:
        this.store.addEvent(action.payload.event);
        return { success: true, entityId: action.payload.event.id };

      case ActionType.UPDATE_PROPERTY:
        this.store.updateProperty(
          action.payload.propertyId,
          action.payload.updates
        );
        return { success: true };

      case ActionType.DELETE_PROPERTY:
        this.store.deleteProperty(action.payload.propertyId);
        return { success: true };

      // ... etc

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  async undo(): Promise<ActionResult> {
    const action = this.undoManager.undo();
    if (!action) {
      return { success: false, error: 'Nothing to undo' };
    }

    // Restore previous state
    this.restoreSnapshot(action.previousState);
    return { success: true, message: `Undid: ${action.type}` };
  }

  async redo(): Promise<ActionResult> {
    const action = this.undoManager.redo();
    if (!action) {
      return { success: false, error: 'Nothing to redo' };
    }

    // Re-execute the action
    return this.executeAction(action);
  }
}
```

---

## Document Processing Pipeline

### Supported Document Types

| Type | Extensions | Processing Method |
|------|------------|-------------------|
| PDF | .pdf | pdf-parse + LLM extraction |
| Images | .jpg, .png, .webp | Vision API + OCR |
| Excel | .xlsx, .xls | xlsx library |
| CSV | .csv | Native parsing |
| Word | .docx | mammoth library |
| Text | .txt | Native parsing |

### Document Processing Architecture

```typescript
// src/lib/documents/DocumentProcessor.ts
interface ProcessedDocument {
  type: DocumentType;
  filename: string;
  extractedData: ExtractedData;
  confidence: number;
  rawText: string;
  suggestedActions: TimelineAction[];
}

interface ExtractedData {
  properties: Partial<Property>[];
  events: Partial<TimelineEvent>[];
  dates: DateMention[];
  amounts: AmountMention[];
  addresses: AddressMention[];
}

class DocumentProcessor {
  async process(file: File): Promise<ProcessedDocument> {
    // 1. Extract raw text/content
    const rawContent = await this.extractContent(file);

    // 2. Use LLM to extract structured data
    const extractedData = await this.extractWithLLM(rawContent);

    // 3. Generate suggested actions
    const suggestedActions = this.generateActions(extractedData);

    return {
      type: this.getDocumentType(file),
      filename: file.name,
      extractedData,
      confidence: this.calculateConfidence(extractedData),
      rawText: rawContent,
      suggestedActions
    };
  }

  private async extractWithLLM(content: string): Promise<ExtractedData> {
    const prompt = `
      Extract property and CGT timeline information from the following document.

      Look for:
      - Property addresses
      - Purchase dates and amounts
      - Sale dates and amounts
      - Rental periods
      - Renovation/improvement costs
      - Dates when owner moved in/out

      Document content:
      ${content}

      Return a JSON object with the extracted information.
    `;

    const response = await this.llm.chat({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1 // Low temperature for extraction accuracy
    });

    return JSON.parse(response.content);
  }
}
```

### PDF Processing Example

```typescript
// src/lib/documents/PDFProcessor.ts
import pdfParse from 'pdf-parse';

class PDFProcessor {
  async extractText(buffer: Buffer): Promise<string> {
    const data = await pdfParse(buffer);
    return data.text;
  }

  async extractWithVision(buffer: Buffer): Promise<ExtractedData> {
    // Convert PDF pages to images for vision analysis
    const images = await this.pdfToImages(buffer);

    // Use GPT-4 Vision or Claude Vision
    const extractedData = await Promise.all(
      images.map(image => this.analyzeImage(image))
    );

    return this.mergeExtractedData(extractedData);
  }
}
```

---

## UI/UX Design

### Main Interface Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CGT Timeline                                    [Settings] [Help] [Export] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     TIMELINE VISUALIZATION                           │   │
│  │                                                                      │   │
│  │  [Property Cards and Events Display - Existing Component]            │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  AI TIMELINE BUILDER                                         [×]    │   │
│  │  ───────────────────────────────────────────────────────────────────│   │
│  │                                                                      │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │  Conversation History                                          │ │   │
│  │  │                                                                │ │   │
│  │  │  AI: Hello! I'm here to help you build your CGT timeline.     │ │   │
│  │  │      You can tell me about your properties, and I'll create   │ │   │
│  │  │      the timeline for you.                                    │ │   │
│  │  │                                                                │ │   │
│  │  │  You: I bought a house at 42 Smith St in 2015 for $800k       │ │   │
│  │  │                                                                │ │   │
│  │  │  AI: ✓ Added property at 42 Smith Street                      │ │   │
│  │  │      - Purchased: 2015                                        │ │   │
│  │  │      - Price: $800,000                                        │ │   │
│  │  │                                                                │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │ [📎 Upload] Type a message...                         [Send] │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │  🎤 Push to Talk   │   🔊 Voice: On   │   ⚙️ LLM: Deepseek  │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
AITimelineBuilder/
├── AITimelineBuilderPanel.tsx      # Main container
├── components/
│   ├── ConversationView.tsx        # Chat history display
│   ├── MessageBubble.tsx           # Individual message
│   ├── VoiceControls.tsx           # Voice input controls
│   ├── TextInput.tsx               # Text chat input
│   ├── DocumentUploader.tsx        # File upload zone
│   ├── LLMSelector.tsx             # LLM provider dropdown
│   ├── VoiceSettings.tsx           # Voice preferences
│   ├── ActionConfirmation.tsx      # Confirm destructive actions
│   └── ProcessingIndicator.tsx     # Loading/thinking states
├── hooks/
│   ├── useVoiceInput.ts            # Voice recording hook
│   ├── useConversation.ts          # Conversation state
│   ├── useLLM.ts                   # LLM communication
│   └── useDocumentProcessor.ts     # Document handling
└── lib/
    ├── voice/                      # Voice integration
    ├── llm/                        # LLM providers
    └── documents/                  # Document processing
```

### Voice Controls Component

```typescript
// src/components/ai-builder/VoiceControls.tsx
interface VoiceControlsProps {
  onTranscript: (text: string) => void;
  onStateChange: (state: VoiceState) => void;
  isAISpeaking: boolean;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'error';

export function VoiceControls({
  onTranscript,
  onStateChange,
  isAISpeaking
}: VoiceControlsProps) {
  const [state, setState] = useState<VoiceState>('idle');
  const [isPushToTalk, setIsPushToTalk] = useState(true);

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      {/* Push to Talk Button */}
      <Button
        variant={state === 'listening' ? 'destructive' : 'default'}
        onMouseDown={isPushToTalk ? startListening : undefined}
        onMouseUp={isPushToTalk ? stopListening : undefined}
        onClick={!isPushToTalk ? toggleListening : undefined}
        className="flex items-center gap-2"
      >
        {state === 'listening' ? (
          <>
            <MicOff className="w-5 h-5" />
            <span>Release to Send</span>
          </>
        ) : (
          <>
            <Mic className="w-5 h-5" />
            <span>{isPushToTalk ? 'Push to Talk' : 'Click to Talk'}</span>
          </>
        )}
      </Button>

      {/* Voice Activity Indicator */}
      {state === 'listening' && (
        <div className="flex items-center gap-1">
          <span className="animate-pulse text-red-500">●</span>
          <span className="text-sm text-gray-600">Listening...</span>
        </div>
      )}

      {/* AI Speaking Indicator */}
      {isAISpeaking && (
        <div className="flex items-center gap-2 text-blue-600">
          <Volume2 className="w-5 h-5 animate-pulse" />
          <span className="text-sm">AI Speaking</span>
        </div>
      )}

      {/* Mode Toggle */}
      <div className="ml-auto flex items-center gap-2">
        <span className="text-sm text-gray-500">Push to Talk</span>
        <Switch
          checked={isPushToTalk}
          onCheckedChange={setIsPushToTalk}
        />
      </div>
    </div>
  );
}
```

### LLM Selector Component

```typescript
// src/components/ai-builder/LLMSelector.tsx
export function LLMSelector() {
  const { selectedLLMProvider, availableLLMProviders, setSelectedLLMProvider }
    = useTimelineStore();

  return (
    <Select value={selectedLLMProvider} onValueChange={setSelectedLLMProvider}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Select LLM" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(availableLLMProviders).map(([id, name]) => (
          <SelectItem key={id} value={id}>
            <div className="flex items-center gap-2">
              <LLMIcon provider={id} className="w-4 h-4" />
              <span>{name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### Accessibility Considerations

- **Keyboard Navigation**: Full keyboard support for all interactions
- **Screen Reader**: ARIA labels for voice controls and status indicators
- **Visual Feedback**: Clear visual states for listening, processing, speaking
- **Captions**: Real-time captions for AI voice output
- **Alternative Input**: Text input always available as fallback

---

## Technical Implementation

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── voice/
│   │   │   ├── connect/route.ts      # WebSocket proxy
│   │   │   ├── transcribe/route.ts   # STT endpoint
│   │   │   └── synthesize/route.ts   # TTS endpoint
│   │   ├── llm/
│   │   │   ├── chat/route.ts         # LLM chat endpoint
│   │   │   └── providers/route.ts    # Get available providers
│   │   └── documents/
│   │       └── process/route.ts      # Document processing
│   └── ...
├── components/
│   ├── ai-builder/
│   │   ├── AITimelineBuilder.tsx
│   │   ├── ConversationView.tsx
│   │   ├── VoiceControls.tsx
│   │   ├── TextInput.tsx
│   │   ├── DocumentUploader.tsx
│   │   ├── LLMSelector.tsx
│   │   └── ...
│   └── ...
├── lib/
│   ├── voice/
│   │   ├── deepgram.ts              # Deepgram integration
│   │   ├── elevenlabs.ts            # ElevenLabs integration
│   │   ├── VoiceManager.ts          # Voice orchestration
│   │   └── types.ts
│   ├── llm/
│   │   ├── providers/
│   │   │   ├── deepseek.ts
│   │   │   ├── claude.ts
│   │   │   ├── openai.ts
│   │   │   └── gemini.ts
│   │   ├── LLMFactory.ts
│   │   ├── tools.ts
│   │   └── types.ts
│   ├── actions/
│   │   ├── ActionExecutor.ts
│   │   ├── UndoManager.ts
│   │   └── types.ts
│   ├── documents/
│   │   ├── DocumentProcessor.ts
│   │   ├── PDFProcessor.ts
│   │   └── types.ts
│   └── conversation/
│       ├── ConversationManager.ts
│       ├── IntentRecognizer.ts
│       └── types.ts
├── hooks/
│   ├── useVoiceInput.ts
│   ├── useConversation.ts
│   ├── useLLM.ts
│   └── useDocumentProcessor.ts
├── store/
│   └── timeline.ts                   # Add voice/LLM state
└── types/
    └── ai-builder.ts
```

### WebSocket Connection for Voice

```typescript
// src/lib/voice/deepgram.ts
export class DeepgramVoiceClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(
    private apiKey: string,
    private onTranscript: (text: string) => void,
    private onAudio: (audio: ArrayBuffer) => void,
    private onError: (error: Error) => void
  ) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(
        `wss://agent.deepgram.com/v1/agent/converse`,
        {
          headers: {
            'Authorization': `Token ${this.apiKey}`
          }
        }
      );

      this.ws.onopen = () => {
        this.sendSettings();
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        this.onError(new Error('WebSocket error'));
        reject(error);
      };

      this.ws.onclose = () => {
        this.handleDisconnect();
      };
    });
  }

  private sendSettings(): void {
    const settings = {
      type: 'SettingsConfiguration',
      audio: {
        input: {
          encoding: 'linear16',
          sample_rate: 16000
        },
        output: {
          encoding: 'linear16',
          sample_rate: 24000
        }
      },
      agent: {
        listen: {
          model: 'nova-2',
          language: 'en-AU'  // Australian English
        }
      }
    };

    this.ws?.send(JSON.stringify(settings));
  }

  sendAudio(audioData: ArrayBuffer): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(audioData);
    }
  }

  private handleMessage(data: any): void {
    const message = JSON.parse(data);

    switch (message.type) {
      case 'Transcript':
        this.onTranscript(message.transcript);
        break;
      case 'Audio':
        this.onAudio(message.audio);
        break;
      case 'Error':
        this.onError(new Error(message.error));
        break;
    }
  }

  private handleDisconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
    }
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }
}
```

### System Prompt for Timeline AI

```typescript
// src/lib/conversation/systemPrompt.ts
export const TIMELINE_AI_SYSTEM_PROMPT = `
You are an AI assistant specialized in helping users build Capital Gains Tax (CGT) timelines for Australian properties. Your role is to have natural conversations and help users add, edit, and manage their property portfolio timeline.

## Your Capabilities
You can:
1. Add new properties to the timeline
2. Add events to existing properties (purchases, sales, rentals, improvements, etc.)
3. Edit property and event details
4. Delete properties or events
5. Undo and redo actions
6. Calculate CGT implications
7. Answer questions about Australian CGT rules

## Conversation Guidelines
- Be conversational and natural
- Ask clarifying questions when information is missing
- Confirm destructive actions (deletions)
- Provide helpful summaries after actions
- Use Australian English and currency formatting
- Be proactive in asking about common events (moves, rentals, improvements)

## CGT Event Types
- purchase: Property purchase
- sale: Property sale
- move_in: Owner moves into property
- move_out: Owner moves out
- rent_start: Property begins being rented
- rent_end: Rental period ends
- improvement: Capital improvements made
- refinance: Loan refinancing
- status_change: Property status change
- living_in_rental_start: Owner moves into rental property
- living_in_rental_end: Owner moves out of rental property

## Property Status Types
- ppr: Principal Place of Residence (main home)
- rental: Investment/rental property
- vacant: Unoccupied property
- construction: Under construction
- sold: Property has been sold
- living_in_rental: Owner living in former rental

## Important CGT Rules to Remember
- Main residence exemption (full exemption for PPR)
- 6-year absence rule (can rent PPR for up to 6 years)
- 50% CGT discount for assets held over 12 months
- Cost base includes purchase price, stamp duty, legal fees, improvements
- Market value at 20 September 1985 for pre-CGT assets

## Response Format
When performing actions, always confirm what you've done:
"I've added [property/event] to your timeline:
- [Key detail 1]
- [Key detail 2]
Would you like to add anything else?"

## Current Timeline Context
The user's current timeline will be provided in the conversation. Reference it when discussing existing properties or suggesting edits.
`;
```

### Environment Variables

```env
# .env.local additions

# Voice APIs
DEEPGRAM_API_KEY=your_deepgram_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
OPENAI_REALTIME_API_KEY=your_openai_realtime_key  # Optional

# LLM Providers
DEEPSEEK_API_KEY=your_deepseek_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key

# Feature Flags
NEXT_PUBLIC_ENABLE_VOICE=true
NEXT_PUBLIC_ENABLE_DOCUMENT_UPLOAD=true
NEXT_PUBLIC_DEFAULT_LLM_PROVIDER=deepseek
```

---

## Security Considerations

### API Key Management

```typescript
// All API keys stored server-side only
// Client requests proxied through Next.js API routes

// src/app/api/voice/connect/route.ts
export async function POST(req: Request) {
  // Verify user session
  const session = await getSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Create temporary token for client
  const tempToken = await createTemporaryToken({
    userId: session.userId,
    expiresIn: '5m'
  });

  return Response.json({ token: tempToken });
}
```

### Rate Limiting

```typescript
// src/middleware.ts
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500
});

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/')) {
    try {
      await limiter.check(req, 30); // 30 requests per minute
    } catch {
      return new Response('Rate limit exceeded', { status: 429 });
    }
  }
}
```

### Input Validation

```typescript
// Validate all LLM tool call parameters
import { z } from 'zod';

const AddPropertySchema = z.object({
  address: z.string().min(5).max(200),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  purchasePrice: z.number().positive().max(100000000),
  propertyType: z.enum(['house', 'unit', 'land', 'commercial'])
});

function validateToolCall(name: string, params: unknown): boolean {
  switch (name) {
    case 'add_property':
      return AddPropertySchema.safeParse(params).success;
    // ... other validators
    default:
      return false;
  }
}
```

### Audio Data Handling

- Audio streams processed in real-time, not stored
- Transcripts stored only for conversation history
- Optional: Encrypt stored conversation history
- User can delete conversation history at any time

---

## Phase-by-Phase Implementation

### Phase 1: Core Voice Infrastructure (2-3 weeks)
**Priority: High**

**Tasks:**
1. Set up Deepgram Voice Agent API integration
   - WebSocket connection management
   - Audio streaming (microphone input)
   - Transcript handling
   - Keep-alive mechanism

2. Implement basic voice UI components
   - VoiceControls component
   - Push-to-talk button
   - Audio visualization
   - Status indicators

3. Create voice API routes
   - `/api/voice/connect` - WebSocket proxy
   - `/api/voice/token` - Temporary token generation

**Deliverables:**
- [ ] Working voice input with transcription
- [ ] Basic UI for voice controls
- [ ] Audio streaming infrastructure

### Phase 2: LLM Abstraction Layer (1-2 weeks)
**Priority: High**

**Tasks:**
1. Build LLM provider abstraction
   - Common interface for all providers
   - Provider factory pattern
   - Streaming support

2. Implement provider integrations
   - Deepseek (primary)
   - Claude (secondary)
   - GPT-4 (tertiary)
   - Gemini (optional)

3. Create tool calling framework
   - Define timeline tools schema
   - Tool execution handlers
   - Response parsing

**Deliverables:**
- [ ] Working LLM abstraction layer
- [ ] At least 2 provider integrations
- [ ] Tool calling implementation

### Phase 3: Conversation System (2-3 weeks)
**Priority: High**

**Tasks:**
1. Build ConversationManager
   - State machine implementation
   - Context management
   - Intent recognition

2. Implement conversation flow
   - System prompt engineering
   - Multi-turn dialogue handling
   - Error recovery patterns

3. Create ConversationView component
   - Message history display
   - Typing indicators
   - Action confirmations

**Deliverables:**
- [ ] Working conversation system
- [ ] Message history UI
- [ ] Basic intent recognition

### Phase 4: Timeline Actions (1-2 weeks)
**Priority: High**

**Tasks:**
1. Implement ActionExecutor
   - Execute timeline modifications
   - Validate tool parameters
   - Handle errors gracefully

2. Build UndoManager
   - State snapshots
   - Undo/redo stack
   - Action descriptions

3. Connect to Zustand store
   - Wire up action execution
   - Real-time timeline updates

**Deliverables:**
- [ ] Working action execution
- [ ] Undo/redo functionality
- [ ] Timeline updates from AI commands

### Phase 5: Voice Output (1-2 weeks)
**Priority: Medium**

**Tasks:**
1. Integrate ElevenLabs TTS
   - Text-to-speech API calls
   - Audio playback queue
   - Voice selection

2. Implement interruption handling
   - VAD integration
   - Audio truncation
   - Context preservation

3. Add voice settings UI
   - Voice selection dropdown
   - Speed/pitch controls
   - Mute/unmute

**Deliverables:**
- [ ] AI voice responses
- [ ] Interruption handling
- [ ] Voice settings

### Phase 6: Document Processing (1-2 weeks)
**Priority: Medium**

**Tasks:**
1. Build DocumentProcessor
   - PDF text extraction
   - Vision API integration
   - Structured data extraction

2. Create DocumentUploader component
   - Drag-and-drop upload
   - Progress indicators
   - Preview/confirmation

3. Connect to conversation
   - Inject extracted data
   - Generate suggested actions

**Deliverables:**
- [ ] PDF upload and processing
- [ ] Data extraction with LLM
- [ ] Document UI components

### Phase 7: Polish & Testing (1-2 weeks)
**Priority: Medium**

**Tasks:**
1. Error handling improvements
   - Graceful degradation
   - Retry mechanisms
   - User-friendly error messages

2. Performance optimization
   - Audio latency reduction
   - Streaming optimizations
   - Caching strategies

3. Accessibility
   - Screen reader support
   - Keyboard navigation
   - Visual feedback

4. Testing
   - Unit tests for core logic
   - Integration tests for APIs
   - E2E voice flow tests

**Deliverables:**
- [ ] Production-ready error handling
- [ ] Performance optimizations
- [ ] Accessibility compliance
- [ ] Test coverage

### Phase 8: Advanced Features (Ongoing)
**Priority: Low**

**Tasks:**
1. Multi-language support
2. Voice cloning for custom AI voices
3. Advanced document types (Excel, images)
4. Conversation export/import
5. AI suggestions and proactive help

---

## API Requirements

### Required API Keys

| Provider | Purpose | Pricing Model |
|----------|---------|---------------|
| **Deepgram** | Speech-to-Text, Voice Agent | $4.50/hour (Voice Agent) |
| **ElevenLabs** | Text-to-Speech | $0.096/minute (Business) |
| **Deepseek** | LLM (Primary) | $0.14/1M input, $0.28/1M output |
| **Anthropic** | LLM (Secondary) | $3/1M input, $15/1M output |
| **OpenAI** | LLM (Tertiary), Vision | $10/1M input, $30/1M output |
| **Google** | LLM (Optional), Vision | $0.10/1M input, $0.40/1M output |

### API Documentation Links

- **Deepgram Voice Agent**: https://developers.deepgram.com/docs/voice-agent
- **ElevenLabs API**: https://elevenlabs.io/docs/api-reference
- **Deepseek API**: https://platform.deepseek.com/api-docs
- **Anthropic Claude**: https://docs.anthropic.com/en/api
- **OpenAI API**: https://platform.openai.com/docs
- **Google Gemini**: https://ai.google.dev/docs

---

## Cost Analysis

### Estimated Monthly Costs

**Assumptions:**
- 100 active users
- Average 30 minutes voice interaction per user per month
- Average 10 document uploads per user per month
- Average 50 LLM requests per user per month

| Component | Calculation | Monthly Cost |
|-----------|-------------|--------------|
| Deepgram Voice | 100 users × 30 min × $0.075/min | $225 |
| ElevenLabs TTS | 100 users × 15 min AI speech × $0.096/min | $144 |
| Deepseek LLM | 100 users × 50 req × 2K tokens × $0.14/1M | $1.40 |
| Document Processing | 100 users × 10 docs × 500 tokens × $0.14/1M | $0.07 |
| **Total Estimated** | | **~$370/month** |

**Notes:**
- Costs scale linearly with usage
- Claude/GPT-4 would increase LLM costs significantly
- Heavy voice users may incur higher costs
- Caching and optimization can reduce costs

### Cost Optimization Strategies

1. **Use Deepseek as default** - Significantly cheaper than alternatives
2. **Cache common responses** - Reduce redundant LLM calls
3. **Batch document processing** - Process multiple documents in single request
4. **Implement usage limits** - Prevent abuse
5. **Voice activity detection** - Only process actual speech

---

## Conclusion

This implementation plan provides a comprehensive roadmap for building an AI-powered Timeline Builder with voice interaction capabilities. The hybrid architecture using Deepgram for STT and ElevenLabs for TTS, combined with a flexible LLM abstraction layer, provides the best balance of quality, cost, and flexibility.

### Key Success Factors

1. **Natural Conversation Flow** - Users should feel like they're talking to a knowledgeable assistant
2. **Reliable Voice Recognition** - High accuracy transcription is critical for user trust
3. **Seamless Interruption** - Users must be able to interrupt and correct naturally
4. **Real-time Feedback** - Timeline should update immediately as user speaks
5. **Graceful Error Handling** - System should recover smoothly from errors

### Next Steps

1. Review and approve this implementation plan
2. Obtain required API keys
3. Set up development environment
4. Begin Phase 1 implementation
5. Conduct user testing after each phase

---

## References

### Research Sources

- [ElevenLabs Agents vs OpenAI Realtime API](https://elevenlabs.io/blog/elevenlabs-agents-vs-openai-realtime-api-conversational-agents-showdown)
- [Deepgram vs ElevenLabs 2025](https://aloa.co/ai/comparisons/ai-voice-comparison/deepgram-vs-elevenlabs)
- [How to Choose STT and TTS for Voice Agents](https://softcery.com/lab/how-to-choose-stt-tts-for-ai-voice-agents-in-2025-a-comprehensive-guide)
- [OpenAI Realtime API Documentation](https://platform.openai.com/docs/guides/realtime-conversations)
- [Deepgram Voice Agent API](https://developers.deepgram.com/docs/voice-agent)
- [LLM API Pricing Comparison 2025](https://intuitionlabs.ai/articles/llm-api-pricing-comparison-2025)
- [Best LLMs for Coding 2025](https://writingmate.ai/blog/best-llm-ai-coding)

---

*Document Version: 1.0*
*Last Updated: January 2026*
*Author: AI Timeline Builder Team*
