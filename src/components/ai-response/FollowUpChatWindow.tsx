'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  MessageCircle,
  User,
  Bot,
  Loader2,
  ChevronDown,
  BookOpen,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface SourceReference {
  page: string | null;
  title: string;
  source_document: string;
  url: string | null;
}

interface Sources {
  references: SourceReference[];
  rules_summary: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Sources;
  timestamp: Date;
}

interface FollowUpChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  initialQuery?: string;
  llmProvider?: string;
}

export default function FollowUpChatWindow({
  isOpen,
  onClose,
  sessionId,
  initialQuery,
  llmProvider = 'deepseek',
}: FollowUpChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Add initial context message when opened
  useEffect(() => {
    if (isOpen && messages.length === 0 && initialQuery) {
      setMessages([
        {
          id: 'context',
          role: 'assistant',
          content: `I've analyzed your CGT query. Feel free to ask any follow-up questions about the analysis, and I'll help clarify or explore different scenarios.`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, initialQuery, messages.length]);

  const toggleSourceExpanded = (messageId: string) => {
    setExpandedSources((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/follow-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          question: userMessage.content,
          llm_provider: llmProvider,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get response');
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.data.answer,
        sources: result.data.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error sending follow-up message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Chat Window - Half screen width, full height */}
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-4 top-4 bottom-4 w-[calc(100%-2rem)] md:w-[calc(50%-2rem)] lg:w-[45%] bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-indigo-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Follow-up Questions</h2>
                  <p className="text-xs text-white/70">Ask anything about your CGT analysis</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl shadow-sm',
                      message.role === 'user'
                        ? 'bg-blue-600 text-white px-4 py-3'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    )}
                  >
                    {message.role === 'user' ? (
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    ) : (
                      <div className="p-4 text-gray-900 dark:text-gray-100">
                        {/* Markdown Content - Using prose-invert for dark mode */}
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-blue-600 dark:prose-a:text-blue-400">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>

                        {/* Sources Section */}
                        {message.sources && (message.sources.references?.length > 0 || message.sources.rules_summary) && (
                          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <button
                              onClick={() => toggleSourceExpanded(message.id)}
                              className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>Sources & Rules ({message.sources.references?.length || 0} references)</span>
                              <ChevronDown
                                className={cn(
                                  'w-3.5 h-3.5 transition-transform',
                                  expandedSources.has(message.id) && 'rotate-180'
                                )}
                              />
                            </button>

                            <AnimatePresence>
                              {expandedSources.has(message.id) && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  {/* References */}
                                  {message.sources.references && message.sources.references.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                      <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                        References
                                      </h5>
                                      {message.sources.references.map((ref, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2"
                                        >
                                          <span className="flex-shrink-0 w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded text-center leading-5 font-medium">
                                            {idx + 1}
                                          </span>
                                          <div>
                                            <p className="font-medium text-gray-800 dark:text-gray-200">
                                              {ref.title}
                                            </p>
                                            <p className="text-gray-500 dark:text-gray-500">
                                              {ref.source_document}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Rules Summary */}
                                  {message.sources.rules_summary && (
                                    <div className="mt-3">
                                      <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">
                                        Rules Applied
                                      </h5>
                                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 text-gray-700 dark:text-gray-300">
                                        <div className="prose prose-xs dark:prose-invert max-w-none">
                                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {message.sources.rules_summary}
                                          </ReactMarkdown>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 justify-start"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Analyzing your question...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-3 text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a follow-up question..."
                    rows={1}
                    className="w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    style={{
                      minHeight: '44px',
                      maxHeight: '120px',
                    }}
                  />
                  <div className="absolute right-2 bottom-2 text-xs text-gray-400 dark:text-gray-500">
                    Enter to send
                  </div>
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className={cn(
                    'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all',
                    inputValue.trim() && !isLoading
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Helper Text */}
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                <Sparkles className="w-3 h-3 inline-block mr-1" />
                Ask about different scenarios, clarifications, or what-if questions
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
