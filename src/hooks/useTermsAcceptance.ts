'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTimelineStore } from '@/store/timeline';

const TERMS_STORAGE_KEY = 'cgtBrain_termsAccepted';

export function useTermsAcceptance() {
  const router = useRouter();
  const { hasAcceptedTerms, setTermsAccepted } = useTimelineStore();
  const [showModal, setShowModal] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAcceptance = localStorage.getItem(TERMS_STORAGE_KEY);
      if (storedAcceptance === 'true' && !hasAcceptedTerms) {
        setTermsAccepted(true);
      }
    }
  }, [hasAcceptedTerms, setTermsAccepted]);

  const handleNavigateToTimeline = () => {
    console.log('🔍 handleNavigateToTimeline called');
    console.log('📋 hasAcceptedTerms:', hasAcceptedTerms);
    console.log('📋 localStorage value:', typeof window !== 'undefined' ? localStorage.getItem(TERMS_STORAGE_KEY) : 'N/A');

    if (hasAcceptedTerms) {
      console.log('✅ Terms already accepted, navigating to timeline');
      router.push('/');
    } else {
      console.log('❌ Terms not accepted, showing modal');
      setShowModal(true);
    }
  };

  const handleAccept = () => {
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(TERMS_STORAGE_KEY, 'true');
    }

    // Update store
    setTermsAccepted(true);

    // Close modal
    setShowModal(false);

    // Navigate to timeline
    router.push('/');
  };

  const handleClose = () => {
    setShowModal(false);
  };

  return {
    showModal,
    hasAcceptedTerms,
    handleNavigateToTimeline,
    handleAccept,
    handleClose,
  };
}
