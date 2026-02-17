'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, Link } from '@react-pdf/renderer';
import type { Property, TimelineEvent } from '@/store/timeline';
import {
  calculatePurchaseIncidentalCosts,
  calculateImprovementCosts,
  calculateSellingCosts,
  calculateCapitalGain,
  getPurchasePrice,
  getSalePrice,
  getImprovementAmount,
  getDivision43Deductions,
} from '@/lib/cost-base-calculations';

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

  // Professional Report Styles
  scenarioTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  scenarioDescription: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#475569',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#e2e8f0',
  },

  // Key Facts Section
  keyFactsSection: {
    marginBottom: 16,
  },
  keyFactsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  keyFactsList: {
    paddingLeft: 8,
  },
  keyFactItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  keyFactBullet: {
    width: 12,
    fontSize: 10,
    color: '#3b82f6',
  },
  keyFactLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#334155',
    width: 140,
  },
  keyFactValue: {
    fontSize: 9,
    color: '#1e293b',
    flex: 1,
  },

  // Timeline Events Table
  timelineTableSection: {
    marginBottom: 16,
  },
  timelineTableTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  timelineTable: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
  },
  timelineTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#e2e8f0',
  },
  timelineTableHeaderCell: {
    padding: 8,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#475569',
  },
  timelineTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#f1f5f9',
  },
  timelineTableCell: {
    padding: 8,
    fontSize: 9,
    color: '#1e293b',
  },
  timelineTableCellDate: {
    width: 80,
  },
  timelineTableCellEvent: {
    width: 90,
  },
  timelineTableCellDetails: {
    flex: 1,
  },

  // CGT Calculation Section
  cgtCalcSection: {
    marginBottom: 16,
  },
  cgtCalcTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  cgtCalcStep: {
    marginBottom: 12,
  },
  cgtCalcStepTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 6,
  },
  cgtCalcStepContent: {
    paddingLeft: 12,
  },
  cgtCalcLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    paddingRight: 20,
  },
  cgtCalcLineLabel: {
    fontSize: 9,
    color: '#475569',
  },
  cgtCalcLineValue: {
    fontSize: 9,
    color: '#1e293b',
    textAlign: 'right',
    width: 100,
  },
  cgtCalcDivider: {
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#cbd5e1',
    marginVertical: 4,
    marginRight: 20,
  },
  cgtCalcTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingRight: 20,
  },
  cgtCalcTotalLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  cgtCalcTotalValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'right',
    width: 100,
  },
  cgtCalcFormula: {
    fontSize: 9,
    color: '#475569',
    marginTop: 6,
    marginLeft: 12,
  },

  // Result Box
  resultBox: {
    backgroundColor: '#1e40af',
    borderRadius: 6,
    padding: 12,
    marginVertical: 12,
  },
  resultText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  resultSubtext: {
    fontSize: 10,
    color: '#dbeafe',
    textAlign: 'center',
    marginTop: 4,
  },

  // Applicable Rules Section
  rulesSection: {
    marginTop: 16,
  },
  rulesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  rulesList: {
    paddingLeft: 8,
  },
  ruleItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  ruleBullet: {
    width: 12,
    fontSize: 10,
    color: '#16a34a',
  },
  ruleText: {
    fontSize: 9,
    color: '#334155',
    flex: 1,
    lineHeight: 1.4,
  },

  // ============================================
  // Timeline Bar + Two-Column Summary Styles
  // ============================================

  // Page Header for Visualization
  vizPageHeader: {
    marginBottom: 16,
  },
  vizPageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4,
  },
  vizPageSubtitle: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },

  // Property Container
  vizPropertyCard: {
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },

  // Property Header
  vizPropertyHeader: {
    backgroundColor: '#3b82f6',
    padding: 12,
  },
  vizPropertyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  vizPropertyAddress: {
    fontSize: 9,
    color: '#dbeafe',
    marginTop: 2,
  },

  // Summary Boxes Row
  vizSummaryRow: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: '#e2e8f0',
  },
  vizSummaryBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 4,
    padding: 8,
    marginHorizontal: 3,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
  },
  vizSummaryLabel: {
    fontSize: 7,
    color: '#64748b',
    marginBottom: 2,
  },
  vizSummaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  vizSummarySubtext: {
    fontSize: 7,
    color: '#94a3b8',
    marginTop: 2,
  },

  // Timeline Bar Section
  vizTimelineSection: {
    padding: 12,
    backgroundColor: '#ffffff',
  },
  vizTimelineScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  vizTimelineScaleText: {
    fontSize: 7,
    color: '#64748b',
  },
  vizTimelineBarsContainer: {
    height: 50,
    position: 'relative',
    marginBottom: 8,
  },
  vizOwnershipBar: {
    position: 'absolute',
    top: 0,
    height: 18,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
  },
  vizOwnershipLabel: {
    fontSize: 7,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 2.2,
  },
  vizPeriodBar: {
    position: 'absolute',
    top: 22,
    height: 14,
    borderRadius: 3,
  },
  vizPeriodLabel: {
    fontSize: 6,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 2,
  },
  vizPeriodPPR: {
    backgroundColor: '#3b82f6',
  },
  vizPeriodRental: {
    backgroundColor: '#8b5cf6',
  },

  // Legend
  vizLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  vizLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  vizLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    marginRight: 4,
  },
  vizLegendText: {
    fontSize: 7,
    color: '#64748b',
  },

  // Two-Column Layout
  vizTwoColumnContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#e2e8f0',
  },
  vizLeftColumn: {
    flex: 1,
    padding: 12,
    borderRightWidth: 1,
    borderRightStyle: 'solid',
    borderRightColor: '#e2e8f0',
  },
  vizRightColumn: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8fafc',
  },
  vizColumnTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  // Timeline Events List
  vizEventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  vizEventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 3,
    marginRight: 8,
  },
  vizEventContent: {
    flex: 1,
  },
  vizEventType: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  vizEventDate: {
    fontSize: 7,
    color: '#64748b',
  },
  vizEventAmount: {
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 2,
  },

  // Cost Base Elements
  vizCostElement: {
    backgroundColor: '#ffffff',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e2e8f0',
  },
  vizCostElementHeader: {
    fontSize: 7,
    color: '#64748b',
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  vizCostLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  vizCostLabel: {
    fontSize: 8,
    color: '#475569',
  },
  vizCostValue: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  vizCostSubtotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#e2e8f0',
  },
  vizCostSubtotalLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#475569',
  },
  vizCostSubtotalValue: {
    fontSize: 8,
    fontWeight: 'bold',
  },

  // Total Summary Footer
  vizTotalFooter: {
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#e2e8f0',
  },
  vizTotalGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  vizTotalItem: {
    alignItems: 'center',
  },
  vizTotalLabel: {
    fontSize: 7,
    color: '#64748b',
    marginBottom: 2,
  },
  vizTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Occupancy Summary
  vizOccupancySection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: '#e2e8f0',
  },
  vizOccupancyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vizOccupancyDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
    marginRight: 6,
  },
  vizOccupancyLabel: {
    fontSize: 7,
    color: '#64748b',
    marginRight: 4,
  },
  vizOccupancyValue: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#1e293b',
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

  // Use shared utility functions for consistent price extraction
  // These check both event.amount AND costBases arrays
  const purchasePrice = getPurchasePrice(purchaseEvent);
  const purchaseCosts = calculatePurchaseIncidentalCosts(purchaseEvent);
  const improvementCosts = calculateImprovementCosts(improvementEvents);
  const sellingCosts = calculateSellingCosts(saleEvent);
  const salePrice = getSalePrice(saleEvent);

  const div43Deductions = getDivision43Deductions(saleEvent);
  const totalCostBase = purchasePrice + purchaseCosts + improvementCosts + sellingCosts - div43Deductions;
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
    div43Deductions,
    totalCostBase,
    capitalGain: saleEvent ? salePrice - totalCostBase : 0,
    ownershipYears,
    salePrice,
  };
};

