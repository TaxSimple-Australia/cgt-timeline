'use client';

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 7,
    fontWeight: 'bold',
  },
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
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  stepNumberCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
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
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
  },
  rowSpaced: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoBox: {
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 8,
  },
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

const formatNumber = (val: string | number | null | undefined): string => {
  if (val === null || val === undefined) return '-';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return String(val);
  return num.toLocaleString('en-AU');
};

// ============================================================================
// RICH TEXT — parse markdown bold (**text**) and italic (*text*) into styled spans
// ============================================================================

/**
 * Parses a string that may contain **bold** and *italic* markdown markers
 * and returns an array of React-PDF <Text> elements with appropriate styling.
 */
const RichText = ({ children, style }: { children: string; style?: any }) => {
  if (!children || typeof children !== 'string') return null;

  // Split on **bold** first, then handle *italic* within each segment
  const segments: React.ReactNode[] = [];
  // Match **bold** blocks (non-greedy)
  const boldPattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  const text = children;

  // eslint-disable-next-line no-cond-assign
  while ((match = boldPattern.exec(text)) !== null) {
    // Text before this bold block
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index);
      segments.push(...parseItalic(before, key));
      key += 10;
    }
    // Bold text
    segments.push(
      <Text key={`b-${key++}`} style={{ fontWeight: 'bold' }}>{match[1]}</Text>
    );
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last bold block
  if (lastIndex < text.length) {
    segments.push(...parseItalic(text.slice(lastIndex), key));
  }

  // If no markdown was found at all, just return the plain text
  if (segments.length === 0) {
    return <Text style={style}>{text}</Text>;
  }

  return <Text style={style}>{segments}</Text>;
};

/** Parse *italic* within a plain (non-bold) segment */
function parseItalic(text: string, startKey: number): React.ReactNode[] {
  const segments: React.ReactNode[] = [];
  const italicPattern = /\*(.+?)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = startKey;

  // eslint-disable-next-line no-cond-assign
  while ((match = italicPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(<Text key={`t-${key++}`}>{text.slice(lastIndex, match.index)}</Text>);
    }
    segments.push(
      <Text key={`i-${key++}`} style={{ fontStyle: 'italic' }}>{match[1]}</Text>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push(<Text key={`t-${key++}`}>{text.slice(lastIndex)}</Text>);
  }

  if (segments.length === 0) {
    segments.push(<Text key={`t-${key}`}>{text}</Text>);
  }

  return segments;
}

// ============================================================================
// LEGAL DISCLAIMERS (last page)
// ============================================================================

const LEGAL_DISCLAIMERS = [
  {
    title: 'AI System Limitations',
    body: 'CGT-Brain AI utilises machine learning and automated analytical models to interpret and organise financial information. Such systems may produce outputs that are incomplete, inconsistent, or incorrect due to limitations in training data, model behaviour, computational interpretation, or contextual ambiguity. Users acknowledge that automated outputs may require verification and correction before use.',
  },
  {
    title: 'Algorithmic Interpretation Risk',
    body: 'Capital gains calculations generated by CGT-Brain AI are based on programmed rules, assumptions, and algorithmic interpretations of tax legislation. These interpretations may not account for all factual circumstances, legal nuances, administrative practices, or updates to legislation and rulings. Final tax positions must therefore be determined through independent professional judgement.',
  },
  {
    title: 'Regulatory Non-Endorsement',
    body: 'CGT-Brain AI is an independent technology tool and is not endorsed, approved, or certified by the Australian Taxation Office, any government authority, or any professional accounting body. Use of the system does not constitute compliance with regulatory requirements unless independently verified.',
  },
  {
    title: 'Legislative Change Risk',
    body: 'Tax laws, rulings, and administrative practices may change without notice. CGT-Brain AI does not guarantee that all calculations reflect the most current legislation, determinations, or interpretative guidance applicable at the time the report is generated.',
  },
  {
    title: 'Scope of Analysis',
    body: 'CGT-Brain AI analyses only the information provided to the system. It does not consider broader taxation factors such as overall taxpayer circumstances, eligibility for concessions, residency changes, related-party arrangements, trust distributions, or other tax events unless explicitly included in the supplied data.',
  },
  {
    title: 'No Professional Engagement',
    body: 'Use of CGT-Brain AI does not create a professional, advisory, fiduciary, or client relationship between the user and the developers, operators, or affiliates of the system.',
  },
  {
    title: 'User Responsibility',
    body: 'Users remain solely responsible for verifying all data inputs, reviewing generated outputs, determining the correct tax treatment of transactions, and ensuring compliance with applicable tax laws and reporting obligations.',
  },
];

const DisclaimerPage = () => (
  <Page size="A4" style={styles.page} wrap>
    {/* Header */}
    <View style={{ marginBottom: 20, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: colors.red }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.primary }}>
        Important Legal Notices
      </Text>
      <Text style={{ fontSize: 9, color: colors.grayLight, marginTop: 3 }}>
        Please read the following disclaimers carefully before relying on this report.
      </Text>
    </View>

    {LEGAL_DISCLAIMERS.map((item, idx) => (
      <View key={idx} style={{ marginBottom: 12 }} wrap={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, marginRight: 6, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 8, color: colors.white, fontWeight: 'bold', textAlign: 'center' }}>{idx + 1}</Text>
          </View>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.primary }}>{item.title}</Text>
        </View>
        <View style={{ paddingLeft: 24 }}>
          <Text style={{ fontSize: 8.5, color: colors.gray, lineHeight: 1.6 }}>{item.body}</Text>
        </View>
      </View>
    ))}

    {/* Footer line */}
    <View style={{ marginTop: 'auto', paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.grayBorder }}>
      <Text style={{ fontSize: 7, color: colors.grayLighter, textAlign: 'center' }}>
        CGT Brain AI | This document is generated for informational purposes only.
      </Text>
      <Text style={{ fontSize: 7, color: colors.grayLighter, textAlign: 'center', marginTop: 2 }}>
        © {new Date().getFullYear()} CGT Brain AI. All rights reserved.
      </Text>
    </View>

    <PageFooter pageLabel="Legal Notices" />
  </Page>
);

