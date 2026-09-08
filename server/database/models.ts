export interface Learner {
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
  created_at?: string;
}

export interface Competency {
  id: number;
  learner_id: number;
  name: string;
  score: number;
  max_score: number;
  category: string;
  benchmark_target: number;
  created_at?: string;
}

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
