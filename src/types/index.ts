export interface LearnerProfile {
  id: number;
  name: string;
  role: string;
  department: string;
  email?: string;
  current_assignment?: string;
  educational_qualification?: string;
  years_of_experience?: number;
  previous_training?: string;
  profile_completed: boolean;
  is_demo: boolean;
  job_family_id?: string;
  role_id?: string;
  job_family?: string;
  language_preference?: string;
  overall_score: number;
  competency_count: number;
  top_competency: string;
  focus_competency: string;
  created_at?: string;
}

export interface ProfileSetupPayload {
  learner_id: number;
  name: string;
  role: string;
  department: string;
  current_assignment: string;
  educational_qualification: string;
  years_of_experience: number;
  previous_training?: string;
  job_family_id?: string;
  role_id?: string;
  language_preference?: string;
}

export interface CompetencyItem {
  id: number;
  learner_id: number;
  name: string;
  score: number;
  max_score: number;
  category: string;
  benchmark_target: number;
  created_at?: string;
}

export interface AssessmentQuestion {
  id: number;
  competency_name: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  question_text: string;
  options: string[];
  correct_option: number;
  explanation: string;
  concept_tag: string;
  weight: number;
}

export interface QuestionBreakdownItem {
  question_id: number;
  competency: string;
  question_text: string;
  selected_option: number;
  correct_option: number;
  is_correct: boolean;
  explanation: string;
  concept_tag: string;
}

export interface AssessmentEvaluation {
  learner_id: number;
  total_questions: number;
  correct_count: number;
  overall_assessment_percentage: number;
  competency_results: Record<string, { total: number; correct: number; score: number }>;
  question_breakdown: QuestionBreakdownItem[];
  updated_gap_report: SkillGapReport;
}

export interface SkillGapItem {
  competency_id: number;
  name: string;
  category: string;
  score: number;
  benchmark_target: number;
  gap: number;
  gap_percentage: number;
  status: 'benchmark_met' | 'moderate_gap' | 'critical_gap';
  priority_level: 'High' | 'Medium' | 'Low';
  priority_rank: number;
  role_criticality: string;
  action_directive: string;
}

export interface SkillGapReport {
  learner_id: number;
  overall_score: number;
  target_average: number;
  overall_gap: number;
  critical_gaps_count: number;
  moderate_gaps_count: number;
  met_count: number;
  priority_areas: SkillGapItem[];
  all_competencies: SkillGapItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  error?: string;
  message?: string;
}

export interface LearningResource {
  id: number;
  title: string;
  source: 'iGOT' | 'NSSTA';
  competency: string;
  secondary_competencies: string[];
  target_roles: string[];
  relevant_departments: string[];
  relevant_assignments: string[];
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  prerequisites: string;
  expected_outcome: string;
  min_recommended_score: number;
  description: string;
}

export interface RecommendationItem {
  id: number;
  learner_id: number;
  learning_resource_id: number;
  recommendation_score: number;
  priority: 'HIGH PRIORITY' | 'RECOMMENDED NEXT' | 'OPTIONAL / FUTURE';
  reason: string;
  resource: LearningResource;
  current_competency_score: number;
  target_competency_score: number;
  created_at?: string;
}

export interface RecommendationResponse {
  learner_id: number;
  next_step: RecommendationItem | null;
  high_priority: RecommendationItem[];
  recommended_next: RecommendationItem[];
  optional_future: RecommendationItem[];
  all_recommendations: RecommendationItem[];
}

export interface HealthResponse {
  status: string;
  stage: string;
  project: string;
  database: {
    engine: string;
    status: string;
    learners_count: number;
    competencies_count: number;
    questions_count?: number;
    attempts_count?: number;
    materials_count?: number;
    quizzes_count?: number;
  };
  groq_configured?: boolean;
  groq_model?: string;
  timestamp: string;
}

// ==========================================
// STAGE 4 — Learning Materials & AI Quiz Types
// ==========================================

export interface SourceReference {
  page?: string | number | null;
  section?: string | null;
  excerpt?: string | null;
}

export interface LearningMaterial {
  id: number;
  learning_resource_id?: number | null;
  learner_id?: number | null;
  original_filename: string;
  file_type: 'pdf' | 'pptx' | 'docx' | 'txt';
  file_size: number;
  storage_reference?: string;
  source_type: 'linked_demo_resource' | 'user_upload';
  processing_status: 'uploaded' | 'processing' | 'ready' | 'failed';
  extracted_text_reference?: string;
  page_or_section_count: number;
  created_at?: string;
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question_text: string;
  options: string[];
  correct_option: number; // 0..3
  explanation: string;
  competency: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  source_reference: SourceReference | null;
  created_at?: string;
}

