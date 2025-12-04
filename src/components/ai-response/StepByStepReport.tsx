'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Info,
  Calculator,
  Lightbulb,
  Shield,
  ChevronDown,
  ChevronUp,
  Users
} from 'lucide-react';
import { formatCurrency, formatPercentage, formatDays, formatDateRange } from '@/lib/format-calculation-display';

interface StepByStepReportProps {
  property: any;
  calculations?: any;
  analysis?: any; // Full analysis object from API response
}

export default function StepByStepReport({ property, calculations, analysis }: StepByStepReportProps) {
  // Extract calculation steps from API
  const calculationSteps = calculations?.calculation_steps || [];

  // Extract narrative sections from API
  const exemptionReason = property?.exemption_reason || null;
  const sixYearReason = property?.six_year_reason || null;

  // Accordion state for Basis of Outcome section
  const [expandedBasisCard, setExpandedBasisCard] = useState<number | null>(0);

  // Parse and extract property-specific analysis
  const propertyAnalysis = useMemo(() => {
    if (!analysis?.content) return null;

    try {
      // Parse the analysis content string (it's JSON)
      const parsedAnalysis = typeof analysis.content === 'string'
        ? JSON.parse(analysis.content)
        : analysis.content;

      // Find this property's analysis by matching address
      const perPropertyArray = parsedAnalysis.per_property_analysis || [];
      return perPropertyArray.find((p: any) =>
        p.property_address === property?.address
      );
    } catch (error) {
      console.log('📍 Could not parse analysis.content:', error);
      return null;
    }
  }, [analysis, property]);

  // Extract cross-property intelligence
  const crossPropertyIntelligence = useMemo(() => {
    if (!analysis?.content) return null;

    try {
      const parsedAnalysis = typeof analysis.content === 'string'
        ? JSON.parse(analysis.content)
        : analysis.content;

      return parsedAnalysis.cross_property_intelligence || null;
    } catch (error) {
      return null;
    }
  }, [analysis]);

  // Extract tax year from sale date (if available)
  const getTaxYear = () => {
    return new Date().getFullYear() + 1; // Default to next year
  };

  // Parse method string into individual rules
  const parseMethodRules = (methodString: string): string[] => {
    if (!methodString) return [];
    const sections = methodString
      .replace('ITAA 1997 ', '')
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    return sections.map(section => `ITAA 1997 ${section}`);
  };

  const methodRules = calculations?.method ? parseMethodRules(calculations.method) : [];

  // Extract RULE references from reasoning text
  const extractRuleReferences = (text: string): string[] => {
    if (!text) return [];
    const ruleMatches = text.match(/RULE\s+\d+/g) || [];
    return [...new Set(ruleMatches)]; // Remove duplicates
  };

  // Basis cards data - now fully dynamic
  const basisCards = useMemo(() => {
    const cards = [];

    // Card 1: Exemption reasoning (always show, enhanced with analysis)
    const hasDetailedReasoning = propertyAnalysis?.reasoning;
    const ruleReferences = hasDetailedReasoning ? extractRuleReferences(propertyAnalysis.reasoning) : [];

    cards.push({
      title: `Why the property is ${property?.exemption_type === 'full' ? 'fully' : property?.exemption_type === 'partial' ? 'partially' : 'not'} exempt`,
      content: (
        <div className="space-y-3">
          {exemptionReason && (
            <div className="text-gray-700 dark:text-gray-300">
              {exemptionReason}
            </div>
          )}
          {hasDetailedReasoning && (
            <div className="mt-3 p-3 bg-amber-100 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded">
              <div className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2">
                Detailed Reasoning:
              </div>
              <div className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                {propertyAnalysis.reasoning}
              </div>
              {ruleReferences.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {ruleReferences.map((rule, idx) => (
                    <span key={idx} className="text-xs px-2 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-200 rounded font-mono">
                      {rule}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ),
      hasData: !!(exemptionReason || hasDetailedReasoning),
    });

    // Card 2: CGT Apportionment (only if partial exemption)
    if (calculations?.main_residence_exemption?.exemption_percentage &&
        calculations.main_residence_exemption.exemption_percentage < 100) {
      cards.push({
        title: 'Why CGT is apportioned',
        content: `Property was main residence for ${calculations.main_residence_exemption.days_as_main_residence} days out of ${calculations.main_residence_exemption.total_ownership_days} total ownership days (${formatPercentage(calculations.main_residence_exemption.exemption_percentage)} exempt).`,
        hasData: true,
      });
    }

    // Card 3: CGT Discount (only if eligible)
    if (calculations?.cgt_discount?.eligible) {
      cards.push({
        title: `Why the ${calculations.cgt_discount.discount_percentage}% CGT discount applies`,
        content: `Property was owned for more than 12 months, qualifying for the ${calculations.cgt_discount.discount_percentage}% CGT discount.`,
        hasData: true,
      });
    }

    // Card 4: Six-year rule (only if applicable)
    if (sixYearReason || (propertyAnalysis?.reasoning && propertyAnalysis.reasoning.includes('six-year'))) {
      const hasCrossPropertyImpact = propertyAnalysis?.cross_property_impact &&
                                      propertyAnalysis.cross_property_impact.toLowerCase() !== 'no other properties affected the exemption status of this property.' &&
                                      propertyAnalysis.cross_property_impact.toLowerCase() !== 'this property was not affected by the status of other properties as it was the main residence throughout its ownership.';

      cards.push({
        title: 'Six-year rule application',
        content: (
          <div className="space-y-3">
            {sixYearReason && (
              <div className="text-gray-700 dark:text-gray-300">
                {sixYearReason}
              </div>
            )}
            {hasCrossPropertyImpact && (
              <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-300 dark:border-purple-700 rounded">
                <div className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Impact from Other Properties:
                </div>
                <div className="text-sm text-purple-800 dark:text-purple-300 leading-relaxed">
                  {propertyAnalysis.cross_property_impact}
                </div>
              </div>
            )}
          </div>
        ),
        hasData: true,
      });
    }

    // Card 5: Cross-property interactions (only if meaningful data exists)
    if (propertyAnalysis?.cross_property_impact &&
        propertyAnalysis.cross_property_impact.toLowerCase() !== 'no other properties affected the exemption status of this property.' &&
        propertyAnalysis.cross_property_impact.toLowerCase() !== 'this property was not affected by the status of other properties as it was the main residence throughout its ownership.' &&
        !sixYearReason) { // Don't duplicate if already shown in six-year card

      cards.push({
        title: 'Cross-property interactions',
        content: (
          <div className="space-y-3">
            <div className="text-gray-700 dark:text-gray-300">
              {propertyAnalysis.cross_property_impact}
            </div>
            {crossPropertyIntelligence && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-300 dark:border-blue-700 rounded">
                <div className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  Portfolio-level Context:
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                  {crossPropertyIntelligence}
                </div>
              </div>
            )}
          </div>
        ),
        hasData: true,
      });
    }

    // Note: Removed hardcoded cards for "deemed acquisition date" and "capital losses"
    // These will only appear if the API provides actual data in the future

    return cards;
  }, [property, calculations, exemptionReason, sixYearReason, propertyAnalysis, crossPropertyIntelligence]);

  const toggleBasisCard = (index: number) => {
    setExpandedBasisCard(expandedBasisCard === index ? null : index);
  };

  return (
    <div className="space-y-8">
      {/* Capital Gain Calculation Section */}
      {calculationSteps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4"
        >
          {/* Section Header */}
          <div className="flex items-center gap-3 border-b-2 border-blue-200 dark:border-blue-800 pb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Capital Gain Calculation
            </h3>
          </div>

          {/* Calculation Steps */}
          <div className="space-y-3">
            {calculationSteps.map((step: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  {/* Step Badge */}
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-600 dark:bg-blue-500 text-white rounded-full text-sm font-bold shadow-md">
                    {step.step}
                  </span>

                  {/* Step Content */}
                  <div className="flex-1 space-y-2">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      Step {step.step} — {step.description}
                    </h4>

                    {/* Calculation */}
                    {step.calculation && (
                      <div className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-white dark:bg-gray-900 p-3 rounded border border-blue-300 dark:border-blue-700">
                        {step.calculation}
                      </div>
                    )}

                    {/* Result */}
                    {step.result !== null && step.result !== undefined && (
                      <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                        = {formatCurrency(step.result)}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Final Result Box */}
          {calculations?.net_capital_gain !== null && calculations?.net_capital_gain !== undefined && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: calculationSteps.length * 0.1 }}
              className="mt-6 p-6 bg-green-50 dark:bg-green-950/20 border-2 border-green-500 dark:border-green-600 rounded-lg shadow-lg"
            >
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Net Capital Gain for {getTaxYear()} Tax Return
                </div>
                <div className="text-4xl font-bold text-green-700 dark:text-green-400">
                  {formatCurrency(calculations.net_capital_gain)}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Basis of the Outcome Section - Accordion Style */}
      {basisCards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-4"
        >
          {/* Section Header */}
          <div className="flex items-center gap-3 border-b-2 border-amber-200 dark:border-amber-800 pb-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Basis of the Outcome
            </h3>
          </div>

          {/* Accordion Cards */}
          <div className="space-y-2">
            {basisCards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.05 * index }}
                className={`rounded-lg border-2 overflow-hidden transition-all duration-300 ${
                  expandedBasisCard === index
                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 shadow-lg'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-800'
                }`}
              >
                {/* Card Header - Clickable */}
                <button
                  onClick={() => toggleBasisCard(index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-amber-50/50 dark:hover:bg-amber-950/10 transition-colors"
                  aria-expanded={expandedBasisCard === index}
                >
                  <div className="flex items-center gap-3">
                    <Info className={`w-5 h-5 flex-shrink-0 ${
                      expandedBasisCard === index
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`} />
                    <span className={`text-sm font-semibold ${
                      expandedBasisCard === index
                        ? 'text-amber-900 dark:text-amber-100'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {card.title}
                    </span>
                    {!card.hasData && (
                      <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                        N/A
                      </span>
                    )}
                  </div>
                  {expandedBasisCard === index ? (
                    <ChevronUp className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  )}
                </button>

                {/* Card Content - Expandable */}
                <AnimatePresence>
                  {expandedBasisCard === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className={`px-4 pb-4 pt-2 text-sm leading-relaxed ${
                        card.hasData
                          ? 'text-gray-700 dark:text-gray-300'
                          : 'text-gray-500 dark:text-gray-400 italic'
                      }`}>
                        {typeof card.content === 'string' ? card.content : card.content}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Rules That Apply Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="space-y-4"
      >
        {/* Section Header */}
        <div className="flex items-center gap-3 border-b-2 border-green-200 dark:border-green-800 pb-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Rules That Apply
          </h3>
        </div>

        {/* Rules Container */}
        <div className="bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-5 space-y-3">
          {/* Method rules (parsed) */}
          {methodRules.map((rule: string, index: number) => (
            <motion.div
              key={`method-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * index }}
              className="flex items-center gap-3 p-2 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                {rule}
              </span>
            </motion.div>
          ))}

          {/* Main residence exemption */}
          {(property?.exemption_type === 'full' || property?.exemption_type === 'partial') && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * methodRules.length }}
              className="flex items-center gap-3 p-2 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                Main residence exemption
              </span>
            </motion.div>
          )}

          {/* Six year rule */}
          {property?.six_year_rule_applied && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * (methodRules.length + 1) }}
              className="flex items-center gap-3 p-2 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                6-year absence rule
              </span>
            </motion.div>
          )}

          {/* Apportionment */}
          {calculations?.main_residence_exemption?.exemption_percentage &&
           calculations.main_residence_exemption.exemption_percentage < 100 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * (methodRules.length + 2) }}
              className="flex items-center gap-3 p-2 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                Apportionment for non-main residence period
              </span>
            </motion.div>
          )}

          {/* CGT Discount */}
          {calculations?.cgt_discount?.eligible && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * (methodRules.length + 3) }}
              className="flex items-center gap-3 p-2 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                {calculations.cgt_discount.discount_percentage}% CGT discount (held more than 12 months)
              </span>
            </motion.div>
          )}
        </div>

        {/* Rules That Do NOT Apply */}
        {(property?.exemption_type !== 'full' || !calculations?.cgt_discount?.eligible) && (
          <div className="mt-6">
            <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              Rules That Do NOT Apply
            </h4>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-2">
              {property?.exemption_type === 'partial' && (
                <div className="flex items-center gap-3 p-2 rounded">
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    No full main residence exemption (mixed use or partial occupancy)
                  </span>
                </div>
              )}

              {property?.exemption_type === 'none' && (
                <div className="flex items-center gap-3 p-2 rounded">
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    No main residence exemption (investment property throughout)
                  </span>
                </div>
              )}

              {!property?.six_year_rule_applied && property?.six_year_rule_eligible === false && (
                <div className="flex items-center gap-3 p-2 rounded">
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Six-year absence rule not applicable
                  </span>
                </div>
              )}

              {calculations?.cgt_discount?.eligible && (
                <div className="flex items-center gap-3 p-2 rounded">
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    No indexation method (discount method chosen)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Empty State */}
      {calculationSteps.length === 0 && basisCards.length === 0 && methodRules.length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            No detailed calculation steps available from API
          </p>
        </div>
      )}
    </div>
  );
}
