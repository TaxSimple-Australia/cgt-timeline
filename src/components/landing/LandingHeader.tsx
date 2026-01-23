'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LANDING_VARIANTS, getCurrentVariant } from '@/lib/landing-variants';

export default function LandingHeader() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVariantDropdownOpen, setIsVariantDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentVariant = getCurrentVariant(pathname);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsVariantDropdownOpen(false);
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

  const navLinks = [
    { label: 'Features', id: 'features', type: 'scroll' as const },
    { label: 'How It Works', id: 'how-it-works', type: 'scroll' as const },
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
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent hover:from-cyan-300 hover:to-blue-400 transition-all">
              CGT Brain AI Timeline
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              link.type === 'link' ? (
                <Link
                  key={link.id}
                  href={`/${link.id}`}
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

            {/* Variant Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsVariantDropdownOpen(!isVariantDropdownOpen)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                  "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50",
                  isVariantDropdownOpen && "text-slate-200 bg-slate-800/50"
                )}
              >
                <span>{currentVariant?.name || 'Variants'}</span>
                <ChevronDown className={cn(
                  "w-4 h-4 transition-transform",
                  isVariantDropdownOpen && "rotate-180"
                )} />
              </button>

              <AnimatePresence>
                {isVariantDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl shadow-black/30 border border-slate-700 overflow-hidden z-50"
                  >
                    <div className="py-1">
                      {LANDING_VARIANTS.map((variant) => (
                        <Link
                          key={variant.path}
                          href={variant.path}
                          onClick={() => setIsVariantDropdownOpen(false)}
                          className={cn(
                            "flex items-center justify-between px-4 py-2.5 text-sm transition-colors",
                            currentVariant?.path === variant.path
                              ? "text-cyan-400 bg-slate-700/50"
                              : "text-slate-300 hover:text-white hover:bg-slate-700/30"
                          )}
                        >
                          <span>{variant.name}</span>
                          {currentVariant?.path === variant.path && (
                            <Check className="w-4 h-4" />
                          )}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop CTA */}
            <Link href="/">
              <Button
                size="sm"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all"
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
                    href={`/${link.id}`}
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

              {/* Mobile Variant Switcher */}
              <div className="border-t border-slate-700 pt-3 mt-3">
                <p className="px-4 text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Page Variants
                </p>
                {LANDING_VARIANTS.map((variant) => (
                  <Link
                    key={variant.path}
                    href={variant.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      currentVariant?.path === variant.path
                        ? "text-cyan-400 bg-slate-800/50"
                        : "text-slate-300 hover:text-cyan-400 hover:bg-slate-800/50"
                    )}
                  >
                    <span>{variant.name}</span>
                    {currentVariant?.path === variant.path && (
                      <Check className="w-4 h-4" />
                    )}
                  </Link>
                ))}
              </div>

              {/* Mobile CTA */}
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
    </header>
  );
}
