// TypeScript types for CGT Model Response

export type IssueType = 'missing_data' | 'warning' | 'info' | 'error';

export interface PropertyHistoryEvent {
  date: string;
  event: string;
  price?: number;
  price_per_week?: number;
  description?: string;
  contract_date?: string;
  settlement_date?: string;

  // Purchase cost base fields (First Element & Element 2)
  purchase_legal_fees?: number;
  stamp_duty?: number;
  valuation_fees?: number;
  purchase_agent_fees?: number;
  building_inspection?: number;
  pest_inspection?: number;
  title_legal_fees?: number;
  loan_establishment?: number;
  mortgage_insurance?: number;
  conveyancing_fees?: number;
  survey_fees?: number;
  search_fees?: number;
  loan_application_fees?: number;

  // Capital improvement fields (Fourth Element)
  improvement_cost?: number;

  // Element 4: Capital Costs (Non-improvement)
  zoning_change_costs?: number;
  asset_installation_costs?: number;
  asset_relocation_costs?: number;

  // Selling cost base fields (Fifth Element)
  legal_fees?: number;
  agent_fees?: number;
  advertising_costs?: number;
  staging_costs?: number;
  auction_costs?: number;
  mortgage_discharge_fees?: number;
  accountant_fees_purchase?: number;
  tax_agent_fees_sale?: number;

  // Sale event - Australian resident status for CGT
  is_resident?: boolean;

  // Sale event - Previous year capital losses to offset CGT
  previous_year_losses?: number;

  // Element 3: Holding/Ownership Costs
  land_tax?: number;
  council_rates?: number;
  water_rates?: number;
  insurance?: number;
  body_corporate_fees?: number;
  interest_on_borrowings?: number;
  maintenance_costs?: number;
  emergency_services_levy?: number;

  // Element 5: Title Costs
  boundary_dispute?: number;
  title_insurance?: number;
  easement_costs?: number;
  caveat_costs?: number;
  partition_action?: number;
  adverse_possession_defense?: number;

  // Legacy/alternative field names
  sale_legal_fees?: number;
  sale_agent_fees?: number;
  auction_fees?: number;

  // Market value for move_out events (used for CGT apportionment when property changes from PPR to rental)
  market_value?: number;
  // Legacy field names for backwards compatibility
  market_valuation?: number;
  market_value_at_first_income?: number;
}

export interface Property {
  address: string;
  property_history: PropertyHistoryEvent[];
  notes?: string;
}

export interface Issue {
  type: IssueType;
  field?: string;
  message: string;
  severity?: 'low' | 'medium' | 'high';
}

export interface VisualMetrics {
  data_completeness: number; // 0-100
  confidence_score: number; // 0-1
}

export interface ModelResponse {
  summary: string;
  recommendation?: string;
  issues?: Issue[];
  visual_metrics?: VisualMetrics;
  detailed_breakdown?: {
    capital_gain?: number;
    cost_base?: number;
    discount_applied?: number;
    tax_payable?: number;
  };
  // Additional fields from new API format
  metadata?: {
    chunks_retrieved?: number;
    llm_used?: string;
    confidence?: number;
    warnings?: string[];
    retrieved_documents?: any[];
  };
  validation?: {
    citation_check?: any;
    calculation_check?: any;
    logic_check?: any;
    warnings?: string[];
    overall_confidence?: number;
  };
}

export interface AdditionalInfo {
  australian_resident?: boolean;
  other_property_owned?: boolean;
  land_size_hectares?: number;
  marginal_tax_rate?: number;
}

export interface CGTModelResponse {
  properties: Property[];
  user_query?: string;
  additional_info?: AdditionalInfo;
  use_claude?: boolean;
  response: ModelResponse;
}

// ============================================================================
// NEW API RESPONSE TYPES (from /api/v1/analyze-portfolio-json)
// ============================================================================

export interface TimelineEvent {
  date: string;
  event: string;
  details: string;
}

export interface CostBaseItem {
  description: string;
  amount: string | number;
}

