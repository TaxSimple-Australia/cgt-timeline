'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { MapPin, Phone, Mail, Globe, Facebook, Linkedin, Youtube, Instagram, AlertCircle, User, LogOut } from 'lucide-react';
import CGTBrainLogo from '@/components/branding/CGTBrainLogo';
import CookiePreferencesModal from '@/components/CookiePreferencesModal';
import CopyrightModal from '@/components/CopyrightModal';
import AdminLoginModal from '@/components/admin/AdminLoginModal';
import AdminPage from '@/components/admin/AdminPage';
import TaxAgentLoginModal from '@/components/tax-agent/TaxAgentLoginModal';
import TaxAgentDashboard from '@/components/tax-agent/TaxAgentDashboard';
import type { TaxAgentPublic } from '@/types/tax-agent';

const ADMIN_API_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'https://cgtbrain.com.au';

export default function LandingFooter() {
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [showCopyrightModal, setShowCopyrightModal] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminPage, setShowAdminPage] = useState(false);
  const [showAdviserLogin, setShowAdviserLogin] = useState(false);
  const [showAdviserDashboard, setShowAdviserDashboard] = useState(false);
  const [taxAgentData, setTaxAgentData] = useState<TaxAgentPublic | null>(null);
  const [taxAgentToken, setTaxAgentToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Admin handlers
  function handleAdminLoginSuccess() {
    setShowAdminLogin(false);
    setShowAdminPage(true);
  }

  function handleAdminClick() {
    const isAuthenticated = sessionStorage.getItem('cgt_admin_auth') === 'true';
    if (isAuthenticated) {
      setShowAdminPage(true);
    } else {
      setShowAdminLogin(true);
    }
  }

  function handleAdminLogout() {
    sessionStorage.removeItem('cgt_admin_auth');
    sessionStorage.removeItem('cgt_admin_user');
    setShowAdminPage(false);
  }

  function handleAdminBack() {
    setShowAdminPage(false);
  }

  // Adviser (Tax Agent) handlers
  function handleAdviserLoginSuccess(agent: TaxAgentPublic, token: string) {
    setTaxAgentData(agent);
    setTaxAgentToken(token);
    setShowAdviserLogin(false);
    setShowAdviserDashboard(true);
  }

  function handleAdviserClick() {
    const storedToken = localStorage.getItem('tax_agent_token');
    const storedData = localStorage.getItem('tax_agent_data');
    if (storedToken && storedData) {
      try {
        const agent = JSON.parse(storedData) as TaxAgentPublic;
        setTaxAgentToken(storedToken);
        setTaxAgentData(agent);
        setShowAdviserDashboard(true);
      } catch {
        setShowAdviserLogin(true);
      }
    } else {
      setShowAdviserLogin(true);
    }
  }

  function handleAdviserLogout() {
    localStorage.removeItem('tax_agent_token');
    localStorage.removeItem('tax_agent_data');
    setTaxAgentData(null);
    setTaxAgentToken(null);
    setShowAdviserDashboard(false);
  }

  function handleAdviserBack() {
    setShowAdviserDashboard(false);
  }
  return (
    <footer className="bg-slate-200 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Footer Content - 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Column 1: Logo & Social */}
          <div className="lg:col-span-1 flex flex-col items-center space-y-6">
            <div className="flex justify-center">
              <CGTBrainLogo size="2xl" className="[&_img]:!h-20 [&_img]:md:!h-24" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center">
              CGT Brain AI
            </h3>
            <div className="flex flex-col gap-4 pt-2">
              {/* First row - 4 icons: TikTok, Vimeo, X, Instagram */}
              <div className="flex items-center gap-4 justify-center">
                <a
                  href="https://www.tiktok.com/@cgtbrainai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  aria-label="TikTok"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
                <a
                  href="https://vimeo.com/cgtbrainai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  aria-label="Vimeo"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.493 4.797l-.013.01z"/>
                  </svg>
                </a>
                <a
                  href="https://x.com/cgtbrainai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  aria-label="X (Twitter)"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/cgtbrainai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </div>

              {/* Second row - 3 icons: Facebook, LinkedIn, YouTube */}
              <div className="flex items-center gap-4 justify-center">
                <a
                  href="https://www.facebook.com/profile.php?id=61580878777527"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="https://www.linkedin.com/in/cgt-brain-ai-9a23423b4/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Resources */}
          <div>
            <h3 className="text-slate-900 dark:text-white font-semibold mb-4 uppercase text-xs tracking-wider">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/#how-it-works" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">
                  How It Works
                </Link>
              </li>
              <li>
                <a
                  href="https://www.ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm"
                >
                  ATO Resources
                </a>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <button
                  onClick={() => setShowCookieModal(true)}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm text-left"
                >
                  Cookie Settings
                </button>
              </li>
              <li>
                <Link href="/terms" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">
                  Terms of Use
                </Link>
              </li>
              <li>
                <button
                  onClick={handleAdviserClick}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm text-left"
                >
                  Adviser Portal
                </button>
              </li>
              <li>
                <button
                  onClick={handleAdminClick}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm text-left"
                >
                  Admin Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Information */}
          <div>
            <h3 className="text-slate-900 dark:text-white font-semibold mb-4 uppercase text-xs tracking-wider">
              Contact
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-slate-600 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  0430 334 344
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-slate-600 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                <a href="mailto:info@cgtbrain.com.au" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">
                  info@cgtbrain.com.au
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-slate-600 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                <a href="https://cgtbrain.com.au" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm">
                  cgtbrain.com.au
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-600 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  8 Fuhrmann Street<br />
                  Muirhead Northern Territory 0810<br />
                  Australia
                </p>
              </div>
            </div>
          </div>

          {/* Column 4: Acknowledgment */}
          <div>
            <h3 className="text-slate-900 dark:text-white font-semibold mb-4 uppercase text-xs tracking-wider">
              Acknowledgment
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              We acknowledge the Traditional Owners and Custodians of Country throughout Australia and their continuing connection to land, waters and community. We pay our respects to them, their cultures, and Elders past and present.
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer Section */}
      <div className="border-t border-slate-500 dark:border-slate-800 bg-slate-200 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center gap-2 justify-center">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Disclaimer:</span> This AI-generated report is for information only and does not constitute financial advice; please review and confirm with a qualified professional.
            </p>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-slate-500 dark:border-slate-800 bg-slate-300 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2">
            <button
              onClick={() => setShowCopyrightModal(true)}
              className="text-slate-600 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-600 text-sm transition-colors cursor-pointer"
            >
              Copyright © CGT Brain AI 2026. All rights reserved.
            </button>
            <span className="text-slate-600 dark:text-slate-600 text-sm">|</span>
            <span className="text-sm text-slate-600 dark:text-slate-500">ABN: 79 684 289 843</span>
            <span className="text-slate-600 dark:text-slate-600 text-sm">•</span>
            <span className="text-sm text-slate-600 dark:text-slate-500">Registered Tax Agent: 26205217</span>
          </div>
        </div>
      </div>

      {/* Cookie Preferences Modal */}
      <CookiePreferencesModal
        isOpen={showCookieModal}
        onClose={() => setShowCookieModal(false)}
      />

      {/* Copyright Modal */}
      <CopyrightModal
        isOpen={showCopyrightModal}
        onClose={() => setShowCopyrightModal(false)}
      />

      {/* Login Modals */}
      <AdminLoginModal
        isOpen={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onSuccess={handleAdminLoginSuccess}
      />
      <TaxAgentLoginModal
        isOpen={showAdviserLogin}
        onClose={() => setShowAdviserLogin(false)}
        onSuccess={handleAdviserLoginSuccess}
      />

      {/* Dashboard Portals */}
      {mounted && showAdminPage && createPortal(
        <AdminPage
          apiUrl={ADMIN_API_URL}
          onLogout={handleAdminLogout}
          onBack={handleAdminBack}
        />,
        document.body
      )}
      {mounted && showAdviserDashboard && taxAgentData && taxAgentToken && createPortal(
        <TaxAgentDashboard
          agent={taxAgentData}
          token={taxAgentToken}
          onLogout={handleAdviserLogout}
          onBack={handleAdviserBack}
        />,
        document.body
      )}
    </footer>
  );
}
