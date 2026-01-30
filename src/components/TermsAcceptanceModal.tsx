'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Shield,
  FileText,
  Bell,
  Check,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import CGTBrainLogo from '@/components/branding/CGTBrainLogo';

// Storage key for terms acceptance
const TERMS_ACCEPTED_KEY = 'cgt-brain-terms-accepted';
const TERMS_VERSION = '1.0'; // Increment this when terms change to require re-acceptance

interface TermsAcceptanceModalProps {
  onAccept: () => void;
}

/**
 * Check if user has already accepted the current terms version
 */
export function hasAcceptedTerms(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const stored = localStorage.getItem(TERMS_ACCEPTED_KEY);
    if (!stored) return false;

    const data = JSON.parse(stored);
    return data.version === TERMS_VERSION && data.accepted === true;
  } catch {
    return false;
  }
}

/**
 * Store that user has accepted terms
 */
function acceptTerms(): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(TERMS_ACCEPTED_KEY, JSON.stringify({
    version: TERMS_VERSION,
    accepted: true,
    acceptedAt: new Date().toISOString(),
  }));
}

export default function TermsAcceptanceModal({ onAccept }: TermsAcceptanceModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [collectionChecked, setCollectionChecked] = useState(false);

  // Check if we need to show the modal
  useEffect(() => {
    // Small delay to prevent flash
    const timer = setTimeout(() => {
      if (!hasAcceptedTerms()) {
        setIsVisible(true);
      } else {
        // Already accepted, proceed
        onAccept();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [onAccept]);

  const allChecked = termsChecked && privacyChecked && collectionChecked;

  const handleAccept = () => {
    if (!allChecked) return;

    acceptTerms();
    setIsVisible(false);
    onAccept();
  };

  // Don't render if already accepted
  if (!isVisible) return null;

  const legalItems = [
    {
      id: 'terms',
      label: 'Terms of Service',
      description: 'Rules for using CGT Brain AI',
      href: '/terms',
      icon: FileText,
      checked: termsChecked,
      setChecked: setTermsChecked,
    },
    {
      id: 'privacy',
      label: 'Privacy Policy',
      description: 'How we handle your data',
      href: '/privacy',
      icon: Shield,
      checked: privacyChecked,
      setChecked: setPrivacyChecked,
    },
    {
      id: 'collection',
      label: 'Collection Notice',
      description: 'What information we collect',
      href: '/collection-notice',
      icon: Bell,
      checked: collectionChecked,
      setChecked: setCollectionChecked,
    },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100]"
          />

          {/* Modal - Centered using fixed positioning */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed z-[101] w-[calc(100%-2rem)] max-w-lg inset-0 m-auto h-fit"
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Header */}
              <div className="px-6 py-6 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <CGTBrainLogo size="lg" variant="logo-1" className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Welcome to CGT Brain AI
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Please review and accept our policies to continue
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-5">
                <div className="space-y-3">
                  {legalItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 transition-all hover:border-cyan-500/50"
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => item.setChecked(!item.checked)}
                          className={`
                            flex-shrink-0 w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center mt-0.5
                            ${item.checked
                              ? 'bg-cyan-500 border-cyan-500'
                              : 'border-slate-300 dark:border-slate-600 hover:border-cyan-500/50'
                            }
                          `}
                        >
                          {item.checked && <Check className="w-4 h-4 text-white" />}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-cyan-500" />
                            <span className="font-medium text-slate-900 dark:text-white">
                              {item.label}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.description}
                          </p>
                        </div>

                        {/* Link */}
                        <Link
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title={`Read ${item.label}`}
                        >
                          <ExternalLink className="w-4 h-4 text-slate-400 hover:text-cyan-500" />
                        </Link>
                      </div>
                    );
                  })}
                </div>

                {/* Agreement text */}
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center leading-relaxed">
                  By clicking "Accept & Continue", you agree to our Terms of Service,
                  Privacy Policy, and Collection Notice. Your data is stored securely
                  in Australia.
                </p>

                {/* Security badge */}
                <div className="flex items-center justify-center gap-2 mt-4 py-2 px-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <Lock className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                    Your data is encrypted and stored securely
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
                <Button
                  onClick={handleAccept}
                  disabled={!allChecked}
                  className={`
                    w-full py-6 text-lg font-semibold transition-all
                    ${allChecked
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                    }
                  `}
                >
                  {allChecked ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Accept & Continue
                    </>
                  ) : (
                    'Please accept all policies to continue'
                  )}
                </Button>

                <p className="text-xs text-center text-slate-400 mt-3">
                  Need help?{' '}
                  <Link href="/contact" className="text-cyan-500 hover:text-cyan-600 underline">
                    Contact us
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
