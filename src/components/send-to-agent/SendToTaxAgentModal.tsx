'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mail, Phone, CheckCircle, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import TaxAgentSelector from './TaxAgentSelector';
import type { TaxAgentPublic } from '@/types/tax-agent';

interface SendToTaxAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareId: string | null;
  propertiesCount: number;
  eventsCount: number;
  hasAnalysis: boolean;
  analysisProvider?: string;
}

type Step = 'select-agent' | 'enter-details' | 'success';

export default function SendToTaxAgentModal({
  isOpen,
  onClose,
  shareId,
  propertiesCount,
  eventsCount,
  hasAnalysis,
  analysisProvider,
}: SendToTaxAgentModalProps) {
  const [step, setStep] = useState<Step>('select-agent');
  const [selectedAgent, setSelectedAgent] = useState<TaxAgentPublic | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep('select-agent');
      setSelectedAgent(null);
      setUserEmail('');
      setUserPhone('');
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  const handleSelectAgent = (agent: TaxAgentPublic) => {
    setSelectedAgent(agent);
    setStep('enter-details');
    setError(null);
  };

  const handleBack = () => {
    setStep('select-agent');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedAgent || !userEmail.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!shareId) {
      setError('Please save your timeline first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/submissions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taxAgentId: selectedAgent.id,
          shareId,
          userEmail: userEmail.trim(),
          userPhone: userPhone.trim() || undefined,
          propertiesCount,
          eventsCount,
          hasAnalysis,
          analysisProvider,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send to Tax Agent');
      }

      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send to Tax Agent');
    } finally {
      setLoading(false);
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
              className="w-full max-w-2xl max-h-[90vh] flex flex-col"
            >
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-full">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-emerald-600 to-teal-600">
                  <div className="flex items-center gap-3">
                    {step === 'enter-details' && (
                      <button
                        onClick={handleBack}
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 text-white" />
                      </button>
                    )}
                    <div>
                      <h2 className="text-lg font-bold text-white">
                        {step === 'success' ? 'Sent Successfully!' : 'Send to Tax Agent'}
                      </h2>
                      <p className="text-xs text-emerald-100">
                        {step === 'select-agent' && 'Choose a Tax Agent to review your timeline'}
                        {step === 'enter-details' && `Sending to ${selectedAgent?.name}`}
                        {step === 'success' && 'Your timeline has been sent for review'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {error && (
                    <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {/* Step 1: Select Agent */}
                  {step === 'select-agent' && (
                    <TaxAgentSelector onSelect={handleSelectAgent} />
                  )}

                  {/* Step 2: Enter Details */}
                  {step === 'enter-details' && selectedAgent && (
                    <div className="space-y-6">
                      {/* Selected Agent Card */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                          {selectedAgent.photoBase64 ? (
                            <img
                              src={selectedAgent.photoBase64}
                              alt={selectedAgent.name}
                              className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-600"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                              <span className="text-lg font-bold text-white">
                                {selectedAgent.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{selectedAgent.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {selectedAgent.role === 'senior_tax_agent' ? 'Senior Tax Agent' : 'Tax Agent'}
                              {selectedAgent.experienceYears && ` • ${selectedAgent.experienceYears} years experience`}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* User Contact Form */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-slate-900 dark:text-slate-100">Your Contact Details</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          The Tax Agent will use this information to contact you with their review.
                        </p>

                        {/* Email */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Email Address *
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="email"
                              value={userEmail}
                              onChange={(e) => setUserEmail(e.target.value)}
                              placeholder="your@email.com"
                              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                              required
                            />
                          </div>
                        </div>

                        {/* Phone (optional) */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Phone Number <span className="text-slate-400">(optional)</span>
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="tel"
                              value={userPhone}
                              onChange={(e) => setUserPhone(e.target.value)}
                              placeholder="0400 000 000"
                              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Timeline Summary */}
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">What you're sending:</h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                          <li>{propertiesCount} {propertiesCount === 1 ? 'property' : 'properties'}</li>
                          <li>{eventsCount} events</li>
                          <li>CGT Analysis: {hasAnalysis ? `Yes (${analysisProvider || 'AI'})` : 'No'}</li>
                        </ul>
                      </div>

                      {/* Submit Button */}
                      <button
                        onClick={handleSubmit}
                        disabled={loading || !userEmail.trim()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Send to Tax Agent
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Step 3: Success */}
                  {step === 'success' && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                        Successfully Sent!
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 mb-6">
                        Your timeline has been sent to <strong>{selectedAgent?.name}</strong> for review.
                      </p>

                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-left mb-6">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">What happens next:</h4>
                        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                          <li className="flex items-start gap-2">
                            <span className="text-green-500">1.</span>
                            A confirmation email has been sent to <strong>{userEmail}</strong>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500">2.</span>
                            The Tax Agent has been notified of your submission
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500">3.</span>
                            They will review your timeline and contact you with feedback
                          </li>
                        </ul>
                      </div>

                      <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  )}
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
