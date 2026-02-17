'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cookie, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PREFERENCE_CHECKBOXES } from '@/lib/legal-content';

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CookiePreferencesModal({
  isOpen,
  onClose,
}: CookiePreferencesModalProps) {
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Load current preferences from localStorage when modal opens
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('cgtBrain_preferences');
      if (saved) {
        try {
          const parsedPreferences = JSON.parse(saved);
          setPreferences(parsedPreferences);
        } catch (error) {
          console.error('❌ Failed to parse saved preferences:', error);
          setPreferences({});
        }
      } else {
        // Set defaults if no preferences saved
        setPreferences({});
      }
      setHasChanges(false);
    }
  }, [isOpen]);

  const togglePreference = (id: string) => {
    setPreferences(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cgtBrain_preferences', JSON.stringify(preferences));
      console.log('✅ Cookie preferences saved:', preferences);
    }
    onClose();
  };

  const handleCancel = () => {
    setHasChanges(false);
    onClose();
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
            onClick={handleCancel}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[100000] grid place-items-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <Cookie className="w-6 h-6 text-cyan-500" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Cookie Settings
                    </h2>
                    <p className="text-sm text-slate-400">
                      Manage your privacy preferences
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancel}
                  className="text-slate-400 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Info Text */}
                <p className="text-sm text-slate-300 leading-relaxed">
                  You can customize how CGT BRAIN AI uses cookies and collects data to enhance your experience.
                  These preferences are stored locally and can be changed at any time.
                </p>

                {/* Essential Cookies Notice */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <h3 className="text-sm font-semibold text-white mb-2">
                    Essential Cookies (Always Active)
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Required for security and basic functionality. These cookies cannot be disabled
                    as they are necessary for the platform to operate securely.
                  </p>
                </div>

                {/* Preference Checkboxes */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-white">
                    Optional Preferences
                  </h3>
                  {PREFERENCE_CHECKBOXES.map((checkbox) => (
                    <label
                      key={checkbox.id}
                      className="flex items-start gap-3 cursor-pointer group p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-cyan-500/50 transition-colors"
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

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-700">
                  <Button
                    onClick={handleSave}
                    className="flex-1 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold transition-all"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    Save Preferences
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="px-6 h-12 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    Cancel
                  </Button>
                </div>

                {/* Footer Note */}
                {hasChanges && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-amber-500 text-center"
                  >
                    You have unsaved changes
                  </motion.p>
                )}
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
