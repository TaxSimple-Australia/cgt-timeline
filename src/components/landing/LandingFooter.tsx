'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Globe } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content - 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Column 1: Logo */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold text-white">
              CGT Brain AI
            </h3>
          </div>

          {/* Column 2: Resources */}
          <div>
            <h3 className="text-slate-500 font-semibold mb-4 uppercase text-xs tracking-wider">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about-us" className="text-slate-400 hover:text-white transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/training-videos" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Training
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Support
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
                <Link href="/terms" className="text-slate-400 hover:text-white transition-colors text-sm">
                  Terms of Use
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Information */}
          <div>
            <h3 className="text-slate-500 font-semibold mb-4 uppercase text-xs tracking-wider">
              Contact
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <p className="text-slate-400 text-sm">
                  Level 5, 123 Collins Street<br />
                  Melbourne VIC 3000<br />
                  Australia
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                <p className="text-slate-400 text-sm">
                  1300 CGT BRAIN<br />
                  (1300 248 272)
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
            </div>
          </div>

          {/* Column 4: Acknowledgment */}
          <div>
            <h3 className="text-slate-500 font-semibold mb-4 uppercase text-xs tracking-wider">
              Acknowledgment
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              In the spirit of reconciliation and legal transparency, we acknowledge the Traditional Owners and their continuing rights and interests in the lands and waters of Australia. We recognize that these connections underpinned by traditional Law and custom remain unceded. We pay our respects to the Elders who carry these rights and responsibilities, both past and present.
            </p>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              Copyright © CGT Brain 2026. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-2 text-sm text-slate-500">
              <span>ABN: 79 684 289 843</span>
              <span>•</span>
              <span>Registered Tax Agent: 26205217</span>
              <span>•</span>
              <span>ISO 27001 Certified</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
