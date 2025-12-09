/**
 * Type definitions for the CGT Analysis Report Display
 * These types represent the transformed data structure for rendering the report
 */

/**
 * Timeline Event - represents a single event in the property timeline
 */
export interface TimelineEvent {
  date: string;
  event: string;
  details: string;
  sortOrder?: number; // For ordering events on the same date
}

/**
 * Calculation Step - represents a single step in the CGT calculation
 */
export interface CalculationStep {
  step: number;
  description: string;
  calculation?: string;
  result?: number | string;
  details?: string;
  note?: string;
  ato_reference?: string;
}

/**
 * Applicable Rule - represents a tax law section applicable to the calculation
 */
export interface ApplicableRule {
  section: string;
  name?: string;
  description?: string;
  source?: string;
  used_in_analysis?: string;
}

/**
 * Report Display Data - complete data structure for rendering a property report
 */
export interface ReportDisplayData {
  propertyAddress: string;
  timelineEvents: TimelineEvent[];
  calculationSteps: CalculationStep[];
  applicableRules: ApplicableRule[];

  // Summary metrics (for display)
  purchasePrice?: number;
  salePrice?: number;
  costBase?: number;
  capitalGain?: number;
  netCapitalGain?: number;
  exemptionType?: string;
  exemptPercentage?: number;
}

/**
 * Missing Field - represents a field that was expected but not found in the API response
 */
export interface MissingField {
  fieldPath: string;
  expectedIn: 'property' | 'calculations' | 'validation';
  impact: 'timeline' | 'calculations' | 'rules' | 'all';
}

/**
 * Transformation Result - includes data and any missing field warnings
 */
export interface TransformationResult {
  reportData: ReportDisplayData;
  missingFields: MissingField[];
  warnings: string[];
}
