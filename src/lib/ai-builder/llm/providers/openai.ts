// OpenAI GPT LLM Provider Implementation

import type { ILLMService, LLMProvider, LLMRequest, LLMResponse, ToolCall, ChatMessage, MessageAttachment } from '../types';
import { LLM_PROVIDERS } from '../types';

// OpenAI content types for multimodal messages
type OpenAIContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail?: 'low' | 'high' | 'auto' } };

export class OpenAIService implements ILLMService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    this.baseUrl = 'https://api.openai.com/v1';
  }

  getProviderInfo(): LLMProvider {
    return LLM_PROVIDERS.gpt4;
  }

  /**
   * Convert attachments to OpenAI content parts
   */
  private attachmentsToContentParts(attachments: MessageAttachment[]): OpenAIContentPart[] {
    const parts: OpenAIContentPart[] = [];

    for (const attachment of attachments) {
      if (attachment.type === 'image') {
        // Image attachment - use OpenAI's image_url format with base64 data URL
        parts.push({
          type: 'image_url',
          image_url: {
            url: `data:${attachment.mimeType};base64,${attachment.data}`,
            detail: 'auto',
          },
        });
      } else if (attachment.type === 'document' || attachment.type === 'pdf') {
        // Document/PDF - include extracted text if available
        if (attachment.extractedText) {
          parts.push({
            type: 'text',
            text: `[Document: ${attachment.name}]\n${attachment.extractedText}`,
          });
        }
      }
    }

    return parts;
  }

  /**
   * Build multimodal content for a user message
   */
  private buildUserContent(msg: ChatMessage): string | OpenAIContentPart[] {
    // If no attachments, return simple string
    if (!msg.attachments || msg.attachments.length === 0) {
      return msg.content;
    }

    // Build content parts array
    const contentParts: OpenAIContentPart[] = [];

    // Add text content first
    if (msg.content) {
      contentParts.push({
        type: 'text',
        text: msg.content,
      });
    }

    // Add attachments
    const attachmentParts = this.attachmentsToContentParts(msg.attachments);
    contentParts.push(...attachmentParts);

    return contentParts;
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const provider = this.getProviderInfo();

    const messages = request.messages.map((msg) => {
      const mapped: Record<string, unknown> = {
        role: msg.role,
      };

      // For tool result messages
      if (msg.toolCallId) {
        mapped.tool_call_id = msg.toolCallId;
        mapped.content = msg.content;
      } else if (msg.name) {
        mapped.name = msg.name;
        mapped.content = msg.content;
      } else if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
        // User message with attachments (multimodal)
        mapped.content = this.buildUserContent(msg);
      } else {
        mapped.content = msg.content;
      }

      // For assistant messages with tool calls - REQUIRED for tool results to be valid
      if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
        mapped.tool_calls = msg.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments),
          },
        }));
      }

      return mapped;
    });

    const body: Record<string, unknown> = {
      model: provider.model,
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
      stream: false,
    };

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map((tool) => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));
      body.tool_choice = 'auto';
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const choice = data.choices[0];
      const message = choice.message;

      let toolCalls: ToolCall[] | undefined;
      if (message.tool_calls && message.tool_calls.length > 0) {
        toolCalls = message.tool_calls.map((tc: { id: string; function: { name: string; arguments: string } }) => ({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
        }));
      }

      const inputTokens = data.usage?.prompt_tokens || 0;
      const outputTokens = data.usage?.completion_tokens || 0;
      const cost =
        inputTokens * provider.costPerInputToken + outputTokens * provider.costPerOutputToken;

      return {
        content: message.content || '',
        toolCalls,
        usage: {
          inputTokens,
          outputTokens,
          cost,
        },
        finishReason: choice.finish_reason === 'tool_calls' ? 'tool_calls' : 'stop',
      };
    } catch (error) {
      console.error('OpenAI chat error:', error);
      throw error;
    }
  }

  async *streamChat(request: LLMRequest): AsyncGenerator<string> {
    const provider = this.getProviderInfo();

    const messages = request.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const body = {
      model: provider.model,
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
      stream: true,
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') return;

            try {
              const json = JSON.parse(data);
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('OpenAI stream error:', error);
      throw error;
    }
  }
}
