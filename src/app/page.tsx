'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import LandingHeader from '@/components/landing/LandingHeader';
import V4Hero from '@/components/landing/variants/v4/V4Hero';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import LandingFooter from '@/components/landing/LandingFooter';

function LandingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle legacy share links: redirect /?share=xxx to /app?share=xxx
  useEffect(() => {
    const shareId = searchParams.get('share');
    if (shareId) {
      console.log('🔗 Legacy share link detected, redirecting to /app?share=' + shareId);
      router.replace(`/app?share=${shareId}`);
    }
  }, [searchParams, router]);

  // If there's a share param, show loading while redirecting
  const shareId = searchParams.get('share');
  if (shareId) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center">
        <div className="bg-slate-900 rounded-lg p-8 max-w-sm text-center shadow-xl border border-slate-800">
          <div className="animate-spin h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg font-medium text-white">Loading shared timeline...</p>
          <p className="text-sm text-slate-400 mt-2">Please wait while we redirect you</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <LandingHeader />
      <V4Hero />
      <HowItWorksSection />
      <LandingFooter />
    </main>
  );
}

import { Suspense } from 'react';

export default function LandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    }>
      <LandingContent />
    </Suspense>
  );
}
