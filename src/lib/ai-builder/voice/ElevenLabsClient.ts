// ElevenLabs Client - Text-to-Speech

import type { VoiceState, AudioChunk, VoiceEventHandlers } from './types';
import { ELEVENLABS_VOICES } from './types';

export interface ElevenLabsConfig {
  apiKey: string;
  voice?: string;
  voiceId?: string;
  model?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export class ElevenLabsClient {
  private config: ElevenLabsConfig;
  private handlers: Partial<VoiceEventHandlers>;
  private state: VoiceState = 'idle';
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private abortController: AbortController | null = null;

  constructor(config: ElevenLabsConfig, handlers: Partial<VoiceEventHandlers> = {}) {
    this.config = {
      voice: 'Rachel',
      model: 'eleven_turbo_v2_5',
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.0,
      useSpeakerBoost: true,
      ...config,
    };
    this.handlers = handlers;
  }

  private setState(state: VoiceState): void {
    this.state = state;
    this.handlers.onStateChange?.(state);
  }

  getState(): VoiceState {
    return this.state;
  }

  private getVoiceId(): string {
    if (this.config.voiceId) {
      return this.config.voiceId;
    }
    const voiceName = this.config.voice as keyof typeof ELEVENLABS_VOICES;
    return ELEVENLABS_VOICES[voiceName] || ELEVENLABS_VOICES.Rachel;
  }

  async speak(text: string): Promise<void> {
    if (!text.trim()) return;

    this.setState('speaking');
    this.abortController = new AbortController();

    try {
      const voiceId = this.getVoiceId();
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this.config.apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: this.config.model,
            voice_settings: {
              stability: this.config.stability,
              similarity_boost: this.config.similarityBoost,
              style: this.config.style,
              use_speaker_boost: this.config.useSpeakerBoost,
            },
          }),
          signal: this.abortController.signal,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
      }

      // Stream the audio
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      // Combine chunks
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const audioData = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        audioData.set(chunk, offset);
        offset += chunk.length;
      }

      // Play audio
      await this.playAudio(audioData.buffer);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Speech cancelled');
      } else {
        console.error('ElevenLabs speak error:', error);
        this.handlers.onError?.(error instanceof Error ? error : new Error('Speech synthesis failed'));
      }
    } finally {
      this.setState('idle');
      this.abortController = null;
    }
  }

  async speakStreaming(text: string): Promise<void> {
    if (!text.trim()) return;

    this.setState('speaking');
    this.abortController = new AbortController();

    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    try {
      const voiceId = this.getVoiceId();
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': this.config.apiKey,
            Accept: 'audio/mpeg',
          },
          body: JSON.stringify({
            text,
            model_id: this.config.model,
            voice_settings: {
              stability: this.config.stability,
              similarity_boost: this.config.similarityBoost,
              style: this.config.style,
              use_speaker_boost: this.config.useSpeakerBoost,
            },
            output_format: 'mp3_44100_128',
          }),
          signal: this.abortController.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      // Read the entire stream first
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);

        // Emit audio chunk event
        this.handlers.onAudio?.({
          data: value.buffer,
          timestamp: Date.now(),
        });
      }

      // Combine and play
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const audioData = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        audioData.set(chunk, offset);
        offset += chunk.length;
      }

      await this.playAudio(audioData.buffer);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('ElevenLabs streaming error:', error);
        this.handlers.onError?.(error instanceof Error ? error : new Error('Streaming synthesis failed'));
      }
    } finally {
      this.setState('idle');
    }
  }

  private async playAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(audioData.slice(0));
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      this.currentSource = source;
      this.isPlaying = true;

      return new Promise((resolve) => {
        source.onended = () => {
          this.isPlaying = false;
          this.currentSource = null;
          resolve();
        };
        source.start(0);
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      throw error;
    }
  }

  stopSpeaking(): void {
    // Cancel ongoing fetch
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Stop current audio
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // Ignore errors if already stopped
      }
      this.currentSource = null;
    }

    this.isPlaying = false;
    this.audioQueue = [];
    this.setState('idle');
  }

  isSpeaking(): boolean {
    return this.isPlaying || this.state === 'speaking';
  }

  disconnect(): void {
    this.stopSpeaking();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  // Get available voices
  static async getVoices(apiKey: string): Promise<Array<{ voice_id: string; name: string }>> {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data = await response.json();
      return data.voices;
    } catch (error) {
      console.error('Error fetching ElevenLabs voices:', error);
      return [];
    }
  }
}
