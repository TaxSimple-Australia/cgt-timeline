// Deepgram Voice Client - Speech-to-Text
// Optimized for clean voice input with noise reduction

import type { VoiceState, TranscriptEvent, VoiceEventHandlers } from './types';

export interface DeepgramConfig {
  apiKey: string;
  model?: string;
  language?: string;
  sampleRate?: number;
  vadEnabled?: boolean;
  interimResults?: boolean;
  endpointingMs?: number;
  silenceThreshold?: number; // Minimum audio level to send (0-1)
}

export class DeepgramClient {
  private ws: WebSocket | null = null;
  private config: DeepgramConfig;
  private handlers: Partial<VoiceEventHandlers>;
  private state: VoiceState = 'idle';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private audioContext: AudioContext | null = null;
  private currentTranscript = '';
  private utteranceTimeout: NodeJS.Timeout | null = null;
  private isUserSpeaking = false;
  private lastAudioLevel = 0;

  constructor(config: DeepgramConfig, handlers: Partial<VoiceEventHandlers> = {}) {
    this.config = {
      model: 'nova-2',
      language: 'en-AU',
      sampleRate: 16000,
      vadEnabled: true,
      interimResults: true,
      endpointingMs: 500, // Increased for better pause detection
      silenceThreshold: 0.01, // Only send audio above this level
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

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  async connect(): Promise<void> {
    if (this.isConnected()) return;

    this.setState('connecting');

    return new Promise((resolve, reject) => {
      // Build query parameters - using correct Deepgram API parameter names
      const params = new URLSearchParams({
        model: this.config.model!,
        language: this.config.language!,
        sample_rate: this.config.sampleRate!.toString(),
        encoding: 'linear16',
        channels: '1',
        interim_results: this.config.interimResults!.toString(),
        endpointing: this.config.endpointingMs!.toString(), // Correct parameter name
        smart_format: 'true',
        punctuate: 'true',
      });

      // Only add VAD events if enabled (optional parameter)
      if (this.config.vadEnabled) {
        params.append('vad_events', 'true');
      }

      // Build the WebSocket URL with authentication
      // For browser connections, Deepgram supports token in subprotocol
      const wsUrl = `wss://api.deepgram.com/v1/listen?${params.toString()}`;
      console.log('Deepgram connecting with params:', params.toString());

      // Create WebSocket with token authentication via subprotocol
      // Deepgram expects: Sec-WebSocket-Protocol: token, <api-key>
      this.ws = new WebSocket(wsUrl, ['token', this.config.apiKey]);

      this.ws.onopen = () => {
        console.log('Deepgram connected successfully');
        this.reconnectAttempts = 0;
        this.setState('idle');
        this.startKeepAlive();
        resolve();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error('Deepgram WebSocket error:', error);
        this.handlers.onError?.(new Error('WebSocket connection error - check API key'));
        this.setState('error');
        reject(error);
      };

      this.ws.onclose = (event) => {
        console.log('Deepgram disconnected:', event.code, event.reason);

        // Log specific close codes for debugging
        if (event.code === 1008) {
          console.error('Deepgram auth failed - invalid API key');
          this.handlers.onError?.(new Error('Deepgram authentication failed - check API key'));
        } else if (event.code === 1003) {
          console.error('Deepgram rejected data format');
        }

        this.stopKeepAlive();

        // Only auto-reconnect if it wasn't an auth failure
        if (event.code !== 1008) {
          this.handleDisconnect();
        } else {
          this.setState('error');
          this.handlers.onError?.(new Error('Deepgram authentication failed'));
        }
      };
    });
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      if (message.type === 'Results') {
        const transcript = message.channel?.alternatives?.[0]?.transcript || '';
        const isFinal = message.is_final || false;
        const confidence = message.channel?.alternatives?.[0]?.confidence || 0;
        const speechFinal = message.speech_final || false;

        if (transcript) {
          // Accumulate transcript
          if (isFinal) {
            this.currentTranscript += (this.currentTranscript ? ' ' : '') + transcript;
          }

          // Send interim updates for UI feedback
          const transcriptEvent: TranscriptEvent = {
            text: isFinal ? this.currentTranscript : this.currentTranscript + ' ' + transcript,
            isFinal: false, // Don't mark as final until utterance ends
            confidence,
            timestamp: Date.now(),
          };
          this.handlers.onTranscript?.(transcriptEvent);

          // Clear any existing utterance timeout
          if (this.utteranceTimeout) {
            clearTimeout(this.utteranceTimeout);
          }

          // Set timeout for utterance end detection (backup for when Deepgram doesn't send UtteranceEnd)
          this.utteranceTimeout = setTimeout(() => {
            this.finalizeUtterance();
          }, 1500); // 1.5 second pause = end of utterance
        }

        // If Deepgram indicates speech is final (user paused)
        if (speechFinal && this.currentTranscript) {
          this.finalizeUtterance();
        }
      } else if (message.type === 'SpeechStarted') {
        // User started speaking - potential interruption
        console.log('Deepgram: Speech started');
        this.isUserSpeaking = true;
        this.handlers.onInterrupt?.();
      } else if (message.type === 'UtteranceEnd') {
        // User finished speaking - finalize the transcript
        console.log('Deepgram: Utterance ended');
        this.isUserSpeaking = false;
        this.finalizeUtterance();
      } else if (message.type === 'Metadata') {
        console.log('Deepgram: Connection established', message.request_id);
      } else if (message.type === 'Error' || message.error) {
        console.error('Deepgram error response:', message);
        this.handlers.onError?.(new Error(message.error || message.message || 'Deepgram error'));
      }
    } catch (error) {
      console.error('Error parsing Deepgram message:', error, 'Raw data:', data);
    }
  }

  private finalizeUtterance(): void {
    if (this.utteranceTimeout) {
      clearTimeout(this.utteranceTimeout);
      this.utteranceTimeout = null;
    }

    if (this.currentTranscript.trim()) {
      console.log('Finalizing utterance:', this.currentTranscript);
      const transcriptEvent: TranscriptEvent = {
        text: this.currentTranscript.trim(),
        isFinal: true,
        confidence: 1,
        timestamp: Date.now(),
      };
      this.handlers.onTranscript?.(transcriptEvent);
      this.currentTranscript = '';
    }
  }

  private startKeepAlive(): void {
    this.keepAliveInterval = setInterval(() => {
      if (this.isConnected()) {
        this.ws?.send(JSON.stringify({ type: 'KeepAlive' }));
      }
    }, 5000);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  private handleDisconnect(): void {
    this.ws = null;
    this.stopKeepAlive();

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * this.reconnectAttempts, 10000);
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    } else {
      this.setState('error');
      this.handlers.onError?.(new Error('Max reconnection attempts reached'));
    }
  }

