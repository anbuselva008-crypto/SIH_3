export type ProviderType = 
  | 'Government' 
  | 'University' 
  | 'Institutional' 
  | 'Educational Platform' 
  | 'Open Learning';

export type SourceTier = 1 | 2 | 3 | 4;

export type SourceType = 'web_discovered' | 'demo_catalogue';

export type VerificationStatus = 'Verified' | 'Institutional' | 'Not Verified';

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
  discovered_at: string;
  last_verified_at?: string;
  ranking_score: number;
  ranking_breakdown?: RankingScores;
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
}

export interface DiscoveryResponse {
  success: boolean;
  status: 'success' | 'fallback';
  status_message: string;
  best_match: DiscoveredResource | null;
  other_options: DiscoveredResource[];
  all_resources: DiscoveredResource[];
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
