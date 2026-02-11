'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TextInputProps {
  onSend: (message: string, files?: File[]) => void;
  onFileUpload?: (files: File[]) => void; // For backward compatibility with docs tab
  disabled?: boolean;
  placeholder?: string;
  currentTranscript?: string;
  selectedProvider?: string;
}

export default function TextInput({
  onSend,
  onFileUpload,
  disabled = false,
  placeholder = 'Type a message...',
  currentTranscript = '',
  selectedProvider,
}: TextInputProps) {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update message when transcript changes
  useEffect(() => {
    if (currentTranscript) {
      setMessage(currentTranscript);
    }
  }, [currentTranscript]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage && attachedFiles.length === 0) return;
    if (disabled) return;

    // Send message with files together (for multimodal support)
    if (attachedFiles.length > 0) {
      // Send message along with files
      onSend(trimmedMessage || 'Please analyze these files.', attachedFiles);
      setAttachedFiles([]);
    } else if (trimmedMessage) {
      // Send text-only message
      onSend(trimmedMessage);
    }

    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachedFiles((prev) => [...prev, ...files]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    const type = file.type.split('/')[0];
    if (type === 'image') return '📷';
    if (file.type === 'application/pdf') return '📄';
    if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx')) return '📊';
    return '📎';
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-3">
      {/* Media support warning - only show for deepseek (no vision support) */}
      <AnimatePresence>
        {attachedFiles.length > 0 && selectedProvider === 'deepseek' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center gap-2 px-3 py-2 mb-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden"
          >
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Deepseek does not support image/media analysis. Switch to Claude, GPT-4, or Gemini.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attached files preview */}
      <AnimatePresence>
        {attachedFiles.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-wrap gap-2 mb-2 overflow-hidden"
          >
            {attachedFiles.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg"
              >
                <span>{getFileIcon(file)}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300 max-w-[150px] truncate">
                  {file.name}
                </span>
                <button
                  onClick={() => removeFile(index)}
                  className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="flex items-end gap-2">
        {/* File upload button */}
        {onFileUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv,.docx,.doc,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className={cn(
                'p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className={cn(
              'w-full px-4 py-2.5 pr-12 rounded-xl resize-none',
              'bg-gray-100 dark:bg-gray-800',
              'text-gray-900 dark:text-gray-100',
              'placeholder-gray-500 dark:placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all'
            )}
          />

          {/* Send button (inside textarea) */}
          <button
            onClick={handleSubmit}
            disabled={disabled || (!message.trim() && attachedFiles.length === 0)}
            className={cn(
              'absolute right-2 bottom-2 p-2 rounded-lg',
              'bg-blue-500 text-white',
              'hover:bg-blue-600 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500'
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hint text */}
      <p className="mt-2 text-xs text-gray-400 text-center">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
