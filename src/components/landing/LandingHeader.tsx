'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, User, ShieldCheck, UserCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTimelineStore } from '@/store/timeline';
import CGTBrainLogo from '@/components/branding/CGTBrainLogo';
import LogoSwitcher from '@/components/branding/LogoSwitcher';
import AdminLoginModal from '@/components/admin/AdminLoginModal';
import AdviserLoginModal from '@/components/AdviserLoginModal';

export default function LandingHeader() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdviserLogin, setShowAdviserLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'adviser' | null>(null);
  const loginDropdownRef = useRef<HTMLDivElement>(null);

  // Logo state from Zustand
  const { currentLogoVariant, setLogoVariant } = useTimelineStore();

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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(event.target as Node)) {
        setIsLoginDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    setIsLoginDropdownOpen(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adviserLoggedIn');
    setIsLoggedIn(false);
    setUserRole(null);
    setIsLoginDropdownOpen(false);
  };

  const navLinks = [
    { label: 'How It Works', id: 'how-it-works', type: 'link' as const, href: '/landing#how-it-works' },
    { label: 'About Us', id: 'about-us', type: 'link' as const },
    { label: 'Pricing', id: 'pricing', type: 'link' as const },
    { label: 'Training', id: 'training-videos', type: 'link' as const },
    { label: 'Contact', id: 'contact', type: 'link' as const },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-slate-900/95 backdrop-blur-md shadow-lg shadow-black/20'
          : 'bg-slate-900/50 backdrop-blur-sm'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/landing" className="flex-shrink-0">
            <div className="flex items-center gap-3">
              <CGTBrainLogo size="xl" variant={currentLogoVariant} />
              {/* Hide text for logo-4 since it has text built in */}
              {currentLogoVariant !== 'logo-4' && (
                <h1 className="font-bold text-xl md:text-2xl">
                  <span className="bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">
                    CGT
                  </span>
                  <span className="text-slate-900 dark:text-slate-100 ml-1">
                    Brain
                  </span>
                </h1>
              )}
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {/* Logo Switcher (hidden by default, press Ctrl+L to show) */}
            <LogoSwitcher
              currentLogo={currentLogoVariant}
              onLogoChange={setLogoVariant}
            />
            {navLinks.map((link) => (
              link.type === 'link' ? (
                <Link
                  key={link.id}
                  href={'href' in link ? link.href : `/${link.id}`}
                  className="text-slate-300 hover:text-cyan-400 transition-colors text-sm font-medium"
                >
                  {link.label}
                </Link>
              ) : (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="text-slate-300 hover:text-cyan-400 transition-colors text-sm font-medium"
                >
                  {link.label}
                </button>
              )
            ))}

            {/* Login Dropdown */}
            <div className="relative" ref={loginDropdownRef}>
              <button
                onClick={() => setIsLoginDropdownOpen(!isLoginDropdownOpen)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all",
                  "text-slate-300 hover:text-white hover:bg-slate-800/50",
                  isLoginDropdownOpen && "text-white bg-slate-800/50"
                )}
              >
                <User className="w-4 h-4" />
                {isLoggedIn ? (
                  <span className="capitalize">{userRole}</span>
                ) : (
                  <span>Login</span>
                )}
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  isLoginDropdownOpen && "rotate-180"
                )} />
              </button>

              <AnimatePresence>
                {isLoginDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl shadow-black/30 border border-slate-700 overflow-hidden z-50"
                  >
                    <div className="py-1">
                      {!isLoggedIn ? (
                        <>
                          <button
                            onClick={() => {
                              setShowAdviserLogin(true);
                              setIsLoginDropdownOpen(false);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/30 transition-colors"
                          >
                            <UserCircle className="w-4 h-4" />
                            <span>Adviser Portal</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowAdminLogin(true);
                              setIsLoginDropdownOpen(false);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/30 transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Admin Portal</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="px-4 py-2.5 text-sm text-cyan-400 border-b border-slate-700">
                            Logged in as {userRole}
                          </div>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700/30 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop CTAs */}
            <Link href="/book-demo">
              <Button
                size="sm"
                variant="outline"
                className="h-9 px-4 font-medium border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all"
              >
                Book a Demo
              </Button>
            </Link>
            <Link href="/">
              <Button
                size="sm"
                className="h-9 px-4 font-medium bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all"
              >
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-900/98 backdrop-blur-md border-t border-slate-800"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                link.type === 'link' ? (
                  <Link
                    key={link.id}
                    href={'href' in link ? link.href : `/${link.id}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-left px-4 py-3 text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-colors text-sm font-medium"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <button
                    key={link.id}
                    onClick={() => scrollToSection(link.id)}
                    className="block w-full text-left px-4 py-3 text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 rounded-lg transition-colors text-sm font-medium"
                  >
                    {link.label}
                  </button>
                )
              ))}

              {/* Mobile Login Section */}
              <div className="border-t border-slate-700 pt-3 mt-3">
                <p className="px-4 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  {isLoggedIn ? 'Account' : 'Login'}
                </p>
                {!isLoggedIn ? (
                  <>
                    <button
                      onClick={() => {
                        setShowAdviserLogin(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 transition-colors"
                    >
                      <UserCircle className="w-4 h-4" />
                      <span>Adviser Portal</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowAdminLogin(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Admin Portal</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-3 rounded-lg text-sm text-cyan-400 bg-slate-800/50">
                      Logged in as {userRole}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50 transition-colors mt-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </>
                )}
              </div>

              {/* Mobile CTAs */}
              <Link href="/book-demo" className="block pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50 transition-all"
                >
                  Book a Demo
                </Button>
              </Link>
              <Link href="/" className="block pt-2">
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30 transition-all"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modals */}
      <AdminLoginModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onLoginSuccess={() => handleLoginSuccess('admin')}
      />
      <AdviserLoginModal
        isOpen={showAdviserLogin}
        onClose={() => setShowAdviserLogin(false)}
        onLoginSuccess={() => handleLoginSuccess('adviser')}
      />
    </header>
  );
}
