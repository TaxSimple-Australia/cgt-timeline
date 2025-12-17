'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { transformPropertyToReport } from '@/lib/transform-api-to-report';

// Create simplified styles matching the user's example
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },

  // Headers
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 12,
    marginTop: 20,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },

  // Portfolio Summary
  portfolioSummary: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 4,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  portfolioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1e3a8a',
  },
  portfolioGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  portfolioMetric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
  },

  // Property Header
  propertyHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginTop: 30,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
  },

  // Timeline Table
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#cbd5e1',
    padding: 8,
  },
  tableColDate: {
    width: '20%',
  },
  tableColEvent: {
    width: '25%',
  },
  tableColDetails: {
    width: '55%',
  },

  // Calculation Steps
  stepContainer: {
    marginBottom: 16,
    flexDirection: 'row',
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 1.8,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1e3a8a',
  },
  stepFormula: {
    fontSize: 9,
    color: '#475569',
    backgroundColor: '#f8fafc',
    padding: 6,
    borderRadius: 2,
    marginTop: 4,
    fontFamily: 'Courier',
  },
  stepResult: {
    fontSize: 10,
    marginTop: 4,
    color: '#1e40af',
  },

  // Rules Section
  ruleItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    width: 12,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  ruleText: {
    flex: 1,
    fontSize: 10,
    color: '#1e3a8a',
    lineHeight: 1.4,
  },
  ruleTitle: {
    fontWeight: 'bold',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },

  pageNumber: {
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'right',
    marginTop: 4,
  },
});

interface SimplifiedCGTReportPDFProps {
  response: any;
}

const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return '$0';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

