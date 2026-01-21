'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle } from 'lucide-react';

interface SourceReference {
  page: number;
  title: string;
  source_document: string;
}

interface Sources {
  references: SourceReference[];
  rules_summary: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Sources;
}

interface ChatPanelProps {
  sessionId: string;
  llmProvider: string;
  apiUrl: string;
}

function SourcesCollapsible({ sources }: { sources: Sources }) {
  const [isOpen, setIsOpen] = useState(false);
  const refCount = sources.references.length;

  return (
    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
      >
        <span className="font-medium">{isOpen ? '[-]' : '[+]'}</span>
        <span>{refCount} source{refCount !== 1 ? 's' : ''}</span>
      </button>

      {isOpen && (
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 space-y-1 pl-3">
          {sources.references.map((src, idx) => (
            <div key={idx} className="truncate">
              {src.title} <span className="text-slate-400 dark:text-slate-500">(p.{src.page})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChatPanel({ sessionId, llmProvider, apiUrl }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Clear messages when session changes (new analysis)
  useEffect(() => {
    setMessages([]);
    setError(null);
    setInput('');
  }, [sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/follow-up/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          question: input,
          llm_provider: llmProvider,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
        sources: data.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Follow-up Questions</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Messages Container */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg h-80 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900 mb-4">
        {messages.length === 0 && !loading && (
          <div className="text-center text-slate-400 dark:text-slate-500 py-8">
            <p className="mb-2">Ask follow-up questions about your CGT analysis</p>
            <p className="text-sm">Examples:</p>
            <ul className="text-sm mt-1 space-y-1">
              <li>&quot;What if I had lived there for 2 more years?&quot;</li>
              <li>&quot;Can you explain the 6-year rule in more detail?&quot;</li>
              <li>&quot;What documentation do I need to keep?&quot;</li>
            </ul>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block max-w-[85%] px-4 py-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100'
              }`}
            >
              {/* Message Content */}
              <div className="whitespace-pre-wrap text-sm">
                {msg.content}
              </div>

              {/* Sources for assistant messages - collapsible */}
              {msg.role === 'assistant' && msg.sources && msg.sources.references.length > 0 && (
                <SourcesCollapsible sources={msg.sources} />
              )}

              {/* Timestamp */}
              <div
                className={`text-xs mt-2 ${
                  msg.role === 'user' ? 'text-blue-200' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {msg.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="mb-4 text-left">
            <div className="inline-block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-4 py-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a follow-up question..."
          disabled={loading}
          className="flex-1 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-800"
        />
        <button
          onClick={handleSendMessage}
          disabled={loading || !input.trim()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">{loading ? '...' : 'Send'}</span>
        </button>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
        Session: {sessionId.slice(0, 8)}... | Using: {llmProvider}
      </p>
    </div>
  );
}
