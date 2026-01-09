// LLM Provider Types and Interfaces

export interface LLMProvider {
  id: string;
  name: string;
  model: string;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsToolCalling: boolean;
  supportsVision: boolean;
  costPerInputToken: number;
  costPerOutputToken: number;
}

// Attachment types for multimodal messages
export type AttachmentType = 'image' | 'document' | 'pdf';

export interface MessageAttachment {
  type: AttachmentType;
  name: string;
  mimeType: string;
  // Base64 encoded data (without data URL prefix)
  data: string;
  // Optional extracted text for documents (pre-processed)
  extractedText?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  toolCallId?: string;
  name?: string;
  toolCalls?: ToolCall[]; // For assistant messages that invoke tools
  attachments?: MessageAttachment[]; // For multimodal messages (images, documents)
}

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  // Gemini 3 thought signature - required for multi-turn function calling
  thoughtSignature?: string;
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

export interface ILLMService {
  chat(request: LLMRequest): Promise<LLMResponse>;
  streamChat(request: LLMRequest): AsyncGenerator<string>;
  getProviderInfo(): LLMProvider;
}

// Provider configurations
export const LLM_PROVIDERS: Record<string, LLMProvider> = {
  deepseek: {
    id: 'deepseek',
    name: 'Deepseek V3',
    model: 'deepseek-chat',
    maxTokens: 128000,
    supportsStreaming: true,
    supportsToolCalling: true,
    supportsVision: false, // Deepseek doesn't support vision yet
    costPerInputToken: 0.00000014,
    costPerOutputToken: 0.00000028,
  },
  claude: {
    id: 'claude',
    name: 'Claude Sonnet 4',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 200000,
    supportsStreaming: true,
    supportsToolCalling: true,
    supportsVision: true, // Claude supports vision
    costPerInputToken: 0.000003,
    costPerOutputToken: 0.000015,
  },
  gpt4: {
    id: 'gpt4',
    name: 'GPT-4o',
    model: 'gpt-4o',
    maxTokens: 128000,
    supportsStreaming: true,
    supportsToolCalling: true,
    supportsVision: true, // GPT-4o supports vision
    costPerInputToken: 0.0000025,
    costPerOutputToken: 0.00001,
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini 3 Pro',
    model: 'gemini-3-pro-preview',
    maxTokens: 1000000,
    supportsStreaming: true,
    supportsToolCalling: true,
    supportsVision: true, // Gemini supports vision
    costPerInputToken: 0.00000125,
    costPerOutputToken: 0.000005,
  },
};