// Helper to format date for display in tables (shorter format)
const formatShortDate = (date: Date | string | undefined) => {
  if (!date) return 'N/A';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

// Helper to get event type display name
const getEventTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    purchase: 'Purchase',
    sale: 'Sale',
    move_in: 'Move In',
    move_out: 'Move Out',
    rent_start: 'Rent Start',
    rent_end: 'Rent End',
    improvement: 'Improvement',
  };
  return labels[type] || type;
};

// Helper to get event details for timeline table
const getEventDetails = (event: TimelineEvent): string => {
  const parts: string[] = [];

  // Get the main amount using the appropriate utility function
  // This checks both event.amount AND costBases for the price
  let mainAmount = 0;
  if (event.type === 'purchase') {
    mainAmount = getPurchasePrice(event);
  } else if (event.type === 'sale') {
    mainAmount = getSalePrice(event);
  } else if (event.type === 'improvement') {
    mainAmount = getImprovementAmount(event);
  } else if (event.amount) {
    mainAmount = event.amount;
  }

  if (mainAmount > 0) {
    parts.push(formatCurrency(mainAmount));
  }

  // Show incidental cost details (excluding main transaction amounts)
  if (event.costBases && event.costBases.length > 0) {
    const excludeFromDisplay = ['purchase_price', 'land_price', 'building_price', 'sale_price'];
    const costDetails = event.costBases
      .filter(cb => cb.amount > 0 && !excludeFromDisplay.includes(cb.definitionId))
      .map(cb => `${cb.name}: ${formatCurrency(cb.amount)}`)
      .join(', ');
    if (costDetails) {
      if (event.type === 'purchase') {
        parts.push(`+ ${costDetails}`);
      } else if (event.type === 'sale') {
        parts.push(`(${costDetails})`);
      } else {
        parts.push(costDetails);
      }
    }
  }

  if (event.description) {
    parts.push(event.description);
  }

  // Add special notes based on event type
  if (event.type === 'move_in') {
    parts.push('Established as main residence');
  } else if (event.type === 'rent_start') {
    parts.push('Tenant moves in');
  } else if (event.type === 'move_out') {
    parts.push('Ceased as main residence');
  }

  return parts.join(' ') || '-';
};

