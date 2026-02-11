// Google Gemini LLM Provider Implementation

import type { ILLMService, LLMProvider, LLMRequest, LLMResponse, ToolCall, ChatMessage, MessageAttachment } from '../types';
import { LLM_PROVIDERS } from '../types';

// Gemini content part types
type GeminiPart =
  | { text: string; thoughtSignature?: string }
  | { inlineData: { mimeType: string; data: string } }
  | { functionCall: { name: string; args: Record<string, unknown> }; thoughtSignature?: string }
  | { functionResponse: { name: string; response: unknown } };

export class GeminiService implements ILLMService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_AI_API_KEY || '';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  getProviderInfo(): LLMProvider {
    return LLM_PROVIDERS.gemini;
  }

  /**
   * Check if model is Gemini 3 series (uses thinkingLevel)
   */
  private isGemini3Model(model: string): boolean {
    return model.includes('gemini-3');
  }

  /**
   * Check if model is Gemini 2.5 series (uses thinkingBudget)
   */
  private isGemini25Model(model: string): boolean {
    return model.includes('gemini-2.5');
  }

  /**
   * Convert attachments to Gemini parts
   */
  private attachmentsToParts(attachments: MessageAttachment[]): GeminiPart[] {
    const parts: GeminiPart[] = [];

    for (const attachment of attachments) {
      if (attachment.type === 'image') {
        // Image attachment - use Gemini's inlineData format
        parts.push({
          inlineData: {
            mimeType: attachment.mimeType,
            data: attachment.data,
          },
        });
      } else if (attachment.type === 'pdf') {
        // PDF - Gemini supports PDF via inlineData natively
        if (attachment.data) {
          parts.push({
            inlineData: {
              mimeType: 'application/pdf',
              data: attachment.data,
            },
          });
        }
        // Also include extracted text as additional context
        if (attachment.extractedText) {
          parts.push({
            text: `[Extracted text from ${attachment.name}]\n${attachment.extractedText}`,
          });
        }
      } else if (attachment.type === 'document') {
        // Non-PDF document - include extracted text
        if (attachment.extractedText) {
          parts.push({
            text: `[Document: ${attachment.name}]\n${attachment.extractedText}`,
          });
        }
      }
    }

    return parts;
  }

  /**
   * Build multimodal parts for a user message
   */
  private buildUserParts(msg: ChatMessage): GeminiPart[] {
    const parts: GeminiPart[] = [];

    // Add attachments first (images before text)
    if (msg.attachments && msg.attachments.length > 0) {
      const attachmentParts = this.attachmentsToParts(msg.attachments);
      parts.push(...attachmentParts);
    }

    // Add text content
    if (msg.content) {
      parts.push({ text: msg.content });
    }

    return parts;
  }

  private convertToGeminiMessages(messages: LLMRequest['messages']) {
    const systemInstruction = messages.find((m) => m.role === 'system');
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((msg) => {
        // Tool result messages - converted to function role with functionResponse
        if (msg.role === 'tool') {
          let responseContent: unknown;
          try {
            responseContent = JSON.parse(msg.content);
          } catch {
            responseContent = { result: msg.content };
          }

          return {
            role: 'function',
            parts: [
              {
                functionResponse: {
                  name: msg.name || 'unknown',
                  response: responseContent,
                },
              },
            ],
          };
        }

        // Assistant messages with tool calls - include functionCall parts with thoughtSignature
        if (msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0) {
          const parts: Array<{
            text?: string;
            functionCall?: { name: string; args: Record<string, unknown> };
            thoughtSignature?: string;
          }> = [];

          // Add text content if present
          if (msg.content) {
            parts.push({ text: msg.content });
          }

          // Add functionCall for each tool call, including thoughtSignature if present
          for (const toolCall of msg.toolCalls) {
            const part: {
              functionCall: { name: string; args: Record<string, unknown> };
              thoughtSignature?: string;
            } = {
              functionCall: {
                name: toolCall.name,
                args: toolCall.arguments,
              },
            };

            // CRITICAL: Preserve thoughtSignature for Gemini 3 models
            // This is REQUIRED for multi-turn function calling to work correctly
            if (toolCall.thoughtSignature) {
              part.thoughtSignature = toolCall.thoughtSignature;
            }

            parts.push(part);
          }

          return {
            role: 'model',
            parts,
          };
        }

        // User messages with attachments (multimodal)
        if (msg.role === 'user' && msg.attachments && msg.attachments.length > 0) {
          return {
            role: 'user',
            parts: this.buildUserParts(msg),
          };
        }

        // Regular messages
        return {
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        };
      });

    return { systemInstruction, contents };
  }

  /**
   * Build generation config based on model type
   * - Gemini 3: uses thinkingLevel ("low" or "high")
   * - Gemini 2.5: uses thinkingBudget (integer)
   * - Other models: no thinking config
   *
   * IMPORTANT: Do NOT set maxOutputTokens for thinking models as it causes
   * the known bug where thinking tokens consume the budget and output is empty.
   */
  private buildGenerationConfig(model: string, request: LLMRequest): Record<string, unknown> {
    // Base config - temperature 1.0 recommended for thinking models
    const config: Record<string, unknown> = {
      temperature: request.temperature ?? 1.0,
    };

    // For Gemini 3 models: use thinkingLevel
    // Do NOT set maxOutputTokens - let the model handle it to avoid empty responses
    if (this.isGemini3Model(model)) {
      config.thinkingConfig = {
        // Use "low" for faster responses, "high" for complex reasoning (default)
        // "low" minimizes latency and cost, good for simple tasks
        thinkingLevel: 'low',
      };
      // Don't set maxOutputTokens for Gemini 3 - causes empty response bug
    }
    // For Gemini 2.5 models: use thinkingBudget
    else if (this.isGemini25Model(model)) {
      config.thinkingConfig = {
        // -1 = dynamic budget (recommended)
        // 0 = disable thinking (Flash only)
        // 1-24576 = specific budget
        thinkingBudget: -1,
      };
      // Don't set maxOutputTokens for thinking models
    }
    // For non-thinking models (1.5, etc.): can set maxOutputTokens
    else {
      config.maxOutputTokens = request.maxTokens ?? 8192;
    }

    return config;
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const provider = this.getProviderInfo();
    const { systemInstruction, contents } = this.convertToGeminiMessages(request.messages);

    const body: Record<string, unknown> = {
      contents,
      generationConfig: this.buildGenerationConfig(provider.model, request),
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction.content }],
      };
    }

    if (request.tools && request.tools.length > 0) {
      body.tools = [
        {
          functionDeclarations: request.tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
          })),
        },
      ];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/models/${provider.model}:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      const candidate = data.candidates?.[0];

      if (!candidate) {
        // Check if there's a prompt feedback or error
        if (data.promptFeedback) {
          throw new Error(`Gemini blocked request: ${JSON.stringify(data.promptFeedback)}`);
        }
        throw new Error('No response from Gemini');
      }

      let content = '';
      const toolCalls: ToolCall[] = [];

      // Handle different response structures
      const parts = candidate.content?.parts || candidate.parts || [];

      if (Array.isArray(parts)) {
        for (const part of parts) {
          // Extract text content (may coexist with thoughtSignature in Gemini 3)
          if (part.text) {
            content += part.text;
          }

          // Extract function calls with thoughtSignature preservation
          if (part.functionCall) {
            const toolCall: ToolCall = {
              id: `call_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              name: part.functionCall.name,
              arguments: part.functionCall.args || {},
            };

            // CRITICAL: Capture thoughtSignature for Gemini 3 models
            // This MUST be passed back in subsequent requests for multi-turn function calling
            if (part.thoughtSignature) {
              toolCall.thoughtSignature = part.thoughtSignature;
              console.log(`📝 Captured thoughtSignature for function call: ${part.functionCall.name}`);
            }

            toolCalls.push(toolCall);
          }
        }
      } else if (candidate.content?.text) {
        // Alternative format: direct text content
        content = candidate.content.text;
      } else if (typeof candidate.content === 'string') {
        // Simple string content
        content = candidate.content;
      }

      // Handle edge cases where content is empty
      if (!content && !toolCalls.length) {
        // Check finish reason for debugging
        const finishReason = candidate.finishReason;
        const thinkingTokens = data.usageMetadata?.thoughtsTokenCount || 0;

        if (finishReason === 'MAX_TOKENS') {
          console.warn(`Gemini hit MAX_TOKENS - thinking used ${thinkingTokens} tokens`);
          content = "I ran into a processing limit. Please try rephrasing your question or using a simpler query.";
        } else if (finishReason === 'SAFETY') {
          content = "I couldn't process that request due to safety filters. Please try rephrasing.";
        } else if (finishReason === 'RECITATION') {
          content = "I couldn't complete the response. Please try a different question.";
        } else {
          // Log for debugging
          console.warn(`Gemini returned empty content. Finish reason: ${finishReason}, Thinking tokens: ${thinkingTokens}`);
          console.warn('Response data:', JSON.stringify(data).substring(0, 500));
        }
      }

      const inputTokens = data.usageMetadata?.promptTokenCount || 0;
      const outputTokens = data.usageMetadata?.candidatesTokenCount || 0;
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
        finishReason:
          candidate.finishReason === 'STOP'
            ? toolCalls.length > 0
              ? 'tool_calls'
              : 'stop'
            : candidate.finishReason === 'MAX_TOKENS'
            ? 'length'
            : 'stop',
      };
    } catch (error) {
      console.error('Gemini chat error:', error);
      throw error;
    }
  }

  async *streamChat(request: LLMRequest): AsyncGenerator<string> {
    const provider = this.getProviderInfo();
    const { systemInstruction, contents } = this.convertToGeminiMessages(request.messages);

    const body: Record<string, unknown> = {
      contents,
      generationConfig: this.buildGenerationConfig(provider.model, request),
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction.content }],
      };
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/models/${provider.model}:streamGenerateContent?key=${this.apiKey}&alt=sse`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
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
              const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                yield text;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Gemini stream error:', error);
      throw error;
    }
  }
}
