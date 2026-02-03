'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ShieldCheck, UserCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTimelineStore } from '@/store/timeline';
import CGTBrainLogo from '@/components/branding/CGTBrainLogo';
import AdminLoginModal from '@/components/admin/AdminLoginModal';
import AdviserLoginModal from '@/components/AdviserLoginModal';
import TermsAndConditionsModal from '@/components/TermsAndConditionsModal';
import { useTermsAcceptance } from '@/hooks/useTermsAcceptance';

export default function LandingHeader() {
  const { showModal, handleNavigateToTimeline, handleAccept, handleClose } = useTermsAcceptance();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdviserLogin, setShowAdviserLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'adviser' | null>(null);

  // Logo state from Zustand
  const { currentLogoVariant } = useTimelineStore();

  // Check login status on mount
  useEffect(() => {
    const adminLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
    const adviserLoggedIn = sessionStorage.getItem('adviserLoggedIn') === 'true';

    if (adminLoggedIn) {
      setIsLoggedIn(true);
      setUserRole('admin');
    } else if (adviserLoggedIn) {
      setIsLoggedIn(true);
      setUserRole('adviser');
    }
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsMobileMenuOpen(false);
    }
  };

  const handleLoginSuccess = (role: 'admin' | 'adviser') => {
    setIsLoggedIn(true);
    setUserRole(role);
    setShowAdminLogin(false);
    setShowAdviserLogin(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adviserLoggedIn');
    setIsLoggedIn(false);
    setUserRole(null);
  };

  const navLinks = [
    { label: 'How It Works', id: 'how-it-works', type: 'link' as const, href: '/landing#how-it-works' },
    { label: 'Pricing', id: 'pricing', type: 'link' as const, href: '/pricing' },
    { label: 'FAQ', id: 'faq', type: 'link' as const, href: '/faqs' },
    { label: 'Contact', id: 'contact', type: 'link' as const, href: '/contact' },
  ];

  return (
    <>
      {/* Utility Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end h-10 gap-1 text-sm">
            {!isLoggedIn ? (
              <>
                <span className="text-slate-700">|</span>
                <button
                  onClick={() => setShowAdviserLogin(true)}
                  className="text-slate-400 hover:text-white transition-colors px-3"
                >
                  Adviser Portal
                </button>
                <span className="text-slate-700">|</span>
                <button
                  onClick={() => setShowAdminLogin(true)}
                  className="text-slate-400 hover:text-white transition-colors px-3"
                >
                  Admin Portal
                </button>
                <span className="text-slate-700">|</span>
              </>
            ) : (
              <>
                <span className="text-slate-700">|</span>
                <span className="text-slate-400 px-3">
                  Logged in as <span className="text-cyan-400 capitalize">{userRole}</span>
                </span>
                <span className="text-slate-700">|</span>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-white transition-colors px-3"
                >
                  Logout
                </button>
                <span className="text-slate-700">|</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="fixed top-10 left-0 right-0 z-40 bg-slate-900">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/landing" className="flex-shrink-0">
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

      {/* Login Modals */}
      <AdminLoginModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onSuccess={() => handleLoginSuccess('admin')}
      />
      <AdviserLoginModal
        isOpen={showAdviserLogin}
        onClose={() => setShowAdviserLogin(false)}
        onLoginSuccess={() => handleLoginSuccess('adviser')}
      />
      <TermsAndConditionsModal
        isOpen={showModal}
        onAccept={handleAccept}
        onClose={handleClose}
      />
    </>
  );
}
