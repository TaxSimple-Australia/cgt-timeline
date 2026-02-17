'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { MapPin, Phone, Mail, Globe, Facebook, Linkedin, Twitter, Youtube, AlertCircle, User, LogOut } from 'lucide-react';
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
    <footer className="bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content - 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Column 1: Logo & Social */}
          <div className="lg:col-span-1 flex flex-col items-center space-y-6">
            <div className="flex justify-center">
              <CGTBrainLogo size="2xl" variant="logo-20" className="[&_img]:!h-20 [&_img]:md:!h-24" />
            </div>
            <h3 className="text-xl font-bold text-white text-center">
              CGT Brain AI
            </h3>
            <div className="flex items-center gap-5 pt-2">
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="X (Twitter)"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Column 2: Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4 uppercase text-xs tracking-wider">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/#how-it-works" className="text-slate-400 hover:text-white transition-colors text-sm">
                  How It Works
                </Link>
              </li>
              <li>
                <a
                  href="https://www.ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  ATO Resources
                </a>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <button
                  onClick={() => setShowCookieModal(true)}
                  className="text-slate-400 hover:text-white transition-colors text-sm text-left"
                >
                  Cookie Settings
                </button>
              </li>
              <li>
                <Link href="/terms" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Terms of Use
                </Link>
              </li>
              <li>
                <button
                  onClick={handleAdviserClick}
                  className="text-slate-400 hover:text-white transition-colors text-sm text-left"
                >
                  Adviser Portal
                </button>
              </li>
              <li>
                <button
                  onClick={handleAdminClick}
                  className="text-slate-400 hover:text-white transition-colors text-sm text-left"
                >
                  Admin Portal
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Information */}
          <div>
            <h3 className="text-white font-semibold mb-4 uppercase text-xs tracking-wider">
              Contact
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <p className="text-slate-400 text-sm">
                  1300 248 272
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <a href="mailto:info@cgtbrain.com.au" className="text-slate-400 hover:text-white transition-colors text-sm">
                  info@cgtbrain.com.au
                </a>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <a href="https://cgtbrain.com.au" className="text-slate-400 hover:text-white transition-colors text-sm">
                  cgtbrain.com.au
                </a>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <p className="text-slate-400 text-sm">
                  Level 5, 123 Collins Street<br />
                  Melbourne VIC 3000<br />
                  Australia
                </p>
              </div>
            </div>
          </div>

          {/* Column 4: Acknowledgment */}
          <div>
            <h3 className="text-white font-semibold mb-4 uppercase text-xs tracking-wider">
              Acknowledgment
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              We acknowledge the Traditional Owners and Custodians of Country throughout Australia and their continuing connection to land, waters and community. We pay our respects to them, their cultures, and Elders past and present.
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer Section */}
      <div className="border-t border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 justify-center">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-slate-400 text-xs whitespace-nowrap">
              <span className="font-semibold text-slate-300">Disclaimer:</span> This AI-generated report is for information only and does not constitute financial advice; please review and confirm with a qualified professional.
            </p>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <button
              onClick={() => setShowCopyrightModal(true)}
              className="text-slate-500 hover:text-slate-300 text-sm transition-colors cursor-pointer"
            >
              Copyright © CGT Brain AI 2026. All rights reserved.
            </button>
            <div className="flex flex-wrap justify-center items-center gap-2 text-sm text-slate-500">
              <span>ABN: 79 684 289 843</span>
              <span>•</span>
              <span>Registered Tax Agent: 26205217</span>
            </div>
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
