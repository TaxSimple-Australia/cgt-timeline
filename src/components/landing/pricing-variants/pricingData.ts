import { Zap, Sparkles, Shield } from 'lucide-react';

export const PRICING_PLANS = [
  {
    name: 'Free',
    price: '0',
    period: 'forever',
    description: 'Unlimited timeline planning',
    icon: Zap,
    iconColor: 'text-cyan-400',
    features: [
      'Create unlimited timelines',
      'Visual timeline builder',
      'Property tracking',
      'Event management',
    ],
    cta: 'Get Started',
    ctaLink: '/',
    popular: false,
    gradient: 'from-cyan-500/10 to-blue-500/10',
    borderColor: 'border-cyan-500/20',
    buttonClass: 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10',
  },
  {
    name: 'Standard',
    price: '9.99',
    period: 'report',
    description: 'Professional CGT reports on demand',
    icon: Sparkles,
    iconColor: 'text-purple-400',
    features: [
      'Everything in Free',
      'First 5 reports free',
      'AI-powered CGT calculations',
      'Detailed cost base breakdowns',
      'Main residence exemption analysis',
      'Scenario modeling',
    ],
    cta: 'Get Your First Report',
    ctaLink: '/',
    popular: true,
    gradient: 'from-purple-500/10 to-pink-500/10',
    borderColor: 'border-purple-500/30',
    buttonClass: 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30',
  },
  {
    name: 'Premium',
    price: '19.99',
    period: 'report',
    description: 'Expert-reviewed, ATO-ready reports',
    icon: Shield,
    iconColor: 'text-blue-400',
    features: [
      'Everything in Standard',
      'Tax agent review & certification',
      'Compliance verification',
      'ATO-ready reports',
      'Priority support (24h response)',
      'Dedicated account manager',
      'Custom reporting',
    ],
    cta: 'Contact Sales',
    ctaLink: '/contact',
    popular: false,
    gradient: 'from-blue-500/10 to-cyan-500/10',
    borderColor: 'border-blue-500/20',
    buttonClass: 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10',
  },
];

export const PRICING_FAQS = [
  {
    question: 'How does pay-per-report work?',
    answer: "There's no subscription required. Build unlimited timelines for free using our visual timeline builder. When you need a professional CGT calculation, simply choose Standard ($9.99) or Premium ($19.99) for that specific report. Your first 5 Standard reports are completely free.",
  },
  {
    question: 'Can I try it before paying?',
    answer: 'Absolutely! The visual timeline builder, property tracking, and all planning features are 100% free forever. Plus, you get your first 5 Standard reports at no cost. You only pay when you need additional AI-powered CGT reports.',
  },
  {
    question: "What's the difference between Standard and Premium reports?",
    answer: 'Standard ($9.99) includes AI-powered CGT calculations, detailed cost base breakdowns, and scenario modeling. Premium ($19.99) adds professional tax agent review, compliance certification, ATO-ready documentation, and priority support.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards and PayPal. Payment is processed securely at the time you generate each report.',
  },
];

// Feature comparison matrix for the comparison table variant
export const FEATURE_CATEGORIES = [
  {
    category: 'Core Features',
    features: [
      { name: 'Visual timeline builder', free: true, standard: true, premium: true },
      { name: 'Unlimited timelines', free: true, standard: true, premium: true },
      { name: 'Property tracking', free: true, standard: true, premium: true },
      { name: 'Event management', free: true, standard: true, premium: true },
    ],
  },
  {
    category: 'AI & Reports',
    features: [
      { name: 'AI-powered CGT calculations', free: false, standard: true, premium: true },
      { name: 'Detailed cost base breakdowns', free: false, standard: true, premium: true },
      { name: 'Main residence exemption analysis', free: false, standard: true, premium: true },
      { name: 'Scenario modeling', free: false, standard: true, premium: true },
      { name: 'First 5 reports free', free: false, standard: true, premium: true },
    ],
  },
  {
    category: 'Professional',
    features: [
      { name: 'Tax agent review & certification', free: false, standard: false, premium: true },
      { name: 'Compliance verification', free: false, standard: false, premium: true },
      { name: 'ATO-ready reports', free: false, standard: false, premium: true },
      { name: 'Priority support (24h)', free: false, standard: false, premium: true },
      { name: 'Dedicated account manager', free: false, standard: false, premium: true },
      { name: 'Custom reporting', free: false, standard: false, premium: true },
    ],
  },
];
