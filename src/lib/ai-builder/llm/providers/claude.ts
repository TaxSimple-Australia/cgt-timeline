// Claude (Anthropic) LLM Provider Implementation

import type { ILLMService, LLMProvider, LLMRequest, LLMResponse, ToolCall, ChatMessage, MessageAttachment } from '../types';
import { LLM_PROVIDERS } from '../types';

// Claude content block types
type ClaudeContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string };

export class ClaudeService implements ILLMService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.baseUrl = 'https://api.anthropic.com/v1';
  }

  getProviderInfo(): LLMProvider {
    return LLM_PROVIDERS.claude;
  }

  /**
   * Convert attachments to Claude content blocks
   */
  private attachmentsToContentBlocks(attachments: MessageAttachment[]): ClaudeContentBlock[] {
    const blocks: ClaudeContentBlock[] = [];

    for (const attachment of attachments) {
      if (attachment.type === 'image') {
        // Image attachment - use Claude's image format
        blocks.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: attachment.mimeType,
            data: attachment.data,
          },
        });
      } else if (attachment.type === 'document' || attachment.type === 'pdf') {
        // Document/PDF - if we have extracted text, include it
        if (attachment.extractedText) {
          blocks.push({
            type: 'text',
            text: `[Document: ${attachment.name}]\n${attachment.extractedText}`,
          });
        } else {
          // For PDFs without extracted text, try to send as-is if supported
          // Claude supports PDF in some models - try image-like format for visual docs
          if (attachment.mimeType === 'application/pdf') {
            blocks.push({
              type: 'text',
              text: `[PDF Document: ${attachment.name}] - Please analyze this document.`,
            });
          }
        }
      }
    }

    return blocks;
  }

  /**
   * Build multimodal content for a user message
   */
  private buildUserContent(msg: ChatMessage): string | ClaudeContentBlock[] {
    // If no attachments, return simple string
    if (!msg.attachments || msg.attachments.length === 0) {
      return msg.content;
    }

    // Build content blocks array
    const contentBlocks: ClaudeContentBlock[] = [];

    // Add attachments first (images appear before text for better context)
    const attachmentBlocks = this.attachmentsToContentBlocks(msg.attachments);
    contentBlocks.push(...attachmentBlocks);

    // Add text content
    if (msg.content) {
      contentBlocks.push({
        type: 'text',
        text: msg.content,
      });
    }

    return contentBlocks;
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const provider = this.getProviderInfo();

    // Extract system message
    const systemMessage = request.messages.find((m) => m.role === 'system');
    const otherMessages = request.messages
      .filter((m) => m.role !== 'system')
      .map((msg) => {
        // Tool result messages - converted to user role with tool_result content
        if (msg.role === 'tool') {
          return {
            role: 'user' as const,
            content: [
              {
                type: 'tool_result' as const,
                tool_use_id: msg.toolCallId,
                content: msg.content,
              },
            ],
          };
        }

        // Assistant messages with tool calls - need to include tool_use blocks
        if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
          const contentBlocks: Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }> = [];

          // Add text content if present
          if (msg.content) {
            contentBlocks.push({
              type: 'text',
              text: msg.content,
            });
          }

          // Add tool_use blocks for each tool call
          for (const toolCall of msg.toolCalls) {
            contentBlocks.push({
              type: 'tool_use',
              id: toolCall.id,
              name: toolCall.name,
              input: toolCall.arguments,
            });
          }

          return {
            role: 'assistant' as const,
            content: contentBlocks,
          };
        }

        // User messages with attachments (multimodal)
        if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
          return {
            role: 'user' as const,
            content: this.buildUserContent(msg),
          };
        }

        // Regular user/assistant messages
        return {
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        };
      });

    const body: Record<string, unknown> = {
      model: provider.model,
      max_tokens: request.maxTokens ?? 4096,
      messages: otherMessages,
    };

    if (systemMessage) {
      body.system = systemMessage.content;
    }

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters,
      }));
    }

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Extract text content and tool calls
      let content = '';
      const toolCalls: ToolCall[] = [];

      for (const block of data.content) {
        if (block.type === 'text') {
          content += block.text;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            arguments: block.input,
          });
        }
      }

      const inputTokens = data.usage?.input_tokens || 0;
      const outputTokens = data.usage?.output_tokens || 0;
      const cost =
        inputTokens * provider.costPerInputToken + outputTokens * provider.costPerOutputToken;

      return {
        content,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        usage: {
          inputTokens,
          outputTokens,
          cost,
        },
        finishReason: data.stop_reason === 'tool_use' ? 'tool_calls' : 'stop',
      };
    } catch (error) {
      console.error('Claude chat error:', error);
      throw error;
    }
  }

  async *streamChat(request: LLMRequest): AsyncGenerator<string> {
    const provider = this.getProviderInfo();

    const systemMessage = request.messages.find((m) => m.role === 'system');
    const otherMessages = request.messages
      .filter((m) => m.role !== 'system')
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    const body: Record<string, unknown> = {
      model: provider.model,
      max_tokens: request.maxTokens ?? 4096,
      messages: otherMessages,
      stream: true,
    };

    if (systemMessage) {
      body.system = systemMessage.content;
    }

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
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

            try {
              const json = JSON.parse(data);
              if (json.type === 'content_block_delta' && json.delta?.text) {
                yield json.delta.text;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Claude stream error:', error);
      throw error;
    }
  }
}
