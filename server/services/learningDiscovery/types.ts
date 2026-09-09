export type ProviderType = 
  | 'Government' 
  | 'University' 
  | 'Institutional' 
  | 'Educational Platform' 
  | 'Open Learning';

export type SourceTier = 1 | 2 | 3 | 4;

export type SourceType = 'web_discovered' | 'demo_catalogue';

export type VerificationStatus = 
  | 'VERIFIED' 
  | 'PARTIALLY_VERIFIED' 
  | 'UNVERIFIED' 
  | 'BROKEN' 
  | 'REJECTED'
  | 'Verified' 
  | 'Institutional' 
  | 'Not Verified';

export type ResourceType = 
  | 'COURSE'
  | 'TRAINING_PROGRAMME'
  | 'CERTIFICATE_PROGRAMME'
  | 'LEARNING_MODULE'
  | 'OFFICIAL_GUIDE'
  | 'HANDBOOK'
  | 'LECTURE_SERIES'
  | 'OTHER_LEARNING_RESOURCE';

export type CompetencyMatchQuality = 
  | 'DIRECT_MATCH' 
  | 'STRONG_MATCH' 
  | 'PARTIAL_MATCH' 
  | 'WEAK_MATCH' 
  | 'NO_MATCH';

export type SelectionStatus = 
  | 'BEST_MATCH' 
  | 'STRONG_ALTERNATIVE' 
  | 'ALTERNATIVE' 
  | 'LOW_PRIORITY' 
  | 'NOT_RECOMMENDED';

export interface Stage5BQualityBreakdown {
  competencyMatch: number;      // Max 25
  assignmentMatch: number;      // Max 20
  roleMatch: number;            // Max 15
  jobFamilyMatch: number;       // Max 10
  sourceAuthority: number;      // Max 15
  levelFit: number;             // Max 5
  languageFit: number;          // Max 5
  trainingContext: number;      // Max 5
  penalties: number;            // Negative score
  totalScore: number;           // Max 100
}

export interface RankingScores {
  skillMatch: number;        // Max 30
  assignmentMatch: number;   // Max 20
  roleMatch: number;         // Max 15
  jobFamilyMatch: number;    // Max 10
  sourceQuality: number;     // Max 15
  difficultyFit: number;     // Max 5
  languageFit: number;       // Max 5
  totalScore: number;        // Max 100
}

export interface DiscoveredResource {
  id: string | number;
  title: string;
  url: string;
  canonical_url: string;
  provider_name: string;
  provider_type: ProviderType;
  source_tier: SourceTier;
  description: string;
  primary_competency: string;
  secondary_competencies: string[];
  relevant_job_families: string[];
  relevant_roles: string[];
  relevant_assignments: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels' | null;
  language: string;
  estimated_duration: string | null;
  source_type: SourceType;
  verification_status: VerificationStatus;
  verification_reason?: string;
  quality_tier?: number;
  resource_type?: ResourceType;
  competency_match_quality?: CompetencyMatchQuality;
  selection_status?: SelectionStatus;
  selection_reason?: string;
  structured_reasons?: string[];
  why_not_recommended?: string;
  prerequisite_warning?: string;
  is_duplicate_training?: boolean;
  is_accessible?: boolean;
  has_https?: boolean;
  domain_consistent?: boolean;
  discovered_at: string;
  last_verified_at?: string;
  verified_at?: string;
  verification_expires_at?: string;
  ranking_score: number;
  ranking_breakdown?: RankingScores;
  stage5b_breakdown?: Stage5BQualityBreakdown;
  match_reason: string;
  is_best_match?: boolean;
  metadata_json?: Record<string, any>;
}

export interface DiscoveryQuery {
  skillGap: string;
  roleId?: string;
  roleName?: string;
  jobFamilyId?: string;
  jobFamilyName?: string;
  department?: string;
  assignment?: string;
  desiredLevel?: string;
  preferredLanguage?: string;
  learnerId?: number;
  forceRefresh?: boolean;
  previousTraining?: string[];
  currentCompetencyScore?: number;
}

export interface ComparisonTableRow {
  id: string | number;
  title: string;
  provider_name: string;
  selection_status: SelectionStatus;
  fit_score: number;
  source_tier: SourceTier;
  resource_type: ResourceType;
  verification_status: VerificationStatus;
  level: string;
  language: string;
  duration: string;
  url: string;
}

export interface DiscoveryResponse {
  success: boolean;
  status: 'success' | 'fallback';
  status_message: string;
  best_match: DiscoveredResource | null;
  strong_alternatives?: DiscoveredResource[];
  other_options: DiscoveredResource[];
  all_resources: DiscoveredResource[];
  comparison_table?: ComparisonTableRow[];
  future_skills_context?: Array<{
    id: string;
    name: string;
    recommended_proficiency: string;
    explanation: string;
  }>;
  total_found: number;
  source_breakdown: {
    web_discovered: number;
    demo_catalogue: number;
  };
  search_intent?: string;
  learner_context: {
    learner_id?: number;
    role: string;
    assignment: string;
    job_family: string;
    skill_gap: string;
    preferred_language: string;
  };
}
