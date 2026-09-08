// Universal Government Role & Competency Framework Types

export interface JobFamily {
  id: string;
  name: string;
  code: string;
  description: string;
  icon: string;
  domain_color: string;
}

export interface RoleDefinition {
  id: string;
  job_family_id: string;
  name: string;
  domain: string;
  description: string;
  typical_departments: string[];
  typical_assignments: string[];
  required_competencies: Array<{
    name: string;
    category: string;
    required_proficiency: 'Beginner' | 'Intermediate' | 'Advanced';
    benchmark_target: number;
    criticality: string;
    is_mandatory: boolean;
  }>;
  future_competencies: string[];
}

export interface AssignmentDefinition {
  id: string;
  role_id: string;
  name: string;
  description: string;
  priority_competencies: string[];
}

export interface CompetencyCatalogueItem {
  id: string;
  name: string;
  category: string;
  type: 'domain_specific' | 'cross_functional';
  job_family_id?: string;
  description: string;
}

export interface FutureSkillItem {
  id: string;
  name: string;
  job_family_id: string;
  relevant_roles: string[];
  prerequisites: string[];
  recommended_proficiency: 'Beginner' | 'Intermediate' | 'Advanced';
  explanation: string;
  suggested_resource_id?: number;
}

export interface RoleProfileResponse {
  role: RoleDefinition;
  job_family: JobFamily;
  required_competencies: RoleDefinition['required_competencies'];
  future_skills: FutureSkillItem[];
  typical_assignments: string[];
}
