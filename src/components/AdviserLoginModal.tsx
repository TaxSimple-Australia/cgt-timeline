'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, User, AlertCircle, UserCircle } from 'lucide-react';

interface AdviserLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

// Hardcoded adviser credentials
const ADVISER_USERNAME = 'adviser';
const ADVISER_PASSWORD = 'adviser123';

export default function AdviserLoginModal({ isOpen, onClose, onLoginSuccess }: AdviserLoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUsername('');
      setPassword('');
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    if (username === ADVISER_USERNAME && password === ADVISER_PASSWORD) {
      // Store auth in session storage
      sessionStorage.setItem('adviserLoggedIn', 'true');
      sessionStorage.setItem('adviserUsername', username);
      onLoginSuccess();
    } else {
      setError('Invalid username or password');
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100001]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[100002] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="w-full max-w-md"
              onKeyDown={handleKeyDown}
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-cyan-500 to-blue-600">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <UserCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Adviser Login</h2>
                      <p className="text-xs text-blue-100">CGT Brain Adviser Portal</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    >
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </motion.div>
                  )}

                  {/* Username Input */}
                  <div>
                    <label htmlFor="adviser-username" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        id="adviser-username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter adviser username"
                        autoComplete="username"
                        autoFocus
                        className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label htmlFor="adviser-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        id="adviser-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter adviser password"
                        autoComplete="current-password"
                        className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || !username || !password}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-cyan-500 disabled:hover:to-blue-600"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Sign In
                      </>
                    )}
                  </button>
                </form>

                {/* Footer */}
                <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    Access restricted to authorized advisers only
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
