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
  };
  timestamp: string;
}


