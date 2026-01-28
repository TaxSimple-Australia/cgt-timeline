'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle,
  Send,
  Sparkles,
  Users,
  Zap,
  Target
} from 'lucide-react';
import LandingHeader from '@/components/landing/LandingHeader';
import LandingFooter from '@/components/landing/LandingFooter';
import { Button } from '@/components/ui/button';

export default function BookDemoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    role: '',
    teamSize: '',
    preferredDate: '',
    preferredTime: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'demo@taxsimple.com.au',
          subject: `Demo Request from ${formData.name}`,
          text: `
Demo Request Details:

Name: ${formData.name}
Email: ${formData.email}
Company: ${formData.company}
Phone: ${formData.phone}
Role: ${formData.role}
Team Size: ${formData.teamSize}

Preferred Date: ${formData.preferredDate}
Preferred Time: ${formData.preferredTime}

Additional Notes:
${formData.message || 'N/A'}
          `,
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          company: '',
          phone: '',
          role: '',
          teamSize: '',
          preferredDate: '',
          preferredTime: '',
          message: '',
        });
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting demo request:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const demoFeatures = [
    {
      icon: Video,
      title: 'Live Walkthrough',
      description: '30-minute personalized demo of CGT Brain features',
    },
    {
      icon: Target,
      title: 'Custom Scenarios',
      description: 'We can demo with your specific use cases and requirements',
    },
    {
      icon: Users,
      title: 'Q&A Session',
      description: 'Get all your questions answered by our product experts',
    },
    {
      icon: Zap,
      title: 'Quick Start Guide',
      description: 'Leave with resources to get started immediately',
    },
  ];

  const benefits = [
    'See AI-powered CGT analysis in action',
    'Explore the interactive timeline builder',
    'Learn about multi-property portfolio management',
    'Understand verification alerts and accuracy features',
    'Discover PDF reporting capabilities',
    'Ask questions specific to your practice',
  ];

  const timeSlots = [
    '9:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '1:00 PM - 2:00 PM',
    '2:00 PM - 3:00 PM',
    '3:00 PM - 4:00 PM',
    '4:00 PM - 5:00 PM',
  ];

  const teamSizes = [
    '1 (Solo Practitioner)',
    '2-5',
    '6-10',
    '11-25',
    '26-50',
    '50+',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <LandingHeader />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">Book Your Demo</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                See CGT Brain
              </span>
              <br />
              <span className="text-white">in Action</span>
            </h1>

            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Schedule a personalized demo and discover how CGT Brain can transform
              your Capital Gains Tax analysis workflow.
            </p>
          </motion.div>
        </div>
      </section>

      {/* What to Expect */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">What to Expect</h2>
            <p className="text-lg text-slate-300">
              Our demos are tailored to your practice and needs
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {demoFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl hover:border-cyan-500/50 transition-all text-center"
                >
                  <div className="inline-flex p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <div className="p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl">
              <h3 className="text-xl font-semibold text-white mb-4">You'll See:</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-400">Request Your Demo</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Schedule Your Demo</h2>
              <p className="text-slate-300">Fill out the form below and we'll be in touch within 24 hours</p>
            </div>

            {submitStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 mb-6 bg-green-500/10 border border-green-500/30 rounded-lg"
              >
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-green-400">Demo requested successfully! We'll contact you shortly to confirm.</p>
              </motion.div>
            )}

            {submitStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <p className="text-red-400">Something went wrong. Please try again or contact us directly.</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-slate-300 mb-2">
                    Company *
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    placeholder="Your Company"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    placeholder="+61 123 456 789"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-slate-300 mb-2">
                    Role *
                  </label>
                  <input
                    type="text"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                    placeholder="e.g., Tax Adviser, Partner"
                  />
                </div>
                <div>
                  <label htmlFor="teamSize" className="block text-sm font-medium text-slate-300 mb-2">
                    Team Size *
                  </label>
                  <select
                    id="teamSize"
                    name="teamSize"
                    value={formData.teamSize}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                  >
                    <option value="">Select team size</option>
                    {teamSizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="preferredDate" className="block text-sm font-medium text-slate-300 mb-2">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    id="preferredDate"
                    name="preferredDate"
                    value={formData.preferredDate}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="preferredTime" className="block text-sm font-medium text-slate-300 mb-2">
                    Preferred Time (AEST) *
                  </label>
                  <select
                    id="preferredTime"
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                  >
                    <option value="">Select time slot</option>
                    {timeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors resize-none"
                  placeholder="Any specific features you'd like to focus on?"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Request Demo
                  </>
                )}
              </Button>

              <p className="text-sm text-slate-400 text-center">
                We'll confirm your demo time within 24 hours
              </p>
            </form>
          </motion.div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
