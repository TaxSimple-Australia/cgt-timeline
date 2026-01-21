/**
 * OpenAI Realtime API Client
 *
 * Uses WebRTC for low-latency, speech-to-speech conversation with function calling.
 * This provides native interruption handling and smooth voice interaction.
 */

export interface RealtimeConfig {
  model?: string;
  voice?: string;
  instructions?: string;
  tools?: RealtimeTool[];
  turnDetection?: {
    type: 'server_vad';
    threshold?: number;
    prefix_padding_ms?: number;
    silence_duration_ms?: number;
  };
  inputAudioTranscription?: {
    model: string;
  };
}

export interface RealtimeTool {
  type: 'function';
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
      items?: { type: string };
    }>;
    required?: string[];
  };
}

export interface RealtimeEventHandlers {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  onSpeechStarted?: () => void;
  onSpeechStopped?: () => void;
  onTranscript?: (text: string, isFinal: boolean, role: 'user' | 'assistant') => void;
  onFunctionCall?: (name: string, args: Record<string, unknown>, callId: string) => void;
  onAudioLevel?: (level: number) => void;
  onStateChange?: (state: RealtimeState) => void;
}

export type RealtimeState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'error';

export class OpenAIRealtimeClient {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private mediaStream: MediaStream | null = null;
  private config: RealtimeConfig;
  private handlers: RealtimeEventHandlers;
  private state: RealtimeState = 'disconnected';
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioLevelInterval: NodeJS.Timeout | null = null;

  constructor(config: RealtimeConfig = {}, handlers: RealtimeEventHandlers = {}) {
    this.config = {
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: 'shimmer',
      turnDetection: {
        type: 'server_vad',
        threshold: 0.7, // Higher threshold reduces false triggers from background noise
        prefix_padding_ms: 300,
        silence_duration_ms: 700, // Longer silence required
      },
      inputAudioTranscription: {
        model: 'whisper-1',
      },
      ...config,
    };
    this.handlers = handlers;
  }

  private setState(state: RealtimeState): void {
    this.state = state;
    this.handlers.onStateChange?.(state);
  }

  getState(): RealtimeState {
    return this.state;
  }

