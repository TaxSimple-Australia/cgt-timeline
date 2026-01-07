// Voice Integration Types

export type VoiceState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'error';

export interface VoiceConfig {
  sttProvider: 'deepgram' | 'openai';
  ttsProvider: 'elevenlabs' | 'openai' | 'deepgram';
  voice: string;
  language: string;
  sampleRate: number;
  vadEnabled: boolean;
  bargeInEnabled: boolean;
}

export interface TranscriptEvent {
  text: string;
  isFinal: boolean;
  confidence: number;
  timestamp: number;
}

export interface AudioChunk {
  data: ArrayBuffer;
  timestamp: number;
}

export interface VoiceEventHandlers {
  onTranscript: (transcript: TranscriptEvent) => void;
  onAudio: (audio: AudioChunk) => void;
  onStateChange: (state: VoiceState) => void;
  onError: (error: Error) => void;
  onInterrupt: () => void;
}

export interface IVoiceService {
  connect(): Promise<void>;
  disconnect(): void;
  startListening(): void;
  stopListening(): void;
  speak(text: string): Promise<void>;
  stopSpeaking(): void;
  isConnected(): boolean;
  getState(): VoiceState;
}

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  sttProvider: 'deepgram',
  ttsProvider: 'elevenlabs',
  voice: 'Rachel',
  language: 'en-AU',
  sampleRate: 16000,
  vadEnabled: true,
  bargeInEnabled: true,
};

// ElevenLabs voice options
export const ELEVENLABS_VOICES = {
  Rachel: '21m00Tcm4TlvDq8ikWAM',
  Domi: 'AZnzlk1XvdvUeBnXmlld',
  Bella: 'EXAVITQu4vr4xnSDxMaL',
  Antoni: 'ErXwobaYiN019PkySvjV',
  Elli: 'MF3mGyEYCl7XYWbV9V6O',
  Josh: 'TxGEqnHWrfWFTfGW9XjX',
  Arnold: 'VR6AewLTigWG4xSOukaG',
  Adam: 'pNInz6obpgDQGcFmaJgB',
  Sam: 'yoZ06aMxZJJ28mfd3POQ',
};

// Deepgram STT models
export const DEEPGRAM_MODELS = {
  nova2: 'nova-2',
  nova2General: 'nova-2-general',
  nova2Meeting: 'nova-2-meeting',
  nova2Phonecall: 'nova-2-phonecall',
  enhanced: 'enhanced',
  base: 'base',
};