export interface KeyFacts {
  property: string;
  purchase_date: string;
  move_in_date: string;
  move_out_date: string;
  rent_start_date: string | null;
  sale_date: string;
  purchase_price: string | number;
  market_value_at_first_rental: string | number | null;
  sale_price: string | number;
  total_ownership_days: number;
  main_residence_days: number;
  non_main_residence_days: number;
}

export interface CGTCalculationStep {
  title: string;
  content: string;
}

export interface CGTCalculation {
  step1: CGTCalculationStep;
  step2: CGTCalculationStep;
  step3: CGTCalculationStep;
  step4: CGTCalculationStep;
  step5: CGTCalculationStep;
  step6: CGTCalculationStep;
  step7: CGTCalculationStep;
  result: string;
}

export interface OwnershipPeriod {
  period_type: string; // e.g., "Total Ownership", "Main Residence", "Rental", "Vacant"
  days: number;
  years: string;
  percentage: string;
  note?: string; // e.g., "s118.110", "s118.145"
}

export interface CalculationStep {
  step_number: number;
  title: string;
  description: string;
  calculation: string | null;
  result: string;
  checks?: string[] | null;
}

export interface WhatIfCalculationStep {
  step_number: number;
  title: string;
  details: string;
  result: string | null;
}

export interface WhatIfScenario {
  title: string;
  description: string;
  example_date: string | null;
  example_details: string | null;
  calculation_steps: WhatIfCalculationStep[];
  result: string;
  net_capital_gain: string | number;
}

export interface CalculationSummary {
  sale_price: string | number;
  total_cost_base: string | number;
  gross_capital_gain: string | number;
  main_residence_exemption_percentage: string | number;
  main_residence_exemption_amount: string | number;
  taxable_capital_gain: string | number;
  cgt_discount_applicable: boolean;
  cgt_discount_percentage: string | number;
  cgt_discount_amount: string | number;
  net_capital_gain: string | number;
}

export interface ApplicableRule {
  section: string;
  name: string;
  description: string;
  applies: boolean;
}

export interface PropertyAnalysis {
  property_address: string;
  high_level_description: string;
  reasoning?: string; // AI's reasoning for CGT determination
  key_facts: KeyFacts;
  purchase_date: string;
  purchase_price: string | number;
  sale_date: string;
  sale_price: string | number;
  total_ownership_days: number;
  total_ownership_years: string;
  total_ownership_months: string | null;
  main_residence_days: number;
  main_residence_percentage: string;
  rental_period_days: number | null;
  rental_period_years: string | null;
  market_value_at_first_rental: string | number | null;
  move_in_date: string;
  move_out_date: string;
  rent_start_date: string | null;
  rent_end_date: string | null;
  timeline_of_events: TimelineEvent[];
  cost_base_items: CostBaseItem[];
  total_cost_base: string | number;
  ownership_periods: OwnershipPeriod[];
  calculation_steps: CalculationStep[];
  cgt_calculation: CGTCalculation;
  calculation_summary: CalculationSummary;
  result: string;
  cgt_payable: boolean;
  applicable_rules: ApplicableRule[];
  what_if_scenarios: WhatIfScenario[];
  important_notes: string[];
  warnings: string[];
}

export interface RuleApplied {
  rule_id: string;
  title: string;
  legislation: string;
  summary: string;
  confidence: number;
  ato_url: string | null;
}

export interface CitationSource {
  title: string;
  legislation: string;
  url: string | null;
  description: string;
}

export interface Citations {
  rules_applied: RuleApplied[];
  legislation_references: string[];
  categories: string[];
  sources: CitationSource[];
}

export interface AnalysisData {
  analysis_date: string;
  total_properties: number;
  description: string;
  properties: PropertyAnalysis[];
  total_net_capital_gain: string | number;
  total_exempt_gains: string | number;
  properties_with_cgt: number;
  properties_fully_exempt: number;
  general_notes: string[];
}

export interface NewAPIResponseData {
  success: boolean;
  needs_clarification: boolean;
  clarification_questions: string[] | null;
  data: AnalysisData;
  error: string | null;
  citations: Citations;
  input_tokens?: number;
  output_tokens?: number;
  cached?: boolean;
  model?: string;
  estimated_cost_usd?: string;
}

export interface NewAPIResponse {
  success: boolean;
  data: NewAPIResponseData;
}