export const SimplifiedCGTReportPDF: React.FC<SimplifiedCGTReportPDFProps> = ({ response }) => {
  const { properties: apiProperties, calculations, validation, analysis, timestamp, analysis_id } = response;

  // Calculate portfolio metrics
  const portfolioMetrics = {
    totalProperties: apiProperties?.length || 0,
    totalCapitalGain: 0,
    totalCGTPayable: 0,
    exemptProperties: 0
  };

  if (apiProperties && calculations?.per_property) {
    apiProperties.forEach((property: any) => {
      const calc = calculations.per_property.find(
        (c: any) =>
          c.property_id === property.property_id ||
          c.property_id === property.address ||
          c.property_address === property.address
      );

      if (calc) {
        portfolioMetrics.totalCapitalGain += calc.raw_capital_gain || 0;
        portfolioMetrics.totalCGTPayable += calc.net_capital_gain || 0;
      }

      if (property.exempt_percentage === 100 || property.exemption_type === 'full') {
        portfolioMetrics.exemptProperties += 1;
      }
    });
  }

  return (
    <Document>
      {/* Cover Page with Portfolio Summary */}
      <Page size="A4" style={styles.page}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 8 }}>
          CGT Analysis Report
        </Text>
        <Text style={{ fontSize: 10, color: '#64748b', marginBottom: 20 }}>
          Generated: {timestamp ? new Date(timestamp).toLocaleDateString('en-AU') : new Date().toLocaleDateString('en-AU')}
        </Text>
        <Text style={{ fontSize: 9, color: '#94a3b8', marginBottom: 30 }}>
          Analysis ID: {analysis_id || 'N/A'}
        </Text>

        {/* Portfolio Summary */}
        <View style={styles.portfolioSummary}>
          <Text style={styles.portfolioTitle}>Portfolio Summary</Text>
          <View style={styles.portfolioGrid}>
            <View style={styles.portfolioMetric}>
              <Text style={styles.metricLabel}>Total Properties</Text>
              <Text style={styles.metricValue}>{portfolioMetrics.totalProperties}</Text>
            </View>
            <View style={styles.portfolioMetric}>
              <Text style={styles.metricLabel}>Capital Gains</Text>
              <Text style={styles.metricValue}>{formatCurrency(portfolioMetrics.totalCapitalGain)}</Text>
            </View>
            <View style={styles.portfolioMetric}>
              <Text style={styles.metricLabel}>CGT Payable</Text>
              <Text style={styles.metricValue}>{formatCurrency(portfolioMetrics.totalCGTPayable)}</Text>
            </View>
            <View style={styles.portfolioMetric}>
              <Text style={styles.metricLabel}>Exempt Properties</Text>
              <Text style={styles.metricValue}>{portfolioMetrics.exemptProperties}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Generated with CGT Timeline | Tax Simple Australia</Text>
        </View>
      </Page>

      {/* Individual Property Pages */}
      {apiProperties && apiProperties.map((property: any, propIndex: number) => {
        const propertyCalc = calculations?.per_property?.find(
          (calc: any) =>
            calc.property_id === property.property_id ||
            calc.property_id === property.address ||
            calc.property_address === property.address
        );

        // Use transformation function to get consistent display data
        const transformResult = transformPropertyToReport(
          property,
          propertyCalc,
          validation
        );

        const { timelineEvents, calculationSteps, applicableRules } = transformResult.reportData;

        return (
          <Page key={propIndex} size="A4" style={styles.page}>
            {/* Property Header */}
            <Text style={styles.propertyHeader}>{property.address}</Text>

            {/* SECTION 1: Timeline of Events */}
            <Text style={styles.sectionTitle}>Timeline of Events</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableColDate}>Date</Text>
                <Text style={styles.tableColEvent}>Event</Text>
                <Text style={styles.tableColDetails}>Details</Text>
              </View>
              {timelineEvents.length > 0 ? timelineEvents.map((event, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={styles.tableColDate}>{formatDate(event.date)}</Text>
                  <Text style={styles.tableColEvent}>{event.event}</Text>
                  <Text style={styles.tableColDetails}>{event.details}</Text>
                </View>
              )) : (
                <View style={styles.tableRow}>
                  <Text style={{ ...styles.tableColDate, width: '100%', textAlign: 'center', fontStyle: 'italic', color: '#64748b' }}>
                    No timeline events available
                  </Text>
                </View>
              )}
            </View>

            {/* SECTION 2: CGT Calculation */}
            <Text style={styles.sectionTitle}>CGT Calculation</Text>
            {calculationSteps.map((step, idx) => {
              const cleanDescription = step.description?.replace(/\s*\([^)]*\)/g, '').trim() || '';
              return (
                <View key={idx} style={styles.stepContainer}>
                  <Text style={styles.stepNumber}>{step.step}</Text>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Step {step.step}: {cleanDescription}</Text>
                    {step.calculation && (
                      <Text style={styles.stepFormula}>{step.calculation}</Text>
                    )}
                    {step.result !== null && step.result !== undefined && (
                      <Text style={styles.stepResult}>
                        Result: {typeof step.result === 'number' ? formatCurrency(step.result) : step.result}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}

            {/* SECTION 3: Applicable Rules */}
            <Text style={styles.sectionTitle}>Applicable Rules</Text>
            {applicableRules.length > 0 ? applicableRules.map((rule, idx) => (
              <View key={`rule-${idx}`} style={styles.ruleItem}>
                <Text style={styles.bullet}>•</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ruleText}>
                    <Text style={styles.ruleTitle}>{rule.name}: </Text>
                    {rule.description}
                  </Text>
                </View>
              </View>
            )) : (
              <Text style={{ fontSize: 9, color: '#64748b', fontStyle: 'italic' }}>
                No specific tax law sections identified in this analysis.
              </Text>
            )}

            <View style={styles.footer}>
              <Text>Generated with CGT Timeline | Tax Simple Australia</Text>
              <Text style={styles.pageNumber}>Page {propIndex + 2}</Text>
            </View>
          </Page>
        );
      })}
    </Document>
  );
};

export default SimplifiedCGTReportPDF;