export interface Quiz {
  id: number;
  learning_material_id: number;
  learning_resource_id?: number | null;
  learner_id: number;
  title: string;
  competency_name: string;
  question_count: number;
  generation_status: 'ready' | 'failed' | 'flagged';
  review_status: 'approved' | 'needs_review' | 'rejected';
  created_at?: string;
  questions?: QuizQuestion[];
  material?: LearningMaterial;
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  learner_id: number;
  total_questions: number;
  correct_count: number;
  score_percentage: number;
  competency: string;
  feedback?: string;
  completed_at?: string;
  answers?: QuizAnswerDetail[];
}

export interface QuizAnswerDetail {
  id: number;
  attempt_id: number;
  question_id: number;
  question_text: string;
  options: string[];
  selected_option: number;
  correct_option: number;
  is_correct: boolean;
  explanation: string;
  source_reference: SourceReference | null;
}

export interface RequiredCompetencySpec {
  competency_name: string;
  target_level: string;
  benchmark_target: number;
  category: string;
  criticality: 'Core Role Prerequisite' | 'Operational Necessity' | 'Strategic Enhancement';
  description: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  job_family_id: string;
  domain?: string;
  description?: string;
  typical_departments?: string[];
  standard_departments: string[];
  typical_assignments: string[];
  default_qualification: string;
  required_competencies: RequiredCompetencySpec[];
  future_skills_focus: string;
  future_competencies?: string[];
}

export interface JobFamily {
  id: string;
  name: string;
  code: string;
  description: string;
  icon_name?: string;
  icon?: string;
  domain_color?: string;
  roles: RoleDefinition[];
}

export interface FutureSkill {
  id: string;
  role_id: string;
  job_family_id: string;
  skill_name: string;
  category: string;
  horizon: 'Immediate (0-1 yr)' | 'Medium Term (1-3 yrs)' | 'Strategic Future (3-5 yrs)';
  description: string;
  recommended_module_titles: string[];
}

export type SupportedLanguage = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' | 'ml' | 'pa' | 'or';

// ==========================================
// STAGE 5A — Intelligent Learning Discovery Types
// ==========================================

export type DiscoveryProviderType = 
  | 'Government' 
  | 'University' 
  | 'Institutional' 
  | 'Educational Platform' 
  | 'Open Learning';

export type DiscoverySourceTier = 1 | 2 | 3 | 4;

export type DiscoverySourceType = 'web_discovered' | 'demo_catalogue';

export type DiscoveryVerificationStatus = 
  | 'VERIFIED' 
  | 'PARTIALLY_VERIFIED' 
  | 'UNVERIFIED' 
  | 'BROKEN' 
  | 'REJECTED'
  | 'Verified' 
  | 'Institutional' 
  | 'Not Verified';

export type VerificationStatus = DiscoveryVerificationStatus;

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

export interface RankingBreakdown {
  skillMatch: number;
  assignmentMatch: number;
  roleMatch: number;
  jobFamilyMatch: number;
  sourceQuality: number;
  difficultyFit: number;
  languageFit: number;
  totalScore: number;
}

export interface ComparisonTableRow {
  id: string | number;
  title: string;
  provider_name: string;
  selection_status: SelectionStatus;
  fit_score: number;
  source_tier: DiscoverySourceTier;
  resource_type: ResourceType;
  verification_status: DiscoveryVerificationStatus;
  level: string;
  language: string;
  duration: string;
  url: string;
}