  async startListening(): Promise<void> {
    if (!this.isConnected()) {
      await this.connect();
    }

    // Reset state
    this.currentTranscript = '';
    this.isUserSpeaking = false;
    if (this.utteranceTimeout) {
      clearTimeout(this.utteranceTimeout);
      this.utteranceTimeout = null;
    }

    this.setState('listening');

    try {
      // Request microphone with enhanced noise suppression
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: { ideal: this.config.sampleRate },
          channelCount: 1,
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
          // Additional constraints for cleaner audio
          latency: { ideal: 0 },
          suppressLocalAudioPlayback: true,
        } as MediaTrackConstraints,
      });

      this.audioContext = new AudioContext({ sampleRate: this.config.sampleRate });
      const source = this.audioContext.createMediaStreamSource(stream);

      // Add a high-pass filter to remove low-frequency noise (rumble, hum)
      const highPassFilter = this.audioContext.createBiquadFilter();
      highPassFilter.type = 'highpass';
      highPassFilter.frequency.value = 80; // Cut frequencies below 80Hz

      // Add a low-pass filter to remove high-frequency noise (hiss)
      const lowPassFilter = this.audioContext.createBiquadFilter();
      lowPassFilter.type = 'lowpass';
      lowPassFilter.frequency.value = 8000; // Cut frequencies above 8kHz

      // Add a compressor to even out volume levels
      const compressor = this.audioContext.createDynamicsCompressor();
      compressor.threshold.value = -50;
      compressor.knee.value = 40;
      compressor.ratio.value = 12;
      compressor.attack.value = 0;
      compressor.release.value = 0.25;

      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      // Connect the audio processing chain
      source.connect(highPassFilter);
      highPassFilter.connect(lowPassFilter);
      lowPassFilter.connect(compressor);
      compressor.connect(processor);
      processor.connect(this.audioContext.destination);

      let silentFrames = 0;
      const maxSilentFrames = 10; // Allow some silent frames before stopping send

      processor.onaudioprocess = (e) => {
        if (this.isConnected() && this.state === 'listening') {
          const inputData = e.inputBuffer.getChannelData(0);

          // Calculate RMS (root mean square) for audio level
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i];
          }
          const rms = Math.sqrt(sum / inputData.length);
          this.lastAudioLevel = rms;

          // Only send audio if it's above the silence threshold
          if (rms > this.config.silenceThreshold!) {
            silentFrames = 0;
            const pcmData = this.floatTo16BitPCM(inputData);
            this.ws?.send(pcmData);
          } else {
            silentFrames++;
            // Send a few silent frames to help Deepgram detect end of speech
            if (silentFrames <= maxSilentFrames) {
              const pcmData = this.floatTo16BitPCM(inputData);
              this.ws?.send(pcmData);
            }
          }
        }
      };

      // Store for cleanup
      const self = this as unknown as {
        _stream: MediaStream;
        _processor: ScriptProcessorNode;
        _source: MediaStreamAudioSourceNode;
        _filters: BiquadFilterNode[];
        _compressor: DynamicsCompressorNode;
      };
      self._stream = stream;
      self._processor = processor;
      self._source = source;
      self._filters = [highPassFilter, lowPassFilter];
      self._compressor = compressor;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      this.setState('error');
      this.handlers.onError?.(error instanceof Error ? error : new Error('Microphone access denied'));
    }
  }

  // Get current audio level (for UI visualization)
  getAudioLevel(): number {
    return this.lastAudioLevel;
  }

  // Check if user is currently speaking
  isSpeaking(): boolean {
    return this.isUserSpeaking;
  }

  stopListening(): void {
    this.setState('idle');

    // Clear any pending utterance
    if (this.utteranceTimeout) {
      clearTimeout(this.utteranceTimeout);
      this.utteranceTimeout = null;
    }
    this.currentTranscript = '';
    this.isUserSpeaking = false;

    // Clean up audio resources
    const self = this as unknown as {
      _stream?: MediaStream;
      _processor?: ScriptProcessorNode;
      _source?: MediaStreamAudioSourceNode;
      _filters?: BiquadFilterNode[];
      _compressor?: DynamicsCompressorNode;
    };

    if (self._processor) {
      self._processor.disconnect();
      self._processor = undefined;
    }

    if (self._compressor) {
      self._compressor.disconnect();
      self._compressor = undefined;
    }

    if (self._filters) {
      self._filters.forEach(filter => filter.disconnect());
      self._filters = undefined;
    }

    if (self._source) {
      self._source.disconnect();
      self._source = undefined;
    }

    if (self._stream) {
      self._stream.getTracks().forEach((track) => track.stop());
      self._stream = undefined;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  disconnect(): void {
    this.stopListening();
    this.stopKeepAlive();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setState('idle');
  }

  private floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return buffer;
  }
}
