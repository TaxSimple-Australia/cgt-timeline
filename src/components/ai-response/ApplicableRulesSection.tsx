'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Shield } from 'lucide-react';

interface ApplicableRulesSectionProps {
  property: any;
  calculations?: any;
}

export default function ApplicableRulesSection({
  property,
  calculations,
}: ApplicableRulesSectionProps) {
  const rules: string[] = [];

  // Extract applicable rules based on property and calculations data

  // Main Residence Exemption
  if (property?.exemption_type === 'full') {
    rules.push('Full main residence exemption applies');
    rules.push('Property was main residence for entire ownership period');
    if (!property?.rental_period_days || property.rental_period_days === 0) {
      rules.push('No income-producing use');
    }
  } else if (property?.exemption_type === 'partial') {
    const exemptPercentage = calculations?.main_residence_exemption?.exemption_percentage || property?.exempt_percentage || 0;
    rules.push(`Partial main residence exemption (${exemptPercentage.toFixed(1)}% exempt)`);
    rules.push('Apportionment for non-main residence period applies');
  }

  // Six-Year Rule
  if (property?.six_year_rule_applied) {
    const rentalYears = property?.rental_period_days ? (property.rental_period_days / 365).toFixed(1) : 'N/A';
    if (rentalYears !== 'N/A' && parseFloat(rentalYears) < 6) {
      rules.push(`Six-year absence rule applies (rental period ${rentalYears} years < 6 years)`);
    } else {
      rules.push('Six-year absence rule applies');
    }
    rules.push('Property treated as main residence during absence');
    rules.push('No other property claimed as main residence during this period');
  }

  // Six-Year Rule Exceeded
  if (property?.six_year_rule_exceeded) {
    const rentalYears = property?.rental_period_days ? (property.rental_period_days / 365).toFixed(1) : 'N/A';
    rules.push(`Six-year absence rule (partial - exceeded 6 years)`);
    if (rentalYears !== 'N/A') {
      rules.push(`Rental period (${rentalYears} years) exceeds 6-year limit`);
    }
  }

  // First Use to Produce Income
  if (property?.first_use_to_produce_income || property?.deemed_acquisition_date) {
    rules.push('First use to produce income rule applies');
    if (property?.deemed_acquisition_value) {
      rules.push(`Deemed acquisition at market value`);
    }
  }

  // CGT Discount
  if (calculations?.cgt_discount?.eligible) {
    const discountPercentage = calculations.cgt_discount.discount_percentage || 50;
    rules.push(`${discountPercentage}% CGT discount applies (held > 12 months)`);
  }

  // ITAA Sections
  if (calculations?.method) {
    const methodSections = calculations.method
      .replace('ITAA 1997 ', '')
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    methodSections.forEach((section: string) => {
      rules.push(`ITAA 1997 ${section}`);
    });
  }

  // Additional rules from property data
  if (property?.exemption_reason && property.exemption_type === 'full') {
    // Already covered above
  }

  // Moving between main residences (6-month overlap)
  if (property?.overlap_rule_applied) {
    rules.push('6-month overlap rule applies');
    rules.push('Both properties treated as main residence during transition');
  }

  // If no rules found, add default based on exemption type
  if (rules.length === 0) {
    if (property?.exemption_type === 'none') {
      rules.push('Property was investment property throughout ownership');
      rules.push('No main residence exemption applies');
    } else {
      rules.push('Standard CGT calculation applies');
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3 border-b-2 border-green-200 dark:border-green-800 pb-3">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          APPLICABLE RULES
        </h3>
      </div>

      {/* Rules List */}
      <div className="bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-5">
        <ul className="space-y-3">
          {rules.map((rule, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * index }}
              className="flex items-start gap-3 text-gray-700 dark:text-gray-300"
            >
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm font-medium leading-relaxed">{rule}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
