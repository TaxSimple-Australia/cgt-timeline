'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, Link } from '@react-pdf/renderer';
import type { Property, TimelineEvent } from '@/store/timeline';

// Register fonts (optional - for better typography)
// Font.register({
//   family: 'Inter',
//   src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
// });

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },

  // Header
  header: {
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: '#2563eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },

  // Timeline Image
  timelineImageContainer: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#cbd5e1',
    borderRadius: 6,
  },
  timelineImage: {
    width: '100%',
    objectFit: 'contain',
    maxHeight: 220,
  },
  timelineImageLabel: {
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 4,
  },

  // Hero Summary Box
  heroBox: {
    backgroundColor: '#dbeafe',
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: '#3b82f6',
    borderRadius: 6,
    padding: 14,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 11,
    color: '#1e40af',
    marginBottom: 6,
    fontWeight: 'bold',
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  heroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  heroMetric: {
    flex: 1,
    padding: 6,
  },
  heroMetricLabel: {
    fontSize: 7,
    color: '#64748b',
    marginBottom: 3,
  },
  heroMetricValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
  },

  // Section Headers
  sectionHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#e2e8f0',
  },

  // Summary Box
  summaryBox: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#bfdbfe',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#334155',
  },

  // Property Cards
  propertyCard: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
    borderRadius: 6,
    marginBottom: 10,
    overflow: 'hidden',
  },
  propertyHeader: {
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#e2e8f0',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  propertyAddress: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
  },
  propertyBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
  },
  badgeSold: {
    backgroundColor: '#ddd6fe',
    color: '#5b21b6',
  },
  badgeOwned: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  badgeFull: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },
  badgePartial: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  badgeNone: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },

  propertyBody: {
    padding: 10,
  },

  subsectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#475569',
    marginTop: 8,
    marginBottom: 5,
  },
  subsectionText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#334155',
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftStyle: 'solid',
    borderLeftColor: '#3b82f6',
    marginBottom: 6,
  },

  impactBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#fde68a',
    borderRadius: 4,
    padding: 8,
    marginTop: 6,
  },
  impactText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#78350f',
  },

  // Calculations
  calculationsBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#bbf7d0',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  calcTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 6,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomStyle: 'solid',
    borderBottomColor: '#d1fae5',
  },
  calcLabel: {
    fontSize: 8,
    color: '#475569',
  },
  calcValue: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  calcTotal: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#16a34a',
  },

  // Calculation Steps
  stepCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#cbd5e1',
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 1.8,
    marginRight: 8,
  },
  stepDescription: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
  },
  stepFormula: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 4,
    marginLeft: 28,
  },
  stepSection: {
    fontSize: 7,
    color: '#94a3b8',
    marginTop: 2,
    marginLeft: 28,
  },

  // Recommendations
  recommendationsList: {
    marginTop: 6,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingLeft: 8,
  },
  recommendationBullet: {
    width: 14,
    fontSize: 10,
    color: '#f59e0b',
    marginRight: 6,
  },
  recommendationText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#334155',
    flex: 1,
  },

  // Validation Grid
  validationGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  validationCard: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
  },
  validationLabel: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 4,
  },
  validationValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  validationSubtext: {
    fontSize: 7,
    color: '#94a3b8',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
  },

  // Page Number
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 40,
    fontSize: 8,
    color: '#94a3b8',
  },

  // Flowchart Styles
  flowchartSection: {
    marginBottom: 16,
  },
  flowchartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  flowchartPropertyCard: {
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
  },
  flowchartPropertyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  flowchartPropertyName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  flowchartPropertyAddress: {
    fontSize: 8,
    color: '#dbeafe',
    marginTop: 2,
  },
  phaseContainer: {
    marginBottom: 10,
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  phaseLabel: {
    width: 90,
    textAlign: 'right',
    paddingTop: 8,
  },
  phaseBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 7,
    fontWeight: 'bold',
  },
  phaseArrow: {
    fontSize: 16,
    color: '#94a3b8',
    paddingTop: 6,
  },
  phaseContent: {
    flex: 1,
  },
  phaseBox: {
    borderRadius: 8,
    padding: 10,
    borderWidth: 2,
    borderStyle: 'solid',
  },
  phaseBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  phaseBoxTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phaseBoxDate: {
    fontSize: 7,
    color: '#64748b',
    marginTop: 2,
  },
  phaseBoxAmount: {
    textAlign: 'right',
  },
  phaseBoxAmountLabel: {
    fontSize: 7,
    color: '#64748b',
  },
  phaseBoxAmountValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  costBaseList: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    marginTop: 6,
  },
  costBaseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    fontSize: 7,
  },
  costBaseItemName: {
    color: '#64748b',
  },
  costBaseItemAmount: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  costBaseTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    fontSize: 8,
  },
  costBaseTotalLabel: {
    fontWeight: 'bold',
  },
  costBaseTotalValue: {
    fontWeight: 'bold',
  },
  improvementItem: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    marginBottom: 4,
  },
  improvementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  improvementDate: {
    fontSize: 7,
    color: '#64748b',
    marginBottom: 2,
  },
  improvementDesc: {
    fontSize: 8,
    color: '#1e293b',
  },
  improvementAmount: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  cgtResultBox: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
  },
  cgtResultGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  cgtResultItem: {
    alignItems: 'center',
  },
  cgtResultLabel: {
    fontSize: 7,
    color: '#dbeafe',
    marginBottom: 2,
  },
  cgtResultValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  cgtResultValueLarge: {
    fontSize: 16,
  },
  cgtResultFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  cgtResultFooterText: {
    fontSize: 7,
    color: '#dbeafe',
  },
});

