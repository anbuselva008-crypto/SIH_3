export interface Learner {
  id: number;
  name: string;
  role: string;
  department: string;
  email?: string;
  job_family?: string;
  job_family_id?: string;
  role_id?: string;
  current_assignment?: string;
  educational_qualification?: string;
  years_of_experience?: number;
  previous_training?: string;
  previous_trainings?: string[];
  language_preference?: string;
  profile_completed: boolean;
  is_demo: boolean;
  created_at?: string;
}

export type LearnerProfile = Learner;

export interface Competency {
  id: number;
  learner_id: number;
  name: string;
  competency_name?: string;
  score: number;
  current_score?: number;
  max_score: number;
  category: string;
  benchmark_target: number;
  created_at?: string;
}

export type CompetencyItem = Competency;

export interface LearnerResponse extends Learner {
  overall_score: number;
  competency_count: number;
  top_competency: string;
  focus_competency: string;
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

export interface AssessmentAttempt {
  id: number;
  learner_id: number;
  total_questions: number;
  correct_count: number;
  overall_score: number;
  competency_scores: Record<string, number>;
  completed_at?: string;
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

export interface LearningResource {
  id: number;
  title: string;
  source: 'iGOT' | 'NSSTA';
  competency: string;
  secondary_competencies: string[];
  target_roles: string[];
  relevant_departments: string[];
  relevant_assignments: string[];
  min_recommended_score: number;
  difficulty_level: 'Beginner' | 'Intermediate' | 'Advanced';
  prerequisites: string[];
  estimated_duration: string;
  learning_type: 'Course' | 'Training Programme';
  description: string;
  expected_outcome: string;
  created_at?: string;
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

// ==========================================
// STAGE 4 — Learning Materials & AI Quiz Models
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

// ==========================================
// STAGE 5C — Learning Path Models
// ==========================================

export type StepType = 'Foundation' | 'Concept' | 'Practical' | 'Scenario' | 'Review' | 'Assessment';
export type StepStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'LOCKED';

export interface LearningPath {
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
}

export interface LearningPathStep {
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
  created_at?: string;
}

export interface LearnerPathStepProgress {
  id: number;
  learner_id: number;
  learning_path_id: number;
  step_id: number;
  status: StepStatus;
  started_at?: string | null;
  completed_at?: string | null;
  updated_at?: string;
}

export interface LearningPathWithProgress extends LearningPath {
  steps: Array<LearningPathStep & { status: StepStatus; started_at?: string | null; completed_at?: string | null }>;
  completed_steps_count: number;
  progress_percentage: number;
  active_step_number: number;
}

// ==========================================
// STAGE 5D — Adaptive Weekly Learning Plan Models
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
  preferred_days: string; // comma-separated e.g. "Monday,Wednesday,Friday,Sunday"
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

export interface WeeklyTopicPerformance {
  id: number;
  learner_id: number;
  weekly_plan_id: number;
  topic_name: string;
  mastery_percentage: number;
  status: 'STRONG' | 'CONTINUE' | 'REINFORCE';
  created_at?: string;
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


