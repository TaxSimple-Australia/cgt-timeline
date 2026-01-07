'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Minimize2,
  Maximize2,
  MessageSquare,
  Mic,
  MicOff,
  FileText,
  Undo2,
  Redo2,
  Volume2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTimelineStore } from '@/store/timeline';
import VoiceControls from './VoiceControls';
import ConversationView from './ConversationView';
import TextInput from './TextInput';
import DocumentUploader from './DocumentUploader';
import LLMSelector from './LLMSelector';
import { VoiceManager } from '@/lib/ai-builder/voice';
import { ConversationManager } from '@/lib/ai-builder/conversation';
import { ActionExecutor } from '@/lib/ai-builder/actions';
import type {
  VoiceState,
  ConversationMessage,
  TimelineAction,
  ProcessedDocument,
  TranscriptEvent,
} from '@/types/ai-builder';

interface AITimelineBuilderProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'chat' | 'voice' | 'documents';

// Strip markdown formatting for TTS (text-to-speech)
function stripMarkdownForTTS(text: string): string {
  return text
    // Remove bold/italic markers
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove links, keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Convert numbered lists to spoken format
    .replace(/^\d+\.\s+/gm, '')
    // Remove bullet points
    .replace(/^[-*+]\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Clean up multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    // Remove HTML tags if any
    .replace(/<[^>]+>/g, '')
    // Trim whitespace
    .trim();
}

interface VoiceCapabilities {
  sttAvailable: boolean;
  ttsAvailable: boolean;
  checked: boolean;
}

export default function AITimelineBuilder({ isOpen, onClose }: AITimelineBuilderProps) {
  const [activeTab, setActiveTab] = useState<TabType>('chat'); // Default to chat
  const [isMinimized, setIsMinimized] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPushToTalk, setIsPushToTalk] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedDocuments, setProcessedDocuments] = useState<ProcessedDocument[]>([]);
  const [isDocProcessing, setIsDocProcessing] = useState(false);
  const [voiceCapabilities, setVoiceCapabilities] = useState<VoiceCapabilities>({
    sttAvailable: false,
    ttsAvailable: false,
    checked: false,
  });
  const [aiBuilderProviders, setAiBuilderProviders] = useState<Record<string, string>>({});
  const [aiBuilderSelectedProvider, setAiBuilderSelectedProvider] = useState<string>('claude');

  // Refs
  const voiceManagerRef = useRef<VoiceManager | null>(null);
  const conversationManagerRef = useRef<ConversationManager | null>(null);
  const actionExecutorRef = useRef<ActionExecutor | null>(null);

  // Store
  const {
    properties,
    events,
    addProperty,
    updateProperty,
    deleteProperty,
    addEvent,
    updateEvent,
    deleteEvent,
    importTimelineData,
    clearAllData,
  } = useTimelineStore();

  // Fetch AI Builder specific providers (checks local API keys)
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/ai-builder/providers');
        const data = await response.json();
        console.log('AI Builder providers:', data);
        setAiBuilderProviders(data.providers || {});
        setAiBuilderSelectedProvider(data.default || 'claude');
      } catch (error) {
        console.error('Failed to fetch AI Builder providers:', error);
        // Fallback to Claude
        setAiBuilderProviders({ claude: 'Claude Sonnet 4' });
      }
    };

    if (isOpen) {
      fetchProviders();
    }
  }, [isOpen]);

  // Initialize managers
  useEffect(() => {
    if (!isOpen) return;

    // CRITICAL: Create store interface with getter functions that always fetch FRESH state
    // Using useTimelineStore.getState() ensures we never read stale closure values
    const storeInterface = {
      // Getters that always return fresh state from the store
      get properties() {
        return useTimelineStore.getState().properties;
      },
      get events() {
        return useTimelineStore.getState().events;
      },
      // Actions from the store (these are stable references)
      addProperty: useTimelineStore.getState().addProperty,
      updateProperty: useTimelineStore.getState().updateProperty,
      deleteProperty: useTimelineStore.getState().deleteProperty,
      addEvent: useTimelineStore.getState().addEvent,
      updateEvent: useTimelineStore.getState().updateEvent,
      deleteEvent: useTimelineStore.getState().deleteEvent,
      importTimelineData: useTimelineStore.getState().importTimelineData,
      clearAllData: useTimelineStore.getState().clearAllData,
    };

    actionExecutorRef.current = new ActionExecutor(storeInterface);

    // Create conversation manager with AI Builder's selected provider
    conversationManagerRef.current = new ConversationManager({
      llmProvider: aiBuilderSelectedProvider,
      onMessage: (message) => {
        setMessages((prev) => [...prev, message]);
      },
      onAction: (action) => {
        console.log('Action executed:', action);
      },
      onStateChange: (state) => {
        setIsProcessing(state === 'processing');
      },
      // CRITICAL: Use getState() to always get fresh data, not stale closure values
      getProperties: () => useTimelineStore.getState().properties,
      getEvents: () => useTimelineStore.getState().events,
      executeAction: async (action) => {
        if (actionExecutorRef.current) {
          await actionExecutorRef.current.execute(action);
        }
      },
    });

    return () => {
      voiceManagerRef.current?.disconnect();
    };
  }, [isOpen, aiBuilderSelectedProvider]);

  // Initialize voice manager when API keys are available
  const initializeVoice = useCallback(async () => {
    try {
      // Fetch API keys from server
      const response = await fetch('/api/ai-builder/voice-token');
      const data = await response.json();

      // Update capabilities
      const capabilities = {
        sttAvailable: data.sttAvailable || false,
        ttsAvailable: data.ttsAvailable || false,
        checked: true,
      };
      setVoiceCapabilities(capabilities);

      // If neither service is available, stay on chat tab
      if (!capabilities.sttAvailable && !capabilities.ttsAvailable) {
        console.log('Voice services not available - using chat mode');
        if (activeTab === 'voice') {
          setActiveTab('chat');
        }
        return;
      }

      // If only TTS is available (no STT), switch to chat but enable TTS for responses
      if (!capabilities.sttAvailable && capabilities.ttsAvailable) {
        console.log('Only TTS available - voice input disabled, voice output enabled');
      }

      // Create voice manager with available services
      voiceManagerRef.current = new VoiceManager(
        {
          deepgramApiKey: data.deepgramKey,
          elevenlabsApiKey: data.elevenlabsKey,
        },
        {
          onTranscript: (transcript: TranscriptEvent) => {
            setCurrentTranscript(transcript.text);
            if (transcript.isFinal) {
              handleSendMessage(transcript.text, true);
              setCurrentTranscript('');
            }
          },
          onAudio: () => {},
          onStateChange: setVoiceState,
          onError: (err) => {
            console.error('Voice error:', err);
            // Don't show error for expected "not available" messages
            if (!err.message.includes('not available')) {
              setError(err.message);
            }
          },
          onInterrupt: () => {
            voiceManagerRef.current?.stopSpeaking();
            setIsSpeaking(false);
          },
        }
      );

      await voiceManagerRef.current.connect();

      // If STT is available, switch to voice tab
      if (capabilities.sttAvailable && activeTab === 'chat') {
        setActiveTab('voice');
      }
    } catch (error) {
      console.error('Failed to initialize voice:', error);
      setVoiceCapabilities({ sttAvailable: false, ttsAvailable: false, checked: true });
    }
  }, [activeTab]);

  // Check voice capabilities on open
  useEffect(() => {
    if (isOpen && !voiceCapabilities.checked) {
      initializeVoice();
    }
  }, [isOpen, voiceCapabilities.checked, initializeVoice]);

  /**
   * Convert a File to a MessageAttachment
   */
  const fileToAttachment = async (file: File): Promise<{
    type: 'image' | 'document' | 'pdf';
    name: string;
    mimeType: string;
    data: string;
    extractedText?: string;
  }> => {
    // Read file as base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/png;base64,")
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Determine attachment type
    let type: 'image' | 'document' | 'pdf' = 'document';
    if (file.type.startsWith('image/')) {
      type = 'image';
    } else if (file.type === 'application/pdf') {
      type = 'pdf';
    }

    return {
      type,
      name: file.name,
      mimeType: file.type,
      data: base64,
    };
  };

  // Send message handler - now supports file attachments
  const handleSendMessage = async (text: string, filesOrIsVoice?: File[] | boolean) => {
    // Handle both old signature (text, isVoice) and new signature (text, files)
    const isVoice = typeof filesOrIsVoice === 'boolean' ? filesOrIsVoice : false;
    const files = Array.isArray(filesOrIsVoice) ? filesOrIsVoice : undefined;

    if (!text.trim() && (!files || files.length === 0)) return;
    if (!conversationManagerRef.current) return;

    setError(null);

    // Convert files to attachments if provided
    let attachments: Array<{
      type: 'image' | 'document' | 'pdf';
      name: string;
      mimeType: string;
      data: string;
      extractedText?: string;
    }> | undefined;

    if (files && files.length > 0) {
      setIsProcessing(true);
      try {
        attachments = await Promise.all(files.map(fileToAttachment));
        console.log('📎 Converted files to attachments:', attachments.map(a => `${a.name} (${a.type})`));
      } catch (error) {
        console.error('Error converting files:', error);
        setError('Failed to process attachments');
        setIsProcessing(false);
        return;
      }
    }

    const response = await conversationManagerRef.current.processUserInput(text, isVoice, attachments);

    // Speak response if voice is active OR if TTS is available and user is in voice tab
    const shouldSpeak = (isVoice || activeTab === 'voice') &&
                        response &&
                        voiceManagerRef.current?.hasTTS();

    if (shouldSpeak && response) {
      setIsSpeaking(true);
      try {
        // Strip markdown formatting for cleaner TTS
        const cleanText = stripMarkdownForTTS(response);
        await voiceManagerRef.current!.speak(cleanText);
      } finally {
        setIsSpeaking(false);
      }
    }
  };

  // Voice control handlers
  const handleStartListening = () => {
    voiceManagerRef.current?.startListening();
  };

  const handleStopListening = () => {
    voiceManagerRef.current?.stopListening();
  };

  const handleStopSpeaking = () => {
    voiceManagerRef.current?.stopSpeaking();
    setIsSpeaking(false);
  };

  // Document processing
  const handleDocumentProcessed = (doc: ProcessedDocument) => {
    setProcessedDocuments((prev) => [...prev, doc]);
  };

  const handleActionsApproved = async (actions: TimelineAction[]) => {
    for (const action of actions) {
      if (actionExecutorRef.current) {
        await actionExecutorRef.current.execute(action);
      }
    }
  };

  // File upload from text input
  const handleFileUpload = async (files: File[]) => {
    setIsDocProcessing(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('llmProvider', aiBuilderSelectedProvider);

        const response = await fetch('/api/ai-builder/process-document', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const { document } = await response.json();
          handleDocumentProcessed(document);
        }
      }
    } finally {
      setIsDocProcessing(false);
    }
  };

  // Undo/Redo handlers
  const handleUndo = () => {
    actionExecutorRef.current?.undo();
  };

  const handleRedo = () => {
    actionExecutorRef.current?.redo();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          height: isMinimized ? 'auto' : 'calc(100vh - 96px)',
          top: isMinimized ? 'auto' : '80px',
          bottom: '16px',
        }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'fixed right-4 w-[500px] bg-white dark:bg-gray-900',
          'rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700',
          'flex flex-col overflow-hidden z-50'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500 to-blue-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">AI Timeline Builder</h3>
              <p className="text-xs text-white/70">
                {voiceState === 'listening'
                  ? 'Listening...'
                  : isProcessing
                  ? 'Thinking...'
                  : 'Ready to help'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Undo/Redo */}
            <button
              onClick={handleUndo}
              disabled={!actionExecutorRef.current?.canUndo()}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-30"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!actionExecutorRef.current?.canRedo()}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg disabled:opacity-30"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            {/* Minimize/Maximize */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content (hidden when minimized) */}
        {!isMinimized && (
          <>
            {/* Tabs */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-1">
                {/* Voice Tab - disabled if STT not available */}
                <button
                  onClick={() => voiceCapabilities.sttAvailable && setActiveTab('voice')}
                  disabled={!voiceCapabilities.sttAvailable}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    activeTab === 'voice'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                    !voiceCapabilities.sttAvailable && 'opacity-50 cursor-not-allowed'
                  )}
                  title={voiceCapabilities.sttAvailable ? 'Voice input' : 'Voice input not available (Deepgram API key required)'}
                >
                  {voiceCapabilities.sttAvailable ? (
                    <Mic className="w-4 h-4" />
                  ) : (
                    <MicOff className="w-4 h-4" />
                  )}
                  Voice
                </button>

                {/* Chat Tab */}
                <button
                  onClick={() => setActiveTab('chat')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    activeTab === 'chat'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  )}
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat
                  {/* Show TTS indicator if available */}
                  {voiceCapabilities.ttsAvailable && !voiceCapabilities.sttAvailable && (
                    <span title="Voice responses enabled">
                      <Volume2 className="w-3 h-3 text-green-500" />
                    </span>
                  )}
                </button>

                {/* Documents Tab */}
                <button
                  onClick={() => setActiveTab('documents')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    activeTab === 'documents'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  )}
                >
                  <FileText className="w-4 h-4" />
                  Docs
                </button>
              </div>

              {/* LLM Selector - uses AI Builder's own providers (based on local API keys) */}
              <LLMSelector
                selectedProvider={aiBuilderSelectedProvider}
                availableProviders={aiBuilderProviders}
                onSelect={setAiBuilderSelectedProvider}
              />
            </div>

            {/* Deepseek media attachment warning */}
            {aiBuilderSelectedProvider === 'deepseek' && (
              <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Note: Deepseek doesn&apos;t support image/media analysis. For attachments, use Claude, GPT-4, or Gemini.
                </p>
              </div>
            )}

            {/* Tab Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Conversation View (for voice and chat) */}
              {(activeTab === 'voice' || activeTab === 'chat') && (
                <>
                  <ConversationView
                    messages={messages}
                    isProcessing={isProcessing}
                    error={error}
                  />

                  {/* Voice Controls */}
                  {activeTab === 'voice' && (
                    <VoiceControls
                      voiceState={voiceState}
                      isSpeaking={isSpeaking}
                      isPushToTalk={isPushToTalk}
                      onStartListening={handleStartListening}
                      onStopListening={handleStopListening}
                      onStopSpeaking={handleStopSpeaking}
                      onTogglePushToTalk={() => setIsPushToTalk(!isPushToTalk)}
                    />
                  )}

                  {/* Text Input */}
                  <TextInput
                    onSend={(msg, files) => handleSendMessage(msg, files)}
                    onFileUpload={handleFileUpload}
                    disabled={isProcessing}
                    currentTranscript={activeTab === 'voice' ? currentTranscript : ''}
                  />
                </>
              )}

              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <div className="flex-1 p-4 overflow-y-auto">
                  <DocumentUploader
                    onDocumentProcessed={handleDocumentProcessed}
                    onActionsApproved={handleActionsApproved}
                    isProcessing={isDocProcessing}
                    processedDocuments={processedDocuments}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
