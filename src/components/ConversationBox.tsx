'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, HelpCircle, X, Sparkles, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ConversationBoxProps {
  onSendQuery: (query: string) => Promise<void>;
  isLoading?: boolean;
  showViewAnalysisButton?: boolean;
  onViewAnalysis?: () => void;
}

export default function ConversationBox({
  onSendQuery,
  isLoading = false,
  showViewAnalysisButton = false,
  onViewAnalysis
}: ConversationBoxProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: query.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsExpanded(true);

    try {
      await onSendQuery(userMessage.content);
    } catch (error) {
      console.error('Error sending query:', error);
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
  };

  const handleOpen = () => {
    setIsOpen(true);
    // Auto-focus input when opening
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsExpanded(false);
    setQuery('');
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
      <div className="flex flex-col items-center gap-2">
        <AnimatePresence mode="wait">
          {!isOpen ? (
            // Collapsed: Question Mark Button
            <motion.button
              key="collapsed"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
              onClick={handleOpen}
              className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700
                       text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300
                       flex items-center justify-center group hover:scale-110 active:scale-95"
              aria-label="Ask a question about your CGT"
            >
              <HelpCircle className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
            </motion.button>
          ) : (
          // Expanded: Input Form
          <motion.div
            key="expanded"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
            className="w-[640px] px-4"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700"
            >
        {/* Messages History */}
        <AnimatePresence>
          {isExpanded && messages.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="max-h-80 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                      <Loader2 className="w-5 h-5 text-gray-600 dark:text-gray-400 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="relative flex items-center gap-2">
            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                       hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
              aria-label="Close question input"
            >
              <X className="w-4 h-4" />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={handleFocus}
              placeholder="Ask a question about your CGT timeline..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 pr-12 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl
                       text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="absolute right-2 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600
                       transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View CGT Analysis Button - Appears below Question Mark when collapsed */}
      <AnimatePresence>
        {!isOpen && showViewAnalysisButton && (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
            onClick={onViewAnalysis}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
            aria-label="Show CGT analysis results"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">View CGT Analysis</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
