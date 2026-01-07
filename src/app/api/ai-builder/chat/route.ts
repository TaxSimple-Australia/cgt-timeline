import { NextRequest, NextResponse } from 'next/server';
import { LLMFactory } from '@/lib/ai-builder/llm';
import type { ChatMessage, Tool } from '@/lib/ai-builder/llm/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      messages,
      provider = 'deepseek',
      tools,
      temperature = 0.7,
      maxTokens = 2048,
      stream = false,
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Set API keys from environment (key names must match provider IDs)
    LLMFactory.setApiKeys({
      deepseek: process.env.DEEPSEEK_API_KEY || '',
      claude: process.env.ANTHROPIC_API_KEY || '',
      gpt4: process.env.OPENAI_API_KEY || '',  // Note: provider ID is 'gpt4'
      gemini: process.env.GOOGLE_AI_API_KEY || '',
    });

    console.log('AI Builder chat request:', {
      provider,
      messageCount: messages.length,
      hasTools: !!tools,
      toolCount: tools?.length,
    });

    // Check if provider is available
    if (!LLMFactory.isProviderAvailable(provider)) {
      const availableProviders = LLMFactory.getAvailableProviderIds();
      console.log('Available providers:', availableProviders);
      return NextResponse.json(
        {
          error: `LLM provider '${provider}' is not available. API key may be missing.`,
          availableProviders,
        },
        { status: 503 }
      );
    }

    const llmService = LLMFactory.getProvider(provider);

    if (stream) {
      // Streaming response
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            const generator = llmService.streamChat({
              messages: messages as ChatMessage[],
              temperature,
              maxTokens,
            });

            for await (const chunk of generator) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`)
              );
            }

            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } else {
      // Non-streaming response with tool support
      const response = await llmService.chat({
        messages: messages as ChatMessage[],
        tools: tools as Tool[],
        temperature,
        maxTokens,
      });

      console.log('AI Builder chat response:', {
        hasContent: !!response.content,
        contentLength: response.content?.length,
        hasToolCalls: !!response.toolCalls,
        toolCallCount: response.toolCalls?.length,
      });

      // Return response in format expected by ConversationManager
      return NextResponse.json({
        content: response.content || '',
        toolCalls: response.toolCalls || [],
        success: true,
      });
    }
  } catch (error) {
    console.error('AI Builder chat error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      },
      { status: 500 }
    );
  }
}
