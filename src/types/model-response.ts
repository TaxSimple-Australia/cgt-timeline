// TypeScript types for CGT Model Response

export type IssueType = 'missing_data' | 'warning' | 'info' | 'error';

export interface PropertyHistoryEvent {
  date: string;
  event: string;
  price?: number;
  price_per_week?: number;
  description?: string;
  contract_date?: string;

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

  // Capital improvement fields (Second Element)
  improvement_cost?: number;

  // Selling cost base fields (Fifth Element)
  legal_fees?: number;
  agent_fees?: number;
  advertising_costs?: number;
  staging_costs?: number;
  auction_costs?: number;
  mortgage_discharge_fees?: number;

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
