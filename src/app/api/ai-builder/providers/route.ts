import { NextResponse } from 'next/server';
import { LLM_PROVIDERS } from '@/lib/ai-builder/llm/types';

export async function GET() {
  // Check which providers are available based on API keys
  const availableProviders: Record<string, string> = {};
  let defaultProvider = 'deepseek';

  const keyMap: Record<string, string> = {
    deepseek: 'DEEPSEEK_API_KEY',
    claude: 'ANTHROPIC_API_KEY',
    gpt4: 'OPENAI_API_KEY',
    gemini: 'GOOGLE_AI_API_KEY',
  };

  // Check each provider
  for (const [id, envKey] of Object.entries(keyMap)) {
    if (process.env[envKey]) {
      availableProviders[id] = LLM_PROVIDERS[id]?.name || id;
    }
  }

  // Determine default provider - Deepseek is preferred
  const preferredOrder = ['deepseek', 'claude', 'gemini', 'gpt4'];
  for (const id of preferredOrder) {
    if (id in availableProviders) {
      defaultProvider = id;
      break;
    }
  }

  // If no providers available, return mock list with Deepseek as default
  if (Object.keys(availableProviders).length === 0) {
    return NextResponse.json({
      providers: { deepseek: 'Deepseek Chat' },
      default: 'deepseek',
      warning: 'No LLM API keys configured. Using mock mode.',
    });
  }

  return NextResponse.json({
    providers: availableProviders,
    default: defaultProvider,
  });
}
