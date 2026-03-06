import type { AnalysisData, PropertyAnalysis, Citations } from '@/types/model-response';
import type { SavedScenarioMetadata, SavedScenarioExpectedResult } from './saved-scenarios';

/**
 * Extracts metadata from an AI analysis response for populating saved scenario fields.
 * Handles double-wrapped, single-wrapped, and direct response formats.
 */
export function extractMetadataFromReport(
  aiResponse: any
): Partial<SavedScenarioMetadata> & { expectedResult?: SavedScenarioExpectedResult } {
  const result: Partial<SavedScenarioMetadata> & { expectedResult?: SavedScenarioExpectedResult } = {};

  // ===== Unwrap response to get AnalysisData =====
  const { analysisData, citations } = unwrapResponse(aiResponse);
  if (!analysisData || !analysisData.properties || analysisData.properties.length === 0) {
    return result;
  }

  const props = analysisData.properties;
  const isSingleProperty = props.length === 1;

  // ===== Build description =====
  if (analysisData.description) {
    result.description = analysisData.description;
  } else if (isSingleProperty && props[0].high_level_description) {
    result.description = props[0].high_level_description;
  }

  // ===== Build expectedResult =====
  if (isSingleProperty) {
    result.expectedResult = buildExpectedResultFromProperty(props[0], analysisData);
  } else {
    result.expectedResult = buildExpectedResultMultiProperty(props, analysisData);
  }

  // ===== Build applicableRules =====
  const rules = new Set<string>();
  for (const prop of props) {
    if (prop.applicable_rules) {
      for (const rule of prop.applicable_rules) {
        if (rule.applies && rule.section) {
          rules.add(rule.section);
        }
      }
    }
  }
  // Also include legislation references from citations
  if (citations?.legislation_references) {
    for (const ref of citations.legislation_references) {
      if (ref) rules.add(ref);
    }
  }
  if (rules.size > 0) {
    result.applicableRules = Array.from(rules);
  }

  // ===== Extract userQuery if available =====
  const query = aiResponse?.query
    || aiResponse?.data?.query
    || aiResponse?.data?.data?.query
    || (analysisData as any)?.query;
  if (query && typeof query === 'string') {
    result.userQuery = query;
  }

  return result;
}

// ===== Helpers =====

function unwrapResponse(response: any): { analysisData: AnalysisData | null; citations: Citations | null } {
  if (!response) return { analysisData: null, citations: null };

  // Double-wrapped: response.data.data.properties
  if (
    response.data?.success !== undefined &&
    response.data?.data?.properties?.length > 0
  ) {
    return {
      analysisData: response.data.data as AnalysisData,
      citations: (response.data.sources || null) as Citations | null,
    };
  }

  // Single-wrapped: response.data.properties
  if (
    response.success !== undefined &&
    response.data?.properties?.length > 0
  ) {
    return {
      analysisData: response.data as AnalysisData,
      citations: (response.citations || response.data?.sources || null) as Citations | null,
    };
  }

  // Direct: response.properties
  if (
    response.properties?.length > 0 &&
    response.properties[0]?.property_address
  ) {
    return {
      analysisData: response as AnalysisData,
      citations: (response.citations || null) as Citations | null,
    };
  }

  return { analysisData: null, citations: null };
}

function toNumber(val: string | number | null | undefined): number | undefined {
  if (val === null || val === undefined) return undefined;
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return isNaN(num) ? undefined : num;
}

function determineExemptionType(percentage: number | undefined): string | undefined {
  if (percentage === undefined) return undefined;
  if (percentage >= 100) return 'full';
  if (percentage <= 0) return 'none';
  return 'partial';
}

function buildExpectedResultFromProperty(
  prop: PropertyAnalysis,
  analysisData: AnalysisData
): SavedScenarioExpectedResult {
  const cs = prop.calculation_summary;
  const exemptionPct = toNumber(cs?.main_residence_exemption_percentage);

  const result: SavedScenarioExpectedResult = {};

  const exemptionType = determineExemptionType(exemptionPct);
  if (exemptionType) result.exemption_type = exemptionType;
  if (exemptionPct !== undefined) result.exemption_percentage = exemptionPct;

  const grossGain = toNumber(cs?.gross_capital_gain);
  if (grossGain !== undefined) result.capital_gain = grossGain;

  const taxableGain = toNumber(cs?.taxable_capital_gain);
  if (taxableGain !== undefined) result.taxable_gain = taxableGain;

  const netGain = toNumber(cs?.net_capital_gain) ?? toNumber(analysisData.total_net_capital_gain);
  if (netGain !== undefined) result.net_capital_gain = netGain;

  // CGT payable from tax_on_cgt
  const cgtTaxImpact = toNumber(cs?.tax_on_cgt?.cgt_tax_impact);
  if (cgtTaxImpact !== undefined) result.cgt_payable = cgtTaxImpact;

  // Build notes from result text + important notes
  const noteParts: string[] = [];
  if (prop.result) noteParts.push(prop.result);
  if (prop.important_notes?.length > 0) {
    noteParts.push(...prop.important_notes);
  }
  if (noteParts.length > 0) {
    result.notes = noteParts.join('\n');
  }

  return result;
}

function buildExpectedResultMultiProperty(
  props: PropertyAnalysis[],
  analysisData: AnalysisData
): SavedScenarioExpectedResult {
  const result: SavedScenarioExpectedResult = {};

  // Aggregate gains across properties
  let totalGrossGain = 0;
  let totalTaxableGain = 0;
  let hasGainData = false;

  for (const prop of props) {
    const cs = prop.calculation_summary;
    const gross = toNumber(cs?.gross_capital_gain);
    const taxable = toNumber(cs?.taxable_capital_gain);
    if (gross !== undefined) { totalGrossGain += gross; hasGainData = true; }
    if (taxable !== undefined) { totalTaxableGain += taxable; }
  }

  if (hasGainData) {
    result.capital_gain = totalGrossGain;
    result.taxable_gain = totalTaxableGain;
  }

  // Use portfolio-level total
  const portfolioNet = toNumber(analysisData.total_net_capital_gain);
  if (portfolioNet !== undefined) {
    result.net_capital_gain = portfolioNet;
  }

  // For multi-property, can't determine a single exemption type easily
  // Use "partial" if mixed, or derive from portfolio data
  if (props.length > 0) {
    const exemptionPcts = props
      .map(p => toNumber(p.calculation_summary?.main_residence_exemption_percentage))
      .filter((v): v is number => v !== undefined);

    if (exemptionPcts.length > 0) {
      const allFull = exemptionPcts.every(p => p >= 100);
      const allNone = exemptionPcts.every(p => p <= 0);
      result.exemption_type = allFull ? 'full' : allNone ? 'none' : 'partial';
    }
  }

  // Build notes from all properties
  const noteParts: string[] = [];
  for (const prop of props) {
    if (prop.result) {
      noteParts.push(`${prop.property_address}: ${prop.result}`);
    }
  }
  if (analysisData.general_notes?.length > 0) {
    noteParts.push(...analysisData.general_notes);
  }
  if (noteParts.length > 0) {
    result.notes = noteParts.join('\n');
  }

  return result;
}
