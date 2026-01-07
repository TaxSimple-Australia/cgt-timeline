// LLM Provider Factory - Manages multiple LLM providers

import type { ILLMService, LLMProvider } from './types';
import { LLM_PROVIDERS } from './types';
import { DeepseekService } from './providers/deepseek';
import { ClaudeService } from './providers/claude';
import { OpenAIService } from './providers/openai';
import { GeminiService } from './providers/gemini';

export class LLMFactory {
  private static instances: Map<string, ILLMService> = new Map();
  private static apiKeys: Record<string, string> = {};

  /**
   * Set API keys for providers
   */
  static setApiKeys(keys: Record<string, string>): void {
    this.apiKeys = { ...this.apiKeys, ...keys };
    // Clear instances to force recreation with new keys
    this.instances.clear();
  }

  /**
   * Get an LLM service instance
   */
  static getProvider(providerId: string): ILLMService {
    if (!this.instances.has(providerId)) {
      const service = this.createProvider(providerId);
      this.instances.set(providerId, service);
    }
    return this.instances.get(providerId)!;
  }

  /**
   * Create a new provider instance
   */
  private static createProvider(providerId: string): ILLMService {
    switch (providerId) {
      case 'deepseek':
        return new DeepseekService(this.apiKeys.deepseek);
      case 'claude':
        return new ClaudeService(this.apiKeys.claude);
      case 'gpt4':
        return new OpenAIService(this.apiKeys.openai);
      case 'gemini':
        return new GeminiService(this.apiKeys.gemini);
      default:
        throw new Error(`Unknown LLM provider: ${providerId}`);
    }
  }

  /**
   * Get available providers
   */
  static getAvailableProviders(): LLMProvider[] {
    return Object.values(LLM_PROVIDERS);
  }

  /**
   * Get provider info by ID
   */
  static getProviderInfo(providerId: string): LLMProvider | undefined {
    return LLM_PROVIDERS[providerId];
  }

  /**
   * Check if a provider is available (has API key)
   */
  static isProviderAvailable(providerId: string): boolean {
    const keyMap: Record<string, string> = {
      deepseek: 'DEEPSEEK_API_KEY',
      claude: 'ANTHROPIC_API_KEY',
      gpt4: 'OPENAI_API_KEY',
      gemini: 'GOOGLE_AI_API_KEY',
    };

    const envKey = keyMap[providerId];
    if (!envKey) return false;

    return !!(this.apiKeys[providerId] || process.env[envKey]);
  }

  /**
   * Get all available provider IDs (those with API keys)
   */
  static getAvailableProviderIds(): string[] {
    return Object.keys(LLM_PROVIDERS).filter((id) => this.isProviderAvailable(id));
  }

  /**
   * Get the default provider (first available, preferring deepseek)
   */
  static getDefaultProviderId(): string {
    const preferred = ['deepseek', 'claude', 'gpt4', 'gemini'];
    for (const id of preferred) {
      if (this.isProviderAvailable(id)) {
        return id;
      }
    }
    return 'deepseek'; // Fallback
  }

  /**
   * Clear cached instances (useful for testing or API key changes)
   */
  static clearInstances(): void {
    this.instances.clear();
  }
}
