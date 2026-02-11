'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  GripVertical,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTimelineStore } from '@/store/timeline';
import Voice2Controls from './Voice2Controls';
import ConversationView from './ConversationView';
import TextInput from './TextInput';
import DocumentUploader from './DocumentUploader';
import LLMSelector from './LLMSelector';
import { ConversationManager } from '@/lib/ai-builder/conversation';
import { ActionExecutor } from '@/lib/ai-builder/actions';
import type {
  ConversationMessage,
  TimelineAction,
  ProcessedDocument,
  DocumentContext,
} from '@/types/ai-builder';

interface AITimelineBuilderProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'chat' | 'voice' | 'documents';

interface VoiceCapabilities {
  available: boolean;
  checked: boolean;
}

// Panel resize constants
const MIN_WIDTH = 380;
const MAX_WIDTH = 700;
const DEFAULT_WIDTH = 500;

export default function AITimelineBuilder({ isOpen, onClose }: AITimelineBuilderProps) {
  const [activeTab, setActiveTab] = useState<TabType>('chat'); // Default to chat
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedDocuments, setProcessedDocuments] = useState<ProcessedDocument[]>([]);
  const [isDocProcessing, setIsDocProcessing] = useState(false);
  const [voiceCapabilities, setVoiceCapabilities] = useState<VoiceCapabilities>({
    available: false,
    checked: false,
  });
  const [aiBuilderProviders, setAiBuilderProviders] = useState<Record<string, string>>({});
  const [aiBuilderSelectedProvider, setAiBuilderSelectedProvider] = useState<string>('deepseek');

  // Panel resizing state
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  // Document context state (for bridging docs to chat)
  const [documentContexts, setDocumentContexts] = useState<DocumentContext[]>([]);
  const documentContextsRef = useRef<DocumentContext[]>([]);

  // Sync ref with state
  useEffect(() => {
    documentContextsRef.current = documentContexts;
  }, [documentContexts]);

  // Refs
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
        setAiBuilderSelectedProvider(data.default || 'deepseek');
      } catch (error) {
        console.error('Failed to fetch AI Builder providers:', error);
        // Fallback to Deepseek
        setAiBuilderProviders({ deepseek: 'Deepseek Chat' });
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
      getDocumentContexts: () => documentContextsRef.current,
    });

  }, [isOpen, aiBuilderSelectedProvider]);

  // Check Voice (OpenAI Realtime) availability
  useEffect(() => {
    const checkVoice = async () => {
      if (!isOpen || voiceCapabilities.checked) return;

      try {
        const response = await fetch('/api/ai-builder/realtime-token');
        const data = await response.json();
        setVoiceCapabilities({
          available: data.available === true,
          checked: true,
        });
      } catch {
        setVoiceCapabilities({ available: false, checked: true });
      }
    };

    checkVoice();
  }, [isOpen, voiceCapabilities.checked]);

  // Panel resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Panel is right-aligned, so width = window width - mouse X - right margin (16px)
      const newWidth = window.innerWidth - e.clientX - 16;
      setPanelWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    // Prevent text selection and set resize cursor during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ew-resize';

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

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
  const handleSendMessage = async (text: string, files?: File[]) => {
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

    await conversationManagerRef.current.processUserInput(text, false, attachments);
  };

  // Document processing - now bridges to chat
  const handleDocumentProcessed = async (doc: ProcessedDocument) => {
    setProcessedDocuments((prev) => [...prev, doc]);

    // Store document context for chat follow-ups
    const newContext: DocumentContext = {
      filename: doc.filename,
      type: doc.type,
      rawText: doc.rawText,
      extractedData: doc.extractedData,
      uploadedAt: new Date(),
      base64: doc.base64,
      mimeType: doc.mimeType,
    };

    setDocumentContexts((prev) => [...prev, newContext]);

    // Add document context to conversation manager
    if (conversationManagerRef.current) {
      conversationManagerRef.current.addDocumentContext(newContext);
    }

    // Auto-switch to Chat tab
    setActiveTab('chat');

    // Auto-send confirmation request to LLM
    if (conversationManagerRef.current) {
      const confirmMsg = `I've uploaded "${doc.filename}". Please review and confirm what you understood from this document. Summarize the key property/CGT information you found.`;
      await conversationManagerRef.current.processUserInput(confirmMsg, false);
    }
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
          width: isMinimized ? 180 : panelWidth,
          top: isMinimized ? 'auto' : '80px',
          bottom: '16px',
        }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: isResizing ? 0 : 0.2 }}
        className={cn(
          'fixed right-4 bg-white dark:bg-gray-900',
          'rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700',
          'flex flex-col overflow-hidden z-50'
        )}
      >
        {/* Resize handle on left edge */}
        {!isMinimized && (
          <div
            onMouseDown={handleResizeStart}
            className={cn(
              'absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize z-10',
              'flex items-center justify-center',
              'hover:bg-blue-500/20 active:bg-blue-500/30 transition-colors',
              isResizing && 'bg-blue-500/30'
            )}
          >
            <div className="flex flex-col gap-0.5 opacity-0 hover:opacity-60 transition-opacity">
              <GripVertical className="w-3 h-3 text-gray-400" />
            </div>
          </div>
        )}

        {/* Header */}
        <div className={cn(
          "flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500 to-blue-500",
          isMinimized ? "px-3 py-2" : "px-4 py-3"
        )}>
          <div className="flex items-center gap-2">
            {!isMinimized && (
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
            )}
            <div>
              <h3 className={cn("font-semibold text-white", isMinimized ? "text-xs" : "text-sm")}>
                {isMinimized ? "AI Builder" : "AI Timeline Builder"}
              </h3>
              {!isMinimized && (
                <p className="text-xs text-white/70">
                  {isProcessing ? 'Thinking...' : 'Ready to help'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Undo/Redo - hide when minimized */}
            {!isMinimized && (
              <>
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
              </>
            )}

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
                {/* Chat Tab - Default tab, always first */}
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
                  {documentContexts.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-blue-500 text-white rounded-full">
                      {documentContexts.length}
                    </span>
                  )}
                </button>

                {/* Voice Tab - OpenAI Realtime */}
                <button
                  onClick={() => voiceCapabilities.available && setActiveTab('voice')}
                  disabled={!voiceCapabilities.available}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    activeTab === 'voice'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                    !voiceCapabilities.available && 'opacity-50 cursor-not-allowed'
                  )}
                  title={voiceCapabilities.available ? 'OpenAI Realtime voice (speech-to-speech)' : 'Voice not available (OpenAI API key required)'}
                >
                  {voiceCapabilities.available ? (
                    <Mic className="w-4 h-4" />
                  ) : (
                    <MicOff className="w-4 h-4" />
                  )}
                  Voice
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

            {/* Deepseek media attachment warning - only show for deepseek, hide on Voice tab */}
            {aiBuilderSelectedProvider === 'deepseek' && activeTab !== 'voice' && (
              <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Deepseek doesn&apos;t support image/media analysis. For attachments, switch to Claude, GPT-4, or Gemini.
                </p>
              </div>
            )}

            {/* Tab Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Voice Tab - OpenAI Realtime */}
              {activeTab === 'voice' && (
                <Voice2Controls
                  onTranscript={(text, role, isFinal) => {
                    if (isFinal) {
                      setMessages((prev) => [
                        ...prev,
                        {
                          id: Date.now().toString(),
                          role: role === 'user' ? 'user' : 'assistant',
                          content: text,
                          timestamp: new Date(),
                          isVoice: true,
                        },
                      ]);
                    }
                  }}
                  onError={(err) => setError(err)}
                />
              )}

              {/* Conversation View (for chat) */}
              {activeTab === 'chat' && (
                <>
                  <ConversationView
                    messages={messages}
                    isProcessing={isProcessing}
                    error={error}
                  />

                  {/* Text Input */}
                  <TextInput
                    onSend={(msg, files) => handleSendMessage(msg, files)}
                    onFileUpload={handleFileUpload}
                    disabled={isProcessing}
                    selectedProvider={aiBuilderSelectedProvider}
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
                    llmProvider={aiBuilderSelectedProvider}
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
