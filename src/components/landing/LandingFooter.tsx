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
  Lock
} from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content - 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">

          {/* Column 1: Company & Product */}
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-6">
              CGT Brain AI Timeline
            </h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Professional Capital Gains Tax analysis tool for Australian property investors and taxpayers.
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-green-500" />
                <span>Australian Hosted</span>
              </div>
              <span>|</span>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-green-500" />
                <span>SSL Encrypted</span>
              </div>
              <span>|</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Privacy Act 1988 Compliant</span>
              </div>
            </div>
          </div>

          {/* Column 2: Help & Resources */}
          <div>
            <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-400" />
              Help & Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/support" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Support Center
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-slate-400 hover:text-white transition-colors text-sm">
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
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            <p className="text-slate-500 text-xs">
              &copy; 2026 Tax Simple Pty Ltd. All rights reserved.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>ABN: 64686297398</span>
              <span>•</span>
              <span>Registered Tax Agent: 26205217</span>
              <span>•</span>
              <span>ATO Compliant</span>
              <span>•</span>
              <span>ISO 27001</span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="p-3 bg-amber-900/5 border border-amber-700/10 rounded-lg">
            <p className="text-[10px] text-slate-500 opacity-60 text-center leading-relaxed">
              <strong className="text-amber-500/70">Disclaimer:</strong> CGT Brain provides general information only and is not a substitute for professional tax advice.
              This tool does not create a tax agent-client relationship. Always verify results with a qualified tax professional or the ATO.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
