'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
  MessageSquare,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTimelineStore } from '@/store/timeline';
import {
  OpenAIRealtimeClient,
  type RealtimeState,
} from '@/lib/ai-builder/voice/OpenAIRealtimeClient';
import {
  REALTIME_TIMELINE_TOOLS,
  TIMELINE_SYSTEM_INSTRUCTIONS,
  RealtimeToolExecutor,
} from '@/lib/ai-builder/voice/realtimeTools';
import VoiceOrb from './VoiceOrb';

interface Voice2ControlsProps {
  onTranscript?: (text: string, role: 'user' | 'assistant', isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStateChange?: (state: RealtimeState) => void;
}

interface TranscriptEntry {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  isFinal: boolean;
}

export default function Voice2Controls({
  onTranscript,
  onError,
  onStateChange,
}: Voice2ControlsProps) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [state, setState] = useState<RealtimeState>('disconnected');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [currentAssistantText, setCurrentAssistantText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const clientRef = useRef<OpenAIRealtimeClient | null>(null);
  const toolExecutorRef = useRef<RealtimeToolExecutor | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const wasMutedBeforeHidden = useRef(false);

  // Check availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const response = await fetch('/api/ai-builder/realtime-token');
        const data = await response.json();
        setIsAvailable(data.available && OpenAIRealtimeClient.isSupported());
      } catch {
        setIsAvailable(false);
      }
    };
    checkAvailability();
  }, []);

  // Auto-mute when tab becomes hidden to prevent background noise triggering AI
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!clientRef.current) return;

      if (document.hidden) {
        // Tab is hidden - save current mute state and mute
        wasMutedBeforeHidden.current = isMuted;
        if (!isMuted) {
          clientRef.current.setMuted(true);
          setIsMuted(true);
        }
      } else {
        // Tab is visible again - restore previous mute state
        if (!wasMutedBeforeHidden.current && isMuted) {
          clientRef.current.setMuted(false);
          setIsMuted(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMuted]);

  // Initialize tool executor with comprehensive context
  useEffect(() => {
    const store = useTimelineStore.getState();

    const context = {
      // Dynamic getters for current state
      get properties() {
        return useTimelineStore.getState().properties;
      },
      get events() {
        return useTimelineStore.getState().events;
      },

      // Property Operations
      addProperty: store.addProperty,
      updateProperty: store.updateProperty,
      deleteProperty: store.deleteProperty,

      // Event Operations
      addEvent: store.addEvent,
      updateEvent: store.updateEvent,
      deleteEvent: store.deleteEvent,

      // Bulk Operations
      clearAllData: store.clearAllData,

      // Selection & Navigation
      selectProperty: store.selectProperty,
      setSelectedPropertyId: (id: string | null) => store.selectProperty(id),

      // Zoom & Pan Controls
      zoomIn: store.zoomIn,
      zoomOut: store.zoomOut,
      setZoomByIndex: store.setZoomByIndex,
      panToDate: store.panToDate,

      // Global Settings
      setMarginalTaxRate: store.setMarginalTaxRate,

      // Analysis - wrap in async function
      analyzePortfolio: async () => {
        // This triggers analysis via the store
        // The actual API call happens in the main app
        console.log('🔍 Portfolio analysis requested via voice');
        // For now, just log - the actual analysis is triggered via UI
        return Promise.resolve();
      },

      // Undo/Redo (if available in store)
      undo: (store as unknown as { undo?: () => void }).undo,
      redo: (store as unknown as { redo?: () => void }).redo,
    };

    toolExecutorRef.current = new RealtimeToolExecutor(context);
  }, []);

  // Auto-scroll transcripts
  useEffect(() => {
    if (showTranscript) {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts, currentAssistantText, showTranscript]);

  const handleStateChange = useCallback(
    (newState: RealtimeState) => {
      setState(newState);
      onStateChange?.(newState);
    },
    [onStateChange]
  );

  const handleTranscriptEvent = useCallback(
    (text: string, isFinal: boolean, role: 'user' | 'assistant') => {
      if (role === 'assistant') {
        if (isFinal) {
          setTranscripts((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role,
              text,
              timestamp: new Date(),
              isFinal: true,
            },
          ]);
          setCurrentAssistantText('');
        } else {
          setCurrentAssistantText((prev) => prev + text);
        }
      } else if (role === 'user' && isFinal) {
        setTranscripts((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role,
            text,
            timestamp: new Date(),
            isFinal: true,
          },
        ]);
      }

      onTranscript?.(text, role, isFinal);
    },
    [onTranscript]
  );

  const handleFunctionCall = useCallback(
    async (name: string, args: Record<string, unknown>, callId: string) => {
      if (!toolExecutorRef.current || !clientRef.current) return;

      try {
        const result = await toolExecutorRef.current.execute(name, args);
        clientRef.current.submitFunctionResult(callId, result);
      } catch (error) {
        console.error('Function execution error:', error);
        clientRef.current.submitFunctionResult(callId, {
          success: false,
          error: String(error),
        });
      }
    },
    []
  );

  const connect = async () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }

    setError(null);
    setTranscripts([]);
    setCurrentAssistantText('');

    try {
      clientRef.current = new OpenAIRealtimeClient(
        {
          instructions: TIMELINE_SYSTEM_INSTRUCTIONS,
          tools: REALTIME_TIMELINE_TOOLS,
          voice: 'shimmer',
          turnDetection: {
            type: 'server_vad',
            threshold: 0.7, // Higher threshold = less sensitive to background noise
            prefix_padding_ms: 300,
            silence_duration_ms: 700, // Longer silence required before AI responds
          },
        },
        {
          onConnected: () => {
            console.log('Voice 2: Connected to OpenAI Realtime');
          },
          onDisconnected: () => {
            console.log('Voice 2: Disconnected');
            handleStateChange('disconnected');
          },
          onError: (err) => {
            console.error('Voice 2 error:', err);
            setError(err.message);
            onError?.(err.message);
          },
          onSpeechStarted: () => {
            console.log('Voice 2: User speaking');
          },
          onSpeechStopped: () => {
            console.log('Voice 2: User stopped speaking');
          },
          onTranscript: handleTranscriptEvent,
          onFunctionCall: handleFunctionCall,
          onAudioLevel: setAudioLevel,
          onStateChange: handleStateChange,
        }
      );

      await clientRef.current.connect();
    } catch (error) {
      console.error('Connection error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Connection failed';

      let displayError = errorMsg;
      if (errorMsg.includes('Could not connect')) {
        displayError = 'Network error: Could not connect to OpenAI. Check your internet connection.';
      } else if (errorMsg.includes('timed out')) {
        displayError = 'Connection timed out. OpenAI may be experiencing issues.';
      } else if (errorMsg.includes('API key')) {
        displayError = errorMsg;
      }

      setError(displayError);
      onError?.(displayError);
    }
  };

  const disconnect = () => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    setState('disconnected');
    setAudioLevel(0);
  };

  const toggleMute = () => {
    if (clientRef.current) {
      const newMuted = !isMuted;
      clientRef.current.setMuted(newMuted);
      setIsMuted(newMuted);
    }
  };

  const toggleSpeakerMute = () => {
    if (clientRef.current) {
      const newMuted = !isSpeakerMuted;
      clientRef.current.setSpeakerMuted(newMuted);
      setIsSpeakerMuted(newMuted);
    }
  };

  if (isAvailable === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!isAvailable) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-lg">
          OpenAI Realtime Not Available
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          Voice 2 requires an OpenAI API key with Realtime API access. Please configure
          OPENAI_API_KEY in your environment variables.
        </p>
      </div>
    );
  }

  const isConnected = state !== 'disconnected' && state !== 'error';
  const hasTranscripts = transcripts.length > 0 || currentAssistantText;

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Toggle View Button */}
      {hasTranscripts && (
        <div className="absolute top-3 right-3 z-20">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className={cn(
              'p-2 rounded-lg transition-all',
              'bg-white/10 hover:bg-white/20 backdrop-blur-sm',
              'text-white/70 hover:text-white'
            )}
            title={showTranscript ? 'Show orb view' : 'Show conversation'}
          >
            {showTranscript ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <MessageSquare className="w-5 h-5" />
            )}
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 relative flex items-center justify-center">
        <AnimatePresence mode="wait">
          {showTranscript ? (
            /* Transcript View */
            <motion.div
              key="transcript"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 flex flex-col"
            >
              {/* Transcript Header */}
              <div className="px-4 py-3 border-b border-white/10">
                <h3 className="text-sm font-medium text-white/80">Conversation</h3>
              </div>

              {/* Transcript Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {transcripts.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'p-3 rounded-xl max-w-[85%]',
                      entry.role === 'user'
                        ? 'bg-blue-500/20 ml-auto border border-blue-500/30'
                        : 'bg-white/10 border border-white/10'
                    )}
                  >
                    <p className="text-sm text-white/90">{entry.text}</p>
                    <p className="text-xs text-white/40 mt-1">
                      {entry.timestamp.toLocaleTimeString()}
                    </p>
                  </motion.div>
                ))}

                {currentAssistantText && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-white/10 border border-white/10 max-w-[85%]"
                  >
                    <p className="text-sm text-white/90">
                      {currentAssistantText}
                      <span className="inline-block w-2 h-4 bg-white/50 animate-pulse ml-1" />
                    </p>
                  </motion.div>
                )}

                <div ref={transcriptEndRef} />
              </div>
            </motion.div>
          ) : (
            /* Orb View */
            <motion.div
              key="orb"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              {/* Voice Orb - centered */}
              <VoiceOrb state={state} audioLevel={audioLevel} />

              {/* Simple transcript text at bottom */}
              {(currentAssistantText || transcripts.length > 0) && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute bottom-2 left-4 right-4 text-center text-sm text-white/70 line-clamp-2"
                >
                  {currentAssistantText || transcripts[transcripts.length - 1]?.text}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 left-4 right-4 z-10"
        >
          <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-3 border border-red-500/30">
            <p className="text-sm text-red-300 text-center">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Controls */}
      <div className="relative z-10 px-4 py-3 bg-gradient-to-t from-black/50 to-transparent">
        <div className="flex items-center justify-center gap-4">
          {/* Mute Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMute}
            disabled={!isConnected}
            className={cn(
              'p-2.5 rounded-full transition-all',
              isConnected
                ? isMuted
                  ? 'bg-red-500/30 text-red-400 hover:bg-red-500/40'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            )}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </motion.button>

          {/* Main Call Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isConnected ? disconnect : connect}
            disabled={state === 'connecting'}
            className={cn(
              'p-4 rounded-full transition-all shadow-lg',
              state === 'connecting'
                ? 'bg-amber-500 text-white cursor-wait'
                : isConnected
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gradient-to-br from-emerald-400 to-cyan-500 hover:from-emerald-500 hover:to-cyan-600 text-white'
            )}
            title={isConnected ? 'End Call' : 'Start Call'}
          >
            {state === 'connecting' ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isConnected ? (
              <PhoneOff className="w-6 h-6" />
            ) : (
              <Phone className="w-6 h-6" />
            )}
          </motion.button>

          {/* Volume/Speaker Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleSpeakerMute}
            disabled={!isConnected}
            className={cn(
              'p-2.5 rounded-full transition-all',
              isConnected
                ? isSpeakerMuted
                  ? 'bg-red-500/30 text-red-400 hover:bg-red-500/40'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            )}
            title={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
          >
            {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </motion.button>
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <motion.div
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              state === 'disconnected' && 'bg-gray-400',
              state === 'connecting' && 'bg-amber-400',
              state === 'connected' && 'bg-emerald-400',
              state === 'listening' && 'bg-blue-400',
              state === 'thinking' && 'bg-purple-400',
              state === 'speaking' && 'bg-cyan-400',
              state === 'error' && 'bg-red-400'
            )}
            animate={
              state === 'connecting' || state === 'thinking'
                ? { opacity: [1, 0.4, 1] }
                : state === 'listening' || state === 'speaking'
                ? { scale: [1, 1.3, 1] }
                : {}
            }
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-[10px] text-white/50">
            {state === 'disconnected' && 'Ready'}
            {state === 'connecting' && 'Connecting...'}
            {state === 'connected' && 'Connected'}
            {state === 'listening' && 'Listening...'}
            {state === 'thinking' && 'Thinking...'}
            {state === 'speaking' && 'Speaking...'}
            {state === 'error' && 'Error'}
          </span>
        </div>
      </div>
    </div>
  );
}
