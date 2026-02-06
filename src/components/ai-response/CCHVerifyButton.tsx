'use client';

import { useState } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface CCHVerifyButtonProps {
  response: any;
}

/**
 * Formats the verification prompt by removing escape characters, line feeds,
 * and special characters to ensure it can be pasted cleanly into CCH chat.
 */
function formatVerificationPrompt(prompt: string): string {
  if (!prompt) return '';
  return prompt
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/\r\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/#{1,6}\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts the full AI response (excluding verification_prompt) for comparison.
 */
function extractOurAnswer(response: any): string {
  if (!response) return '';
  const responseCopy = JSON.parse(JSON.stringify(response));
  delete responseCopy.verification_prompt;
  if (responseCopy.data) {
    delete responseCopy.data.verification_prompt;
    if (responseCopy.data.data) {
      delete responseCopy.data.data.verification_prompt;
    }
  }
  return JSON.stringify(responseCopy, null, 2);
}

/**
 * Extract verification prompt from various response structures
 */
function getVerificationPrompt(response: any): string {
  if (!response) return '';
  return response.verification_prompt ||
         response.data?.verification_prompt ||
         response.data?.data?.verification_prompt ||
         '';
}

export default function CCHVerifyButton({ response }: CCHVerifyButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const verificationPrompt = getVerificationPrompt(response);

  // Don't render if no verification prompt available
  if (!verificationPrompt) {
    return null;
  }

  const handleVerify = async () => {
    setIsLoading(true);
    setStatus('loading');

    try {
      const formattedPrompt = formatVerificationPrompt(verificationPrompt);
      const ourAnswer = extractOurAnswer(response);

      console.log('📤 CCH Verification - Starting verification from button...');
      console.log('📤 CCH Verification - Formatted prompt length:', formattedPrompt.length);

      const apiResponse = await fetch('/api/cch/verify-and-compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: formattedPrompt,
          our_answer: ourAnswer,
          ai_response: response
        })
      });

      const data = await apiResponse.json();

      if (!apiResponse.ok || !data.success) {
        throw new Error(data.error || 'CCH verification failed');
      }

      console.log('✅ CCH Verification completed successfully');
      setStatus('success');

      // Store result in sessionStorage so CCH tab can display it
      sessionStorage.setItem('cch_verification_result', JSON.stringify(data));

      // Show success briefly then reset
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error('❌ CCH Verification error:', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleVerify}
      disabled={isLoading}
      className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors shadow-sm text-sm font-medium ${
        status === 'success'
          ? 'bg-green-600 text-white'
          : status === 'error'
          ? 'bg-red-600 text-white'
          : 'bg-purple-600 hover:bg-purple-700 text-white'
      } disabled:opacity-70`}
      title="Verify with CCH iKnowConnect"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="hidden lg:inline">Verifying...</span>
        </>
      ) : status === 'success' ? (
        <>
          <ShieldCheck className="w-4 h-4" />
          <span className="hidden lg:inline">Verified!</span>
        </>
      ) : status === 'error' ? (
        <>
          <ShieldCheck className="w-4 h-4" />
          <span className="hidden lg:inline">Failed</span>
        </>
      ) : (
        <>
          <ShieldCheck className="w-4 h-4" />
          <span className="hidden lg:inline">CCH Verify</span>
        </>
      )}
    </button>
  );
}