interface CGTReportPDFProps {
  response: any;
  properties: Property[];
  events: TimelineEvent[];
  shareUrl?: string;
}

const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
};

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

const formatEventDate = (date: Date | undefined) => {
  if (!date) return 'N/A';
  try {
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

// Helper function to get property flowchart data
const getPropertyFlowData = (property: Property, events: TimelineEvent[]) => {
  const propertyEvents = events
    .filter((e) => e.propertyId === property.id)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const purchaseEvent = propertyEvents.find((e) => e.type === 'purchase');
  const saleEvent = propertyEvents.find((e) => e.type === 'sale');
  const moveInEvent = propertyEvents.find((e) => e.type === 'move_in');
  const moveOutEvent = propertyEvents.find((e) => e.type === 'move_out');
  const rentStartEvent = propertyEvents.find((e) => e.type === 'rent_start');
  const improvementEvents = propertyEvents.filter((e) => e.type === 'improvement');

  const purchasePrice = purchaseEvent?.amount || 0;
  const purchaseCosts = purchaseEvent?.costBases?.reduce((sum, cb) => sum + cb.amount, 0) || 0;
  const improvementCosts = improvementEvents.reduce(
    (sum, e) => sum + (e.amount || 0) + (e.costBases?.reduce((s, cb) => s + cb.amount, 0) || 0),
    0
  );
  const sellingCosts = saleEvent?.costBases?.reduce((sum, cb) => sum + cb.amount, 0) || 0;
  const totalCostBase = purchasePrice + purchaseCosts + improvementCosts + sellingCosts;
  const ownershipYears = saleEvent && purchaseEvent
    ? Math.round((saleEvent.date.getTime() - purchaseEvent.date.getTime()) / (1000 * 60 * 60 * 24 * 365))
    : 0;

  return {
    purchaseEvent,
    saleEvent,
    moveInEvent,
    moveOutEvent,
    rentStartEvent,
    improvementEvents,
    purchasePrice,
    purchaseCosts,
    improvementCosts,
    sellingCosts,
    totalCostBase,
    capitalGain: saleEvent ? (saleEvent.amount || 0) - totalCostBase : 0,
    ownershipYears,
  };
};

export const CGTReportPDF: React.FC<CGTReportPDFProps> = ({ response, properties: timelineProperties = [], events: timelineEvents = [], shareUrl }) => {
  const { summary, properties, analysis, calculations, validation, timestamp, analysis_id } = response;

  return (
    <Document>
      {/* Page 1: Cover & Summary */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Capital Gains Tax Analysis Report</Text>
          <Text style={styles.subtitle}>Analysis ID: {analysis_id}</Text>
          <Text style={styles.subtitle}>Generated: {formatDate(timestamp)}</Text>
        </View>

        {/* Share Link Banner */}
        {shareUrl && (
          <View style={{
            backgroundColor: '#eff6ff',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: '#bfdbfe',
            borderRadius: 6,
            padding: 10,
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 9, color: '#1e40af', marginRight: 4 }}>
              View Interactive Timeline:
            </Text>
            <Link src={shareUrl} style={{ fontSize: 9, color: '#2563eb', textDecoration: 'underline' }}>
              {shareUrl}
            </Link>
          </View>
        )}

        {/* Hero Summary */}
        <View style={styles.heroBox}>
          <Text style={styles.heroTitle}>Total CGT Liability</Text>
          <Text style={styles.heroAmount}>{formatCurrency(summary?.cgt_liability)}</Text>

          <View style={styles.heroGrid}>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricLabel}>Capital Gain</Text>
              <Text style={[styles.heroMetricValue, { color: summary?.total_capital_gain >= 0 ? '#16a34a' : '#dc2626' }]}>
                {summary?.total_capital_gain !== null ? formatCurrency(summary.total_capital_gain) : 'N/A'}
              </Text>
            </View>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricLabel}>Confidence</Text>
              <Text style={styles.heroMetricValue}>{summary?.confidence_score || 0}%</Text>
            </View>
            {summary?.exemption_percentage > 0 && (
              <View style={styles.heroMetric}>
                <Text style={styles.heroMetricLabel}>Avg Exemption</Text>
                <Text style={styles.heroMetricValue}>{summary.exemption_percentage.toFixed(1)}%</Text>
              </View>
            )}
          </View>
        </View>

        {/* Executive Summary */}
        {analysis?.summary && (
          <View>
            <Text style={styles.sectionHeader}>Executive Summary</Text>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>{analysis.summary}</Text>
            </View>
          </View>
        )}

        {/* Portfolio Intelligence */}
        {analysis?.cross_property_intelligence && (
          <View>
            <Text style={styles.sectionHeader}>Portfolio Intelligence</Text>
            <View style={[styles.summaryBox, { backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }]}>
              <Text style={styles.summaryText}>{analysis.cross_property_intelligence}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>CGT Brain AI Analysis - {analysis_id}</Text>
          <Text style={styles.footerText}>Executive Summary</Text>
        </View>
      </Page>

      {/* Property Analysis Pages - One page per property */}
      {properties && properties.length > 0 && properties.map((property: any, propIndex: number) => {
        const propCalc = calculations?.per_property?.find((c: any) => c.property_id === property.property_id);
        const propAnalysis = analysis?.per_property_analysis?.find((a: any) => a.property_address === property.address);

        return (
          <Page key={`property-${propIndex}`} size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Property Analysis</Text>
              <Text style={styles.subtitle}>{property.address}</Text>
            </View>

            {/* Property Card */}
            <View style={styles.propertyCard}>
              <View style={styles.propertyHeader}>
                <Text style={styles.propertyAddress}>{property.address}</Text>
                <View style={styles.propertyBadges}>
                  <Text style={[styles.badge, property.status === 'sold' ? styles.badgeSold : styles.badgeOwned]}>
                    {property.status?.toUpperCase()}
                  </Text>
                  {property.exemption_type && (
                    <Text style={[
                      styles.badge,
                      property.exemption_type === 'full' ? styles.badgeFull :
                      property.exemption_type === 'partial' ? styles.badgePartial :
                      styles.badgeNone
                    ]}>
                      {property.exemption_type === 'full' && 'FULL EXEMPTION'}
                      {property.exemption_type === 'partial' && `PARTIAL ${property.exempt_percentage?.toFixed(1)}%`}
                      {property.exemption_type === 'none' && 'NO EXEMPTION'}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.propertyBody}>
                {/* Transaction Details */}
                {property.purchase_price && property.sale_price && (
                  <View style={styles.calculationsBox}>
                    <Text style={styles.calcTitle}>Transaction Summary</Text>
                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>Purchase Price</Text>
                      <Text style={styles.calcValue}>{formatCurrency(property.purchase_price)}</Text>
                    </View>
                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>Sale Price</Text>
                      <Text style={styles.calcValue}>{formatCurrency(property.sale_price)}</Text>
                    </View>
                    <View style={[styles.calcRow, styles.calcTotal]}>
                      <Text style={[styles.calcLabel, { fontWeight: 'bold' }]}>Capital Change</Text>
                      <Text style={[styles.calcValue, {
                        color: property.capital_change >= 0 ? '#16a34a' : '#dc2626'
                      }]}>
                        {property.capital_change < 0 && '−'}{formatCurrency(property.capital_change)}
                      </Text>
                    </View>
                    {property.net_after_cgt_discount !== undefined && (
                      <View style={styles.calcRow}>
                        <Text style={[styles.calcLabel, { fontWeight: 'bold', color: '#1e40af' }]}>Net CGT Liability</Text>
                        <Text style={[styles.calcValue, { color: '#1e40af' }]}>
                          {formatCurrency(property.net_after_cgt_discount)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Reasoning */}
                {propAnalysis?.reasoning && (
                  <View>
                    <Text style={styles.subsectionTitle}>📝 Reasoning</Text>
                    <Text style={styles.subsectionText}>{propAnalysis.reasoning}</Text>
                  </View>
                )}

                {/* Cross-Property Impact */}
                {propAnalysis?.cross_property_impact && (
                  <View>
                    <Text style={styles.subsectionTitle}>🔗 Cross-Property Impact</Text>
                    <View style={styles.impactBox}>
                      <Text style={styles.impactText}>{propAnalysis.cross_property_impact}</Text>
                    </View>
                  </View>
                )}

                {/* Cost Base Breakdown */}
                {propCalc?.cost_base_breakdown && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.subsectionTitle}>Cost Base Breakdown</Text>
                    <View style={styles.calculationsBox}>
                      <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>Acquisition Cost</Text>
                        <Text style={styles.calcValue}>
                          {formatCurrency(propCalc.cost_base_breakdown.acquisition_cost)}
                        </Text>
                      </View>
                      <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>Incidental Costs (Acquire)</Text>
                        <Text style={styles.calcValue}>
                          {formatCurrency(propCalc.cost_base_breakdown.incidental_costs_acquire)}
                        </Text>
                      </View>
                      <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>Capital Improvements</Text>
                        <Text style={styles.calcValue}>
                          {formatCurrency(propCalc.cost_base_breakdown.capital_improvements)}
                        </Text>
                      </View>
                      <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>Disposal Costs</Text>
                        <Text style={styles.calcValue}>
                          {formatCurrency(propCalc.cost_base_breakdown.disposal_costs)}
                        </Text>
                      </View>
                      <View style={[styles.calcRow, styles.calcTotal]}>
                        <Text style={[styles.calcLabel, { fontWeight: 'bold' }]}>Total Cost Base</Text>
                        <Text style={[styles.calcValue, { fontWeight: 'bold' }]}>
                          {formatCurrency(propCalc.cost_base_breakdown.total_cost_base)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Main Residence Exemption - Summary */}
                {propCalc?.main_residence_exemption && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.subsectionTitle}>Main Residence Exemption</Text>
                    <View style={styles.calculationsBox}>
                      <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>Days as Main Residence</Text>
                        <Text style={styles.calcValue}>
                          {propCalc.main_residence_exemption.days_as_main_residence} days
                        </Text>
                      </View>
                      <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>Total Ownership Days</Text>
                        <Text style={styles.calcValue}>
                          {propCalc.main_residence_exemption.total_ownership_days} days
                        </Text>
                      </View>
                      <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>Exemption Percentage</Text>
                        <Text style={styles.calcValue}>
                          {propCalc.main_residence_exemption.exemption_percentage}%
                        </Text>
                      </View>
                      <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>Exempt Amount</Text>
                        <Text style={[styles.calcValue, { color: '#16a34a' }]}>
                          {formatCurrency(propCalc.main_residence_exemption.exempt_amount)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Main Residence Exemption - Detailed Calculation */}
                {propCalc?.main_residence_exemption && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.subsectionTitle}>Main Residence Exemption Calculation</Text>
                    <View style={styles.stepCard}>
                      <View style={styles.stepHeader}>
                        <Text style={styles.stepNumber}>1</Text>
                        <Text style={styles.stepDescription}>Calculate Exemption Percentage</Text>
                      </View>
                      <Text style={styles.stepFormula}>
                        ({propCalc.main_residence_exemption.days_as_main_residence} days ÷ {propCalc.main_residence_exemption.total_ownership_days} days) × 100 = {propCalc.main_residence_exemption.exemption_percentage}%
                      </Text>
                    </View>
                    <View style={styles.stepCard}>
                      <View style={styles.stepHeader}>
                        <Text style={styles.stepNumber}>2</Text>
                        <Text style={styles.stepDescription}>Calculate Exempt Amount</Text>
                      </View>
                      <Text style={styles.stepFormula}>
                        {formatCurrency(propCalc.raw_capital_gain)} × {propCalc.main_residence_exemption.exemption_percentage}% = {formatCurrency(propCalc.main_residence_exemption.exempt_amount)}
                      </Text>
                    </View>
                    <View style={styles.stepCard}>
                      <View style={styles.stepHeader}>
                        <Text style={styles.stepNumber}>3</Text>
                        <Text style={styles.stepDescription}>Calculate Taxable Amount (Before Discount)</Text>
                      </View>
                      <Text style={styles.stepFormula}>
                        {formatCurrency(propCalc.raw_capital_gain)} − {formatCurrency(propCalc.main_residence_exemption.exempt_amount)} = {formatCurrency(propCalc.main_residence_exemption.taxable_amount_before_discount)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* CGT Discount Calculation */}
                {propCalc?.cgt_discount && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.subsectionTitle}>CGT Discount Calculation</Text>
                    <View style={[styles.calculationsBox, { backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }]}>
                      <View style={styles.calcRow}>
                        <Text style={styles.calcLabel}>CGT Discount Eligible</Text>
                        <Text style={[styles.calcValue, {
                          color: propCalc.cgt_discount.eligible ? '#16a34a' : '#dc2626',
                          fontWeight: 'bold'
                        }]}>
                          {propCalc.cgt_discount.eligible ? 'YES' : 'NO'}
                        </Text>
                      </View>
                      {propCalc.cgt_discount.eligible && (
                        <>
                          <View style={styles.calcRow}>
                            <Text style={styles.calcLabel}>Discount Percentage</Text>
                            <Text style={styles.calcValue}>{propCalc.cgt_discount.discount_percentage}%</Text>
                          </View>
                          <View style={styles.calcRow}>
                            <Text style={styles.calcLabel}>Before Discount</Text>
                            <Text style={styles.calcValue}>
                              {formatCurrency(propCalc.cgt_discount.gain_before_discount)}
                            </Text>
                          </View>
                          <View style={[styles.calcRow, styles.calcTotal]}>
                            <Text style={[styles.calcLabel, { fontWeight: 'bold' }]}>After Discount</Text>
                            <Text style={[styles.calcValue, { fontWeight: 'bold', color: '#7c3aed' }]}>
                              {formatCurrency(propCalc.cgt_discount.discounted_gain)}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                    {propCalc.cgt_discount.eligible && (
                      <View style={[styles.stepCard, { marginTop: 8 }]}>
                        <View style={styles.stepHeader}>
                          <Text style={styles.stepNumber}>1</Text>
                          <Text style={styles.stepDescription}>Apply 50% CGT Discount</Text>
                        </View>
                        <Text style={styles.stepFormula}>
                          {formatCurrency(propCalc.cgt_discount.gain_before_discount)} × {propCalc.cgt_discount.discount_percentage}% = {formatCurrency(propCalc.cgt_discount.discounted_gain)}
                        </Text>
                      </View>
                    )}
                    {propCalc.cgt_discount.eligible && (
                      <View style={[styles.calculationsBox, { marginTop: 8, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                        <Text style={[styles.calcTitle, { fontSize: 8, marginBottom: 4 }]}>You Save</Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#16a34a', textAlign: 'center' }}>
                          {formatCurrency(propCalc.cgt_discount.gain_before_discount - propCalc.cgt_discount.discounted_gain)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Final Net Capital Gain */}
                {propCalc?.net_capital_gain !== undefined && (
                  <View style={{ marginTop: 12 }}>
                    <View style={[styles.calculationsBox, {
                      backgroundColor: '#dbeafe',
                      borderColor: '#3b82f6',
                      borderWidth: 2,
                      padding: 10
                    }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                          <Text style={[styles.calcTitle, { color: '#1e40af', marginBottom: 2 }]}>
                            Final Net Capital Gain
                          </Text>
                          <Text style={{ fontSize: 7, color: '#64748b' }}>
                            (After exemptions and discount)
                          </Text>
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e40af' }}>
                          {formatCurrency(propCalc.net_capital_gain)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Calculation Steps */}
                {propCalc?.calculation_steps && propCalc.calculation_steps.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.subsectionTitle}>Calculation Steps</Text>
                    {propCalc.calculation_steps.map((step: any, stepIndex: number) => (
                      <View key={stepIndex} style={styles.stepCard}>
                        <View style={styles.stepHeader}>
                          <Text style={styles.stepNumber}>{step.step}</Text>
                          <Text style={styles.stepDescription}>{step.description}</Text>
                        </View>
                        <Text style={styles.stepFormula}>{step.calculation}</Text>
                        <Text style={styles.stepSection}>{step.section}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Property Analysis - {property.address}</Text>
              <Text style={styles.footerText}>Property {propIndex + 1} of {properties.length}</Text>
            </View>
          </Page>
        );
      })}

      {/* Recommendations & Validation Page */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Recommendations & Validation</Text>
          <Text style={styles.subtitle}>Analysis ID: {analysis_id}</Text>
        </View>

        {/* Recommendations */}
        {analysis?.recommendations && analysis.recommendations.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionHeader}>💡 Recommendations</Text>
            <View style={styles.recommendationsList}>
              {analysis.recommendations.map((rec: string, index: number) => (
                <View key={index} style={styles.recommendationItem}>
                  <Text style={styles.recommendationBullet}>✓</Text>
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Validation Summary */}
        {validation && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionHeader}>Analysis Validation</Text>
            <View style={styles.validationGrid}>
              {validation.citation_check && (
                <View style={[styles.validationCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                  <Text style={styles.validationLabel}>ATO Citations</Text>
                  <Text style={[styles.validationValue, { color: '#16a34a' }]}>
                    {validation.citation_check.valid_citations}/{validation.citation_check.total_citations}
                  </Text>
                  <Text style={styles.validationSubtext}>Valid references</Text>
                </View>
              )}
              {validation.calculation_check && (
                <View style={[styles.validationCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                  <Text style={styles.validationLabel}>Calculations</Text>
                  <Text style={[styles.validationValue, { color: '#1e40af' }]}>
                    {validation.calculation_check.calculations_verified}/{validation.calculation_check.calculations_found}
                  </Text>
                  <Text style={styles.validationSubtext}>Verified</Text>
                </View>
              )}
            </View>
            <View style={[styles.validationGrid, { marginTop: 10 }]}>
              {validation.logic_check && (
                <View style={[styles.validationCard, { backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }]}>
                  <Text style={styles.validationLabel}>Completeness</Text>
                  <Text style={[styles.validationValue, { color: '#7c3aed' }]}>
                    {validation.logic_check.completeness_score}%
                  </Text>
                  <Text style={styles.validationSubtext}>Data quality</Text>
                </View>
              )}
              {validation.overall_confidence !== undefined && (
                <View style={[styles.validationCard, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
                  <Text style={styles.validationLabel}>Confidence</Text>
                  <Text style={[styles.validationValue, { color: '#d97706' }]}>
                    {validation.overall_confidence}%
                  </Text>
                  <Text style={styles.validationSubtext}>Overall</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Disclaimer */}
        <View style={{ marginTop: 30, padding: 15, backgroundColor: '#fef3c7', borderRadius: 6 }}>
          <Text style={{ fontSize: 8, color: '#78350f', lineHeight: 1.5 }}>
            <Text style={{ fontWeight: 'bold' }}>Disclaimer:</Text> This report is generated by CGT Brain AI and is intended for informational purposes only.
            It should not be considered as professional tax advice. Please consult with a qualified tax professional or accountant
            before making any decisions based on this analysis. The calculations are based on the information provided and current ATO guidelines.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>CGT Brain AI Analysis - {analysis_id}</Text>
          <Text style={styles.footerText}>Recommendations & Validation</Text>
        </View>
      </Page>

      {/* Flowchart Pages - One page per property */}
      {timelineProperties && timelineProperties.length > 0 && timelineProperties.map((property, index) => {
        if (!property || !property.id) return null;

        const flowData = getPropertyFlowData(property, timelineEvents || []);

        // Only render flowchart if property has purchase event
        if (!flowData.purchaseEvent) return null;

        return (
          <Page key={`flowchart-${property.id}`} size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Property Lifecycle Flowchart</Text>
              <Text style={styles.subtitle}>{property.name}</Text>
            </View>

            <View style={styles.flowchartSection}>
              {/* Property Header */}
              <View style={styles.flowchartPropertyCard}>
                <View style={styles.flowchartPropertyHeader}>
                  <View>
                    <Text style={styles.flowchartPropertyName}>{property.name}</Text>
                    <Text style={styles.flowchartPropertyAddress}>{property.address}</Text>
                  </View>
                </View>

                {/* 1. Acquisition Phase */}
                <View style={styles.phaseContainer}>
                  <View style={styles.phaseRow}>
                    <View style={styles.phaseLabel}>
                      <View style={[styles.phaseBadge, { backgroundColor: '#d1fae5', color: '#065f46' }]}>
                        <Text>ACQUISITION</Text>
                      </View>
                    </View>
                    <Text style={styles.phaseArrow}>→</Text>
                    <View style={styles.phaseContent}>
                      <View style={[styles.phaseBox, { backgroundColor: '#f0fdf4', borderColor: '#22c55e' }]}>
                        <View style={styles.phaseBoxHeader}>
                          <View>
                            <Text style={[styles.phaseBoxTitle, { color: '#166534' }]}>Purchase</Text>
                            <Text style={styles.phaseBoxDate}>{formatEventDate(flowData.purchaseEvent.date)}</Text>
                          </View>
                          <View style={styles.phaseBoxAmount}>
                            <Text style={styles.phaseBoxAmountLabel}>Purchase Price</Text>
                            <Text style={[styles.phaseBoxAmountValue, { color: '#16a34a' }]}>
                              {formatCurrency(flowData.purchasePrice)}
                            </Text>
                          </View>
                        </View>

                        {flowData.purchaseCosts > 0 && flowData.purchaseEvent.costBases && (
                          <View style={[styles.costBaseList, { borderColor: '#bbf7d0' }]}>
                            {flowData.purchaseEvent.costBases.map((cb) => (
                              <View key={cb.id} style={styles.costBaseItem}>
                                <Text style={styles.costBaseItemName}>{cb.name}:</Text>
                                <Text style={styles.costBaseItemAmount}>{formatCurrency(cb.amount)}</Text>
                              </View>
                            ))}
                            <View style={[styles.costBaseTotal, { borderColor: '#22c55e' }]}>
                              <Text style={[styles.costBaseTotalLabel, { color: '#166534' }]}>
                                Total Acquisition Cost:
                              </Text>
                              <Text style={[styles.costBaseTotalValue, { color: '#16a34a' }]}>
                                {formatCurrency(flowData.purchasePrice + flowData.purchaseCosts)}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </View>

                {/* 2. Occupancy Phase */}
                {(flowData.moveInEvent || flowData.rentStartEvent) && (
                  <View style={styles.phaseContainer}>
                    <View style={styles.phaseRow}>
                      <View style={styles.phaseLabel}>
                        <View style={[styles.phaseBadge, { backgroundColor: '#dbeafe', color: '#1e40af' }]}>
                          <Text>OCCUPANCY</Text>
                        </View>
                      </View>
                      <Text style={styles.phaseArrow}>→</Text>
                      <View style={styles.phaseContent}>
                        {flowData.moveInEvent && (
                          <View style={[styles.phaseBox, { backgroundColor: '#eff6ff', borderColor: '#3b82f6', marginBottom: 6 }]}>
                            <View style={styles.phaseBoxHeader}>
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.phaseBoxTitle, { color: '#1e40af' }]}>Main Residence (PPR)</Text>
                                <Text style={styles.phaseBoxDate}>
                                  {formatEventDate(flowData.moveInEvent.date)} - {flowData.moveOutEvent ? formatEventDate(flowData.moveOutEvent.date) : 'Present'}
                                </Text>
                              </View>
                              <View style={{ backgroundColor: '#3b82f6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                                <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#ffffff' }}>CGT Exempt</Text>
                              </View>
                            </View>
                          </View>
                        )}
                        {flowData.rentStartEvent && (
                          <View style={[styles.phaseBox, { backgroundColor: '#faf5ff', borderColor: '#a855f7' }]}>
                            <View style={styles.phaseBoxHeader}>
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.phaseBoxTitle, { color: '#7c3aed' }]}>Rental Property</Text>
                                <Text style={styles.phaseBoxDate}>
                                  {formatEventDate(flowData.rentStartEvent.date)} - Present
                                </Text>
                              </View>
                              <View style={{ backgroundColor: '#a855f7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                                <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#ffffff' }}>CGT Applies</Text>
                              </View>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                )}

                {/* 3. Improvements Phase */}
                {flowData.improvementEvents.length > 0 && (
                  <View style={styles.phaseContainer}>
                    <View style={styles.phaseRow}>
                      <View style={styles.phaseLabel}>
                        <View style={[styles.phaseBadge, { backgroundColor: '#fce7f3', color: '#9f1239' }]}>
                          <Text>IMPROVEMENTS</Text>
                        </View>
                      </View>
                      <Text style={styles.phaseArrow}>→</Text>
                      <View style={styles.phaseContent}>
                        <View style={[styles.phaseBox, { backgroundColor: '#fdf2f8', borderColor: '#ec4899' }]}>
                          <Text style={[styles.phaseBoxTitle, { color: '#9f1239', marginBottom: 6 }]}>
                            Capital Improvements ({flowData.improvementEvents.length})
                          </Text>
                          {flowData.improvementEvents.map((imp) => (
                            <View key={imp.id} style={[styles.improvementItem, { borderColor: '#fbcfe8' }]}>
                              <View style={styles.improvementHeader}>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.improvementDate}>{formatEventDate(imp.date)}</Text>
                                  <Text style={styles.improvementDesc}>{imp.description || 'Capital improvement'}</Text>
                                </View>
                                <Text style={[styles.improvementAmount, { color: '#ec4899' }]}>
                                  {formatCurrency(imp.amount || 0)}
                                </Text>
                              </View>
                            </View>
                          ))}
                          <View style={[styles.costBaseTotal, { borderColor: '#ec4899' }]}>
                            <Text style={[styles.costBaseTotalLabel, { color: '#9f1239' }]}>
                              Total Improvements:
                            </Text>
                            <Text style={[styles.costBaseTotalValue, { color: '#ec4899' }]}>
                              {formatCurrency(flowData.improvementCosts)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* 4. Disposition Phase */}
                {flowData.saleEvent && (
                  <View style={styles.phaseContainer}>
                    <View style={styles.phaseRow}>
                      <View style={styles.phaseLabel}>
                        <View style={[styles.phaseBadge, { backgroundColor: '#fee2e2', color: '#991b1b' }]}>
                          <Text>DISPOSITION</Text>
                        </View>
                      </View>
                      <Text style={styles.phaseArrow}>→</Text>
                      <View style={styles.phaseContent}>
                        <View style={[styles.phaseBox, { backgroundColor: '#fef2f2', borderColor: '#ef4444' }]}>
                          <View style={styles.phaseBoxHeader}>
                            <View>
                              <Text style={[styles.phaseBoxTitle, { color: '#991b1b' }]}>Sale</Text>
                              <Text style={styles.phaseBoxDate}>{formatEventDate(flowData.saleEvent.date)}</Text>
                            </View>
                            <View style={styles.phaseBoxAmount}>
                              <Text style={styles.phaseBoxAmountLabel}>Sale Price</Text>
                              <Text style={[styles.phaseBoxAmountValue, { color: '#ef4444' }]}>
                                {formatCurrency(flowData.saleEvent.amount || 0)}
                              </Text>
                            </View>
                          </View>

                          {flowData.sellingCosts > 0 && flowData.saleEvent.costBases && (
                            <View style={[styles.costBaseList, { borderColor: '#fecaca' }]}>
                              {flowData.saleEvent.costBases.map((cb) => (
                                <View key={cb.id} style={styles.costBaseItem}>
                                  <Text style={styles.costBaseItemName}>{cb.name}:</Text>
                                  <Text style={styles.costBaseItemAmount}>{formatCurrency(cb.amount)}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {/* 5. CGT Result */}
                {flowData.saleEvent && (
                  <View style={styles.phaseContainer}>
                    <View style={styles.phaseRow}>
                      <View style={styles.phaseLabel}>
                        <View style={[styles.phaseBadge, { backgroundColor: '#ddd6fe', color: '#5b21b6' }]}>
                          <Text>CGT RESULT</Text>
                        </View>
                      </View>
                      <Text style={styles.phaseArrow}>▶</Text>
                      <View style={styles.phaseContent}>
                        <View style={styles.cgtResultBox}>
                          <View style={styles.cgtResultGrid}>
                            <View style={styles.cgtResultItem}>
                              <Text style={styles.cgtResultLabel}>Total Cost Base</Text>
                              <Text style={styles.cgtResultValue}>{formatCurrency(flowData.totalCostBase)}</Text>
                            </View>
                            <View style={styles.cgtResultItem}>
                              <Text style={styles.cgtResultLabel}>Sale Proceeds</Text>
                              <Text style={styles.cgtResultValue}>{formatCurrency(flowData.saleEvent.amount || 0)}</Text>
                            </View>
                            <View style={styles.cgtResultItem}>
                              <Text style={styles.cgtResultLabel}>Capital Gain</Text>
                              <Text style={[styles.cgtResultValue, styles.cgtResultValueLarge]}>
                                {formatCurrency(flowData.capitalGain)}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.cgtResultFooter}>
                            <Text style={styles.cgtResultFooterText}>
                              Ownership Period: {flowData.ownershipYears} years
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Property Lifecycle Flowchart - {property.name}</Text>
              <Text style={styles.footerText}>Property {index + 1} of {timelineProperties.length}</Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};
