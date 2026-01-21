'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Shield, CheckCircle } from 'lucide-react';

export default function TrustBar() {
  const [counts, setCounts] = useState({ properties: 0, savings: 0, users: 0 });

  // Animated counter effect
  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const interval = duration / steps;

    const targets = {
      properties: 10482,
      savings: 2.4,
      users: 8734,
    };

    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;

      setCounts({
        properties: Math.floor(targets.properties * progress),
        savings: parseFloat((targets.savings * progress).toFixed(1)),
        users: Math.floor(targets.users * progress),
      });

      if (step >= steps) {
        clearInterval(timer);
        setCounts(targets);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const stats = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      value: counts.properties.toLocaleString() + '+',
      label: 'Properties Analyzed',
      color: 'cyan',
    },
    {
      icon: <Users className="w-6 h-6" />,
      value: counts.users.toLocaleString() + '+',
      label: 'Happy Users',
      color: 'blue',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      value: '$' + counts.savings + 'M+',
      label: 'Tax Savings Found',
      color: 'green',
    },
  ];

  const trustBadges = [
    { icon: <CheckCircle className="w-4 h-4" />, text: 'ATO Compliant' },
    { icon: <CheckCircle className="w-4 h-4" />, text: 'Australian Hosted' },
    { icon: <CheckCircle className="w-4 h-4" />, text: 'Bank-Level Security' },
  ];

  return (
    <section className="relative py-16 px-4 bg-slate-900 border-y border-slate-800">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-cyan-500/30 transition-all duration-300">
                {/* Gradient glow on hover */}
                <div className={`absolute inset-0 bg-gradient-to-r from-${stat.color}-500/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <div className="relative">
                  <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-600/20 rounded-xl mb-4`}>
                    <span className={`text-${stat.color}-400`}>{stat.icon}</span>
                  </div>

                  <div className={`text-4xl font-bold bg-gradient-to-r from-${stat.color}-400 to-${stat.color}-500 bg-clip-text text-transparent mb-2`}>
                    {stat.value}
                  </div>

                  <div className="text-slate-400 text-sm font-medium">
                    {stat.label}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap justify-center items-center gap-6"
        >
          {trustBadges.map((badge, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/30 border border-slate-700/50 rounded-lg"
            >
              <span className="text-green-400">{badge.icon}</span>
              <span className="text-slate-300 text-sm font-medium">{badge.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Social Proof Text */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-8"
        >
          <p className="text-slate-400 text-sm">
            Trusted by property investors, tax professionals, and accountants across Australia
          </p>
        </motion.div>
      </div>
    </section>
  );
}
