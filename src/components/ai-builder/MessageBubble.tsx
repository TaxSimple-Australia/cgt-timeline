'use client';

import React from 'react';
import { User, Bot, Mic, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import type { ConversationMessage } from '@/types/ai-builder';

interface MessageBubbleProps {
  message: ConversationMessage;
  isLatest?: boolean;
}

export default function MessageBubble({ message, isLatest = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  // Parse action badges from message content
  const parseActions = (content: string): { text: string; actions: string[] } => {
    const actionPatterns = [
      /I've added ([^.]+)/gi,
      /Added ([^.]+)/gi,
      /I've recorded ([^.]+)/gi,
      /Updated ([^.]+)/gi,
      /Deleted ([^.]+)/gi,
    ];

    const actions: string[] = [];
    const text = content;

    actionPatterns.forEach((pattern) => {
      const matches = Array.from(content.matchAll(pattern));
      matches.forEach((match) => {
        if (match[1]) {
          actions.push(match[1].trim());
        }
      });
    });

    return { text, actions };
  };

  const { text, actions } = !isUser ? parseActions(message.content) : { text: message.content, actions: [] };

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-gray-500 dark:text-gray-400">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Content */}
      <div className={cn('flex flex-col max-w-[80%]', isUser ? 'items-end' : 'items-start')}>
        {/* Voice indicator */}
        {message.isVoice && (
          <div className="flex items-center gap-1 mb-1 text-xs text-gray-400">
            <Mic className="w-3 h-3" />
            <span>Voice message</span>
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl',
            isUser
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{text}</p>
          ) : (
            <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-strong:text-inherit prose-headings:text-inherit">
              <ReactMarkdown
                components={{
                  // Customize link rendering
                  a: ({ children, href }) => (
                    <a href={href} className="text-blue-600 dark:text-blue-400 underline" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                  // Keep paragraphs tight
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  // Style lists nicely
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                  li: ({ children }) => <li className="ml-2">{children}</li>,
                  // Bold text
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  // Code blocks
                  code: ({ children }) => (
                    <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">{children}</code>
                  ),
                }}
              >
                {text}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Action badges */}
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {actions.map((action, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full"
              >
                <Check className="w-3 h-3" />
                {action}
              </span>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="mt-1 text-xs text-gray-400">{formatTime(message.timestamp)}</span>
      </div>
    </motion.div>
  );
}

// Typing indicator component
export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex gap-3"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-gray-400 rounded-full"
              animate={{ y: [0, -5, 0] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Error message component
export function ErrorMessage({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
        <AlertCircle className="w-4 h-4 text-white" />
      </div>
      <div className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-2xl rounded-bl-md">
        <p className="text-sm">{message}</p>
      </div>
    </motion.div>
  );
}