// Calculate days between two dates
const calculateDays = (start: Date, end: Date): number => {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

// Format days as years and months
const formatDuration = (days: number): string => {
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
  return parts.length > 0 ? parts.join(', ') : '< 1 month';
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

      {/* Property Analysis Pages - Professional Layout - Using AI Response Data */}
      {properties && properties.length > 0 && properties.map((property: any, propIndex: number) => {
        // Get AI calculation data for this property - try multiple matching strategies
        const propCalc = calculations?.per_property?.find((c: any) =>
          c.property_id === property.property_id ||
          c.property_address === property.address ||
          c.property_id === property.address || // Sometimes property_id is the address
          (property.address && c.property_address?.toLowerCase().includes(property.address.toLowerCase().split(',')[0])) ||
          (property.address && c.property_id?.toLowerCase().includes(property.address.toLowerCase().split(',')[0]))
        ) || (calculations?.per_property?.length === 1 && properties.length === 1 ? calculations.per_property[0] : undefined);

        const propAnalysis = analysis?.per_property_analysis?.find((a: any) =>
          a.property_address === property.address ||
          (property.address && a.property_address?.toLowerCase().includes(property.address.toLowerCase().split(',')[0]))
        ) || (analysis?.per_property_analysis?.length === 1 && properties.length === 1 ? analysis.per_property_analysis[0] : undefined);

        // Get timeline events for this property (fallback data source)
        const matchedTimelineProperty = timelineProperties?.find(
          (tp) => tp.address === property.address || tp.name === property.address ||
                  (property.address && tp.address?.toLowerCase().includes(property.address.toLowerCase().split(',')[0]))
        );
        const propertyEvents = matchedTimelineProperty
          ? timelineEvents?.filter((e) => e.propertyId === matchedTimelineProperty.id).sort((a, b) => a.date.getTime() - b.date.getTime())
          : [];

        // Extract dates from property_history in AI response (primary source for dates)
        const propertyHistory = property.property_history || [];
        const aiPurchaseHistory = propertyHistory.find((h: any) => h.event === 'purchase');
        const aiSaleHistory = propertyHistory.find((h: any) => h.event === 'sale');
        const aiMoveInHistory = propertyHistory.find((h: any) => h.event === 'move_in');
        const aiMoveOutHistory = propertyHistory.find((h: any) => h.event === 'move_out');

        // Extract timeline events for dates (fallback if AI doesn't provide)
        const purchaseEvent = propertyEvents?.find((e) => e.type === 'purchase');
        const saleEvent = propertyEvents?.find((e) => e.type === 'sale');
        const moveInEvent = propertyEvents?.find((e) => e.type === 'move_in');
        const moveOutEvent = propertyEvents?.find((e) => e.type === 'move_out');
        const rentStartEvent = propertyEvents?.find((e) => e.type === 'rent_start');
        const rentEndEvent = propertyEvents?.find((e) => e.type === 'rent_end');
        const improvementEvents = propertyEvents?.filter((e) => e.type === 'improvement') || [];

        // ===== AI DATA (Primary Source) =====
        // Get dates from AI property_history first, then from property object, then timeline
        const aiPurchaseDate = aiPurchaseHistory?.date || property.purchase_date;
        const aiSaleDate = aiSaleHistory?.date || property.sale_date;

        // Ownership and Main Residence data from AI
        const aiTotalOwnershipDays = propCalc?.main_residence_exemption?.total_ownership_days;
        const aiMainResidenceDays = propCalc?.main_residence_exemption?.days_as_main_residence;
        const aiExemptionPercentage = propCalc?.main_residence_exemption?.exemption_percentage;
        const aiNonMainResidenceDays = propCalc?.main_residence_exemption?.non_main_residence_days;

        // Cost base data from AI - check multiple sources
        const aiPurchasePrice = property.purchase_price ||
          propCalc?.cost_base_breakdown?.purchase_price ||
          propCalc?.cost_base_breakdown?.acquisition_cost ||
          aiPurchaseHistory?.price;
        const aiSalePrice = property.sale_price ||
          propCalc?.capital_proceeds ||
          aiSaleHistory?.price;
        const aiIncidentalCostsAcquire = propCalc?.cost_base_breakdown?.incidental_costs_acquire || 0;
        const aiCapitalImprovements = propCalc?.cost_base_breakdown?.capital_improvements || 0;
        const aiDisposalCosts = propCalc?.cost_base_breakdown?.disposal_costs || 0;
        const aiTotalCostBase = propCalc?.cost_base_breakdown?.total_cost_base || aiPurchasePrice;
        const aiRawCapitalGain = propCalc?.raw_capital_gain;
        const aiNetCapitalGain = propCalc?.net_capital_gain;

        // CGT Discount data from AI
        const aiCgtDiscountEligible = propCalc?.cgt_discount?.eligible;
        const aiGainBeforeDiscount = propCalc?.cgt_discount?.gain_before_discount;
        const aiDiscountedGain = propCalc?.cgt_discount?.discounted_gain;

        // Six-year rule from AI
        const aiSixYearRuleApplied = property.six_year_rule_applied;
        const aiSixYearReason = property.six_year_reason;

        // ===== FALLBACK to Timeline (if AI data not available) =====
        // Calculate from AI dates first, then timeline events
        const aiOwnershipDays = (aiPurchaseDate && aiSaleDate)
          ? calculateDays(new Date(aiPurchaseDate), new Date(aiSaleDate))
          : 0;
        const timelineOwnershipDays = (purchaseEvent && saleEvent)
          ? calculateDays(purchaseEvent.date, saleEvent.date)
          : 0;

        // Calculate timeline-based cost bases for fallback using utility functions
        // These properly check both event.amount AND costBases arrays
        const timelinePurchaseCosts = calculatePurchaseIncidentalCosts(purchaseEvent);
        const timelineImprovementCosts = calculateImprovementCosts(improvementEvents);
        const timelineSellingCosts = calculateSellingCosts(saleEvent);

        // ===== FINAL VALUES (AI preferred, then AI dates calculation, then timeline fallback) =====
        // AI propCalc data is most authoritative, then calculate from AI dates, then timeline
        const totalOwnershipDays = aiTotalOwnershipDays || aiOwnershipDays || timelineOwnershipDays;
        const mainResidenceDays = aiMainResidenceDays ?? totalOwnershipDays;
        const nonMainResidenceDays = aiNonMainResidenceDays ?? (totalOwnershipDays - mainResidenceDays);
        const exemptionPercentage = aiExemptionPercentage ?? (totalOwnershipDays > 0 ? (mainResidenceDays / totalOwnershipDays) * 100 : 100);

        // Use utility functions to properly extract prices from amount OR costBases
        const purchasePrice = aiPurchasePrice || getPurchasePrice(purchaseEvent);
        const salePrice = aiSalePrice || getSalePrice(saleEvent);
        const incidentalCostsAcquire = aiIncidentalCostsAcquire || timelinePurchaseCosts;
        const capitalImprovements = aiCapitalImprovements || timelineImprovementCosts;
        const disposalCosts = aiDisposalCosts || timelineSellingCosts;
        const div43Deductions = getDivision43Deductions(saleEvent);
        const totalCostBase = aiTotalCostBase || (purchasePrice + incidentalCostsAcquire + capitalImprovements + disposalCosts - div43Deductions);
        const rawCapitalGain = aiRawCapitalGain ?? (salePrice - totalCostBase);
        const netCapitalGain = aiNetCapitalGain ?? rawCapitalGain;

        // Calculate taxable portion (for partial exemption)
        const taxablePercentage = 100 - exemptionPercentage;
        const taxableGain = rawCapitalGain * (taxablePercentage / 100);
        const exemptAmount = rawCapitalGain * (exemptionPercentage / 100);

        // ===== APPLICABLE RULES =====
        const applicableRules: string[] = [];

        // Six-year rule from AI
        if (aiSixYearRuleApplied) {
          applicableRules.push('Six-year absence rule applied (s118-145 ITAA 1997)');
          if (aiSixYearReason) {
            applicableRules.push(aiSixYearReason);
          }
        }

        // Main residence exemption
        if (exemptionPercentage === 100) {
          applicableRules.push('Full main residence exemption applies (s118-110 ITAA 1997)');
        } else if (exemptionPercentage > 0) {
          applicableRules.push(`Partial main residence exemption applies (${exemptionPercentage.toFixed(2)}%)`);
          applicableRules.push('Property was income-producing for part of ownership period');
        } else {
          applicableRules.push('No main residence exemption - property was investment only');
        }

        // CGT Discount
        if (aiCgtDiscountEligible) {
          applicableRules.push('50% CGT discount applies (asset held > 12 months) (s115-25 ITAA 1997)');
        } else if (totalOwnershipDays < 365) {
          applicableRules.push('CGT discount not available (asset held < 12 months)');
        }

        return (
          <Page key={`property-${propIndex}`} size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Property Analysis</Text>
              <Text style={styles.subtitle}>Property {propIndex + 1} of {properties.length}</Text>
            </View>

            {/* Scenario Title and Description */}
            <Text style={styles.scenarioTitle}>{property.address}</Text>
            {propAnalysis?.reasoning && (
              <Text style={styles.scenarioDescription}>{propAnalysis.reasoning}</Text>
            )}

            {/* Key Facts Section - Using AI Data */}
            <View style={styles.keyFactsSection}>
              <Text style={styles.keyFactsTitle}>Key Facts</Text>
              <View style={styles.keyFactsList}>
                <View style={styles.keyFactItem}>
                  <Text style={styles.keyFactBullet}>•</Text>
                  <Text style={styles.keyFactLabel}>Property:</Text>
                  <Text style={styles.keyFactValue}>{property.address}</Text>
                </View>
                <View style={styles.keyFactItem}>
                  <Text style={styles.keyFactBullet}>•</Text>
                  <Text style={styles.keyFactLabel}>Purchase Date:</Text>
                  <Text style={styles.keyFactValue}>
                    {aiPurchaseDate ? formatShortDate(aiPurchaseDate) : (purchaseEvent ? formatShortDate(purchaseEvent.date) : 'N/A')}
                  </Text>
                </View>
                <View style={styles.keyFactItem}>
                  <Text style={styles.keyFactBullet}>•</Text>
                  <Text style={styles.keyFactLabel}>Purchase Price:</Text>
                  <Text style={styles.keyFactValue}>{formatCurrency(purchasePrice)}</Text>
                </View>
                <View style={styles.keyFactItem}>
                  <Text style={styles.keyFactBullet}>•</Text>
                  <Text style={styles.keyFactLabel}>Sale Date:</Text>
                  <Text style={styles.keyFactValue}>
                    {aiSaleDate ? formatShortDate(aiSaleDate) : (saleEvent ? formatShortDate(saleEvent.date) : 'N/A')}
                  </Text>
                </View>
                <View style={styles.keyFactItem}>
                  <Text style={styles.keyFactBullet}>•</Text>
                  <Text style={styles.keyFactLabel}>Sale Price:</Text>
                  <Text style={styles.keyFactValue}>{formatCurrency(salePrice)}</Text>
                </View>
                <View style={styles.keyFactItem}>
                  <Text style={styles.keyFactBullet}>•</Text>
                  <Text style={styles.keyFactLabel}>Total Ownership:</Text>
                  <Text style={styles.keyFactValue}>
                    {totalOwnershipDays > 0 ? `${totalOwnershipDays.toLocaleString()} days (${formatDuration(totalOwnershipDays)})` : 'N/A'}
                  </Text>
                </View>
                <View style={styles.keyFactItem}>
                  <Text style={styles.keyFactBullet}>•</Text>
                  <Text style={styles.keyFactLabel}>Main Residence Days:</Text>
                  <Text style={styles.keyFactValue}>
                    {mainResidenceDays > 0 ? `${mainResidenceDays.toLocaleString()} days (${exemptionPercentage.toFixed(2)}%)` : 'N/A'}
                  </Text>
                </View>
                {nonMainResidenceDays > 0 && (
                  <View style={styles.keyFactItem}>
                    <Text style={styles.keyFactBullet}>•</Text>
                    <Text style={styles.keyFactLabel}>Non-Main Residence Days:</Text>
                    <Text style={styles.keyFactValue}>
                      {nonMainResidenceDays.toLocaleString()} days ({taxablePercentage.toFixed(2)}%)
                    </Text>
                  </View>
                )}
                {property.status && (
                  <View style={styles.keyFactItem}>
                    <Text style={styles.keyFactBullet}>•</Text>
                    <Text style={styles.keyFactLabel}>Status:</Text>
                    <Text style={styles.keyFactValue}>{property.status.toUpperCase()}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Timeline of Events Table */}
            {propertyEvents && propertyEvents.length > 0 && (
              <View style={styles.timelineTableSection}>
                <Text style={styles.timelineTableTitle}>Timeline of Events</Text>
                <View style={styles.timelineTable}>
                  <View style={styles.timelineTableHeader}>
                    <Text style={[styles.timelineTableHeaderCell, styles.timelineTableCellDate]}>Date</Text>
                    <Text style={[styles.timelineTableHeaderCell, styles.timelineTableCellEvent]}>Event</Text>
                    <Text style={[styles.timelineTableHeaderCell, styles.timelineTableCellDetails]}>Details</Text>
                  </View>
                  {propertyEvents.map((event, eventIndex) => (
                    <View key={eventIndex} style={styles.timelineTableRow}>
                      <Text style={[styles.timelineTableCell, styles.timelineTableCellDate]}>
                        {formatShortDate(event.date)}
                      </Text>
                      <Text style={[styles.timelineTableCell, styles.timelineTableCellEvent]}>
                        {getEventTypeLabel(event.type)}
                      </Text>
                      <Text style={[styles.timelineTableCell, styles.timelineTableCellDetails]}>
                        {getEventDetails(event)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* CGT Calculation Section - Detailed Math */}
            <View style={styles.cgtCalcSection}>
              <Text style={styles.cgtCalcTitle}>CGT Calculation - Step by Step</Text>

              {/* Step 1: Capital Proceeds */}
              <View style={styles.cgtCalcStep}>
                <Text style={styles.cgtCalcStepTitle}>Step 1: Capital Proceeds (Sale Price)</Text>
                <View style={styles.cgtCalcStepContent}>
                  <View style={styles.cgtCalcLine}>
                    <Text style={styles.cgtCalcLineLabel}>Sale Price (Contract):</Text>
                    <Text style={styles.cgtCalcLineValue}>{formatCurrency(salePrice)}</Text>
                  </View>
                  <View style={styles.cgtCalcTotal}>
                    <Text style={styles.cgtCalcTotalLabel}>Capital Proceeds:</Text>
                    <Text style={styles.cgtCalcTotalValue}>{formatCurrency(salePrice)}</Text>
                  </View>
                </View>
              </View>

              {/* Step 2: Cost Base - Detailed Breakdown */}
              <View style={styles.cgtCalcStep}>
                <Text style={styles.cgtCalcStepTitle}>Step 2: Cost Base (5 Elements)</Text>
                <View style={styles.cgtCalcStepContent}>
                  {/* Element 1: Acquisition */}
                  <View style={styles.cgtCalcLine}>
                    <Text style={styles.cgtCalcLineLabel}>Element 1 - Purchase Price:</Text>
                    <Text style={styles.cgtCalcLineValue}>{formatCurrency(purchasePrice)}</Text>
                  </View>

                  {/* Element 2: Incidental costs acquire */}
                  {incidentalCostsAcquire > 0 && (
                    <View style={styles.cgtCalcLine}>
                      <Text style={styles.cgtCalcLineLabel}>Element 2 - Incidental Costs (Acquire):</Text>
                      <Text style={styles.cgtCalcLineValue}>{formatCurrency(incidentalCostsAcquire)}</Text>
                    </View>
                  )}

                  {/* Element 3: Capital Improvements */}
                  {capitalImprovements > 0 && (
                    <View style={styles.cgtCalcLine}>
                      <Text style={styles.cgtCalcLineLabel}>Element 3 - Capital Improvements:</Text>
                      <Text style={styles.cgtCalcLineValue}>{formatCurrency(capitalImprovements)}</Text>
                    </View>
                  )}

                  {/* Element 5: Disposal Costs */}
                  {disposalCosts > 0 && (
                    <View style={styles.cgtCalcLine}>
                      <Text style={styles.cgtCalcLineLabel}>Element 5 - Disposal Costs:</Text>
                      <Text style={styles.cgtCalcLineValue}>{formatCurrency(disposalCosts)}</Text>
                    </View>
                  )}

                  <View style={styles.cgtCalcDivider} />
                  <View style={styles.cgtCalcTotal}>
                    <Text style={styles.cgtCalcTotalLabel}>Total Cost Base:</Text>
                    <Text style={styles.cgtCalcTotalValue}>{formatCurrency(totalCostBase)}</Text>
                  </View>
                  <Text style={styles.cgtCalcFormula}>
                    = {formatCurrency(purchasePrice)} + {formatCurrency(incidentalCostsAcquire)} + {formatCurrency(capitalImprovements)} + {formatCurrency(disposalCosts)}
                  </Text>
                </View>
              </View>

              {/* Step 3: Raw Capital Gain */}
              <View style={styles.cgtCalcStep}>
                <Text style={styles.cgtCalcStepTitle}>Step 3: Calculate Raw Capital Gain</Text>
                <View style={styles.cgtCalcStepContent}>
                  <View style={styles.cgtCalcLine}>
                    <Text style={styles.cgtCalcLineLabel}>Capital Proceeds:</Text>
                    <Text style={styles.cgtCalcLineValue}>{formatCurrency(salePrice)}</Text>
                  </View>
                  <View style={styles.cgtCalcLine}>
                    <Text style={styles.cgtCalcLineLabel}>Less: Cost Base:</Text>
                    <Text style={styles.cgtCalcLineValue}>({formatCurrency(totalCostBase)})</Text>
                  </View>
                  <View style={styles.cgtCalcDivider} />
                  <View style={styles.cgtCalcTotal}>
                    <Text style={styles.cgtCalcTotalLabel}>Raw Capital Gain:</Text>
                    <Text style={styles.cgtCalcTotalValue}>{formatCurrency(rawCapitalGain)}</Text>
                  </View>
                  <Text style={styles.cgtCalcFormula}>
                    = {formatCurrency(salePrice)} - {formatCurrency(totalCostBase)} = {formatCurrency(rawCapitalGain)}
                  </Text>
                </View>
              </View>

              {/* Step 4: Main Residence Exemption */}
              <View style={styles.cgtCalcStep}>
                <Text style={styles.cgtCalcStepTitle}>Step 4: Apply Main Residence Exemption</Text>
                <View style={styles.cgtCalcStepContent}>
                  <View style={styles.cgtCalcLine}>
                    <Text style={styles.cgtCalcLineLabel}>Main Residence Days:</Text>
                    <Text style={styles.cgtCalcLineValue}>{mainResidenceDays.toLocaleString()} days</Text>
                  </View>
                  <View style={styles.cgtCalcLine}>
                    <Text style={styles.cgtCalcLineLabel}>Total Ownership Days:</Text>
                    <Text style={styles.cgtCalcLineValue}>{totalOwnershipDays.toLocaleString()} days</Text>
                  </View>
                  <View style={styles.cgtCalcLine}>
                    <Text style={styles.cgtCalcLineLabel}>Exemption Percentage:</Text>
                    <Text style={styles.cgtCalcLineValue}>
                      {mainResidenceDays.toLocaleString()} ÷ {totalOwnershipDays.toLocaleString()} = {exemptionPercentage.toFixed(2)}%
                    </Text>
                  </View>
                  <View style={styles.cgtCalcDivider} />
                  {exemptionPercentage === 100 ? (
                    <View style={styles.cgtCalcTotal}>
                      <Text style={styles.cgtCalcTotalLabel}>Result:</Text>
                      <Text style={styles.cgtCalcTotalValue}>FULL EXEMPTION - No CGT</Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.cgtCalcLine}>
                        <Text style={styles.cgtCalcLineLabel}>Exempt Amount:</Text>
                        <Text style={styles.cgtCalcLineValue}>
                          {formatCurrency(rawCapitalGain)} × {exemptionPercentage.toFixed(2)}% = {formatCurrency(exemptAmount)}
                        </Text>
                      </View>
                      <View style={styles.cgtCalcLine}>
                        <Text style={styles.cgtCalcLineLabel}>Taxable Amount:</Text>
                        <Text style={styles.cgtCalcLineValue}>
                          {formatCurrency(rawCapitalGain)} × {taxablePercentage.toFixed(2)}% = {formatCurrency(taxableGain)}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>

              {/* Step 5: CGT Discount (if applicable) */}
              {exemptionPercentage < 100 && (
                <View style={styles.cgtCalcStep}>
                  <Text style={styles.cgtCalcStepTitle}>Step 5: Apply 50% CGT Discount</Text>
                  <View style={styles.cgtCalcStepContent}>
                    {aiCgtDiscountEligible ? (
                      <>
                        <View style={styles.cgtCalcLine}>
                          <Text style={styles.cgtCalcLineLabel}>Taxable Gain (before discount):</Text>
                          <Text style={styles.cgtCalcLineValue}>{formatCurrency(aiGainBeforeDiscount || taxableGain)}</Text>
                        </View>
                        <View style={styles.cgtCalcLine}>
                          <Text style={styles.cgtCalcLineLabel}>50% CGT Discount:</Text>
                          <Text style={styles.cgtCalcLineValue}>× 50%</Text>
                        </View>
                        <View style={styles.cgtCalcDivider} />
                        <View style={styles.cgtCalcTotal}>
                          <Text style={styles.cgtCalcTotalLabel}>Net Capital Gain:</Text>
                          <Text style={styles.cgtCalcTotalValue}>{formatCurrency(aiDiscountedGain || (taxableGain * 0.5))}</Text>
                        </View>
                        <Text style={styles.cgtCalcFormula}>
                          = {formatCurrency(aiGainBeforeDiscount || taxableGain)} × 50% = {formatCurrency(aiDiscountedGain || (taxableGain * 0.5))}
                        </Text>
                      </>
                    ) : (
                      <>
                        <View style={styles.cgtCalcLine}>
                          <Text style={styles.cgtCalcLineLabel}>CGT Discount:</Text>
                          <Text style={styles.cgtCalcLineValue}>Not eligible (held &lt; 12 months)</Text>
                        </View>
                        <View style={styles.cgtCalcTotal}>
                          <Text style={styles.cgtCalcTotalLabel}>Net Capital Gain:</Text>
                          <Text style={styles.cgtCalcTotalValue}>{formatCurrency(netCapitalGain)}</Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Result Box */}
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>
                {exemptionPercentage === 100 || netCapitalGain === 0
                  ? 'RESULT: NO CGT PAYABLE'
                  : `RESULT: NET CAPITAL GAIN = ${formatCurrency(aiDiscountedGain || netCapitalGain)}`
                }
              </Text>
              {exemptionPercentage === 100 && (
                <Text style={styles.resultSubtext}>Full main residence exemption applies</Text>
              )}
              {exemptionPercentage < 100 && aiCgtDiscountEligible && (
                <Text style={styles.resultSubtext}>After 50% CGT discount applied</Text>
              )}
            </View>

            {/* Applicable Rules Section */}
            {applicableRules.length > 0 && (
              <View style={styles.rulesSection}>
                <Text style={styles.rulesTitle}>Applicable Tax Rules</Text>
                <View style={styles.rulesList}>
                  {applicableRules.map((rule, ruleIndex) => (
                    <View key={ruleIndex} style={styles.ruleItem}>
                      <Text style={styles.ruleBullet}>•</Text>
                      <Text style={styles.ruleText}>{rule}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Cross-Property Impact (from AI) */}
            {propAnalysis?.cross_property_impact && (
              <View style={[styles.impactBox, { marginTop: 10 }]}>
                <Text style={[styles.impactText, { fontWeight: 'bold', marginBottom: 4 }]}>Cross-Property Impact:</Text>
                <Text style={styles.impactText}>{propAnalysis.cross_property_impact}</Text>
              </View>
            )}

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

        {/* Six-Year Rule Analysis */}
        {properties && properties.some((p: any) => p.six_year_rule_applied || p.six_year_reason) && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionHeader}>Six-Year Rule Analysis</Text>
            {properties.filter((p: any) => p.six_year_rule_applied || p.six_year_reason).map((property: any, index: number) => (
              <View key={index} style={{ marginBottom: 10, padding: 10, backgroundColor: property.six_year_rule_applied ? '#f0fdfa' : '#f8fafc', borderRadius: 6, borderWidth: 1, borderColor: property.six_year_rule_applied ? '#5eead4' : '#e2e8f0' }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 }}>{property.address}</Text>
                <Text style={{ fontSize: 8, fontWeight: 'bold', color: property.six_year_rule_applied ? '#0f766e' : '#64748b', marginBottom: 4 }}>
                  {property.six_year_rule_applied ? 'APPLIED ✓' : 'NOT APPLIED'}
                </Text>
                {property.six_year_reason && (
                  <Text style={{ fontSize: 8, color: '#475569', lineHeight: 1.5 }}>{property.six_year_reason}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Timeline Quality Assessment */}
        {response?.verification?.timeline_analysis?.statistics && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionHeader}>Timeline Quality Assessment</Text>
            <View style={styles.validationGrid}>
              <View style={[styles.validationCard, {
                backgroundColor: response.verification.timeline_analysis.statistics.accounted_percentage >= 99 ? '#f0fdf4' : response.verification.timeline_analysis.statistics.accounted_percentage >= 95 ? '#fffbeb' : '#fef2f2',
                borderColor: response.verification.timeline_analysis.statistics.accounted_percentage >= 99 ? '#bbf7d0' : response.verification.timeline_analysis.statistics.accounted_percentage >= 95 ? '#fde68a' : '#fecaca'
              }]}>
                <Text style={styles.validationLabel}>Coverage</Text>
                <Text style={[styles.validationValue, { color: response.verification.timeline_analysis.statistics.accounted_percentage >= 99 ? '#16a34a' : response.verification.timeline_analysis.statistics.accounted_percentage >= 95 ? '#d97706' : '#dc2626' }]}>
                  {response.verification.timeline_analysis.statistics.accounted_percentage.toFixed(1)}%
                </Text>
                <Text style={styles.validationSubtext}>Timeline quality</Text>
              </View>
              <View style={[styles.validationCard, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
                <Text style={styles.validationLabel}>Gap Days</Text>
                <Text style={[styles.validationValue, { color: '#d97706' }]}>
                  {response.verification.timeline_analysis.statistics.gap_days || 0}
                </Text>
                <Text style={styles.validationSubtext}>Missing periods</Text>
              </View>
            </View>
          </View>
        )}

        {/* Analysis Metadata */}
        {analysis?.metadata && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionHeader}>Analysis Metadata</Text>
            <View style={styles.validationGrid}>
              {analysis.metadata.llm_used && (
                <View style={[styles.validationCard, { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' }]}>
                  <Text style={styles.validationLabel}>AI Model</Text>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#4338ca' }}>
                    {analysis.metadata.llm_used}
                  </Text>
                  <Text style={styles.validationSubtext}>Language model</Text>
                </View>
              )}
              {analysis.metadata.chunks_retrieved !== undefined && (
                <View style={[styles.validationCard, { backgroundColor: '#f0fdfa', borderColor: '#99f6e4' }]}>
                  <Text style={styles.validationLabel}>KB Chunks</Text>
                  <Text style={[styles.validationValue, { color: '#0f766e' }]}>
                    {analysis.metadata.chunks_retrieved}
                  </Text>
                  <Text style={styles.validationSubtext}>Retrieved</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Portfolio Intelligence */}
        {analysis?.cross_property_intelligence && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionHeader}>Portfolio Intelligence</Text>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>{analysis.cross_property_intelligence}</Text>
            </View>
          </View>
        )}

        {/* Verification Summary */}
        {response?.verification?.llm_summary && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionHeader}>Verification Summary</Text>
            <View style={{ padding: 10, backgroundColor: '#eff6ff', borderRadius: 6, borderWidth: 1, borderColor: '#bfdbfe' }}>
              <Text style={{ fontSize: 9, color: '#1e293b', lineHeight: 1.5 }}>{response.verification.llm_summary}</Text>
            </View>
          </View>
        )}

        {/* Validation Warnings */}
        {validation?.warnings && validation.warnings.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionHeader}>⚠️ Validation Warnings</Text>
            {validation.warnings.map((warning: string, index: number) => (
              <View key={index} style={{ marginBottom: 6, padding: 8, backgroundColor: '#fef2f2', borderLeftWidth: 3, borderLeftColor: '#ef4444', borderRadius: 4 }}>
                <Text style={{ fontSize: 8, color: '#991b1b', lineHeight: 1.5 }}>{warning}</Text>
              </View>
            ))}
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

      {/* Timeline Bar + Two-Column Summary Visualization Pages */}
      {timelineProperties && timelineProperties.length > 0 && timelineProperties.map((property, propIdx) => {
        if (!property || !property.id) return null;

        // Get all events for this property sorted by date
        const propertyEvents = (timelineEvents || [])
          .filter((e) => e.propertyId === property.id)
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        const purchaseEvent = propertyEvents.find((e) => e.type === 'purchase');
        const saleEvent = propertyEvents.find((e) => e.type === 'sale');
        const moveInEvent = propertyEvents.find((e) => e.type === 'move_in');
        const moveOutEvent = propertyEvents.find((e) => e.type === 'move_out');
        const rentStartEvent = propertyEvents.find((e) => e.type === 'rent_start');
        const rentEndEvent = propertyEvents.find((e) => e.type === 'rent_end');
        const improvementEvents = propertyEvents.filter((e) => e.type === 'improvement');

        if (!purchaseEvent) return null;

        // Calculate cost base using shared utilities - matching TwoColumnLayout approach
        // Use getPurchasePrice/getSalePrice which check both event.amount AND costBases
        const purchasePrice = getPurchasePrice(purchaseEvent);
        const purchaseCostBases = purchaseEvent.costBases || [];
        const purchaseCosts = calculatePurchaseIncidentalCosts(purchaseEvent);

        // Filter purchase cost bases to exclude main transaction amounts (already shown separately)
        const excludeFromDisplay = ['purchase_price', 'land_price', 'building_price', 'sale_price'];
        const filteredPurchaseCostBases = purchaseCostBases.filter(
          (cb) => !excludeFromDisplay.includes(cb.definitionId)
        );

        const improvementCosts = calculateImprovementCosts(improvementEvents);
        const saleCostBases = saleEvent?.costBases || [];
        const filteredSaleCostBases = saleCostBases.filter(
          (cb) => !excludeFromDisplay.includes(cb.definitionId)
        );
        const sellingCosts = calculateSellingCosts(saleEvent);
        const div43Deductions2 = getDivision43Deductions(saleEvent);
        const totalCostBase = purchasePrice + purchaseCosts + improvementCosts + sellingCosts - div43Deductions2;
        const salePrice = getSalePrice(saleEvent);
        const capitalGain = calculateCapitalGain(purchaseEvent, improvementEvents, saleEvent);

        // Calculate timeline positions (relative percentages)
        const startDate = purchaseEvent.date;
        const endDate = saleEvent?.date || new Date();
        const totalDays = Math.max(1, calculateDays(startDate, endDate));

        // Helper to get position percentage
        const getPositionPercent = (date: Date): number => {
          const days = calculateDays(startDate, date);
          return Math.min(100, Math.max(0, (days / totalDays) * 100));
        };

        // Calculate periods for the bar
        const periods: Array<{ type: 'ppr' | 'rental'; start: number; width: number; label: string }> = [];

        if (moveInEvent) {
          const pprStart = getPositionPercent(moveInEvent.date);
          const pprEnd = moveOutEvent ? getPositionPercent(moveOutEvent.date) : 100;
          periods.push({
            type: 'ppr',
            start: pprStart,
            width: pprEnd - pprStart,
            label: 'Main Residence',
          });
        }

        if (rentStartEvent) {
          const rentalStart = getPositionPercent(rentStartEvent.date);
          const rentalEnd = rentEndEvent ? getPositionPercent(rentEndEvent.date) : (saleEvent ? 100 : 100);
          periods.push({
            type: 'rental',
            start: rentalStart,
            width: rentalEnd - rentalStart,
            label: 'Rental',
          });
        }

        // Calculate ownership months
        const ownershipMonths = Math.round(totalDays / 30);

        // Event dot colors
        const eventColors: Record<string, string> = {
          purchase: '#22c55e',
          sale: '#ef4444',
          move_in: '#3b82f6',
          move_out: '#f97316',
          rent_start: '#8b5cf6',
          rent_end: '#eab308',
          improvement: '#ec4899',
        };

        return (
          <Page key={`viz-${property.id}`} size="A4" style={styles.page}>
            {/* Page Header */}
            <View style={styles.vizPageHeader}>
              <Text style={styles.vizPageTitle}>Property Summary & Timeline</Text>
              <Text style={styles.vizPageSubtitle}>
                Visual representation of ownership, occupancy periods, and cost breakdown
              </Text>
            </View>

            {/* Property Card */}
            <View style={styles.vizPropertyCard}>
              {/* Property Header */}
              <View style={styles.vizPropertyHeader}>
                <Text style={styles.vizPropertyName}>{property.name}</Text>
                <Text style={styles.vizPropertyAddress}>{property.address}</Text>
              </View>

              {/* Summary Boxes Row */}
              <View style={styles.vizSummaryRow}>
                <View style={styles.vizSummaryBox}>
                  <Text style={styles.vizSummaryLabel}>Purchase</Text>
                  <Text style={[styles.vizSummaryValue, { color: '#22c55e' }]}>
                    {formatCurrency(purchasePrice)}
                  </Text>
                  <Text style={styles.vizSummarySubtext}>
                    {formatShortDate(purchaseEvent.date)}
                  </Text>
                </View>

                {purchaseCosts > 0 && (
                  <View style={styles.vizSummaryBox}>
                    <Text style={styles.vizSummaryLabel}>Purchase Costs</Text>
                    <Text style={[styles.vizSummaryValue, { color: '#3b82f6' }]}>
                      {formatCurrency(purchaseCosts)}
                    </Text>
                    <Text style={styles.vizSummarySubtext}>
                      {purchaseEvent.costBases?.length || 0} items
                    </Text>
                  </View>
                )}

                {improvementCosts > 0 && (
                  <View style={styles.vizSummaryBox}>
                    <Text style={styles.vizSummaryLabel}>Improvements</Text>
                    <Text style={[styles.vizSummaryValue, { color: '#ec4899' }]}>
                      {formatCurrency(improvementCosts)}
                    </Text>
                    <Text style={styles.vizSummarySubtext}>
                      {improvementEvents.length} events
                    </Text>
                  </View>
                )}

                {saleEvent && (
                  <View style={styles.vizSummaryBox}>
                    <Text style={styles.vizSummaryLabel}>Sale</Text>
                    <Text style={[styles.vizSummaryValue, { color: '#ef4444' }]}>
                      {formatCurrency(salePrice)}
                    </Text>
                    <Text style={styles.vizSummarySubtext}>
                      {formatShortDate(saleEvent.date)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Timeline Bar Section */}
              <View style={styles.vizTimelineSection}>
                {/* Scale */}
                <View style={styles.vizTimelineScale}>
                  <Text style={styles.vizTimelineScaleText}>
                    {formatShortDate(startDate)}
                  </Text>
                  <Text style={styles.vizTimelineScaleText}>
                    {formatShortDate(endDate)}
                  </Text>
                </View>

                {/* Timeline Bars Container */}
                <View style={styles.vizTimelineBarsContainer}>
                  {/* Ownership Bar (full width) */}
                  <View style={[styles.vizOwnershipBar, { left: '0%', width: '100%' }]}>
                    <Text style={styles.vizOwnershipLabel}>Owned</Text>
                  </View>

                  {/* Period Bars */}
                  {periods.map((period, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.vizPeriodBar,
                        period.type === 'ppr' ? styles.vizPeriodPPR : styles.vizPeriodRental,
                        { left: `${period.start}%`, width: `${Math.max(period.width, 5)}%` },
                      ]}
                    >
                      <Text style={styles.vizPeriodLabel}>{period.label}</Text>
                    </View>
                  ))}
                </View>

                {/* Legend */}
                <View style={styles.vizLegend}>
                  <View style={styles.vizLegendItem}>
                    <View style={[styles.vizLegendDot, { backgroundColor: '#e2e8f0' }]} />
                    <Text style={styles.vizLegendText}>Owned</Text>
                  </View>
                  <View style={styles.vizLegendItem}>
                    <View style={[styles.vizLegendDot, { backgroundColor: '#3b82f6' }]} />
                    <Text style={styles.vizLegendText}>Main Residence</Text>
                  </View>
                  <View style={styles.vizLegendItem}>
                    <View style={[styles.vizLegendDot, { backgroundColor: '#8b5cf6' }]} />
                    <Text style={styles.vizLegendText}>Rental</Text>
                  </View>
                </View>
              </View>

              {/* Two-Column Layout */}
              <View style={styles.vizTwoColumnContainer}>
                {/* Left Column: Property Timeline */}
                <View style={styles.vizLeftColumn}>
                  <Text style={styles.vizColumnTitle}>Property Timeline</Text>

                  {/* Purchase Event */}
                  {purchaseEvent && (
                    <View style={styles.vizEventItem}>
                      <View style={[styles.vizEventDot, { backgroundColor: eventColors.purchase }]} />
                      <View style={styles.vizEventContent}>
                        <Text style={styles.vizEventType}>Purchase</Text>
                        <Text style={styles.vizEventDate}>{formatShortDate(purchaseEvent.date)}</Text>
                        <Text style={[styles.vizEventAmount, { color: '#22c55e' }]}>
                          {formatCurrency(purchasePrice)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Move In Event */}
                  {moveInEvent && (
                    <View style={styles.vizEventItem}>
                      <View style={[styles.vizEventDot, { backgroundColor: eventColors.move_in }]} />
                      <View style={styles.vizEventContent}>
                        <Text style={styles.vizEventType}>Move In (Main Residence)</Text>
                        <Text style={styles.vizEventDate}>{formatShortDate(moveInEvent.date)}</Text>
                      </View>
                    </View>
                  )}

                  {/* Improvement Events */}
                  {improvementEvents.map((event) => (
                    <View key={event.id} style={styles.vizEventItem}>
                      <View style={[styles.vizEventDot, { backgroundColor: eventColors.improvement }]} />
                      <View style={styles.vizEventContent}>
                        <Text style={styles.vizEventType}>
                          {event.description || 'Capital Improvement'}
                        </Text>
                        <Text style={styles.vizEventDate}>{formatShortDate(event.date)}</Text>
                        <Text style={[styles.vizEventAmount, { color: '#ec4899' }]}>
                          {formatCurrency(getImprovementAmount(event))}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {/* Move Out Event */}
                  {moveOutEvent && (
                    <View style={styles.vizEventItem}>
                      <View style={[styles.vizEventDot, { backgroundColor: eventColors.move_out }]} />
                      <View style={styles.vizEventContent}>
                        <Text style={styles.vizEventType}>Move Out</Text>
                        <Text style={styles.vizEventDate}>{formatShortDate(moveOutEvent.date)}</Text>
                      </View>
                    </View>
                  )}

                  {/* Rent Start Event */}
                  {rentStartEvent && (
                    <View style={styles.vizEventItem}>
                      <View style={[styles.vizEventDot, { backgroundColor: eventColors.rent_start }]} />
                      <View style={styles.vizEventContent}>
                        <Text style={styles.vizEventType}>Rent Start</Text>
                        <Text style={styles.vizEventDate}>{formatShortDate(rentStartEvent.date)}</Text>
                      </View>
                    </View>
                  )}

                  {/* Rent End Event */}
                  {rentEndEvent && (
                    <View style={styles.vizEventItem}>
                      <View style={[styles.vizEventDot, { backgroundColor: eventColors.rent_end }]} />
                      <View style={styles.vizEventContent}>
                        <Text style={styles.vizEventType}>Rent End</Text>
                        <Text style={styles.vizEventDate}>{formatShortDate(rentEndEvent.date)}</Text>
                      </View>
                    </View>
                  )}

                  {/* Sale Event */}
                  {saleEvent && (
                    <View style={styles.vizEventItem}>
                      <View style={[styles.vizEventDot, { backgroundColor: eventColors.sale }]} />
                      <View style={styles.vizEventContent}>
                        <Text style={styles.vizEventType}>Sale</Text>
                        <Text style={styles.vizEventDate}>{formatShortDate(saleEvent.date)}</Text>
                        <Text style={[styles.vizEventAmount, { color: '#ef4444' }]}>
                          {formatCurrency(salePrice)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Occupancy Summary */}
                  <View style={styles.vizOccupancySection}>
                    <Text style={styles.vizColumnTitle}>Occupancy Summary</Text>
                    {moveInEvent && (
                      <View style={styles.vizOccupancyItem}>
                        <View style={[styles.vizOccupancyDot, { backgroundColor: '#3b82f6' }]} />
                        <Text style={styles.vizOccupancyLabel}>Main Residence:</Text>
                        <Text style={styles.vizOccupancyValue}>
                          {formatShortDate(moveInEvent.date)} - {moveOutEvent ? formatShortDate(moveOutEvent.date) : 'Present'}
                        </Text>
                      </View>
                    )}
                    {rentStartEvent && (
                      <View style={styles.vizOccupancyItem}>
                        <View style={[styles.vizOccupancyDot, { backgroundColor: '#8b5cf6' }]} />
                        <Text style={styles.vizOccupancyLabel}>Rental:</Text>
                        <Text style={styles.vizOccupancyValue}>
                          {formatShortDate(rentStartEvent.date)} - {rentEndEvent ? formatShortDate(rentEndEvent.date) : 'Present'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Right Column: Cost Base Breakdown */}
                <View style={styles.vizRightColumn}>
                  <Text style={styles.vizColumnTitle}>Cost Base Breakdown</Text>

                  {/* Element 1: Purchase */}
                  <View style={styles.vizCostElement}>
                    <Text style={styles.vizCostElementHeader}>Element 1: Purchase</Text>
                    <View style={styles.vizCostLine}>
                      <Text style={styles.vizCostLabel}>Purchase Price</Text>
                      <Text style={styles.vizCostValue}>{formatCurrency(purchasePrice)}</Text>
                    </View>
                    {filteredPurchaseCostBases.map((cb) => (
                      <View key={cb.id} style={styles.vizCostLine}>
                        <Text style={styles.vizCostLabel}>{cb.name}</Text>
                        <Text style={styles.vizCostValue}>{formatCurrency(cb.amount)}</Text>
                      </View>
                    ))}
                    {filteredPurchaseCostBases.length > 0 && (
                      <View style={styles.vizCostSubtotal}>
                        <Text style={styles.vizCostSubtotalLabel}>Subtotal</Text>
                        <Text style={[styles.vizCostSubtotalValue, { color: '#3b82f6' }]}>
                          {formatCurrency(purchasePrice + purchaseCosts)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Element 2: Capital Improvements */}
                  {improvementEvents.length > 0 && (
                    <View style={styles.vizCostElement}>
                      <Text style={styles.vizCostElementHeader}>Element 2: Capital Improvements</Text>
                      {improvementEvents.map((event) => (
                        <View key={event.id}>
                          <View style={styles.vizCostLine}>
                            <Text style={styles.vizCostLabel}>
                              {event.description || 'Improvement'}
                            </Text>
                            <Text style={styles.vizCostValue}>{formatCurrency(getImprovementAmount(event))}</Text>
                          </View>
                          {/* Show improvement cost bases if any (excluding main amounts) */}
                          {event.costBases && event.costBases.length > 0 && event.costBases
                            .filter((cb) => !['purchase_price', 'land_price', 'building_price', 'sale_price'].includes(cb.definitionId))
                            .map((cb) => (
                            <View key={cb.id} style={[styles.vizCostLine, { paddingLeft: 8 }]}>
                              <Text style={[styles.vizCostLabel, { fontSize: 7 }]}>{cb.name}</Text>
                              <Text style={[styles.vizCostValue, { fontSize: 7 }]}>{formatCurrency(cb.amount)}</Text>
                            </View>
                          ))}
                        </View>
                      ))}
                      <View style={styles.vizCostSubtotal}>
                        <Text style={styles.vizCostSubtotalLabel}>Subtotal</Text>
                        <Text style={[styles.vizCostSubtotalValue, { color: '#ec4899' }]}>
                          {formatCurrency(improvementCosts)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Element 5: Selling Costs */}
                  {saleEvent && filteredSaleCostBases.length > 0 && (
                    <View style={styles.vizCostElement}>
                      <Text style={styles.vizCostElementHeader}>Element 5: Selling Costs</Text>
                      {filteredSaleCostBases.map((cb) => (
                        <View key={cb.id} style={styles.vizCostLine}>
                          <Text style={styles.vizCostLabel}>{cb.name}</Text>
                          <Text style={styles.vizCostValue}>{formatCurrency(cb.amount)}</Text>
                        </View>
                      ))}
                      <View style={styles.vizCostSubtotal}>
                        <Text style={styles.vizCostSubtotalLabel}>Subtotal</Text>
                        <Text style={[styles.vizCostSubtotalValue, { color: '#ef4444' }]}>
                          {formatCurrency(sellingCosts)}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Total Summary Footer */}
              <View style={styles.vizTotalFooter}>
                <View style={styles.vizTotalGrid}>
                  <View style={styles.vizTotalItem}>
                    <Text style={styles.vizTotalLabel}>Total Cost Base</Text>
                    <Text style={[styles.vizTotalValue, { color: '#1e293b' }]}>
                      {formatCurrency(totalCostBase)}
                    </Text>
                  </View>
                  {saleEvent && (
                    <>
                      <View style={styles.vizTotalItem}>
                        <Text style={styles.vizTotalLabel}>Sale Price</Text>
                        <Text style={[styles.vizTotalValue, { color: '#22c55e' }]}>
                          {formatCurrency(salePrice)}
                        </Text>
                      </View>
                      <View style={styles.vizTotalItem}>
                        <Text style={styles.vizTotalLabel}>Capital Gain</Text>
                        <Text style={[styles.vizTotalValue, { color: capitalGain >= 0 ? '#3b82f6' : '#ef4444' }]}>
                          {formatCurrency(capitalGain)}
                        </Text>
                      </View>
                      <View style={styles.vizTotalItem}>
                        <Text style={styles.vizTotalLabel}>Ownership Period</Text>
                        <Text style={[styles.vizTotalValue, { color: '#1e293b' }]}>
                          {ownershipMonths} months
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Property Summary - {property.name}</Text>
              <Text style={styles.footerText}>Property {propIdx + 1} of {timelineProperties.length}</Text>
            </View>
          </Page>
        );
      })}

      {/* Flowchart Pages - DISABLED for now - can be re-enabled later
      {timelineProperties && timelineProperties.length > 0 && timelineProperties.map((property, index) => {
        if (!property || !property.id) return null;

        const flowData = getPropertyFlowData(property, timelineEvents || []);

        // Only render flowchart if property has purchase event
        if (!flowData.purchaseEvent) return null;

        return (
          <Page key={`flowchart-${property.id}`} size="A4" style={styles.page}>
            ...flowchart content...
          </Page>
        );
      })}
      */}
    </Document>
  );
};