// ============================================================================
// EXTRACT analysisData FROM RESPONSE (matches CGTAnalysisDisplay format detection)
// ============================================================================

interface ExtractedData {
  analysisData: any;
  queryAsked: string | null;
  rulesAppliedSummary: string | null;
  sourceReferences: any[];
  llmUsed: string | null;
  analysisDate: string | null;
  disclaimer: string | null;
}

function extractAnalysisData(response: any): ExtractedData {
  // Format detection - same as CGTAnalysisDisplay
  const isDoubleWrapped = response.success !== undefined &&
    response.data?.success !== undefined &&
    response.data?.data?.properties?.length > 0;

  const isWrapped = !isDoubleWrapped &&
    response.success !== undefined &&
    response.data?.properties?.length > 0;

  const isDirect = !isDoubleWrapped && !isWrapped &&
    response.properties?.length > 0 &&
    response.properties[0]?.property_address;

  // Check for legacy status-based format: { status: 'success', summary, properties, analysis, calculations }
  const isLegacySuccess = !isDoubleWrapped && !isWrapped && !isDirect &&
    response.status === 'success' &&
    response.properties?.length > 0;

  let analysisData = isDoubleWrapped
    ? response.data.data
    : isWrapped
      ? response.data
      : isDirect
        ? response
        : null;

  // Transform legacy format into json-sections structure
  if (isLegacySuccess) {
    let parsedAnalysis: any = { summary: '', per_property_analysis: [], recommendations: [] };
    try {
      if (response.analysis?.content) {
        parsedAnalysis = JSON.parse(response.analysis.content);
      }
    } catch { /* ignore parse errors */ }

    const normalizedProperties = response.properties.map((prop: any, idx: number) => {
      const perPropAnalysis = parsedAnalysis.per_property_analysis?.[idx] || {};
      const propCalc = response.calculations?.properties?.[idx] ||
        (response.calculations && response.calculations[prop.address]) || {};

      return {
        property_address: prop.address || prop.name || `Property ${idx + 1}`,
        high_level_description: perPropAnalysis.analysis || perPropAnalysis.summary || '',
        result: prop.result || (prop.capital_gain === 0 ? 'FULLY EXEMPT' : 'CGT PAYABLE'),
        cgt_payable: (prop.capital_gain || 0) > 0,
        timeline: prop.property_history || [],
        ownership_periods: propCalc.ownership_periods || [],
        calculation_steps: propCalc.calculation_steps || propCalc.steps || [],
        cost_base_items: propCalc.cost_base_items || [],
        calculation_summary: propCalc.summary || {},
        what_if_scenarios: perPropAnalysis.what_if_scenarios || [],
        important_notes: perPropAnalysis.important_notes || perPropAnalysis.notes || [],
        warnings: perPropAnalysis.warnings || [],
        applicable_rules: perPropAnalysis.applicable_rules || [],
      };
    });

    analysisData = {
      properties: normalizedProperties,
      description: parsedAnalysis.summary || response.summary?.description || '',
      general_notes: parsedAnalysis.recommendations || [],
      total_net_capital_gain: response.summary?.total_capital_gain || 0,
      total_exempt_gains: response.summary?.total_exempt_gains || 0,
    };
  }

  const queryAsked = response.query || response.data?.query || response.data?.data?.query || null;

  const sources = response.sources || response.data?.sources || response.citations ||
    response.data?.citations || analysisData?.sources || analysisData?.citations || null;

  const rulesAppliedSummary = sources?.rules_summary || response.rules_summary ||
    response.data?.rules_summary || analysisData?.rules_summary || null;

  const sourceReferences = sources?.references || response.references ||
    response.data?.references || analysisData?.references || [];

  const llmUsed = response.llm_used || response.data?.llm_used ||
    response.data?.data?.llm_used || analysisData?.llm_used || null;

  const analysisDate = analysisData?.analysis_date || response.data?.data?.analysis_date ||
    response.analysis_date || null;

  const disclaimer = analysisData?.disclaimer || null;

  return { analysisData, queryAsked, rulesAppliedSummary, sourceReferences, llmUsed, analysisDate, disclaimer };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const PageFooter = ({ pageLabel }: { pageLabel: string }) => (
  <View style={styles.footer} fixed>
    <Text>CGT Analysis Report | CGT Brain AI</Text>
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface SimplifiedCGTReportPDFProps {
  response: any;
}

export const SimplifiedCGTReportPDF: React.FC<SimplifiedCGTReportPDFProps> = ({ response }) => {
  const { analysisData, queryAsked, rulesAppliedSummary, sourceReferences, llmUsed, analysisDate, disclaimer } = extractAnalysisData(response);

  // If we have the json-sections format, use it directly
  if (analysisData && analysisData.properties && analysisData.properties.length > 0) {
    return <JSONSectionsReport
      analysisData={analysisData}
      queryAsked={queryAsked}
      rulesAppliedSummary={rulesAppliedSummary}
      sourceReferences={sourceReferences}
      llmUsed={llmUsed}
      analysisDate={analysisDate}
      disclaimer={disclaimer}
      response={response}
    />;
  }

  // Fallback: legacy format or empty
  return <LegacyReport response={response} />;
};

// ============================================================================
// JSON SECTIONS FORMAT REPORT (matches the UI json-sections display)
// ============================================================================

function JSONSectionsReport({
  analysisData, queryAsked, rulesAppliedSummary, sourceReferences, llmUsed, analysisDate, disclaimer, response,
}: ExtractedData & { analysisData: any; response: any }) {

  const properties = analysisData.properties || [];
  const generalNotes = analysisData.general_notes || [];
  const totalProperties = properties.length;
  const reportDate = analysisDate || new Date().toLocaleDateString('en-AU');
  const analysisId = response.analysis_id || response.data?.analysis_id || analysisData.analysis_id || 'N/A';

  // Calculate portfolio totals from properties
  let totalNetCapitalGain = toNumber(analysisData.total_net_capital_gain);
  let totalExemptGains = toNumber(analysisData.total_exempt_gains);

  const borderColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#6366f1'];

  return (
    <Document>
      {/* ================================================================ */}
      {/* COVER PAGE                                                       */}
      {/* ================================================================ */}
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
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.black }}>{analysisId}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 9, color: colors.grayLight }}>Properties Analysed</Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.black }}>{totalProperties}</Text>
          </View>
        </View>

        {/* Query Asked */}
        {queryAsked && (
          <View style={{ ...styles.infoBox, backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder, marginBottom: 16 }}>
            <Text style={{ fontSize: 7, fontWeight: 'bold', color: colors.primaryLight, marginBottom: 4, textTransform: 'uppercase' as any }}>Question Asked</Text>
            <RichText style={{ fontSize: 9, color: colors.black, lineHeight: 1.4 }}>{queryAsked}</RichText>
          </View>
        )}

        {/* Portfolio Summary */}
        {(totalNetCapitalGain > 0 || totalExemptGains > 0 || properties.length > 0) && (
          <View style={{ backgroundColor: colors.primaryBg, padding: 16, borderRadius: 4, borderWidth: 2, borderColor: colors.primaryLight, marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: 12 }}>
              Portfolio Summary
            </Text>
            <View style={{ flexDirection: 'row', marginBottom: 10 }}>
              <MetricCard
                label="Total Net Capital Gain"
                value={formatCurrency(totalNetCapitalGain)}
                sub={totalNetCapitalGain === 0 ? 'No CGT payable' : 'After exemptions & discount'}
                bgColor={totalNetCapitalGain === 0 ? colors.greenBg : colors.amberBg}
                borderColor={totalNetCapitalGain === 0 ? colors.greenBorder : colors.amberBorder}
                textColor={totalNetCapitalGain === 0 ? colors.green : colors.amber}
              />
              <MetricCard
                label="Total Exempt Gains"
                value={formatCurrency(totalExemptGains)}
                sub="Main residence exemption"
                bgColor={colors.greenBg}
                borderColor={colors.greenBorder}
                textColor={colors.green}
              />
              <MetricCard
                label="Properties Analysed"
                value={String(totalProperties)}
                bgColor={colors.primaryBg}
                borderColor={colors.primaryBorder}
                textColor={colors.primaryLight}
              />
            </View>
          </View>
        )}

        {/* Summary / Description */}
        {analysisData.description && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.textBlock}>
              <RichText style={styles.bodyText}>{analysisData.description}</RichText>
            </View>
          </View>
        )}

        {/* Properties Overview Table */}
        {properties.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Properties Overview</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={{ ...styles.tableHeaderCell, width: '45%' }}>Property</Text>
                <Text style={{ ...styles.tableHeaderCell, width: '20%' }}>Result</Text>
                <Text style={{ ...styles.tableHeaderCell, width: '15%' }}>CGT Payable</Text>
                <Text style={{ ...styles.tableHeaderCell, width: '20%' }}>Net Capital Gain</Text>
              </View>
              {properties.map((property: any, idx: number) => {
                const ncg = property.calculation_summary?.net_capital_gain;
                return (
                  <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                    <Text style={{ ...styles.tableCellBold, width: '45%' }}>{property.property_address}</Text>
                    <Text style={{ ...styles.tableCell, width: '20%' }}>{property.result || 'N/A'}</Text>
                    <Text style={{ ...styles.tableCell, width: '15%', color: property.cgt_payable ? colors.red : colors.green }}>
                      {property.cgt_payable ? 'Yes' : 'No'}
                    </Text>
                    <Text style={{ ...styles.tableCellBold, width: '20%' }}>{ncg !== undefined ? formatCurrency(ncg) : 'N/A'}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <PageFooter pageLabel="Cover Page" />
      </Page>

      {/* ================================================================ */}
      {/* PER-PROPERTY PAGES                                               */}
      {/* ================================================================ */}
      {properties.map((property: any, propIndex: number) => {
        const borderColor = borderColors[propIndex % borderColors.length];
        const timeline = property.timeline || property.timeline_of_events || [];
        const ownershipPeriods = property.ownership_periods || [];
        const calculationSteps = property.calculation_steps || [];
        const costBaseItems = property.cost_base_items || [];
        const calcSummary = property.calculation_summary || {};
        const whatIfScenarios = property.what_if_scenarios || [];
        const importantNotes = property.important_notes || [];
        const warnings = property.warnings || [];
        const applicableRules = property.applicable_rules || [];

        return (
          <Page key={`prop-${propIndex}`} size="A4" style={styles.page} wrap>
            {/* Property Header */}
            <View style={{ ...styles.propertyBar, borderLeftColor: borderColor }}>
              <Text style={styles.propertyAddress}>{property.property_address}</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <Text style={{
                  ...styles.badge,
                  backgroundColor: property.cgt_payable ? colors.redBg : colors.greenBg,
                  color: property.cgt_payable ? colors.red : colors.green,
                }}>
                  {property.result || (property.cgt_payable ? 'CGT PAYABLE' : 'NO CGT')}
                </Text>
              </View>
            </View>

            {/* High-Level Description */}
            {property.high_level_description && (
              <View style={{ marginBottom: 10 }}>
                <View style={{ backgroundColor: colors.tealBg, borderLeftWidth: 3, borderLeftColor: colors.teal, padding: 8, borderRadius: 2 }}>
                  <RichText style={{ ...styles.bodyText, color: '#134e4a' }}>{property.high_level_description}</RichText>
                </View>
              </View>
            )}

            {/* -------------------------------------------------- */}
            {/* SECTION 1: Timeline of Events                      */}
            {/* -------------------------------------------------- */}
            {timeline.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Timeline of Events</Text>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={{ ...styles.tableHeaderCell, width: '20%' }}>Date</Text>
                    <Text style={{ ...styles.tableHeaderCell, width: '20%' }}>Event</Text>
                    <Text style={{ ...styles.tableHeaderCell, width: '60%' }}>Details</Text>
                  </View>
                  {timeline.map((event: any, idx: number) => (
                    <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                      <Text style={{ ...styles.tableCell, width: '20%' }}>{event.date || ''}</Text>
                      <Text style={{ ...styles.tableCellBold, width: '20%' }}>{event.event || ''}</Text>
                      <RichText style={{ ...styles.tableCell, width: '60%' }}>{event.details || ''}</RichText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* -------------------------------------------------- */}
            {/* SECTION 2: Ownership Periods                       */}
            {/* -------------------------------------------------- */}
            {ownershipPeriods.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Ownership Periods</Text>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={{ ...styles.tableHeaderCell, width: '20%' }}>Period Type</Text>
                    <Text style={{ ...styles.tableHeaderCell, width: '17%' }}>Start</Text>
                    <Text style={{ ...styles.tableHeaderCell, width: '17%' }}>End</Text>
                    <Text style={{ ...styles.tableHeaderCell, width: '10%' }}>Days</Text>
                    <Text style={{ ...styles.tableHeaderCell, width: '12%' }}>%</Text>
                    <Text style={{ ...styles.tableHeaderCell, width: '12%' }}>Exempt</Text>
                    <Text style={{ ...styles.tableHeaderCell, width: '12%' }}>Rule</Text>
                  </View>
                  {ownershipPeriods.map((period: any, idx: number) => {
                    const isExempt = period.exempt === 'yes' || period.exempt === true || period.is_exempt === 'yes' || period.is_exempt === true;
                    const isPartial = period.exempt === 'partial' || period.is_exempt === 'partial';
                    const bgColor = isExempt ? colors.greenBg : isPartial ? colors.amberBg : colors.white;
                    return (
                      <View key={idx} style={{ ...styles.tableRow, backgroundColor: bgColor }}>
                        <Text style={{ ...styles.tableCellBold, width: '20%' }}>{period.period_type || ''}</Text>
                        <Text style={{ ...styles.tableCell, width: '17%' }}>{period.start_date || ''}</Text>
                        <Text style={{ ...styles.tableCell, width: '17%' }}>{period.end_date || ''}</Text>
                        <Text style={{ ...styles.tableCell, width: '10%' }}>{formatNumber(period.days)}</Text>
                        <Text style={{ ...styles.tableCell, width: '12%' }}>{period.percentage || ''}</Text>
                        <Text style={{ ...styles.tableCellBold, width: '12%', color: isExempt ? colors.green : isPartial ? colors.amber : colors.gray }}>
                          {isExempt ? 'Yes' : isPartial ? 'Partial' : 'No'}
                        </Text>
                        <Text style={{ ...styles.tableCell, width: '12%', fontSize: 7 }}>{period.rule_applied || period.note || ''}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* -------------------------------------------------- */}
            {/* SECTION 3: Cost Base Items                         */}
            {/* -------------------------------------------------- */}
            {costBaseItems.length > 0 && (
              <View wrap={false}>
                <Text style={styles.sectionTitle}>Cost Base Breakdown</Text>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={{ ...styles.tableHeaderCell, width: '60%' }}>Description</Text>
                    <Text style={{ ...styles.tableHeaderCell, width: '40%', textAlign: 'right' }}>Amount</Text>
                  </View>
                  {costBaseItems.map((item: any, idx: number) => (
                    <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                      <Text style={{ ...styles.tableCell, width: '60%' }}>{item.description || item.name || ''}</Text>
                      <Text style={{ ...styles.tableCellBold, width: '40%', textAlign: 'right' }}>{formatCurrency(item.amount)}</Text>
                    </View>
                  ))}
                  {/* Total row */}
                  {property.total_cost_base && (
                    <View style={{ ...styles.tableRow, backgroundColor: '#1e3a8a' }}>
                      <Text style={{ fontSize: 9, color: colors.white, fontWeight: 'bold', width: '60%' }}>TOTAL COST BASE</Text>
                      <Text style={{ fontSize: 10, color: colors.white, fontWeight: 'bold', width: '40%', textAlign: 'right' }}>
                        {formatCurrency(property.total_cost_base)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* -------------------------------------------------- */}
            {/* SECTION 4: CGT Calculation Steps                   */}
            {/* -------------------------------------------------- */}
            {calculationSteps.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>CGT Calculation Steps</Text>
                {calculationSteps.map((step: any, idx: number) => (
                  <View key={idx} style={styles.stepContainer} wrap={false}>
                    <View style={styles.stepNumberCircle}>
                      <Text style={styles.stepNumberText}>{step.step_number || step.step || idx + 1}</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepTitle}>{step.title || `Step ${step.step_number || idx + 1}`}</Text>
                      {step.description && (
                        <RichText style={{ fontSize: 8, color: colors.gray, lineHeight: 1.4, marginBottom: 2 }}>{step.description}</RichText>
                      )}
                      {(step.formula || step.calculation) && (
                        <Text style={styles.stepFormula}>{step.formula || step.calculation}</Text>
                      )}
                      {step.result !== null && step.result !== undefined && (
                        <Text style={styles.stepResult}>
                          = {typeof step.result === 'number' ? formatCurrency(step.result) : step.result}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* -------------------------------------------------- */}
            {/* SECTION 5: Calculation Summary                     */}
            {/* -------------------------------------------------- */}
            {Object.keys(calcSummary).length > 0 && (
              <View wrap={false}>
                <Text style={styles.sectionTitle}>Calculation Summary</Text>
                <View style={{ ...styles.card, borderColor: colors.primaryBorder }}>
                  {calcSummary.sale_price !== undefined && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 9, color: colors.gray }}>Sale Price (Capital Proceeds)</Text>
                      <Text style={{ fontSize: 9, fontWeight: 'bold', color: colors.black }}>{formatCurrency(calcSummary.sale_price)}</Text>
                    </View>
                  )}
                  {calcSummary.total_cost_base !== undefined && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 9, color: colors.gray }}>Less: Total Cost Base</Text>
                      <Text style={{ fontSize: 9, fontWeight: 'bold', color: colors.red }}>- {formatCurrency(calcSummary.total_cost_base)}</Text>
                    </View>
                  )}
                  {calcSummary.gross_capital_gain !== undefined && (
                    <>
                      <View style={styles.divider} />
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.primary }}>Gross Capital Gain</Text>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.primary }}>{formatCurrency(calcSummary.gross_capital_gain)}</Text>
                      </View>
                    </>
                  )}
                  {calcSummary.main_residence_exemption_percentage !== undefined && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 9, color: colors.gray }}>Main Residence Exemption ({calcSummary.main_residence_exemption_percentage})</Text>
                      <Text style={{ fontSize: 9, fontWeight: 'bold', color: colors.green }}>- {formatCurrency(calcSummary.main_residence_exemption_amount)}</Text>
                    </View>
                  )}
                  {calcSummary.taxable_capital_gain !== undefined && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 9, color: colors.gray }}>Taxable Capital Gain (after exemption)</Text>
                      <Text style={{ fontSize: 9, fontWeight: 'bold', color: colors.amber }}>{formatCurrency(calcSummary.taxable_capital_gain)}</Text>
                    </View>
                  )}
                  {calcSummary.cgt_discount_applicable && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 9, color: colors.gray }}>CGT Discount ({calcSummary.cgt_discount_percentage || '50%'})</Text>
                      <Text style={{ fontSize: 9, fontWeight: 'bold', color: colors.green }}>- {formatCurrency(calcSummary.cgt_discount_amount)}</Text>
                    </View>
                  )}
                  {calcSummary.net_capital_gain !== undefined && (
                    <>
                      <View style={{ ...styles.divider, borderBottomWidth: 2, borderBottomColor: colors.primaryLight }} />
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: calcSummary.net_capital_gain === 0 || calcSummary.net_capital_gain === '$0' ? colors.greenBg : colors.amberBg, padding: 8, borderRadius: 4, marginTop: 4 }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.primary }}>Net Capital Gain</Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: toNumber(calcSummary.net_capital_gain) === 0 ? colors.green : colors.amber }}>
                          {formatCurrency(calcSummary.net_capital_gain)}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            )}

            {/* -------------------------------------------------- */}
            {/* SECTION 5b: Tax on CGT                             */}
            {/* -------------------------------------------------- */}
            {calcSummary.tax_on_cgt && (
              <View wrap={false}>
                <Text style={styles.subsectionTitle}>Tax on Capital Gain</Text>
                <View style={{ ...styles.card, borderColor: colors.indigoBorder }}>
                  {calcSummary.tax_on_cgt.total_taxable_income !== undefined && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 9, color: colors.gray }}>Total Taxable Income</Text>
                      <Text style={{ fontSize: 9, fontWeight: 'bold', color: colors.black }}>{formatCurrency(calcSummary.tax_on_cgt.total_taxable_income)}</Text>
                    </View>
                  )}
                  {calcSummary.tax_on_cgt.cgt_tax_impact !== undefined && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 9, color: colors.gray }}>Tax Attributable to CGT</Text>
                      <Text style={{ fontSize: 9, fontWeight: 'bold', color: colors.indigo }}>{formatCurrency(calcSummary.tax_on_cgt.cgt_tax_impact)}</Text>
                    </View>
                  )}
                  {calcSummary.tax_on_cgt.effective_cgt_rate !== undefined && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 9, color: colors.gray }}>Effective CGT Rate</Text>
                      <Text style={{ fontSize: 9, fontWeight: 'bold', color: colors.indigo }}>{calcSummary.tax_on_cgt.effective_cgt_rate}</Text>
                    </View>
                  )}
                  {calcSummary.tax_on_cgt.financial_year && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 9, color: colors.gray }}>Financial Year</Text>
                      <Text style={{ fontSize: 9, color: colors.black }}>{calcSummary.tax_on_cgt.financial_year}</Text>
                    </View>
                  )}
                  {calcSummary.tax_on_cgt.note && (
                    <View style={{ marginTop: 4 }}>
                      <RichText style={{ fontSize: 7, color: colors.grayLight, lineHeight: 1.4 }}>{calcSummary.tax_on_cgt.note}</RichText>
                    </View>
                  )}
                </View>

                {/* Tax Bracket Breakdown */}
                {calcSummary.tax_on_cgt.cgt_bracket_breakdown && calcSummary.tax_on_cgt.cgt_bracket_breakdown.length > 0 && (
                  <View style={{ marginTop: 6 }}>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', color: colors.indigo, marginBottom: 4 }}>CGT Tax Bracket Breakdown</Text>
                    <View style={styles.table}>
                      <View style={{ ...styles.tableHeader, backgroundColor: colors.indigoBg }}>
                        <Text style={{ ...styles.tableHeaderCell, width: '25%', color: colors.indigo }}>Marginal Rate</Text>
                        <Text style={{ ...styles.tableHeaderCell, width: '25%', color: colors.indigo }}>Income From</Text>
                        <Text style={{ ...styles.tableHeaderCell, width: '25%', color: colors.indigo }}>Income To</Text>
                        <Text style={{ ...styles.tableHeaderCell, width: '25%', color: colors.indigo, textAlign: 'right' }}>Tax Amount</Text>
                      </View>
                      {calcSummary.tax_on_cgt.cgt_bracket_breakdown.map((bracket: any, idx: number) => (
                        <View key={idx} style={styles.tableRow}>
                          <Text style={{ ...styles.tableCellBold, width: '25%' }}>{bracket.marginal_rate}</Text>
                          <Text style={{ ...styles.tableCell, width: '25%' }}>{formatCurrency(bracket.income_from)}</Text>
                          <Text style={{ ...styles.tableCell, width: '25%' }}>{bracket.income_to ? formatCurrency(bracket.income_to) : 'Above'}</Text>
                          <Text style={{ ...styles.tableCellBold, width: '25%', textAlign: 'right' }}>{formatCurrency(bracket.tax_amount)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* -------------------------------------------------- */}
            {/* SECTION 6: What-If Scenarios                       */}
            {/* -------------------------------------------------- */}
            {whatIfScenarios.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>What-If Scenarios</Text>
                {whatIfScenarios.map((scenario: any, idx: number) => (
                  <View key={idx} style={{ ...styles.card, borderLeftWidth: 3, borderLeftColor: colors.purple, marginBottom: 10 }} wrap={false}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.purple, marginBottom: 4 }}>
                      {scenario.title}
                    </Text>
                    {scenario.description && (
                      <RichText style={{ fontSize: 8, color: colors.gray, lineHeight: 1.4, marginBottom: 6 }}>
                        {scenario.description}
                      </RichText>
                    )}
                    {scenario.calculation_steps && scenario.calculation_steps.length > 0 && (
                      <View style={{ marginBottom: 6 }}>
                        {scenario.calculation_steps.map((step: any, sIdx: number) => (
                          <View key={sIdx} style={{ flexDirection: 'row', marginBottom: 3 }}>
                            <Text style={{ fontSize: 7, color: colors.purple, fontWeight: 'bold', width: 16 }}>{step.step_number || sIdx + 1}.</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 8, fontWeight: 'bold', color: colors.black }}>{step.title}</Text>
                              <RichText style={{ fontSize: 7, color: colors.gray }}>{step.details}</RichText>
                              {step.result && <Text style={{ fontSize: 7, color: colors.purple, fontWeight: 'bold' }}>= {step.result}</Text>}
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                    {scenario.result && (
                      <View style={{ backgroundColor: colors.purpleBg, padding: 6, borderRadius: 3, marginTop: 4 }}>
                        <RichText style={{ fontSize: 8, color: colors.gray, lineHeight: 1.4 }}>{scenario.result}</RichText>
                        {scenario.net_capital_gain !== undefined && (
                          <Text style={{ fontSize: 9, fontWeight: 'bold', color: colors.purple, marginTop: 2 }}>
                            Net Capital Gain: {formatCurrency(scenario.net_capital_gain)}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* -------------------------------------------------- */}
            {/* SECTION 7: Important Notes                         */}
            {/* -------------------------------------------------- */}
            {importantNotes.length > 0 && (
              <View wrap={false}>
                <Text style={styles.sectionTitle}>Important Notes</Text>
                <View style={{ ...styles.infoBox, backgroundColor: colors.amberBg, borderColor: colors.amberBorder }}>
                  {importantNotes.map((note: string, idx: number) => (
                    <View key={idx} style={{ flexDirection: 'row', marginBottom: 3 }}>
                      <Text style={{ fontSize: 8, color: colors.amber, marginRight: 4 }}>!</Text>
                      <RichText style={{ fontSize: 8, color: '#92400e', lineHeight: 1.4, flex: 1 }}>{note}</RichText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* -------------------------------------------------- */}
            {/* SECTION 8: Applicable Rules                        */}
            {/* -------------------------------------------------- */}
            {applicableRules.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>Applicable Tax Rules</Text>
                {applicableRules.map((rule: any, idx: number) => (
                  <View key={`rule-${idx}`} style={styles.ruleItem}>
                    <Text style={styles.bullet}>•</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 9, color: colors.primary, lineHeight: 1.4 }}>
                        <Text style={{ fontWeight: 'bold' }}>{rule.rule_name || rule.name}: </Text>
                      </Text>
                      <RichText style={{ fontSize: 9, color: colors.primary, lineHeight: 1.4 }}>
                        {rule.description || rule.explanation || ''}
                      </RichText>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* -------------------------------------------------- */}
            {/* SECTION 9: Warnings                                */}
            {/* -------------------------------------------------- */}
            {warnings.length > 0 && (
              <View wrap={false}>
                <Text style={styles.subsectionTitle}>Warnings</Text>
                {warnings.map((warning: string, idx: number) => (
                  <View key={idx} style={{ ...styles.infoBox, backgroundColor: colors.redBg, borderColor: colors.redBorder, borderLeftWidth: 3, borderLeftColor: colors.red }}>
                    <RichText style={{ fontSize: 8, color: '#991b1b', lineHeight: 1.4 }}>{warning}</RichText>
                  </View>
                ))}
              </View>
            )}

            <PageFooter pageLabel={`Property ${propIndex + 1} of ${totalProperties}`} />
          </Page>
        );
      })}

      {/* ================================================================ */}
      {/* GENERAL NOTES, RULES & REFERENCES PAGE                          */}
      {/* ================================================================ */}
      <Page size="A4" style={styles.page} wrap>
        <SectionBanner title="General Notes, Rules & References" subtitle="Portfolio-level notes, CGT rules applied, and source references" />

        {/* General Notes */}
        {generalNotes.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>General Notes</Text>
            {generalNotes.map((note: string, idx: number) => (
              <View key={idx} style={styles.ruleItem}>
                <Text style={styles.bullet}>•</Text>
                <RichText style={{ flex: 1, fontSize: 9, color: colors.gray, lineHeight: 1.4 }}>{note}</RichText>
              </View>
            ))}
          </View>
        )}

        {/* Rules Applied Summary */}
        {rulesAppliedSummary && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>CGT Rules Applied</Text>
            <View style={{ ...styles.infoBox, backgroundColor: colors.tealBg, borderColor: colors.tealBorder }}>
              <RichText style={{ fontSize: 8, color: colors.gray, lineHeight: 1.5 }}>{rulesAppliedSummary}</RichText>
            </View>
          </View>
        )}

        {/* Source References */}
        {sourceReferences.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>Source References</Text>
            {sourceReferences.map((ref: any, idx: number) => (
              <View key={idx} style={{ ...styles.card, borderLeftWidth: 3, borderLeftColor: colors.emerald }} wrap={false}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                  <Text style={{ ...styles.badge, backgroundColor: colors.emerald, color: colors.white, marginRight: 4 }}>
                    {idx + 1}
                  </Text>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: colors.emerald }}>{ref.title || ref.source_document || `Reference ${idx + 1}`}</Text>
                </View>
                {ref.source_document && ref.title && (
                  <Text style={{ fontSize: 7, color: colors.grayLight }}>{ref.source_document}{ref.page ? ` | Page ${ref.page}` : ''}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Short disclaimer note pointing to full legal page */}
        <View style={{ ...styles.infoBox, backgroundColor: colors.amberBg, borderColor: colors.amberBorder, marginTop: 10 }}>
          <Text style={{ fontSize: 8, fontWeight: 'bold', color: colors.amber, marginBottom: 3 }}>Important</Text>
          <Text style={{ fontSize: 7, color: '#92400e', lineHeight: 1.4 }}>
            This report is generated by an AI-powered analysis tool and is intended for informational purposes only. It does not constitute professional tax advice. Please refer to the Important Legal Notices page at the end of this document for full disclaimers.
          </Text>
        </View>

        {/* Analysis ID Footer */}
        <View style={styles.divider} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 8, color: colors.grayLighter }}>Report generated by CGT Brain AI</Text>
          <Text style={{ fontSize: 8, color: colors.grayLighter }}>Generated: {new Date().toLocaleDateString('en-AU')}</Text>
        </View>

        <PageFooter pageLabel="Notes & References" />
      </Page>

      {/* ================================================================ */}
      {/* LEGAL DISCLAIMERS (LAST PAGE)                                    */}
      {/* ================================================================ */}
      <DisclaimerPage />
    </Document>
  );
}

// ============================================================================
// LEGACY FORMAT REPORT (fallback for old status-based responses)
// ============================================================================

function LegacyReport({ response }: { response: any }) {
  const reportDate = new Date().toLocaleDateString('en-AU');

  // Try to get any useful data for display
  const markdownContent = typeof response.answer === 'string' ? response.answer :
    typeof response.analysis === 'string' ? response.analysis : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={{ marginBottom: 30, paddingBottom: 12, borderBottomWidth: 3, borderBottomColor: colors.primaryLight }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.primary }}>
            CGT Analysis Report
          </Text>
          <Text style={{ fontSize: 11, color: colors.grayLight, marginTop: 4 }}>
            Capital Gains Tax Portfolio Analysis
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
          <View>
            <Text style={{ fontSize: 9, color: colors.grayLight }}>Generated</Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: colors.black }}>{reportDate}</Text>
          </View>
        </View>

        {markdownContent && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.sectionTitle}>Analysis</Text>
            <View style={styles.textBlock}>
              <RichText style={styles.bodyText}>{markdownContent}</RichText>
            </View>
          </View>
        )}

        {!markdownContent && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 11, color: colors.grayLight, textAlign: 'center' }}>
              Analysis data could not be parsed for PDF generation.
            </Text>
            <Text style={{ fontSize: 9, color: colors.grayLighter, textAlign: 'center', marginTop: 8 }}>
              Please use the web interface to view the full analysis.
            </Text>
          </View>
        )}

        {/* Short disclaimer pointing to full legal page */}
        <View style={{ ...styles.infoBox, backgroundColor: colors.amberBg, borderColor: colors.amberBorder, marginTop: 20 }}>
          <Text style={{ fontSize: 8, fontWeight: 'bold', color: colors.amber, marginBottom: 3 }}>Important</Text>
          <Text style={{ fontSize: 7, color: '#92400e', lineHeight: 1.4 }}>
            This report is generated by an AI-powered analysis tool and is intended for informational purposes only. Please refer to the Important Legal Notices page for full disclaimers.
          </Text>
        </View>

        <PageFooter pageLabel="Report" />
      </Page>

      <DisclaimerPage />
    </Document>
  );
}

export default SimplifiedCGTReportPDF;
