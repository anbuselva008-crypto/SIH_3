import type { StepType, StepStatus, LearningPath, LearningPathStep, LearningPathWithProgress } from '../../database/models.ts';
import type { DiscoveredResource } from '../learningDiscovery/types.ts';

export interface GeneratePathRequest {
  learnerId: number;
  skillGap: string;
  resource?: DiscoveredResource | null;
  resourceId?: string | number | null;
  targetScore?: number;
  forceNew?: boolean;
}

export interface GeneratedStepPlan {
  stepNumber: number;
  title: string;
  purpose: string;
  stepType: StepType;
  competency: string;
  estimatedEffort?: string | null;
  prerequisite?: string | null;
  prerequisiteMet: boolean;
  resourceUrl?: string;
  sectionRef?: string | null;
  completionCondition: string;
}

export interface GeneratedPathPlan {
  targetCompetency: string;
  currentScore: number;
  targetScore: number;
  currentLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  targetLevel: 'Intermediate' | 'Advanced' | 'Expert';
  learningGoal: string;
  roleName: string;
  assignmentName: string;
  resourceId?: string;
  resourceTitle: string;
  resourceUrl: string;
  providerName: string;
  resourceType: string;
  isOfficialStructure: boolean;
  structureLabel: string;
  totalSteps: number;
  futureSkillNote?: string | null;
  steps: GeneratedStepPlan[];
}

export interface PathSummaryItem {
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

export interface SwitchResourceRequest {
  pathId: number;
  learnerId: number;
  newResource: DiscoveredResource;
}
