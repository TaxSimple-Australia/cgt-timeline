'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { transformPropertyToReport } from '@/lib/transform-api-to-report';

// ============================================================================
// STYLES
// ============================================================================

const colors = {
  primary: '#1e3a8a',
  primaryLight: '#3b82f6',
  primaryBg: '#eff6ff',
  primaryBorder: '#bfdbfe',
  green: '#16a34a',
  greenDark: '#15803d',
  greenBg: '#f0fdf4',
  greenBorder: '#bbf7d0',
  emerald: '#059669',
  emeraldBg: '#ecfdf5',
  emeraldBorder: '#a7f3d0',
  red: '#dc2626',
  redBg: '#fef2f2',
  redBorder: '#fecaca',
  amber: '#d97706',
  amberBg: '#fffbeb',
  amberBorder: '#fde68a',
  purple: '#7c3aed',
  purpleBg: '#f5f3ff',
  purpleBorder: '#ddd6fe',
  indigo: '#4f46e5',
  indigoBg: '#eef2ff',
  indigoBorder: '#c7d2fe',
  teal: '#0d9488',
  tealBg: '#f0fdfa',
  tealBorder: '#99f6e4',
  cyan: '#0891b2',
  cyanBg: '#ecfeff',
  cyanBorder: '#a5f3fc',
  gray: '#475569',
  grayLight: '#64748b',
  grayLighter: '#94a3b8',
  grayBg: '#f8fafc',
  grayBorder: '#cbd5e1',
  white: '#ffffff',
  black: '#1e293b',
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 60,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: colors.white,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    fontSize: 7,
    color: colors.grayLighter,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
  },
  // Section Headers
  sectionBanner: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  sectionBannerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  sectionBannerSub: {
    fontSize: 9,
    color: '#bfdbfe',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
    marginTop: 14,
    paddingBottom: 4,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.primaryLight,
  },
  subsectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 6,
    marginTop: 10,
  },
  // Cards
  card: {
    borderWidth: 1,
    borderColor: colors.grayBorder,
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  metricCard: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 6,
  },
  metricLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    marginBottom: 3,
    textTransform: 'uppercase' as any,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  metricSub: {
    fontSize: 7,
    marginTop: 2,
  },
  // Tables
  table: {
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: colors.grayBorder,
    padding: 6,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    color: colors.gray,
  },
  tableRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.grayBorder,
    padding: 6,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.grayBorder,
    padding: 6,
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 9,
    color: colors.black,
  },
  tableCellBold: {
    fontSize: 9,
    color: colors.black,
    fontWeight: 'bold',
  },
  // Badges
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 7,
    fontWeight: 'bold',
  },
  // Text blocks
  textBlock: {
    backgroundColor: colors.primaryBg,
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 9,
    color: colors.gray,
    lineHeight: 1.5,
  },
  // Steps
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 1.7,
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 8,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
    color: colors.primary,
  },
  stepFormula: {
    fontSize: 8,
    color: colors.gray,
    backgroundColor: colors.grayBg,
    padding: 4,
    borderRadius: 2,
    marginTop: 2,
    fontFamily: 'Courier',
  },
  stepResult: {
    fontSize: 9,
    marginTop: 2,
    color: colors.primaryLight,
    fontWeight: 'bold',
  },
  // Rules
  ruleItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 4,
  },
  bullet: {
    width: 10,
    color: colors.primaryLight,
    fontWeight: 'bold',
    fontSize: 10,
  },
  // Divider
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginVertical: 10,
  },
  // Row layouts
  row: {
    flexDirection: 'row',
  },
  rowSpaced: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // Info box
  infoBox: {
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 8,
  },
  // Property header bar
  propertyBar: {
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 4,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  propertyAddress: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
});

// ============================================================================
// HELPERS
// ============================================================================

const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) return '$0';
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]/g, '')) : amount;
  if (isNaN(num)) return String(amount);
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(num));
};

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const toNumber = (val: string | number | null | undefined): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? 0 : num;
};

// Find matching calculations for a property
const findPropertyCalc = (property: any, calculations: any) => {
  return calculations?.per_property?.find(
    (calc: any) =>
      calc.property_id === property.property_id ||
      calc.property_id === property.address ||
      calc.property_address === property.address
  );
};

