// TypeScript types for CGT Model Response

export type IssueType = 'missing_data' | 'warning' | 'info' | 'error';

export interface PropertyHistoryEvent {
  date: string;
  event: string;
  price?: number;
  price_per_week?: number;
  description?: string;
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
