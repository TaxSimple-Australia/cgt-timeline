import LandingHeader from '@/components/landing/LandingHeader';
import V3Hero from '@/components/landing/variants/v3/V3Hero';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import FAQSection from '@/components/landing/FAQSection';
import LandingFooter from '@/components/landing/LandingFooter';

export default function LandingV3Page() {
  return (
    <main className="min-h-screen bg-slate-950">
      <LandingHeader />
      <V3Hero />
      <HowItWorksSection />
      <FAQSection />
      <LandingFooter />
    </main>
  );
}
