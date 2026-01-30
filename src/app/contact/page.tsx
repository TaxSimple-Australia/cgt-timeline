'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  MessageCircle,
  Sparkles,
  Twitter,
  Facebook,
  Instagram
} from 'lucide-react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';

export default function ContactPage() {
  const contactInfo = [
    {
      icon: Mail,
      label: 'Email',
      value: 'contact@taxsimple.com.au',
      href: 'mailto:contact@taxsimple.com.au',
    },
    {
      icon: Phone,
      label: 'Phone',
      value: '+61 (0) 123 456 789',
      href: 'tel:+61123456789',
    },
    {
      icon: MapPin,
      label: 'Address',
      value: 'PO Box 1234, Sydney NSW 2000',
      href: null,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <LandingHeader />

      {/* Contact Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
              <MessageCircle className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-300 text-sm font-medium">Contact</span>
            </div>

            {/* Heading with decorative lines */}
            <div className="flex items-center justify-center gap-6 mb-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent via-cyan-500 to-cyan-500" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Get in Touch
              </h1>
              <div className="h-px w-16 bg-gradient-to-l from-transparent via-cyan-500 to-cyan-500" />
            </div>

            <p className="text-lg text-slate-300 mt-4">
              We're here to help with any questions about CGT Brain
            </p>
          </motion.div>

          {/* Contact Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              const content = (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex flex-col items-center text-center gap-4 p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl hover:border-cyan-500/50 transition-all"
                >
                  <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-md">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">{info.label}</p>
                    <p className="text-xs md:text-sm text-white break-words">{info.value}</p>
                  </div>
                </motion.div>
              );

              return info.href ? (
                <a key={index} href={info.href}>
                  {content}
                </a>
              ) : (
                <div key={index}>{content}</div>
              );
            })}
          </div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl text-center"
          >
            <p className="text-sm font-medium text-slate-400 mb-4">Follow Us</p>
            <div className="flex justify-center gap-3">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-slate-700 hover:bg-cyan-500/20 rounded-lg transition-all group"
              >
                <Linkedin className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-slate-700 hover:bg-cyan-500/20 rounded-lg transition-all group"
              >
                <Twitter className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-slate-700 hover:bg-cyan-500/20 rounded-lg transition-all group"
              >
                <Facebook className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-slate-700 hover:bg-cyan-500/20 rounded-lg transition-all group"
              >
                <Instagram className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
