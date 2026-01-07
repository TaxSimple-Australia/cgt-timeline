// Voice Manager - Orchestrates STT and TTS

import type { VoiceState, VoiceConfig, TranscriptEvent, VoiceEventHandlers } from './types';
import { DEFAULT_VOICE_CONFIG } from './types';
import { DeepgramClient } from './DeepgramClient';
import { ElevenLabsClient } from './ElevenLabsClient';

export interface VoiceManagerConfig {
  deepgramApiKey?: string | null;
  elevenlabsApiKey?: string | null;
  voiceConfig?: Partial<VoiceConfig>;
}

export interface VoiceCapabilities {
  sttAvailable: boolean;
  ttsAvailable: boolean;
}

export class VoiceManager {
  private sttClient: DeepgramClient | null = null;
  private ttsClient: ElevenLabsClient | null = null;
  private config: VoiceConfig;
  private handlers: VoiceEventHandlers;
  private state: VoiceState = 'idle';
  private currentTranscript = '';
  private isSpeakingInterrupted = false;
  private capabilities: VoiceCapabilities;

  constructor(config: VoiceManagerConfig, handlers: VoiceEventHandlers) {
    this.config = { ...DEFAULT_VOICE_CONFIG, ...config.voiceConfig };
    this.handlers = handlers;
    this.capabilities = {
      sttAvailable: !!config.deepgramApiKey,
      ttsAvailable: !!config.elevenlabsApiKey,
    };

    // Initialize STT client (Deepgram) - only if API key available
    if (config.deepgramApiKey) {
      this.sttClient = new DeepgramClient(
        {
          apiKey: config.deepgramApiKey,
          model: 'nova-2',
          language: this.config.language,
          sampleRate: this.config.sampleRate,
          vadEnabled: this.config.vadEnabled,
        },
        {
          onTranscript: this.handleTranscript.bind(this),
          onStateChange: this.handleSTTStateChange.bind(this),
          onError: this.handleError.bind(this),
          onInterrupt: this.handleInterrupt.bind(this),
        }
      );
    } else {
      console.log('VoiceManager: STT (Deepgram) not available - voice input disabled');
    }

    // Initialize TTS client (ElevenLabs) - only if API key available
    if (config.elevenlabsApiKey) {
      this.ttsClient = new ElevenLabsClient(
        {
          apiKey: config.elevenlabsApiKey,
          voice: this.config.voice,
        },
        {
          onStateChange: this.handleTTSStateChange.bind(this),
          onError: this.handleError.bind(this),
          onAudio: this.handlers.onAudio,
        }
      );
    } else {
      console.log('VoiceManager: TTS (ElevenLabs) not available - voice output disabled');
    }
  }

  getCapabilities(): VoiceCapabilities {
    return this.capabilities;
  }

  private setState(state: VoiceState): void {
    this.state = state;
    this.handlers.onStateChange(state);
  }

  getState(): VoiceState {
    return this.state;
  }

  private handleTranscript(transcript: TranscriptEvent): void {
    this.currentTranscript = transcript.text;
    this.handlers.onTranscript(transcript);
  }

  private handleSTTStateChange(state: VoiceState): void {
    if (state === 'listening') {
      this.setState('listening');
    } else if (state === 'error') {
      this.setState('error');
    }
  }

  private handleTTSStateChange(state: VoiceState): void {
    if (state === 'speaking') {
      this.setState('speaking');
    } else if (state === 'idle' && this.state === 'speaking') {
      this.setState('idle');
    }
  }

  private handleError(error: Error): void {
    console.error('Voice error:', error);
    this.handlers.onError(error);
    this.setState('error');
  }

  private handleInterrupt(): void {
    // User started speaking while AI is speaking
    if (this.config.bargeInEnabled && this.ttsClient?.isSpeaking()) {
      console.log('Barge-in detected, stopping speech');
      this.isSpeakingInterrupted = true;
      this.ttsClient.stopSpeaking();
      this.handlers.onInterrupt();
    }
  }

  async connect(): Promise<void> {
    // If no STT client, just go to idle (TTS-only mode)
    if (!this.sttClient) {
      console.log('VoiceManager: No STT client - operating in TTS-only mode');
      this.setState('idle');
      return;
    }

    this.setState('connecting');
    try {
      await this.sttClient.connect();
      this.setState('idle');
    } catch (error) {
      console.error('VoiceManager: STT connection failed:', error);
      // Don't throw - allow degraded operation with TTS-only
      this.setState('idle');
    }
  }

  disconnect(): void {
    this.sttClient?.disconnect();
    this.ttsClient?.disconnect();
    this.setState('idle');
  }

  async startListening(): Promise<void> {
    // Check if STT is available
    if (!this.sttClient) {
      console.warn('VoiceManager: Cannot start listening - STT not available');
      this.handlers.onError(new Error('Voice input not available. Please use text input instead.'));
      return;
    }

    // Stop any ongoing speech first
    if (this.ttsClient?.isSpeaking()) {
      this.ttsClient.stopSpeaking();
    }

    this.currentTranscript = '';
    await this.sttClient.startListening();
  }

  hasSTT(): boolean {
    return this.capabilities.sttAvailable;
  }

  hasTTS(): boolean {
    return this.capabilities.ttsAvailable;
  }

  stopListening(): string {
    this.sttClient?.stopListening();
    const transcript = this.currentTranscript;
    this.currentTranscript = '';
    return transcript;
  }

  async speak(text: string): Promise<void> {
    this.isSpeakingInterrupted = false;
    this.setState('speaking');

    try {
      await this.ttsClient?.speak(text);
    } catch (error) {
      if (!this.isSpeakingInterrupted) {
        throw error;
      }
    } finally {
      if (!this.isSpeakingInterrupted) {
        this.setState('idle');
      }
    }
  }

  stopSpeaking(): void {
    this.ttsClient?.stopSpeaking();
    this.setState('idle');
  }

  isConnected(): boolean {
    return this.sttClient?.isConnected() ?? false;
  }

  isSpeaking(): boolean {
    return this.ttsClient?.isSpeaking() ?? false;
  }

  getCurrentTranscript(): string {
    return this.currentTranscript;
  }

  updateConfig(config: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Static method to check if voice features are supported
  static isSupported(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      window.AudioContext
    );
  }

  // Request microphone permission
  static async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      return false;
    }
  }
}
