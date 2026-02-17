'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTimelineStore } from '@/store/timeline';
import CGTBrainLogo from '@/components/branding/CGTBrainLogo';
import LogoSwitcher from '@/components/branding/LogoSwitcher';
import TermsAndConditionsModal from '@/components/TermsAndConditionsModal';
import { useTermsAcceptance } from '@/hooks/useTermsAcceptance';

export default function LandingHeader() {
  const { showModal, handleNavigateToTimeline, handleAccept, handleClose } = useTermsAcceptance();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Logo state from Zustand
  const { currentLogoVariant, setLogoVariant } = useTimelineStore();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { label: 'About', id: 'about', type: 'link' as const, href: '/about-us' },
    { label: 'Training', id: 'training', type: 'link' as const, href: '/training-videos' },
    { label: 'FAQ', id: 'faq', type: 'link' as const, href: '/faqs' },
    { label: 'Contact', id: 'contact', type: 'link' as const, href: '/contact' },
  ];

  return (
    <>
      {/* Main Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-900">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <div className="flex items-center gap-3">
                <CGTBrainLogo size="2xl" variant={currentLogoVariant} />
                {currentLogoVariant !== 'logo-4' && (
                  <h1 className="font-bold text-xl md:text-2xl text-white">
                    CGT Brain AI
                  </h1>
                )}
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname === `/${link.id}`;
                return link.type === 'link' ? (
                  <Link
                    key={link.id}
                    href={'href' in link && link.href ? link.href : `/${link.id}`}
                    className={cn(
                      "text-base font-medium uppercase transition-colors",
                      isActive
                        ? "text-cyan-400"
                        : "text-slate-300 hover:text-white"
                    )}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <button
                    key={link.id}
                    onClick={() => scrollToSection(link.id)}
                    className="text-slate-300 hover:text-white transition-colors text-base font-medium uppercase"
                  >
                    {link.label}
                  </button>
                );
              })}

              {/* Logo Switcher - Press Ctrl+L to toggle */}
              <LogoSwitcher
                currentLogo={currentLogoVariant}
                onLogoChange={setLogoVariant}
              />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-slate-800">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname === `/${link.id}`;
                return link.type === 'link' ? (
                  <Link
                    key={link.id}
                    href={'href' in link && link.href ? link.href : `/${link.id}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "block w-full text-left px-4 py-3 text-base font-medium uppercase transition-colors",
                      isActive
                        ? "text-cyan-400"
                        : "text-slate-300 hover:text-white"
                    )}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <button
                    key={link.id}
                    onClick={() => scrollToSection(link.id)}
                    className="block w-full text-left px-4 py-3 text-slate-300 hover:text-white transition-colors text-base font-medium uppercase"
                  >
                    {link.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Terms Modal */}
      <TermsAndConditionsModal
        isOpen={showModal}
        onAccept={handleAccept}
        onClose={handleClose}
      />
    </>
  );
}
