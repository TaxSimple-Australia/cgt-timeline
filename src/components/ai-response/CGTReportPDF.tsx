'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

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
    borderBottom: '2 solid #2563eb',
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
    border: '1 solid #cbd5e1',
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
    border: '2 solid #3b82f6',
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
    borderBottom: '1 solid #e2e8f0',
  },

  // Summary Box
  summaryBox: {
    backgroundColor: '#f0f9ff',
    border: '1 solid #bfdbfe',
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
    border: '1 solid #e2e8f0',
    borderRadius: 6,
    marginBottom: 10,
    overflow: 'hidden',
  },
  propertyHeader: {
    backgroundColor: '#f8fafc',
    borderBottom: '1 solid #e2e8f0',
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
    borderLeft: '2 solid #3b82f6',
    marginBottom: 6,
  },

  impactBox: {
    backgroundColor: '#fffbeb',
    border: '1 solid #fde68a',
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
    border: '1 solid #bbf7d0',
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
    borderBottom: '0.5 solid #d1fae5',
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
    borderTop: '1 solid #16a34a',
  },

  // Calculation Steps
  stepCard: {
    backgroundColor: '#f8fafc',
    border: '1 solid #cbd5e1',
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
    border: '1 solid #e2e8f0',
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
    borderTop: '1 solid #e2e8f0',
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
});

interface CGTReportPDFProps {
  response: any;
  timelineImage?: string | null;
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

export const CGTReportPDF: React.FC<CGTReportPDFProps> = ({ response, timelineImage }) => {
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

        {/* Timeline Snapshot */}
        {timelineImage && (
          <View style={styles.timelineImageContainer}>
            <Text style={styles.timelineImageLabel}>Property Timeline Overview</Text>
            <Image src={timelineImage} style={styles.timelineImage} />
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
          <Text style={styles.footerText}>CGT Brain AI Analysis</Text>
          <Text style={styles.footerText}>Page 1</Text>
        </View>
      </Page>

      {/* Page 2+: Property Analysis */}
      {properties && properties.map((property: any, propIndex: number) => {
        const propCalc = calculations?.per_property?.find((c: any) => c.property_id === property.property_id);
        const propAnalysis = analysis?.per_property_analysis?.find((a: any) => a.property_address === property.address);

        return (
          <Page key={propIndex} size="A4" style={styles.page}>
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

                {/* Main Residence Exemption */}
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
              <Text style={styles.footerText}>Property {propIndex + 1} of {properties.length}</Text>
              <Text style={styles.footerText}>Page {propIndex + 2}</Text>
            </View>
          </Page>
        );
      })}

      {/* Final Page: Recommendations & Validation */}
      <Page size="A4" style={styles.page}>
        {/* Recommendations */}
        {analysis?.recommendations && analysis.recommendations.length > 0 && (
          <View>
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
          <Text style={styles.footerText}>Final Page</Text>
        </View>
      </Page>
    </Document>
  );
};
