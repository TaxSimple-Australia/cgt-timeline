'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TERMS_AND_CONDITIONS } from '@/lib/legal-content';

interface CopyrightModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CopyrightModal({
  isOpen,
  onClose,
}: CopyrightModalProps) {
  if (!isOpen) return null;

  // Get the Copyright & Intellectual Property section
  const copyrightSection = TERMS_AND_CONDITIONS.sections.find(
    section => section.title === 'Copyright & Intellectual Property Disclaimer'
  );

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

          {/* Modal Container */}
          <div className="fixed inset-0 z-[100000] grid place-items-center p-4 pointer-events-none overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl pointer-events-auto my-8"
              style={{ maxHeight: 'calc(100vh - 4rem)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-cyan-500" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Copyright & Intellectual Property
                    </h2>
                    <p className="text-sm text-slate-400">
                      CGT Brain AI Legal Protection
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

              {/* Content */}
              <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
                {copyrightSection && (
                  <div className="space-y-6">
                    {copyrightSection.content.map((item, itemIndex) => (
                      <div key={itemIndex} className="space-y-3">
                        <h3 className="text-lg font-semibold text-cyan-400">
                          {item.subtitle}
                        </h3>
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
                )}

                {/* Footer Note */}
                <div className="pt-6 border-t border-slate-700">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    All content, algorithms, and branding are protected under the Copyright Act 1968 (Cth)
                    and international intellectual property treaties. Unauthorized use, reproduction,
                    or reverse-engineering is strictly prohibited.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-6 border-t border-slate-700">
                <Button
                  onClick={onClose}
                  className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold transition-all"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  // Render modal in a portal at document.body level
  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
