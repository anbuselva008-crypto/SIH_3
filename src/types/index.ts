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
  standard_departments: string[];
  typical_assignments: string[];
  default_qualification: string;
  required_competencies: RequiredCompetencySpec[];
  future_skills_focus: string;
}

export interface JobFamily {
  id: string;
  name: string;
  code: string;
  description: string;
  icon_name: string;
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


