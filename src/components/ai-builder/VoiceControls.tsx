'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { VoiceState } from '@/types/ai-builder';

interface VoiceControlsProps {
  voiceState: VoiceState;
  isSpeaking: boolean;
  isPushToTalk: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  onTogglePushToTalk: () => void;
  onOpenSettings?: () => void;
  disabled?: boolean;
}

export default function VoiceControls({
  voiceState,
  isSpeaking,
  isPushToTalk,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  onTogglePushToTalk,
  onOpenSettings,
  disabled = false,
}: VoiceControlsProps) {
  const [isHolding, setIsHolding] = useState(false);
  const isListening = voiceState === 'listening';
  const isProcessing = voiceState === 'processing';
  const isConnecting = voiceState === 'connecting';
  const hasError = voiceState === 'error';

  // Handle push-to-talk
  const handleMouseDown = useCallback(() => {
    if (disabled || !isPushToTalk) return;
    setIsHolding(true);
    onStartListening();
  }, [disabled, isPushToTalk, onStartListening]);

  const handleMouseUp = useCallback(() => {
    if (!isPushToTalk) return;
    setIsHolding(false);
    onStopListening();
  }, [isPushToTalk, onStopListening]);

  const handleClick = useCallback(() => {
    if (disabled) return;
    if (isPushToTalk) return; // Handled by mouse down/up

    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  }, [disabled, isPushToTalk, isListening, onStartListening, onStopListening]);

  // Keyboard support for push-to-talk (spacebar)
  useEffect(() => {
    if (!isPushToTalk) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !isHolding) {
        e.preventDefault();
        setIsHolding(true);
        onStartListening();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsHolding(false);
        onStopListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPushToTalk, isHolding, onStartListening, onStopListening]);

  const getButtonContent = () => {
    if (isConnecting) {
      return (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Connecting...</span>
        </>
      );
    }

    if (hasError) {
      return (
        <>
          <MicOff className="w-5 h-5" />
          <span>Connection Error</span>
        </>
      );
    }

    if (isProcessing) {
      return (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Processing...</span>
        </>
      );
    }

    if (isListening) {
      return (
        <>
          <Mic className="w-5 h-5 animate-pulse" />
          <span>{isPushToTalk ? 'Release to Send' : 'Listening...'}</span>
        </>
      );
    }

    return (
      <>
        <Mic className="w-5 h-5" />
        <span>{isPushToTalk ? 'Hold to Talk' : 'Click to Talk'}</span>
      </>
    );
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      {/* Main Voice Button */}
      <button
        onMouseDown={isPushToTalk ? handleMouseDown : undefined}
        onMouseUp={isPushToTalk ? handleMouseUp : undefined}
        onMouseLeave={isPushToTalk && isHolding ? handleMouseUp : undefined}
        onClick={!isPushToTalk ? handleClick : undefined}
        disabled={disabled || isConnecting}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500'
            : hasError
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {getButtonContent()}
      </button>

      {/* Voice Activity Indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5"
          >
            {/* Audio visualization bars */}
            <div className="flex items-center gap-0.5">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-red-500 rounded-full"
                  animate={{
                    height: [8, 16, 8, 20, 8],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
            <span className="text-sm text-red-500 font-medium">Recording</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Speaking Indicator */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-2"
          >
            <Volume2 className="w-5 h-5 text-blue-500 animate-pulse" />
            <span className="text-sm text-blue-500 font-medium">AI Speaking</span>
            <button
              onClick={onStopSpeaking}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              title="Stop speaking"
            >
              <VolumeX className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Push-to-Talk Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">Push to Talk</span>
        <button
          onClick={onTogglePushToTalk}
          className={cn(
            'relative w-10 h-5 rounded-full transition-colors',
            isPushToTalk ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
          )}
        >
          <motion.div
            className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow"
            animate={{ left: isPushToTalk ? 22 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* Settings Button */}
      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Voice Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
