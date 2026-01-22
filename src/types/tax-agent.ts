// Tax Agent System Types

/**
 * Tax Agent account managed by Admin
 */
export interface TaxAgent {
  id: string;                    // nanoid
  email: string;                 // Login email (unique)
  passwordHash: string;          // bcrypt hashed
  name: string;
  role: 'tax_agent' | 'senior_tax_agent';

  // Profile (editable by agent)
  photoBase64?: string;          // Base64 data URL (stored in KV, max ~500KB)
  bio?: string;
  certifications?: string[];
  experienceYears?: number;
  specializations?: string[];
  contactPhone?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;             // Admin username
  isActive: boolean;
}

/**
 * Public view of Tax Agent (no password hash, no admin metadata)
 */
export interface TaxAgentPublic {
  id: string;
  name: string;
  role: 'tax_agent' | 'senior_tax_agent';
  photoBase64?: string;
  bio?: string;
  certifications?: string[];
  experienceYears?: number;
  specializations?: string[];
  contactPhone?: string;
}

/**
 * Submission from user to Tax Agent
 */
export interface TaxAgentSubmission {
  id: string;                    // nanoid
  taxAgentId: string;
  shareId: string;               // Links to existing timeline:${shareId}
  timelineLink: string;          // Full URL to timeline (for easy access)

  // User contact info (visible to Tax Agent)
  userEmail: string;             // Required
  userPhone?: string;            // Optional

  // Status tracking
  status: 'pending' | 'in_progress' | 'reviewed' | 'completed';
  submittedAt: string;
  viewedAt?: string;             // First time Tax Agent opened it
  reviewedAt?: string;
  completedAt?: string;

  // Tax Agent feedback
  agentNotes?: string;           // Private notes (not sent to user)
  feedbackSentAt?: string;       // When feedback email was sent
  feedbackMessage?: string;      // The feedback that was sent

  // Summary info (captured at submission time)
  propertiesCount: number;
  eventsCount: number;
  hasAnalysis: boolean;
  analysisProvider?: string;     // Which LLM was used
}

/**
 * Tax Agent session for authentication
 */
export interface TaxAgentSession {
  agentId: string;
  expiresAt: string;             // ISO date string
}

/**
 * Submission status type
 */
export type SubmissionStatus = 'pending' | 'in_progress' | 'reviewed' | 'completed';

/**
 * Status display info
 */
export const SUBMISSION_STATUS_INFO: Record<SubmissionStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  in_progress: { label: 'In Progress', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  reviewed: { label: 'Reviewed', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  completed: { label: 'Completed', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
};

/**
 * Role display info
 */
export const TAX_AGENT_ROLE_INFO: Record<TaxAgent['role'], { label: string; description: string }> = {
  tax_agent: { label: 'Tax Agent', description: 'Standard Tax Agent' },
  senior_tax_agent: { label: 'Senior Tax Agent', description: 'Senior Tax Agent with additional privileges' },
};

/**
 * API Request/Response types
 */

// Create Tax Agent
export interface CreateTaxAgentRequest {
  email: string;
  password: string;
  name: string;
  role: TaxAgent['role'];
}

export interface CreateTaxAgentResponse {
  success: boolean;
  agent?: TaxAgentPublic;
  error?: string;
}

// Login
export interface TaxAgentLoginRequest {
  email: string;
  password: string;
}

export interface TaxAgentLoginResponse {
  success: boolean;
  token?: string;
  agent?: TaxAgentPublic;
  error?: string;
}

// Update Profile
export interface UpdateTaxAgentProfileRequest {
  bio?: string;
  certifications?: string[];
  experienceYears?: number;
  specializations?: string[];
  contactPhone?: string;
}

// Create Submission
export interface CreateSubmissionRequest {
  taxAgentId: string;
  shareId: string;
  userEmail: string;
  userPhone?: string;
  propertiesCount: number;
  eventsCount: number;
  hasAnalysis: boolean;
  analysisProvider?: string;
}

export interface CreateSubmissionResponse {
  success: boolean;
  submission?: TaxAgentSubmission;
  error?: string;
}

// Update Submission Status
export interface UpdateSubmissionStatusRequest {
  status: SubmissionStatus;
}

// Send Feedback
export interface SendFeedbackRequest {
  message: string;
}

export interface SendFeedbackResponse {
  success: boolean;
  error?: string;
}