export interface DiscoveredResource {
  id: string | number;
  title: string;
  url: string;
  canonical_url: string;
  provider_name: string;
  provider_type: DiscoveryProviderType;
  source_tier: DiscoverySourceTier;
  description: string;
  primary_competency: string;
  secondary_competencies: string[];
  relevant_job_families: string[];
  relevant_roles: string[];
  relevant_assignments: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels' | null;
  language: string;
  estimated_duration: string | null;
  source_type: DiscoverySourceType;
  verification_status: DiscoveryVerificationStatus;
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
  ranking_breakdown?: RankingBreakdown;
  stage5b_breakdown?: Stage5BQualityBreakdown;
  match_reason: string;
  is_best_match?: boolean;
  metadata_json?: Record<string, any>;
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

// ==========================================
// STAGE 5C — Personalized Learning Path Types
// ==========================================

export type StepType = 'Foundation' | 'Concept' | 'Practical' | 'Scenario' | 'Review' | 'Assessment';
export type StepStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'LOCKED';

export interface LearningPathStepItem {
  id: number;
  learning_path_id: number;
  step_number: number;
  title: string;
  purpose: string;
  step_type: StepType;
  competency: string;
  estimated_effort?: string | null;
  prerequisite?: string | null;
  prerequisite_met: boolean;
  resource_url?: string;
  section_ref?: string | null;
  completion_condition: string;
  status: StepStatus;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface LearningPathDetail {
  id: number;
  learner_id: number;
  target_competency: string;
  current_score: number;
  target_score: number;
  current_level: 'Beginner' | 'Intermediate' | 'Advanced';
  target_level: 'Intermediate' | 'Advanced' | 'Expert';
  learning_goal: string;
  role_name: string;
  assignment_name: string;
  resource_id?: string;
  resource_title: string;
  resource_url: string;
  provider_name: string;
  resource_type: string;
  is_official_structure: boolean;
  structure_label: string;
  total_steps: number;
  future_skill_note?: string | null;
  created_at?: string;
  updated_at?: string;
  steps: LearningPathStepItem[];
  completed_steps_count: number;
  progress_percentage: number;
  active_step_number: number;
}

export interface LearningPathSummary {
  id: number;
  target_competency: string;
  current_level: string;
  target_level: string;
  learning_goal: string;
  resource_title: string;
  provider_name: string;
  total_steps: number;
  completed_steps_count: number;
  progress_percentage: number;
  active_step_number: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  updated_at?: string;
}

// ==========================================
// STAGE 5D — Adaptive Weekly Learning Plan Types
// ==========================================

export type AvailabilityMode = 
  | '15_min_day'
  | '30_min_day'
  | '45_min_day'
  | '60_min_day'
  | '2_3_hrs_week'
  | '5_plus_hrs_week'
  | 'custom';

export type PreferredPeriod = 'Morning' | 'Afternoon' | 'Evening' | 'Custom';
export type WeeklyActivityType = 'LEARN' | 'PRACTICE' | 'REVIEW' | 'CHECK' | 'REFLECT';
export type WeeklyPlanStatus = 'ACTIVE' | 'COMPLETED' | 'ADAPTED' | 'PAST';
export type MomentumStatus = 'On Track' | 'Steady' | 'Needs Attention';

export interface LearnerSchedulePreferences {
  id: number;
  learner_id: number;
  availability_mode: AvailabilityMode;
  minutes_per_session: number;
  weekly_minutes_target: number;
  preferred_days: string;
  preferred_period: PreferredPeriod;
  created_at?: string;
  updated_at?: string;
}

export interface WeeklyLearningPlan {
  id: number;
  learner_id: number;
  learning_path_id: number;
  week_number: number;
  version: number;
  status: WeeklyPlanStatus;
  focus_topic: string;
  why_this_matters: string;
  adaptation_reason?: string | null;
  learning_goal: string;
  total_planned_minutes: number;
  completed_minutes: number;
  momentum_status: MomentumStatus;
  week_start?: string | null;
  week_end?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WeeklyLearningItem {
  id: number;
  weekly_plan_id: number;
  day_of_week: string;
  sequence_order: number;
  title: string;
  description: string;
  activity_type: WeeklyActivityType;
  estimated_minutes: number;
  topic_tag: string;
  resource_url?: string | null;
  is_completed: boolean;
  completed_at?: string | null;
  is_carried_forward: boolean;
  priority_level: 'NORMAL' | 'HIGH' | 'REINFORCEMENT';
  created_at?: string;
}

export interface WeeklyCheckpoint {
  id: number;
  weekly_plan_id: number;
  learner_id: number;
  learning_path_id: number;
  week_number: number;
  title: string;
  total_questions: number;
  passing_score: number;
  competency_name: string;
  created_at?: string;
}

export interface WeeklyCheckpointQuestion {
  id: number;
  checkpoint_id: number;
  question_number: number;
  question_text: string;
  options: string[];
  correct_option: number;
  explanation: string;
  topic_tag: string;
  difficulty: string;
  source_reference?: string | null;
  created_at?: string;
}

export interface WeeklyCheckpointResult {
  id: number;
  checkpoint_id: number;
  weekly_plan_id: number;
  learner_id: number;
  total_questions: number;
  correct_count: number;
  score_percentage: number;
  progress_rating: 'Excellent' | 'Good' | 'Developing' | 'Needs Attention';
  strong_topics: string[];
  weak_topics: string[];
  improvement_analysis: string;
  next_week_recommendation: string;
  answers_summary: Record<string, any>;
  completed_at?: string;
}

export interface WeeklyPlanWithItems extends WeeklyLearningPlan {
  items: WeeklyLearningItem[];
  checkpoint?: WeeklyCheckpoint | null;
  latest_result?: WeeklyCheckpointResult | null;
  is_checkpoint_completed: boolean;
  completion_percentage: number;
  schedule_summary?: {
    preferred_days: string[];
    minutes_per_session: number;
    weekly_minutes_target: number;
    preferred_period: string;
  };
}

export interface SchedulePreferencesInput {
  availability_mode?: AvailabilityMode;
  minutes_per_session?: number;
  weekly_minutes_target?: number;
  preferred_days?: string[];
  preferred_period?: PreferredPeriod;
}

export interface PlanAdjustmentInput {
  adjustment_type: 'less_time' | 'more_time' | 'need_practice' | 'already_know';
  reason?: string;
}





