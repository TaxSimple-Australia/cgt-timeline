'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Check, Copy, Link, X, Loader2, Mail, Phone, Send, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimelineStore } from '@/store/timeline';

const COUNTRY_CODES = [
  { code: '+61', country: 'AU', label: 'Australia', flag: '🇦🇺' },
  { code: '+64', country: 'NZ', label: 'New Zealand', flag: '🇳🇿' },
  { code: '+1', country: 'US', label: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', country: 'GB', label: 'United Kingdom', flag: '🇬🇧' },
  { code: '+91', country: 'IN', label: 'India', flag: '🇮🇳' },
  { code: '+86', country: 'CN', label: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'JP', label: 'Japan', flag: '🇯🇵' },
  { code: '+82', country: 'KR', label: 'South Korea', flag: '🇰🇷' },
  { code: '+65', country: 'SG', label: 'Singapore', flag: '🇸🇬' },
  { code: '+60', country: 'MY', label: 'Malaysia', flag: '🇲🇾' },
  { code: '+63', country: 'PH', label: 'Philippines', flag: '🇵🇭' },
  { code: '+62', country: 'ID', label: 'Indonesia', flag: '🇮🇩' },
  { code: '+66', country: 'TH', label: 'Thailand', flag: '🇹🇭' },
  { code: '+84', country: 'VN', label: 'Vietnam', flag: '🇻🇳' },
  { code: '+49', country: 'DE', label: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'FR', label: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'IT', label: 'Italy', flag: '🇮🇹' },
  { code: '+353', country: 'IE', label: 'Ireland', flag: '🇮🇪' },
  { code: '+254', country: 'KE', label: 'Kenya', flag: '🇰🇪' },
  { code: '+27', country: 'ZA', label: 'South Africa', flag: '🇿🇦' },
  { code: '+971', country: 'AE', label: 'UAE', flag: '🇦🇪' },
];

interface ShareLinkButtonProps {
  className?: string;
  /** Button variant: 'toolbar' for timeline, 'analysis' for analysis view */
  variant?: 'toolbar' | 'analysis';
  /** Whether to include analysis in the share */
  includeAnalysis?: boolean;
}

export default function ShareLinkButton({
  className,
  variant = 'toolbar',
  includeAnalysis = false,
}: ShareLinkButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Email form state
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // WhatsApp form state
  const [waPhone, setWaPhone] = useState('');
  const [waCountryCode, setWaCountryCode] = useState('+61');
  const [waName, setWaName] = useState('');
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsAppSent, setWhatsAppSent] = useState(false);
  const [whatsAppError, setWhatsAppError] = useState<string | null>(null);

  const { exportShareableData, saveCurrentAnalysis, aiResponse } = useTimelineStore();

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Reset email and WhatsApp state when popup closes
  useEffect(() => {
    if (!isOpen) {
      setEmailSent(false);
      setEmailError(null);
      setWhatsAppSent(false);
      setWhatsAppError(null);
    }
  }, [isOpen]);

  // Generate share link
  const handleGenerateLink = async () => {
    setIsLoading(true);
    setError(null);
    setShareLink(null);

    try {
      // Save current analysis state if including analysis
      if (includeAnalysis && aiResponse) {
        saveCurrentAnalysis();
      }

      // Get all shareable data
      const data = exportShareableData();

      // Save to API
      const response = await fetch('/api/timeline/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate share link');
      }

      const link = `${window.location.origin}/app?share=${result.shareId}`;
      setShareLink(link);
      console.log('✅ Share link generated:', link);
    } catch (err) {
      console.error('❌ Error generating share link:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate link');
    } finally {
      setIsLoading(false);
    }
  };

  // Copy link to clipboard
  const handleCopy = async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      // Fallback: select input text
      inputRef.current?.select();
      document.execCommand('copy');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Send share link via email
  const handleSendEmail = async () => {
    if (!shareLink || !email) return;

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsSendingEmail(true);
    setEmailError(null);

    try {
      const response = await fetch('/api/send-share-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phoneNumber: phoneNumber || undefined,
          shareLink,
          includesAnalysis: includeAnalysis && !!aiResponse,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to send email');
      }

      setEmailSent(true);
      console.log('✅ Share link email sent successfully');
    } catch (err) {
      console.error('❌ Error sending email:', err);
      setEmailError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // WhatsApp phone input with country code auto-detection
  const handleWaPhoneChange = (value: string) => {
    if (value.startsWith('+')) {
      // Sort codes by length descending so +353 matches before +3
      const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
      const match = sorted.find(c => value.startsWith(c.code));
      if (match) {
        setWaCountryCode(match.code);
        setWaPhone(value.slice(match.code.length).trimStart());
        return;
      }
    }
    setWaPhone(value);
  };

  // Send share link via WhatsApp
  const handleSendWhatsApp = async () => {
    if (!shareLink || !waPhone) return;

    const cleanPhone = waPhone.replace(/[\s\-()]/g, '');
    if (cleanPhone.length < 4) {
      setWhatsAppError('Please enter a valid phone number');
      return;
    }

    const fullPhone = `${waCountryCode}${cleanPhone}`;

    setIsSendingWhatsApp(true);
    setWhatsAppError(null);

    try {
      const response = await fetch('https://cch.cgtbrain.com.au/api/share/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhone,
          shareLink,
          recipientName: waName || undefined,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to send');

      setWhatsAppSent(true);
      console.log('✅ WhatsApp message sent successfully');
    } catch (err) {
      console.error('❌ Error sending WhatsApp:', err);
      setWhatsAppError(err instanceof Error ? err.message : 'Failed to send WhatsApp message');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  // Open popup and generate link
  const handleClick = () => {
    setIsOpen(true);
    if (!shareLink) {
      handleGenerateLink();
    }
  };

  const hasAnalysis = !!aiResponse;

  return (
    <div className="relative" ref={popupRef}>
      {/* Trigger Button */}
      <motion.button
        onClick={handleClick}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1.5 rounded-md',
          'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50',
          'text-blue-700 dark:text-blue-300',
          'border border-blue-300 dark:border-blue-700',
          'transition-colors shadow-sm',
          className
        )}
        title="Share timeline"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span className="text-xs font-medium hidden sm:inline">Share</span>
      </motion.button>

      {/* Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-[10000] mt-2',
              'w-[720px] max-w-[calc(100vw-2rem)] p-4 rounded-xl shadow-2xl',
              'bg-white dark:bg-gray-800',
              'border border-gray-200 dark:border-gray-700',
              variant === 'toolbar' ? 'right-0' : 'left-0'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Link className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Share Link
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  Generating link...
                </span>
              </div>
            ) : error ? (
              <div className="py-4">
                <p className="text-sm text-red-500 dark:text-red-400 mb-3">{error}</p>
                <button
                  onClick={handleGenerateLink}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Try again
                </button>
              </div>
            ) : shareLink ? (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Anyone with this link can view your timeline
                  {hasAnalysis && includeAnalysis && ', analysis, '} and sticky notes.
                </p>

                {/* Link Input */}
                <div className="flex gap-2 mb-4">
                  <input
                    ref={inputRef}
                    type="text"
                    value={shareLink}
                    readOnly
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className={cn(
                      'flex-1 px-3 py-2 text-sm rounded-lg',
                      'bg-gray-100 dark:bg-gray-700',
                      'border border-gray-200 dark:border-gray-600',
                      'text-gray-900 dark:text-white',
                      'focus:outline-none focus:ring-2 focus:ring-blue-500'
                    )}
                  />
                  <motion.button
                    onClick={handleCopy}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'px-3 py-2 rounded-lg flex items-center justify-center min-w-[44px]',
                      'transition-colors',
                      isCopied
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    )}
                    title={isCopied ? 'Copied!' : 'Copy to clipboard'}
                  >
                    {isCopied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </motion.button>
                </div>

                {/* Copy Success Message */}
                <AnimatePresence>
                  {isCopied && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-green-600 dark:text-green-400 mb-3 font-medium"
                    >
                      Link copied to clipboard!
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Email & WhatsApp Side by Side */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email/Phone Section */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Send via Email
                    </h4>

                    {emailSent ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center"
                      >
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-sm font-medium text-green-700 dark:text-green-300">
                          Email sent!
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Sent to {email}
                        </p>
                        <button
                          onClick={() => {
                            setEmailSent(false);
                            setEmail('');
                            setPhoneNumber('');
                          }}
                          className="text-xs text-green-700 dark:text-green-300 hover:underline mt-3 font-medium"
                        >
                          Send to another email
                        </button>
                      </motion.div>
                    ) : (
                      <div className="space-y-3">
                        {/* Email Input */}
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                setEmailError(null);
                              }}
                              placeholder="recipient@example.com"
                              className={cn(
                                'w-full pl-9 pr-3 py-2 text-sm rounded-lg',
                                'bg-gray-50 dark:bg-gray-700',
                                'border',
                                emailError
                                  ? 'border-red-300 dark:border-red-600'
                                  : 'border-gray-200 dark:border-gray-600',
                                'text-gray-900 dark:text-white',
                                'placeholder-gray-400 dark:placeholder-gray-500',
                                'focus:outline-none focus:ring-2 focus:ring-blue-500'
                              )}
                            />
                          </div>
                        </div>

                        {/* Phone Input */}
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                            Phone Number <span className="text-gray-400">(optional)</span>
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="+61 400 000 000"
                              className={cn(
                                'w-full pl-9 pr-3 py-2 text-sm rounded-lg',
                                'bg-gray-50 dark:bg-gray-700',
                                'border border-gray-200 dark:border-gray-600',
                                'text-gray-900 dark:text-white',
                                'placeholder-gray-400 dark:placeholder-gray-500',
                                'focus:outline-none focus:ring-2 focus:ring-blue-500'
                              )}
                            />
                          </div>
                        </div>

                        {/* Email Error */}
                        <AnimatePresence>
                          {emailError && (
                            <motion.p
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-xs text-red-500 dark:text-red-400"
                            >
                              {emailError}
                            </motion.p>
                          )}
                        </AnimatePresence>

                        {/* Send Email Button */}
                        <motion.button
                          onClick={handleSendEmail}
                          disabled={!email || isSendingEmail}
                          whileHover={email && !isSendingEmail ? { scale: 1.02 } : undefined}
                          whileTap={email && !isSendingEmail ? { scale: 0.98 } : undefined}
                          className={cn(
                            'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
                            'text-sm font-medium transition-all',
                            email && !isSendingEmail
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          )}
                        >
                          {isSendingEmail ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Send via Email
                            </>
                          )}
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {/* WhatsApp Section */}
                  <div className="sm:border-l sm:border-gray-200 sm:dark:border-gray-700 sm:pl-4 border-t sm:border-t-0 border-gray-200 dark:border-gray-700 pt-4 sm:pt-0">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-green-500" />
                      Send via WhatsApp
                    </h4>

                    {whatsAppSent ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center"
                      >
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-sm font-medium text-green-700 dark:text-green-300">
                          WhatsApp sent!
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Sent to {waCountryCode}{waPhone}
                        </p>
                        <button
                          onClick={() => {
                            setWhatsAppSent(false);
                            setWaPhone('');
                            setWaName('');
                          }}
                          className="text-xs text-green-700 dark:text-green-300 hover:underline mt-3 font-medium"
                        >
                          Send to another number
                        </button>
                      </motion.div>
                    ) : (
                      <div className="space-y-3">
                        {/* Country Code + Phone Input */}
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <div className="flex gap-2">
                            <select
                              value={waCountryCode}
                              onChange={(e) => setWaCountryCode(e.target.value)}
                              className={cn(
                                'w-[100px] px-2 py-2 text-sm rounded-lg appearance-none',
                                'bg-gray-50 dark:bg-gray-700',
                                'border border-gray-200 dark:border-gray-600',
                                'text-gray-900 dark:text-white',
                                'focus:outline-none focus:ring-2 focus:ring-green-500',
                                'cursor-pointer'
                              )}
                            >
                              {COUNTRY_CODES.map((c) => (
                                <option key={c.country} value={c.code}>
                                  {c.flag} {c.code}
                                </option>
                              ))}
                            </select>
                            <div className="relative flex-1">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="tel"
                                value={waPhone}
                                onChange={(e) => {
                                  handleWaPhoneChange(e.target.value);
                                  setWhatsAppError(null);
                                }}
                                placeholder="400 123 456"
                                className={cn(
                                  'w-full pl-9 pr-3 py-2 text-sm rounded-lg',
                                  'bg-gray-50 dark:bg-gray-700',
                                  'border',
                                  whatsAppError
                                    ? 'border-red-300 dark:border-red-600'
                                    : 'border-gray-200 dark:border-gray-600',
                                  'text-gray-900 dark:text-white',
                                  'placeholder-gray-400 dark:placeholder-gray-500',
                                  'focus:outline-none focus:ring-2 focus:ring-green-500'
                                )}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Recipient Name (optional) */}
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">
                            Recipient Name <span className="text-gray-400">(optional)</span>
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              value={waName}
                              onChange={(e) => setWaName(e.target.value)}
                              placeholder="John Smith"
                              className={cn(
                                'w-full pl-9 pr-3 py-2 text-sm rounded-lg',
                                'bg-gray-50 dark:bg-gray-700',
                                'border border-gray-200 dark:border-gray-600',
                                'text-gray-900 dark:text-white',
                                'placeholder-gray-400 dark:placeholder-gray-500',
                                'focus:outline-none focus:ring-2 focus:ring-green-500'
                              )}
                            />
                          </div>
                        </div>

                        {/* WhatsApp Error */}
                        <AnimatePresence>
                          {whatsAppError && (
                            <motion.p
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              className="text-xs text-red-500 dark:text-red-400"
                            >
                              {whatsAppError}
                            </motion.p>
                          )}
                        </AnimatePresence>

                        {/* Send WhatsApp Button */}
                        <motion.button
                          onClick={handleSendWhatsApp}
                          disabled={!waPhone || isSendingWhatsApp}
                          whileHover={waPhone && !isSendingWhatsApp ? { scale: 1.02 } : undefined}
                          whileTap={waPhone && !isSendingWhatsApp ? { scale: 0.98 } : undefined}
                          className={cn(
                            'w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
                            'text-sm font-medium transition-all',
                            waPhone && !isSendingWhatsApp
                              ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md hover:shadow-lg'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          )}
                        >
                          {isSendingWhatsApp ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <MessageCircle className="w-4 h-4" />
                              Send via WhatsApp
                            </>
                          )}
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Regenerate Option */}
                <button
                  onClick={handleGenerateLink}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-4 block"
                >
                  Generate new link
                </button>
              </div>
            ) : null}

            {/* What's included info */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Includes:
              </p>
              <ul className="text-xs text-gray-400 dark:text-gray-500 space-y-0.5">
                <li>• Timeline with all properties and events</li>
                <li>• All sticky notes and annotations</li>
                {hasAnalysis && <li>• CGT analysis results</li>}
                {hasAnalysis && <li>• Analysis sticky notes</li>}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
