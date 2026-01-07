// Deepseek LLM Provider Implementation

import type { ILLMService, LLMProvider, LLMRequest, LLMResponse, ChatMessage, ToolCall, MessageAttachment } from '../types';
import { LLM_PROVIDERS } from '../types';

export class DeepseekService implements ILLMService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY || '';
    this.baseUrl = 'https://api.deepseek.com/v1';
  }

  getProviderInfo(): LLMProvider {
    return LLM_PROVIDERS.deepseek;
  }

  /**
   * Build content for a message with attachments
   * Deepseek doesn't support vision, so we only include text from documents
   * and a note about images that can't be processed
   */
  private buildContentWithAttachments(msg: ChatMessage): string {
    let content = msg.content || '';

    if (msg.attachments && msg.attachments.length > 0) {
      const attachmentTexts: string[] = [];

      for (const attachment of msg.attachments) {
        if (attachment.type === 'image') {
          // Deepseek doesn't support images - add a note
          attachmentTexts.push(`[Image attached: ${attachment.name} - Note: This model cannot process images directly. Please describe what you see or switch to a vision-capable model like Claude or GPT-4.]`);
        } else if ((attachment.type === 'document' || attachment.type === 'pdf') && attachment.extractedText) {
          // Include document text
          attachmentTexts.push(`[Document: ${attachment.name}]\n${attachment.extractedText}`);
        }
      }

      if (attachmentTexts.length > 0) {
        content = attachmentTexts.join('\n\n') + (content ? '\n\n' + content : '');
      }
    }

    return content;
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const provider = this.getProviderInfo();

    const messages = request.messages.map((msg) => {
      const mapped: Record<string, unknown> = {
        role: msg.role,
      };

      // Build content - handle attachments for user messages
      if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
        mapped.content = this.buildContentWithAttachments(msg);
      } else {
        mapped.content = msg.content;
      }

      // For tool result messages
      if (msg.toolCallId) {
        mapped.tool_call_id = msg.toolCallId;
      }
      if (msg.name) {
        mapped.name = msg.name;
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
        throw new Error(`Deepseek API error: ${response.status} - ${errorText}`);
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
      console.error('Deepseek chat error:', error);
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
        throw new Error(`Deepseek API error: ${response.status}`);
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
      console.error('Deepseek stream error:', error);
      throw error;
    }
  }
}
