'use client';

import React, { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import MessageBubble, { TypingIndicator, ErrorMessage } from './MessageBubble';
import type { ConversationMessage } from '@/types/ai-builder';

interface ConversationViewProps {
  messages: ConversationMessage[];
  isProcessing: boolean;
  error?: string | null;
}

export default function ConversationView({
  messages,
  isProcessing,
  error,
}: ConversationViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isProcessing]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
    >
      {/* Welcome message if no messages */}
      {messages.length === 0 && !isProcessing && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            AI Timeline Builder
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
            Tell me about your properties and I&apos;ll help you build your CGT timeline.
            You can speak or type your messages.
          </p>
        </div>
      )}

      {/* Messages */}
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isLatest={index === messages.length - 1}
          />
        ))}
      </AnimatePresence>

      {/* Typing indicator */}
      <AnimatePresence>
        {isProcessing && <TypingIndicator />}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && <ErrorMessage message={error} />}
      </AnimatePresence>

      {/* Scroll anchor */}
      <div ref={scrollRef} />
    </div>
  );
}
