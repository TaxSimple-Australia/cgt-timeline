import LandingHeader from '@/components/landing/LandingHeader';
import V4Hero from '@/components/landing/variants/v4/V4Hero';
import AIHumanSection from '@/components/landing/AIHumanSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import LandingFooter from '@/components/landing/LandingFooter';

export default function LandingV4Page() {
  return (
    <main className="min-h-screen bg-slate-950">
      <LandingHeader />
      <V4Hero />
      <HowItWorksSection />
      <AIHumanSection />
      <LandingFooter />
    </main>
  );
}