// Find matching analysis for a property
const findPropertyAnalysis = (property: any, analysis: any) => {
  return analysis?.per_property_analysis?.find(
    (a: any) => a.property_address === property.address
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const PageFooter = ({ pageLabel }: { pageLabel: string }) => (
  <View style={styles.footer} fixed>
    <Text>CGT Analysis Report | Tax Simple Australia | CGT Brain</Text>
    <Text>{pageLabel}</Text>
  </View>
);

const MetricCard = ({
  label, value, sub, bgColor, borderColor, textColor, subColor,
}: {
  label: string; value: string; sub?: string;
  bgColor: string; borderColor: string; textColor: string; subColor?: string;
}) => (
  <View style={{ ...styles.metricCard, backgroundColor: bgColor, borderColor }}>
    <Text style={{ ...styles.metricLabel, color: textColor }}>{label}</Text>
    <Text style={{ ...styles.metricValue, color: textColor }}>{value}</Text>
    {sub && <Text style={{ ...styles.metricSub, color: subColor || textColor }}>{sub}</Text>}
  </View>
);

const SectionBanner = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <View style={styles.sectionBanner}>
    <Text style={styles.sectionBannerText}>{title}</Text>
    {subtitle && <Text style={styles.sectionBannerSub}>{subtitle}</Text>}
  </View>
);

const InfoBox = ({
  text, bgColor, borderColor, textColor,
}: {
  text: string; bgColor: string; borderColor: string; textColor: string;
}) => (
  <View style={{ ...styles.infoBox, backgroundColor: bgColor, borderColor }}>
    <Text style={{ fontSize: 8, color: textColor, lineHeight: 1.4 }}>{text}</Text>
  </View>
);

const PropertyBadges = ({ property, propAnalysis }: { property: any; propAnalysis: any }) => {
  const status = propAnalysis?.status || property?.status;
  const exemption = propAnalysis?.exemption || property?.exemption_type;

  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {status && (
        <Text style={{
          ...styles.badge,
          backgroundColor: status === 'sold' ? colors.purpleBg : colors.primaryBg,
          color: status === 'sold' ? colors.purple : colors.primaryLight,
        }}>
          {status.toUpperCase()}
        </Text>
      )}
      {exemption && (
        <Text style={{
          ...styles.badge,
          backgroundColor: exemption === 'full' ? colors.greenBg : exemption === 'partial' ? colors.amberBg : colors.redBg,
          color: exemption === 'full' ? colors.green : exemption === 'partial' ? colors.amber : colors.red,
        }}>
          {exemption === 'full' ? 'FULL EXEMPTION' : exemption === 'partial' ? 'PARTIAL EXEMPTION' : 'NO EXEMPTION'}
        </Text>
      )}
    </View>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SimplifiedCGTReportPDFProps {
  response: any;
}

export const SimplifiedCGTReportPDF: React.FC<SimplifiedCGTReportPDFProps> = ({ response }) => {
  const {
    properties: apiProperties,
    calculations,
    validation,
    analysis,
    verification,
    timestamp,
    analysis_id,
    summary: responseSummary,
  } = response || {};

  const portfolioTotal = calculations?.portfolio_total;

  // Calculate portfolio metrics
  let totalCapitalGain = portfolioTotal?.total_capital_gain || 0;
  let totalCGTLiability = portfolioTotal?.total_cgt_liability || 0;
  let totalExemptAmount = portfolioTotal?.total_exempt_amount || 0;
  let exemptProperties = 0;

  if (apiProperties && calculations?.per_property) {
    apiProperties.forEach((property: any) => {
      if (property.exempt_percentage === 100 || property.exemption_type === 'full') {
        exemptProperties += 1;
      }
    });
    // Fallback if portfolio_total not present
    if (!totalCapitalGain && !totalCGTLiability) {
      calculations.per_property.forEach((calc: any) => {
        totalCapitalGain += calc.raw_capital_gain || 0;
        totalCGTLiability += calc.net_capital_gain || 0;
      });
    }
  }

  const totalProperties = apiProperties?.length || 0;
  const reportDate = timestamp ? new Date(timestamp).toLocaleDateString('en-AU') : new Date().toLocaleDateString('en-AU');

  return (
    <Document>
      {/* ================================================================== */}
      {/* COVER PAGE                                                         */}
      {/* ================================================================== */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={{ marginBottom: 30, paddingBottom: 12, borderBottomWidth: 3, borderBottomColor: colors.primaryLight }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.primary }}>
            CGT Analysis Report
          </Text>
          <Text style={{ fontSize: 11, color: colors.grayLight, marginTop: 4 }}>
            Capital Gains Tax Portfolio Analysis
          </Text>
        </View>

        {/* Report Info */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
          <View>
            <Text style={{ fontSize: 9, color: colors.grayLight }}>Generated</Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.black }}>{reportDate}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 9, color: colors.grayLight }}>Analysis ID</Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.black }}>{analysis_id || 'N/A'}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 9, color: colors.grayLight }}>Properties Analysed</Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.black }}>{totalProperties}</Text>
          </View>
        </View>

        {/* Portfolio Summary Card */}
        <View style={{ backgroundColor: colors.primaryBg, padding: 16, borderRadius: 4, borderWidth: 2, borderColor: colors.primaryLight, marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: 12 }}>
            Portfolio Summary
          </Text>
          <View style={{ flexDirection: 'row', marginBottom: 10 }}>
            <MetricCard
              label="Total CGT Liability"
              value={formatCurrency(totalCGTLiability)}
              sub={totalCGTLiability === 0 ? 'Fully exempt' : 'Tax return total'}
              bgColor={totalCGTLiability === 0 ? colors.greenBg : colors.redBg}
              borderColor={totalCGTLiability === 0 ? colors.greenBorder : colors.redBorder}
              textColor={totalCGTLiability === 0 ? colors.green : colors.red}
            />
            <MetricCard
              label="Total Capital Gain"
              value={formatCurrency(totalCapitalGain)}
              sub="Before exemptions"
              bgColor={colors.emeraldBg}
              borderColor={colors.emeraldBorder}
              textColor={colors.emerald}
            />
            <MetricCard
              label="Total Exempt Amount"
              value={formatCurrency(totalExemptAmount)}
              sub="Main residence"
              bgColor={colors.purpleBg}
              borderColor={colors.purpleBorder}
              textColor={colors.purple}
            />
            <MetricCard
              label="Exempt Properties"
              value={`${exemptProperties}/${totalProperties}`}
              sub="Fully exempt"
              bgColor={colors.primaryBg}
              borderColor={colors.primaryBorder}
              textColor={colors.primaryLight}
            />
          </View>

          {/* Carry-forward loss */}
          {responseSummary?.carry_forward_loss !== undefined && responseSummary.carry_forward_loss !== null && (
            <View style={{ flexDirection: 'row', marginTop: 4 }}>
              <MetricCard
                label="Carry-Forward Loss"
                value={formatCurrency(responseSummary.carry_forward_loss)}
                sub="Available"
                bgColor={colors.amberBg}
                borderColor={colors.amberBorder}
                textColor={colors.amber}
              />
              <View style={{ flex: 3 }} />
            </View>
          )}
        </View>

        {/* Portfolio Statistics */}
        {(responseSummary?.main_residence_days || responseSummary?.total_ownership_days) && (
          <View style={{ ...styles.card, backgroundColor: colors.grayBg }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', color: colors.grayLight, marginBottom: 6 }}>PORTFOLIO STATISTICS</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {responseSummary.main_residence_days !== undefined && (
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 8, color: colors.grayLight }}>Main Residence Days</Text>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.black }}>{responseSummary.main_residence_days.toLocaleString()}</Text>
                </View>
              )}
              {responseSummary.total_ownership_days !== undefined && (
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 8, color: colors.grayLight }}>Total Ownership Days</Text>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.black }}>{responseSummary.total_ownership_days.toLocaleString()}</Text>
                </View>
              )}
              {responseSummary.exemption_percentage !== undefined && (
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 8, color: colors.grayLight }}>Exemption %</Text>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.black }}>{toNumber(responseSummary.exemption_percentage).toFixed(2)}%</Text>
                </View>
              )}
              {portfolioTotal?.properties_with_cgt !== undefined && (
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 8, color: colors.grayLight }}>Properties with CGT</Text>
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.black }}>{portfolioTotal.properties_with_cgt}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Executive Summary */}
        {analysis?.summary && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Executive Summary</Text>
            <View style={styles.textBlock}>
              <Text style={styles.bodyText}>{analysis.summary}</Text>
            </View>
          </View>
        )}

        {/* Properties Overview Table */}
        {apiProperties && apiProperties.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Properties Overview</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={{ ...styles.tableHeaderCell, width: '40%' }}>Property</Text>
                <Text style={{ ...styles.tableHeaderCell, width: '15%' }}>Status</Text>
                <Text style={{ ...styles.tableHeaderCell, width: '15%' }}>Exemption</Text>
                <Text style={{ ...styles.tableHeaderCell, width: '15%' }}>Capital Gain</Text>
                <Text style={{ ...styles.tableHeaderCell, width: '15%' }}>Net CGT</Text>
              </View>
              {apiProperties.map((property: any, idx: number) => {
                const calc = findPropertyCalc(property, calculations);
                const propAnalysis = findPropertyAnalysis(property, analysis);
                return (
                  <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                    <Text style={{ ...styles.tableCellBold, width: '40%' }}>{property.address}</Text>
                    <Text style={{ ...styles.tableCell, width: '15%' }}>{(propAnalysis?.status || property?.status || 'N/A').toUpperCase()}</Text>
                    <Text style={{ ...styles.tableCell, width: '15%' }}>{(propAnalysis?.exemption || property?.exemption_type || 'N/A').toUpperCase()}</Text>
                    <Text style={{ ...styles.tableCell, width: '15%' }}>{formatCurrency(calc?.raw_capital_gain)}</Text>
                    <Text style={{ ...styles.tableCellBold, width: '15%' }}>{formatCurrency(calc?.net_capital_gain)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <PageFooter pageLabel="Cover Page" />
      </Page>

      {/* ================================================================== */}
      {/* SECTION B: TAX RETURN ESSENTIALS - Per Property Pages               */}
      {/* ================================================================== */}
      {apiProperties && apiProperties.map((property: any, propIndex: number) => {
        const propertyCalc = findPropertyCalc(property, calculations);
        const propAnalysis = findPropertyAnalysis(property, analysis);

        // Use transformation function for timeline events / calc steps / rules
        const transformResult = transformPropertyToReport(property, propertyCalc, validation);
        const { timelineEvents, calculationSteps, applicableRules } = transformResult.reportData;

        // Cost base breakdown
        const costBase = propertyCalc?.cost_base_breakdown;
        const costBaseItems: Array<{ element: string; description: string; amount: number | string }> = [];

        if (costBase) {
          if (costBase.original_cost) costBaseItems.push({ element: '1st', description: 'Purchase Price', amount: costBase.original_cost });
          if (costBase.stamp_duty) costBaseItems.push({ element: '2nd', description: 'Stamp Duty', amount: costBase.stamp_duty });
          if (costBase.purchase_legal_fees || costBase.legal_fees_purchase) costBaseItems.push({ element: '2nd', description: 'Legal Fees (Purchase)', amount: costBase.purchase_legal_fees || costBase.legal_fees_purchase });
          if (costBase.valuation_fees) costBaseItems.push({ element: '2nd', description: 'Valuation Fees', amount: costBase.valuation_fees });
          // Capital improvements
          const improvements = costBase.capital_improvements || [];
          improvements.forEach((imp: any, i: number) => {
            costBaseItems.push({ element: '3rd', description: imp.description || `Capital Improvement ${i + 1}`, amount: imp.amount });
          });
          if (costBase.agent_fees || costBase.selling_agent_fees) costBaseItems.push({ element: '5th', description: 'Agent Fees (Sale)', amount: costBase.agent_fees || costBase.selling_agent_fees });
          if (costBase.legal_fees_sale || costBase.sale_legal_fees) costBaseItems.push({ element: '5th', description: 'Legal Fees (Sale)', amount: costBase.legal_fees_sale || costBase.sale_legal_fees });
          if (costBase.advertising_costs) costBaseItems.push({ element: '5th', description: 'Advertising Costs', amount: costBase.advertising_costs });
        }

        // Period breakdown
        const periodBreakdown = property?.period_breakdown;
        const mainResidencePeriods = periodBreakdown?.main_residence_periods || [];
        const rentalPeriods = periodBreakdown?.rental_periods || [];
        const vacantPeriods = periodBreakdown?.vacant_periods || [];

        const borderColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#6366f1'];
        const borderColor = borderColors[propIndex % borderColors.length];

        return (
          <Page key={`prop-${propIndex}`} size="A4" style={styles.page} wrap>
            {/* Property Header */}
            <View style={{ ...styles.propertyBar, borderLeftColor: borderColor }}>
              <Text style={styles.propertyAddress}>{property.address}</Text>
              <PropertyBadges property={property} propAnalysis={propAnalysis} />
            </View>

            {/* Reasoning */}
            {propAnalysis?.reasoning && (
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.subsectionTitle}>Analysis Reasoning</Text>
                <View style={{ backgroundColor: colors.primaryBg, borderLeftWidth: 3, borderLeftColor: colors.primaryLight, padding: 8, borderRadius: 2 }}>
                  <Text style={styles.bodyText}>{propAnalysis.reasoning}</Text>
                </View>
              </View>
            )}

            {/* Cross-Property Impact */}
            {propAnalysis?.cross_property_impact && (
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.subsectionTitle}>Cross-Property Impact</Text>
                <View style={{ backgroundColor: colors.amberBg, borderLeftWidth: 3, borderLeftColor: colors.amber, padding: 8, borderRadius: 2 }}>
                  <Text style={{ ...styles.bodyText, color: '#92400e' }}>{propAnalysis.cross_property_impact}</Text>
                </View>
              </View>
            )}

            {/* Key Financial Summary */}
            {propertyCalc && (
              <View style={{ marginBottom: 10 }}>
                <Text style={styles.subsectionTitle}>Financial Summary</Text>
                <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                  <MetricCard
                    label="Purchase Price"
                    value={formatCurrency(property.purchase_price || costBase?.original_cost)}
                    bgColor={colors.primaryBg}
                    borderColor={colors.primaryBorder}
                    textColor={colors.primaryLight}
                  />
                  <MetricCard
                    label="Sale Price"
                    value={formatCurrency(property.sale_price || propertyCalc.capital_proceeds)}
                    bgColor={colors.emeraldBg}
                    borderColor={colors.emeraldBorder}
                    textColor={colors.emerald}
                  />
                  <MetricCard
                    label="Total Cost Base"
                    value={formatCurrency(propertyCalc.cost_base)}
                    bgColor={colors.purpleBg}
                    borderColor={colors.purpleBorder}
                    textColor={colors.purple}
                  />
                  <MetricCard
                    label="Net Capital Gain"
                    value={formatCurrency(propertyCalc.net_capital_gain)}
                    sub={propertyCalc.net_capital_gain === 0 ? 'Exempt' : 'After discount'}
                    bgColor={propertyCalc.net_capital_gain === 0 ? colors.greenBg : colors.amberBg}
                    borderColor={propertyCalc.net_capital_gain === 0 ? colors.greenBorder : colors.amberBorder}
                    textColor={propertyCalc.net_capital_gain === 0 ? colors.green : colors.amber}
                  />
                </View>
                {/* Exemption Info */}
                {(propertyCalc.exemption_percentage !== undefined || propertyCalc.main_residence_exemption !== undefined) && (
                  <View style={{ flexDirection: 'row' }}>
                    <MetricCard
                      label="Main Residence Days"
                      value={String(property.main_residence_days || propertyCalc.main_residence_days || 'N/A')}
                      sub={`of ${property.total_ownership_days || propertyCalc.total_ownership_days || '?'} total days`}
                      bgColor={colors.greenBg}
                      borderColor={colors.greenBorder}
                      textColor={colors.green}
                    />
                    <MetricCard
                      label="Exemption %"
                      value={`${toNumber(propertyCalc.exemption_percentage).toFixed(2)}%`}
                      sub="Main residence"
                      bgColor={colors.tealBg}
                      borderColor={colors.tealBorder}
                      textColor={colors.teal}
                    />
                    {propertyCalc.cgt_discount !== undefined && (
                      <MetricCard
                        label="CGT Discount"
                        value={propertyCalc.cgt_discount ? '50%' : 'N/A'}
                        sub={propertyCalc.cgt_discount ? 'Applied (>12 months)' : 'Not applicable'}
                        bgColor={colors.indigoBg}
                        borderColor={colors.indigoBorder}
                        textColor={colors.indigo}
                      />
                    )}
                    <View style={{ flex: 1 }} />
                  </View>
                )}
              </View>
            )}

            {/* Timeline of Events */}
            <Text style={styles.sectionTitle}>Timeline of Events</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={{ ...styles.tableHeaderCell, width: '20%' }}>Date</Text>
                <Text style={{ ...styles.tableHeaderCell, width: '20%' }}>Event</Text>
                <Text style={{ ...styles.tableHeaderCell, width: '60%' }}>Details</Text>
              </View>
              {timelineEvents.length > 0 ? timelineEvents.map((event, idx) => (
                <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={{ ...styles.tableCell, width: '20%' }}>{formatDate(event.date)}</Text>
                  <Text style={{ ...styles.tableCellBold, width: '20%' }}>{event.event}</Text>
                  <Text style={{ ...styles.tableCell, width: '60%' }}>{event.details}</Text>
                </View>
              )) : (
                <View style={styles.tableRow}>
                  <Text style={{ ...styles.tableCell, width: '100%', textAlign: 'center', fontStyle: 'italic', color: colors.grayLight }}>
                    No timeline events available
                  </Text>
                </View>
              )}
            </View>

            {/* Cost Base Breakdown */}
            {costBaseItems.length > 0 && (
              <View wrap={false}>
                <Text style={styles.sectionTitle}>Cost Base Breakdown</Text>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={{ ...styles.tableHeaderCell, width: '15%' }}>Element</Text>
                    <Text style={{ ...styles.tableHeaderCell, width: '55%' }}>Description</Text>
                    <Text style={{ ...styles.tableHeaderCell, width: '30%', textAlign: 'right' }}>Amount</Text>
                  </View>
                  {costBaseItems.map((item, idx) => {
                    const elementColors: Record<string, string> = {
                      '1st': colors.primaryBg,
                      '2nd': colors.purpleBg,
                      '3rd': '#fdf2f8',
                      '5th': colors.amberBg,
                    };
                    return (
                      <View key={idx} style={{ ...styles.tableRow, backgroundColor: elementColors[item.element] || colors.white }}>
                        <Text style={{ ...styles.tableCellBold, width: '15%' }}>{item.element}</Text>
                        <Text style={{ ...styles.tableCell, width: '55%' }}>{item.description}</Text>
                        <Text style={{ ...styles.tableCellBold, width: '30%', textAlign: 'right' }}>{formatCurrency(item.amount)}</Text>
                      </View>
                    );
                  })}
                  {/* Total row */}
                  <View style={{ ...styles.tableRow, backgroundColor: '#1e3a8a' }}>
                    <Text style={{ fontSize: 9, color: colors.white, fontWeight: 'bold', width: '15%' }}></Text>
                    <Text style={{ fontSize: 9, color: colors.white, fontWeight: 'bold', width: '55%' }}>TOTAL COST BASE</Text>
                    <Text style={{ fontSize: 10, color: colors.white, fontWeight: 'bold', width: '30%', textAlign: 'right' }}>
                      {formatCurrency(propertyCalc?.cost_base)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* CGT Calculation Steps */}
            {calculationSteps.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>CGT Calculation</Text>
                {calculationSteps.map((step, idx) => {
                  const cleanDesc = step.description?.replace(/\s*\([^)]*\)/g, '').trim() || '';
                  return (
                    <View key={idx} style={styles.stepContainer} wrap={false}>
                      <Text style={styles.stepNumber}>{step.step}</Text>
                      <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Step {step.step}: {cleanDesc}</Text>
                        {step.calculation && (
                          <Text style={styles.stepFormula}>{step.calculation}</Text>
                        )}
                        {step.result !== null && step.result !== undefined && (
                          <Text style={styles.stepResult}>
                            = {typeof step.result === 'number' ? formatCurrency(step.result) : step.result}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Ownership Periods */}
            {(mainResidencePeriods.length > 0 || rentalPeriods.length > 0 || vacantPeriods.length > 0) && (
              <View wrap={false}>
                <Text style={styles.sectionTitle}>Ownership Period Breakdown</Text>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={{ ...styles.tableHeaderCell, width: '25%' }}>Period Type</Text>
                    <Text style={{ ...styles.tableHeaderCell, width: '20%' }}>Start</Text>
                    <Text style={{ ...styles.tableHeaderCell, width: '20%' }}>End</Text>
                    <Text style={{ ...styles.tableHeaderCell, width: '15%' }}>Days</Text>
                    <Text style={{ ...styles.tableHeaderCell, width: '20%' }}>CGT Status</Text>
                  </View>
                  {mainResidencePeriods.map((period: any, idx: number) => (
                    <View key={`mr-${idx}`} style={{ ...styles.tableRow, backgroundColor: colors.greenBg }}>
                      <Text style={{ ...styles.tableCellBold, width: '25%', color: colors.green }}>Main Residence</Text>
                      <Text style={{ ...styles.tableCell, width: '20%' }}>{formatDate(period.start)}</Text>
                      <Text style={{ ...styles.tableCell, width: '20%' }}>{formatDate(period.end)}</Text>
                      <Text style={{ ...styles.tableCell, width: '15%' }}>{period.days || 'N/A'}</Text>
                      <Text style={{ ...styles.tableCellBold, width: '20%', color: colors.green }}>Exempt</Text>
                    </View>
                  ))}
                  {rentalPeriods.map((period: any, idx: number) => (
                    <View key={`r-${idx}`} style={{ ...styles.tableRow, backgroundColor: colors.primaryBg }}>
                      <Text style={{ ...styles.tableCellBold, width: '25%', color: colors.primaryLight }}>Rental</Text>
                      <Text style={{ ...styles.tableCell, width: '20%' }}>{formatDate(period.start)}</Text>
                      <Text style={{ ...styles.tableCell, width: '20%' }}>{formatDate(period.end)}</Text>
                      <Text style={{ ...styles.tableCell, width: '15%' }}>{period.days || 'N/A'}</Text>
                      <Text style={{ ...styles.tableCellBold, width: '20%', color: period.six_year_rule ? colors.teal : colors.amber }}>
                        {period.six_year_rule ? '6-Year Rule' : 'Taxable'}
                      </Text>
                    </View>
                  ))}
                  {vacantPeriods.map((period: any, idx: number) => (
                    <View key={`v-${idx}`} style={{ ...styles.tableRow, backgroundColor: colors.amberBg }}>
                      <Text style={{ ...styles.tableCellBold, width: '25%', color: colors.amber }}>Vacant</Text>
                      <Text style={{ ...styles.tableCell, width: '20%' }}>{formatDate(period.start)}</Text>
                      <Text style={{ ...styles.tableCell, width: '20%' }}>{formatDate(period.end)}</Text>
                      <Text style={{ ...styles.tableCell, width: '15%' }}>{period.days || 'N/A'}</Text>
                      <Text style={{ ...styles.tableCellBold, width: '20%', color: colors.amber }}>Taxable</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Six-Year Rule */}
            {(property.six_year_rule_applied !== undefined) && (
              <View style={{ ...styles.infoBox, backgroundColor: property.six_year_rule_applied ? colors.tealBg : colors.grayBg, borderColor: property.six_year_rule_applied ? colors.tealBorder : colors.grayBorder }} wrap={false}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.teal, marginRight: 6 }}>Six-Year Rule</Text>
                  <Text style={{
                    ...styles.badge,
                    backgroundColor: property.six_year_rule_applied ? colors.tealBg : colors.grayBg,
                    color: property.six_year_rule_applied ? colors.teal : colors.grayLight,
                    borderWidth: 1,
                    borderColor: property.six_year_rule_applied ? colors.tealBorder : colors.grayBorder,
                  }}>
                    {property.six_year_rule_applied ? 'APPLIED' : 'NOT APPLIED'}
                  </Text>
                </View>
                {property.six_year_reason && (
                  <Text style={{ fontSize: 8, color: colors.gray, lineHeight: 1.4 }}>{property.six_year_reason}</Text>
                )}
              </View>
            )}

            {/* Applicable Rules */}
            {applicableRules.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Applicable Tax Rules</Text>
                {applicableRules.map((rule, idx) => (
                  <View key={`rule-${idx}`} style={styles.ruleItem}>
                    <Text style={styles.bullet}>•</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 9, color: colors.primary, lineHeight: 1.4 }}>
                        <Text style={{ fontWeight: 'bold' }}>{rule.name}: </Text>
                        {rule.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <PageFooter pageLabel={`Property ${propIndex + 1} of ${totalProperties}`} />
          </Page>
        );
      })}

      {/* ================================================================== */}
      {/* SECTION C: SPECIAL RULES, VERIFICATION & AUDIT TRAIL               */}
      {/* ================================================================== */}
      <Page size="A4" style={styles.page} wrap>
        <SectionBanner title="Verification & Audit Trail" subtitle="Timeline quality, validation results, and source citations" />

        {/* ITAA Tax Law Sections */}
        {calculations?.method && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>ITAA Tax Law Sections Applied</Text>
            <View style={{ ...styles.infoBox, backgroundColor: colors.indigoBg, borderColor: colors.indigoBorder }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
                {calculations.method.split(',').map((section: string, idx: number) => (
                  <Text key={idx} style={{
                    ...styles.badge,
                    backgroundColor: '#e0e7ff',
                    color: colors.indigo,
                    marginRight: 4,
                    marginBottom: 4,
                    fontFamily: 'Courier',
                    fontSize: 8,
                  }}>
                    {section.trim()}
                  </Text>
                ))}
              </View>
              <Text style={{ fontSize: 8, color: colors.gray }}>
                These sections of the Income Tax Assessment Act 1997 (ITAA 1997) were applied in calculating your CGT.
              </Text>
            </View>
          </View>
        )}

        {/* Timeline Quality Assessment */}
        {verification?.timeline_analysis?.statistics && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>Timeline Quality Assessment</Text>
            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
              {verification.timeline_analysis.statistics.accounted_percentage !== undefined && (
                <MetricCard
                  label="Timeline Coverage"
                  value={`${verification.timeline_analysis.statistics.accounted_percentage.toFixed(2)}%`}
                  sub={verification.timeline_analysis.statistics.accounted_percentage >= 99 ? 'Excellent' : verification.timeline_analysis.statistics.accounted_percentage >= 95 ? 'Good' : 'Needs Review'}
                  bgColor={verification.timeline_analysis.statistics.accounted_percentage >= 99 ? colors.greenBg : colors.amberBg}
                  borderColor={verification.timeline_analysis.statistics.accounted_percentage >= 99 ? colors.greenBorder : colors.amberBorder}
                  textColor={verification.timeline_analysis.statistics.accounted_percentage >= 99 ? colors.green : colors.amber}
                />
              )}
              {verification.timeline_analysis.statistics.total_days !== undefined && (
                <MetricCard
                  label="Total Days"
                  value={verification.timeline_analysis.statistics.total_days.toLocaleString()}
                  sub="Ownership period"
                  bgColor={colors.primaryBg}
                  borderColor={colors.primaryBorder}
                  textColor={colors.primaryLight}
                />
              )}
              {verification.timeline_analysis.statistics.gap_days !== undefined && (
                <MetricCard
                  label="Gap Days"
                  value={verification.timeline_analysis.statistics.gap_days.toLocaleString()}
                  sub="Missing data"
                  bgColor={colors.amberBg}
                  borderColor={colors.amberBorder}
                  textColor={colors.amber}
                />
              )}
              {verification.timeline_analysis.statistics.overlap_days !== undefined && (
                <MetricCard
                  label="Overlap Days"
                  value={verification.timeline_analysis.statistics.overlap_days.toLocaleString()}
                  sub="Conflicts"
                  bgColor={colors.purpleBg}
                  borderColor={colors.purpleBorder}
                  textColor={colors.purple}
                />
              )}
            </View>
          </View>
        )}

        {/* Gap Analysis */}
        {verification?.timeline_analysis?.gaps && verification.timeline_analysis.gaps.length > 0 && (
          <View style={{ marginBottom: 12 }} wrap={false}>
            <Text style={styles.subsectionTitle}>Timeline Gaps</Text>
            <View style={styles.table}>
              <View style={{ ...styles.tableHeader, backgroundColor: colors.amberBg }}>
                <Text style={{ ...styles.tableHeaderCell, width: '30%', color: '#92400e' }}>Property</Text>
                <Text style={{ ...styles.tableHeaderCell, width: '20%', color: '#92400e' }}>Gap Start</Text>
                <Text style={{ ...styles.tableHeaderCell, width: '20%', color: '#92400e' }}>Gap End</Text>
                <Text style={{ ...styles.tableHeaderCell, width: '10%', color: '#92400e' }}>Days</Text>
                <Text style={{ ...styles.tableHeaderCell, width: '20%', color: '#92400e' }}>Description</Text>
              </View>
              {verification.timeline_analysis.gaps.map((gap: any, idx: number) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={{ ...styles.tableCell, width: '30%' }}>{gap.property_address || gap.property_id || 'Unknown'}</Text>
                  <Text style={{ ...styles.tableCell, width: '20%' }}>{gap.start ? formatDate(gap.start) : 'N/A'}</Text>
                  <Text style={{ ...styles.tableCell, width: '20%' }}>{gap.end ? formatDate(gap.end) : 'N/A'}</Text>
                  <Text style={{ ...styles.tableCellBold, width: '10%', color: colors.amber }}>{gap.days || gap.duration || 'N/A'}</Text>
                  <Text style={{ ...styles.tableCell, width: '20%', fontSize: 7 }}>{gap.description || gap.message || 'Gap detected'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Overlap Analysis */}
        {verification?.timeline_analysis?.overlaps && verification.timeline_analysis.overlaps.length > 0 && (
          <View style={{ marginBottom: 12 }} wrap={false}>
            <Text style={styles.subsectionTitle}>Timeline Overlaps</Text>
            <View style={styles.table}>
              <View style={{ ...styles.tableHeader, backgroundColor: colors.purpleBg }}>
                <Text style={{ ...styles.tableHeaderCell, width: '30%', color: colors.purple }}>Properties</Text>
                <Text style={{ ...styles.tableHeaderCell, width: '20%', color: colors.purple }}>Start</Text>
                <Text style={{ ...styles.tableHeaderCell, width: '20%', color: colors.purple }}>End</Text>
                <Text style={{ ...styles.tableHeaderCell, width: '10%', color: colors.purple }}>Days</Text>
                <Text style={{ ...styles.tableHeaderCell, width: '20%', color: colors.purple }}>Description</Text>
              </View>
              {verification.timeline_analysis.overlaps.map((overlap: any, idx: number) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={{ ...styles.tableCell, width: '30%' }}>
                    {overlap.properties
                      ? (Array.isArray(overlap.properties) ? overlap.properties.join(', ') : overlap.properties)
                      : (overlap.property_1 && overlap.property_2 ? `${overlap.property_1} & ${overlap.property_2}` : 'Multiple')}
                  </Text>
                  <Text style={{ ...styles.tableCell, width: '20%' }}>{overlap.start ? formatDate(overlap.start) : 'N/A'}</Text>
                  <Text style={{ ...styles.tableCell, width: '20%' }}>{overlap.end ? formatDate(overlap.end) : 'N/A'}</Text>
                  <Text style={{ ...styles.tableCellBold, width: '10%', color: colors.purple }}>{overlap.days || overlap.duration || 'N/A'}</Text>
                  <Text style={{ ...styles.tableCell, width: '20%', fontSize: 7 }}>{overlap.description || overlap.message || 'Overlap detected'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Validation Metrics */}
        {validation && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>Analysis Validation</Text>
            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
              {validation.citation_check && (
                <MetricCard
                  label="ATO Citations"
                  value={`${validation.citation_check.valid_citations || 0}/${validation.citation_check.total_citations || 0}`}
                  sub="Valid references"
                  bgColor={colors.greenBg}
                  borderColor={colors.greenBorder}
                  textColor={colors.green}
                />
              )}
              {validation.calculation_check && (
                <MetricCard
                  label="Calculations"
                  value={`${validation.calculation_check.calculations_verified || 0}/${validation.calculation_check.calculations_found || 0}`}
                  sub="Verified"
                  bgColor={colors.primaryBg}
                  borderColor={colors.primaryBorder}
                  textColor={colors.primaryLight}
                />
              )}
              {validation.logic_check && (
                <MetricCard
                  label="Completeness"
                  value={`${validation.logic_check.completeness_score || 0}%`}
                  sub="Data quality"
                  bgColor={colors.purpleBg}
                  borderColor={colors.purpleBorder}
                  textColor={colors.purple}
                />
              )}
              {validation.overall_confidence !== undefined && (
                <MetricCard
                  label="Confidence"
                  value={`${validation.overall_confidence}%`}
                  sub="Overall"
                  bgColor={colors.amberBg}
                  borderColor={colors.amberBorder}
                  textColor={colors.amber}
                />
              )}
            </View>

            {/* Logic Checks Passed */}
            {validation.logic_check?.checks_passed && validation.logic_check.checks_passed.length > 0 && (
              <View style={{ ...styles.infoBox, backgroundColor: colors.greenBg, borderColor: colors.greenBorder }}>
                <Text style={{ fontSize: 8, fontWeight: 'bold', color: colors.green, marginBottom: 4 }}>Validation Checks Passed</Text>
                {validation.logic_check.checks_passed.map((check: string, idx: number) => (
                  <Text key={idx} style={{ fontSize: 8, color: colors.greenDark, marginBottom: 2 }}>• {check}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ATO Source Citations */}
        {validation?.citation_check?.citation_details && validation.citation_check.citation_details.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>ATO Source Citations</Text>
            {validation.citation_check.citation_details.map((citation: any, idx: number) => (
              <View key={idx} style={{ ...styles.card, borderLeftWidth: 3, borderLeftColor: colors.emerald }} wrap={false}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ ...styles.badge, backgroundColor: colors.emerald, color: colors.white, marginRight: 4 }}>
                    {citation.rule_number || `CITATION ${idx + 1}`}
                  </Text>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: colors.emerald }}>{citation.source}</Text>
                  {citation.page && citation.page !== 'N/A' && (
                    <Text style={{ fontSize: 7, color: colors.grayLight, marginLeft: 4 }}>(Page {citation.page})</Text>
                  )}
                </View>
                <Text style={{ fontSize: 8, color: colors.gray, lineHeight: 1.4 }}>
                  {citation.source_text_preview || (citation.source_text ? citation.source_text.substring(0, 300) + '...' : '')}
                </Text>
                {citation.used_in_analysis && (
                  <Text style={{ fontSize: 7, color: colors.emerald, marginTop: 4, fontWeight: 'bold' }}>
                    Applied in: {citation.used_in_analysis}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Knowledge Base Rules */}
        {validation?.knowledge_base_rules && validation.knowledge_base_rules.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>Rules Applied</Text>
            {validation.knowledge_base_rules.map((rule: any, idx: number) => (
              <View key={idx} style={{ ...styles.infoBox, backgroundColor: colors.greenBg, borderColor: colors.greenBorder }} wrap={false}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ ...styles.badge, backgroundColor: '#dcfce7', color: colors.green, borderWidth: 1, borderColor: colors.greenBorder, marginRight: 4 }}>
                    {rule.rule_id || `RULE ${idx + 1}`}
                  </Text>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: colors.black }}>{rule.rule_title}</Text>
                </View>
                {rule.summary && (
                  <Text style={{ fontSize: 8, color: colors.gray, lineHeight: 1.4 }}>{rule.summary}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Recommendations */}
        {analysis?.recommendations && analysis.recommendations.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {analysis.recommendations.map((rec: any, idx: number) => {
              const recText = typeof rec === 'string' ? rec : rec.text || rec.recommendation || JSON.stringify(rec);
              return (
                <View key={idx} style={styles.ruleItem}>
                  <Text style={{ ...styles.bullet, color: colors.amber }}>•</Text>
                  <Text style={{ flex: 1, fontSize: 9, color: colors.gray, lineHeight: 1.4 }}>{recText}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Validation Warnings */}
        {validation?.warnings && validation.warnings.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.subsectionTitle}>Validation Warnings</Text>
            {validation.warnings.map((warning: string, idx: number) => (
              <View key={idx} style={{ ...styles.infoBox, backgroundColor: colors.redBg, borderColor: colors.redBorder, borderLeftWidth: 3, borderLeftColor: colors.red }}>
                <Text style={{ fontSize: 8, color: '#991b1b', lineHeight: 1.4 }}>{warning}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Verification Summary */}
        {verification?.llm_summary && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>Verification Summary</Text>
            <View style={{ ...styles.infoBox, backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }}>
              <Text style={{ fontSize: 8, color: colors.gray, lineHeight: 1.5 }}>{verification.llm_summary}</Text>
            </View>
          </View>
        )}

        {/* Portfolio Intelligence */}
        {analysis?.cross_property_intelligence && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>Portfolio Intelligence</Text>
            <View style={{ ...styles.infoBox, backgroundColor: colors.purpleBg, borderColor: colors.purpleBorder }}>
              <Text style={styles.bodyText}>{analysis.cross_property_intelligence}</Text>
            </View>
          </View>
        )}

        {/* Analysis Metadata */}
        {analysis?.metadata && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>Analysis Metadata</Text>
            <View style={{ flexDirection: 'row' }}>
              {analysis.metadata.llm_used && (
                <MetricCard
                  label="AI Model Used"
                  value={analysis.metadata.llm_used}
                  bgColor={colors.indigoBg}
                  borderColor={colors.indigoBorder}
                  textColor={colors.indigo}
                />
              )}
              {analysis.metadata.chunks_retrieved !== undefined && (
                <MetricCard
                  label="KB Chunks"
                  value={String(analysis.metadata.chunks_retrieved)}
                  sub="Retrieved"
                  bgColor={colors.tealBg}
                  borderColor={colors.tealBorder}
                  textColor={colors.teal}
                />
              )}
              {analysis.metadata.confidence !== undefined && (
                <MetricCard
                  label="Confidence"
                  value={`${analysis.metadata.confidence}%`}
                  sub="Model confidence"
                  bgColor={colors.cyanBg}
                  borderColor={colors.cyanBorder}
                  textColor={colors.cyan}
                />
              )}
              <View style={{ flex: 1 }} />
            </View>
          </View>
        )}

        {/* Analysis ID Footer */}
        <View style={styles.divider} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 8, color: colors.grayLighter }}>Analysis ID: {analysis_id || 'N/A'}</Text>
          <Text style={{ fontSize: 8, color: colors.grayLighter }}>Generated: {reportDate}</Text>
        </View>

        {/* Disclaimer */}
        <View style={{ ...styles.infoBox, backgroundColor: colors.grayBg, borderColor: colors.grayBorder, marginTop: 10 }}>
          <Text style={{ fontSize: 7, color: colors.grayLight, lineHeight: 1.4 }}>
            DISCLAIMER: This report is generated by an AI-powered analysis tool and is intended for informational purposes only. It does not constitute professional tax advice. Capital gains tax calculations involve complex rules and individual circumstances may vary. Always consult with a qualified tax professional or registered tax agent before making decisions based on this analysis. Tax Simple Australia and CGT Brain accept no liability for decisions made based on this report.
          </Text>
        </View>

        <PageFooter pageLabel="Verification & Audit" />
      </Page>
    </Document>
  );
};

export default SimplifiedCGTReportPDF;
