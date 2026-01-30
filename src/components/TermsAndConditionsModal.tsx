'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TERMS_AND_CONDITIONS, PREFERENCE_CHECKBOXES } from '@/lib/legal-content';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose: () => void;
}

export default function TermsAndConditionsModal({
  isOpen,
  onAccept,
  onClose,
}: TermsAndConditionsModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  // Debug logging
  useEffect(() => {
    console.log('📝 TermsAndConditionsModal rendered, isOpen:', isOpen);
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('🚀 Modal opening, resetting state');
      setHasScrolledToBottom(false);
      setHasAgreed(false);
      setPreferences({});
    }
  }, [isOpen]);

  // Check if user has scrolled to bottom
  const handleScroll = () => {
    if (!contentRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 20; // 20px threshold

    if (scrolledToBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    if (hasAgreed && hasScrolledToBottom) {
      // Save preferences to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('cgtBrain_preferences', JSON.stringify(preferences));
      }
      onAccept();
    }
  };

  const togglePreference = (id: string) => {
    setPreferences(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (!isOpen) return null;

  // Portal content to render at document.body level
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999]"
            onClick={onClose}
          />

          {/* Modal Container - Grid centering for reliable positioning */}
          <div className="fixed inset-0 z-[100000] grid place-items-center p-4 pointer-events-none overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col pointer-events-auto my-8"
              style={{ maxHeight: 'calc(100vh - 4rem)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <ScrollText className="w-6 h-6 text-cyan-500" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {TERMS_AND_CONDITIONS.title}
                    </h2>
                    <p className="text-sm text-slate-400">
                      Last updated: {TERMS_AND_CONDITIONS.lastUpdated}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div
                ref={contentRef}
                onScroll={handleScroll}
                className="flex-1 min-h-0 overflow-y-auto p-6 space-y-8"
              >
                {TERMS_AND_CONDITIONS.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="space-y-4">
                    <h3 className="text-xl font-bold text-white border-b border-slate-700 pb-2">
                      {section.title}
                    </h3>
                    {section.content.map((item, itemIndex) => (
                      <div key={itemIndex} className="space-y-2">
                        <h4 className="text-base font-semibold text-cyan-400">
                          {item.subtitle}
                        </h4>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          {item.text}
                        </p>
                        {item.list && (
                          <ul className="list-disc list-inside space-y-2 ml-4 text-sm text-slate-300">
                            {item.list.map((listItem, listIndex) => (
                              <li key={listIndex} className="leading-relaxed">
                                {listItem}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ))}

                {/* Scroll indicator */}
                {!hasScrolledToBottom && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center gap-2 text-amber-500 text-sm py-4 sticky bottom-0 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent pt-8"
                  >
                    <ScrollText className="w-4 h-4 animate-bounce" />
                    <span>Please scroll to the bottom to continue</span>
                  </motion.div>
                )}

                {/* Footer with Checkboxes and Actions - Now inside scrollable area */}
                <div className="border-t border-slate-700 pt-6 mt-8 space-y-4">
                {/* Preference Checkboxes */}
                <div className="space-y-3">
                  {PREFERENCE_CHECKBOXES.map((checkbox) => (
                    <label
                      key={checkbox.id}
                      className="flex items-start gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={preferences[checkbox.id] || false}
                        onChange={() => togglePreference(checkbox.id)}
                        className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">
                          {checkbox.label}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {checkbox.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Main Agreement Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer group p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <input
                    type="checkbox"
                    checked={hasAgreed}
                    onChange={(e) => setHasAgreed(e.target.checked)}
                    disabled={!hasScrolledToBottom}
                    className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex-1">
                    <div className="text-base font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      I have read and agree to the Terms & Conditions
                    </div>
                    {!hasScrolledToBottom && (
                      <div className="text-xs text-amber-500 mt-1">
                        Please scroll to the bottom to enable this option
                      </div>
                    )}
                  </div>
                </label>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleAccept}
                    disabled={!hasAgreed || !hasScrolledToBottom}
                    className="flex-1 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Accept & Continue
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="px-6 h-12 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    Cancel
                  </Button>
                </div>

                {/* Legal Footer Note */}
                <p className="text-xs text-slate-500 text-center leading-relaxed">
                  By clicking "Accept & Continue", you agree to our Terms & Conditions and acknowledge that CGT BRAIN AI is a decision-support tool. All outputs are preliminary until reviewed by a qualified tax professional.
                </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  // Render modal in a portal at document.body level to escape stacking context
  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
