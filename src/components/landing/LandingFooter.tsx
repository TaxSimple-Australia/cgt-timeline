'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  FileText,
  HelpCircle,
  BookOpen,
  MessageCircle,
  ExternalLink,
  CheckCircle,
  Server,
  Lock,
  Building2
} from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content - 5 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">

          {/* Column 1: Company & Product */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-6">
              CGT Brain
            </h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Professional Capital Gains Tax analysis tool for Australian property investors and taxpayers.
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-green-500" />
                <span>AU Hosted</span>
              </div>
              <span>|</span>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-green-500" />
                <span>SSL</span>
              </div>
              <span>|</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Privacy Act</span>
              </div>
            </div>
          </div>

          {/* Column 2: Company */}
          <div>
            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              Company
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about-us" className="text-slate-400 hover:text-white transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/book-demo" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Book a Demo
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Help & Resources */}
          <div>
            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-400" />
              Help & Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/training-videos" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Training Videos
                </Link>
              </li>
              <li>
                <Link href="/book-demo" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Book a Demo
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="text-slate-400 hover:text-white transition-colors text-sm">
                  FAQs
                </Link>
              </li>
              <li>
                <a
                  href="https://www.ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  ATO CGT Resources
                </a>
              </li>
              <li>
                <Link href="/contact" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Legal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/data-retention" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Data Retention
                </Link>
              </li>
              <li>
                <Link href="/quality" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Quality Policy
                </Link>
              </li>
              <li>
                <Link href="/collection-notice" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Collection Notice
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Connect */}
          <div>
            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-400" />
              Connect
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:support@cgtbrain.com.au"
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  support@cgtbrain.com.au
                </a>
              </li>
              <li>
                <a
                  href="https://linkedin.com/company/cgtbrain"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/cgtbrain"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors text-sm"
                >
                  Twitter / X
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800">
          {/* Acknowledgment of Country */}
          <div className="mb-4">
            <p className="text-xs text-slate-400 text-center leading-relaxed max-w-3xl mx-auto">
              <span className="text-amber-600/70 mr-2">🌿</span>
              We acknowledge the Traditional Owners and Custodians of Country throughout Australia
              and their continuing connection to land, waters and community. We pay our respects
              to them, their cultures, and Elders past and present.
            </p>
          </div>

          {/* Disclaimer */}
          <div className="p-3 bg-amber-900/5 border border-amber-700/10 rounded-lg">
            <p className="text-xs text-slate-400 text-center leading-relaxed">
              <strong className="text-amber-500/70">Disclaimer:</strong> CGT Brain provides general information only and is not a substitute for professional tax advice.
              This tool does not create a tax agent-client relationship. Always verify results with a qualified tax professional or the ATO.
            </p>
          </div>
        </div>
      </div>

      {/* Slim Footer Bar - Copyright & Business Info */}
      <div className="bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-slate-400 text-xs">
              &copy; 2026 CGT Brain AI Pty Ltd. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-2 text-xs text-slate-500">
              <span>ABN: 79 684 289 843</span>
              <span>•</span>
              <span>Registered Tax Agent: 26205217</span>
              <span>•</span>
              <span>ATO Compliant</span>
              <span>•</span>
              <span>ISO 27001</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