  async connect(): Promise<void> {
    if (this.state === 'connected' || this.state === 'connecting') {
      console.log('Already connected or connecting');
      return;
    }

    this.setState('connecting');

    try {
      // Get ephemeral token from our API
      const tokenResponse = await fetch('/api/ai-builder/realtime-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.config.model }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        throw new Error(error.error || 'Failed to get realtime token');
      }

      const { client_secret } = await tokenResponse.json();

      // Create peer connection
      this.pc = new RTCPeerConnection();

      // Set up audio element for playback
      this.audioElement = document.createElement('audio');
      this.audioElement.autoplay = true;

      // Handle incoming audio track
      this.pc.ontrack = (event) => {
        console.log('Received audio track');
        if (this.audioElement) {
          this.audioElement.srcObject = event.streams[0];
        }
      };

      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
        },
      });

      // Add audio track to peer connection
      this.mediaStream.getTracks().forEach((track) => {
        this.pc!.addTrack(track, this.mediaStream!);
      });

      // Set up audio level monitoring
      this.setupAudioLevelMonitoring();

      // Create data channel for events
      this.dc = this.pc.createDataChannel('oai-events');
      this.setupDataChannel();

      // Create and set local description
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Send offer to OpenAI
      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = this.config.model;

      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${client_secret.value}`,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      });

      if (!sdpResponse.ok) {
        throw new Error('Failed to connect to OpenAI Realtime API');
      }

      const answerSdp = await sdpResponse.text();
      await this.pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      console.log('WebRTC connection established');
    } catch (error) {
      console.error('Connection error:', error);
      this.setState('error');
      this.handlers.onError?.(error instanceof Error ? error : new Error('Connection failed'));
      throw error;
    }
  }

  private setupDataChannel(): void {
    if (!this.dc) return;

    this.dc.onopen = () => {
      console.log('Data channel opened');
      this.setState('connected');
      this.handlers.onConnected?.();

      // Send session configuration
      this.sendSessionUpdate();
    };

    this.dc.onclose = () => {
      console.log('Data channel closed');
      this.setState('disconnected');
      this.handlers.onDisconnected?.();
    };

    this.dc.onerror = (error) => {
      console.error('Data channel error:', error);
      this.handlers.onError?.(new Error('Data channel error'));
    };

    this.dc.onmessage = (event) => {
      this.handleServerEvent(JSON.parse(event.data));
    };
  }

  private sendSessionUpdate(): void {
    if (!this.dc || this.dc.readyState !== 'open') return;

    const sessionConfig: Record<string, unknown> = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        voice: this.config.voice,
        turn_detection: this.config.turnDetection,
        input_audio_transcription: this.config.inputAudioTranscription,
      },
    };

    // Add instructions if provided
    if (this.config.instructions) {
      (sessionConfig.session as Record<string, unknown>).instructions = this.config.instructions;
    }

    // Add tools if provided
    if (this.config.tools && this.config.tools.length > 0) {
      (sessionConfig.session as Record<string, unknown>).tools = this.config.tools;
      (sessionConfig.session as Record<string, unknown>).tool_choice = 'auto';
    }

    this.sendEvent(sessionConfig);
  }

  private handleServerEvent(event: Record<string, unknown>): void {
    const eventType = event.type as string;

    switch (eventType) {
      case 'session.created':
        console.log('Session created:', event);
        this.setState('listening');
        break;

      case 'session.updated':
        console.log('Session updated:', event);
        break;

      case 'input_audio_buffer.speech_started':
        console.log('User speech started');
        this.handlers.onSpeechStarted?.();
        this.setState('listening');
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('User speech stopped');
        this.handlers.onSpeechStopped?.();
        this.setState('thinking');
        break;

      case 'conversation.item.input_audio_transcription.completed':
        const userTranscript = (event as { transcript?: string }).transcript || '';
        console.log('User transcript:', userTranscript);
        this.handlers.onTranscript?.(userTranscript, true, 'user');
        break;

      case 'response.created':
        console.log('Response started');
        break;

      case 'response.output_item.added':
        const item = (event as { item?: { type?: string } }).item;
        if (item?.type === 'function_call') {
          console.log('Function call started');
        }
        break;

      case 'response.function_call_arguments.done':
        this.handleFunctionCall(event);
        break;

      case 'response.audio_transcript.delta':
        const delta = (event as { delta?: string }).delta || '';
        this.handlers.onTranscript?.(delta, false, 'assistant');
        break;

      case 'response.audio_transcript.done':
        const fullTranscript = (event as { transcript?: string }).transcript || '';
        console.log('Assistant transcript:', fullTranscript);
        this.handlers.onTranscript?.(fullTranscript, true, 'assistant');
        break;

      case 'response.audio.delta':
        this.setState('speaking');
        break;

      case 'response.audio.done':
        console.log('Audio response complete');
        break;

      case 'response.done':
        console.log('Response complete');
        this.setState('listening');
        break;

      case 'error':
        console.error('Server error:', event);
        const errorMsg = ((event as { error?: { message?: string } }).error?.message) || 'Unknown error';
        this.handlers.onError?.(new Error(errorMsg));
        break;

      default:
        // Log other events for debugging
        if (!eventType.includes('delta')) {
          console.log('Event:', eventType, event);
        }
    }
  }

  private handleFunctionCall(event: Record<string, unknown>): void {
    const name = event.name as string;
    const callId = event.call_id as string;
    const argsString = event.arguments as string;

    try {
      const args = JSON.parse(argsString || '{}');
      console.log('Function call:', name, args);
      this.handlers.onFunctionCall?.(name, args, callId);
    } catch (error) {
      console.error('Failed to parse function arguments:', error);
    }
  }

  /**
   * Submit function call result back to the model
   */
  submitFunctionResult(callId: string, result: unknown): void {
    // Create the function call output
    this.sendEvent({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: callId,
        output: JSON.stringify(result),
      },
    });

    // Trigger response generation
    this.sendEvent({ type: 'response.create' });
  }

  /**
   * Send a text message to the model
   */
  sendTextMessage(text: string): void {
    // Create conversation item
    this.sendEvent({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    });

    // Trigger response
    this.sendEvent({ type: 'response.create' });
  }

  /**
   * Cancel current response (for interruption)
   */
  cancelResponse(): void {
    this.sendEvent({ type: 'response.cancel' });
  }

  /**
   * Update session configuration
   */
  updateSession(config: Partial<RealtimeConfig>): void {
    this.config = { ...this.config, ...config };
    this.sendSessionUpdate();
  }

  /**
   * Update tools dynamically
   */
  updateTools(tools: RealtimeTool[]): void {
    this.config.tools = tools;
    this.sendSessionUpdate();
  }

  private sendEvent(event: Record<string, unknown>): void {
    if (this.dc && this.dc.readyState === 'open') {
      this.dc.send(JSON.stringify(event));
    } else {
      console.warn('Data channel not ready, cannot send event:', event.type);
    }
  }

  private setupAudioLevelMonitoring(): void {
    if (!this.mediaStream) return;

    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    this.audioLevelInterval = setInterval(() => {
      if (this.analyser) {
        this.analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const level = average / 255;
        this.handlers.onAudioLevel?.(level);
      }
    }, 100);
  }

  /**
   * Mute/unmute microphone
   */
  setMuted(muted: boolean): void {
    if (this.mediaStream) {
      this.mediaStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  /**
   * Check if microphone is muted
   */
  isMuted(): boolean {
    if (this.mediaStream) {
      const track = this.mediaStream.getAudioTracks()[0];
      return track ? !track.enabled : true;
    }
    return true;
  }

  /**
   * Mute/unmute speaker (AI audio output)
   */
  setSpeakerMuted(muted: boolean): void {
    if (this.audioElement) {
      this.audioElement.muted = muted;
    }
  }

  /**
   * Check if speaker is muted
   */
  isSpeakerMuted(): boolean {
    return this.audioElement ? this.audioElement.muted : false;
  }

  disconnect(): void {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }

    if (this.audioElement) {
      this.audioElement.srcObject = null;
      this.audioElement = null;
    }

    this.setState('disconnected');
    this.handlers.onDisconnected?.();
  }

  /**
   * Check if OpenAI Realtime is supported
   */
  static isSupported(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      window.RTCPeerConnection &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    );
  }
}
