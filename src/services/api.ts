import type { 
  LearnerProfile, 
  ProfileSetupPayload,
  CompetencyItem, 
  AssessmentQuestion, 
  AssessmentEvaluation, 
  SkillGapReport, 
  LearningResource,
  RecommendationItem,
  RecommendationResponse,
  ApiResponse, 
  HealthResponse,
  LearningMaterial,
  Quiz,
  QuizAttempt,
  QuizAnswerDetail,
  JobFamily,
  RoleDefinition,
  FutureSkill
} from '../types/index.ts';

const BASE_URL = '/api';

/**
 * Prototype Authentication: Login or create account by official email
 */
export async function loginOfficer(email: string): Promise<{ learner: LearnerProfile; isNewUser: boolean }> {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Login failed (HTTP ${response.status})`);
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to authenticate officer');
  }
  return { learner: result.data, isNewUser: Boolean(result.isNewUser) };
}

/**
 * Prototype Authentication: Register a new officer
 */
export async function registerOfficer(email: string, name?: string): Promise<{ learner: LearnerProfile; isNewUser: boolean }> {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name }),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Registration failed (HTTP ${response.status})`);
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to register officer');
  }
  return { learner: result.data, isNewUser: Boolean(result.isNewUser) };
}

/**
 * Hackathon Demonstration: Load Arun Kumar demo profile
 */
export async function loginDemoAccount(): Promise<LearnerProfile> {
  const response = await fetch(`${BASE_URL}/auth/demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to load demo account (HTTP ${response.status})`);
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to load demo profile');
  }
  return result.data;
}

/**
 * Profile Setup: Saves full officer profile and marks profile_completed = true
 */
export async function saveProfileSetup(payload: ProfileSetupPayload): Promise<LearnerProfile> {
  const response = await fetch(`${BASE_URL}/profile/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to save profile (HTTP ${response.status})`);
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to save profile');
  }
  return result.data;
}

/**
 * Fetches the learner profile from the backend REST API
 */
export async function getLearner(learnerId: number): Promise<LearnerProfile> {
  const response = await fetch(`${BASE_URL}/learner?id=${learnerId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch learner profile (HTTP ${response.status})`);
  }
  const result: ApiResponse<LearnerProfile> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to retrieve learner profile');
  }
  return result.data;
}

/**
 * Fetches competencies for the learner from the backend REST API
 */
export async function getCompetencies(learnerId: number): Promise<CompetencyItem[]> {
  const response = await fetch(`${BASE_URL}/competencies?learner_id=${learnerId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch competencies (HTTP ${response.status})`);
  }
  const result: ApiResponse<CompetencyItem[]> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to retrieve competencies');
  }
  return result.data;
}

/**
 * Fetches diagnostic assessment questions, optionally filtered by competency or cadre role
 */
export async function getAssessmentQuestions(competency?: string, roleId?: string): Promise<AssessmentQuestion[]> {
  const params = new URLSearchParams();
  if (competency) params.append('competency', competency);
  if (roleId) params.append('role_id', roleId);
  const queryStr = params.toString();
  const url = queryStr ? `${BASE_URL}/assessment/questions?${queryStr}` : `${BASE_URL}/assessment/questions`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch assessment questions (HTTP ${response.status})`);
  }
  const result: ApiResponse<AssessmentQuestion[]> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to retrieve assessment questions');
  }
  return result.data;
}

/**
 * Submits assessment responses for dynamic scoring and database update
 */
export async function submitAssessment(
  learnerId: number, 
  answers: Record<number, number>
): Promise<AssessmentEvaluation> {
  const response = await fetch(`${BASE_URL}/assessment/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ learner_id: learnerId, answers }),
  });
  if (!response.ok) {
    throw new Error(`Assessment submission failed (HTTP ${response.status})`);
  }
  const result: ApiResponse<AssessmentEvaluation> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to evaluate assessment');
  }
  return result.data;
}

/**
 * Fetches the comprehensive Skill Gap Analysis report
 */
export async function getSkillGapReport(learnerId: number): Promise<SkillGapReport> {
  const response = await fetch(`${BASE_URL}/skill-gap?learner_id=${learnerId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch skill gap analysis (HTTP ${response.status})`);
  }
  const result: ApiResponse<SkillGapReport> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to retrieve skill gap report');
  }
  return result.data;
}

/**
 * Resets the learner baseline back to initial demo state
 */
export async function resetBaseline(): Promise<{
  learner: LearnerProfile;
  competencies: CompetencyItem[];
  gapReport: SkillGapReport;
}> {
  const response = await fetch(`${BASE_URL}/assessment/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Baseline reset failed (HTTP ${response.status})`);
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to reset baseline');
  }
  return result.data;
}

/**
 * Fetches personalized learning recommendations for the officer
 */
export async function getRecommendations(learnerId: number, regenerate: boolean = false): Promise<RecommendationResponse> {
  const url = `${BASE_URL}/recommendations?learner_id=${learnerId}${regenerate ? '&regenerate=true' : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch recommendations (HTTP ${response.status})`);
  }
  const result: ApiResponse<RecommendationResponse> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to retrieve recommendations');
  }
  return result.data;
}

/**
 * Fetches the catalogue of all learning resources
 */
export async function getLearningResources(): Promise<LearningResource[]> {
  const response = await fetch(`${BASE_URL}/learning-resources`);
  if (!response.ok) {
    throw new Error(`Failed to fetch learning resources catalogue (HTTP ${response.status})`);
  }
  const result: ApiResponse<LearningResource[]> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to retrieve learning resources');
  }
  return result.data;
}

/**
 * Fetches single recommendation details
 */
export async function getRecommendationById(id: number): Promise<RecommendationItem> {
  const response = await fetch(`${BASE_URL}/recommendations/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch recommendation (HTTP ${response.status})`);
  }
  const result: ApiResponse<RecommendationItem> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to retrieve recommendation details');
  }
  return result.data;
}

/**
 * Checks system health and database connectivity
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed (HTTP ${response.status})`);
  }
  return await response.json();
}

// ==========================================
// STAGE 4 — Learning Materials & AI Quiz API
// ==========================================

/**
 * Uploads an official learning material (PDF, PPTX, DOCX, TXT)
 */
export async function uploadLearningMaterial(
  file: File,
  learnerId?: number,
  resourceId?: number
): Promise<{ material: LearningMaterial; chunk_count: number }> {
  const formData = new FormData();
  formData.append('file', file);
  if (learnerId) formData.append('learner_id', String(learnerId));
  if (resourceId) formData.append('learning_resource_id', String(resourceId));

  const response = await fetch(`${BASE_URL}/learning-materials/upload`, {
    method: 'POST',
    body: formData,
  });

  const result: ApiResponse<{ material: LearningMaterial; chunk_count: number }> = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to upload and parse learning material');
  }
  return result.data;
}

/**
 * Fetches linked learning material for a specific resource
 */
export async function getLearningMaterialForResource(resourceId: number): Promise<LearningMaterial | null> {
  const response = await fetch(`${BASE_URL}/learning-materials/resource/${resourceId}`);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch material for resource (HTTP ${response.status})`);
  }
  const result: ApiResponse<LearningMaterial> = await response.json();
  return result.data;
}

/**
 * Generates an AI practice quiz from a learning material
 */
export async function generateQuizFromMaterial(
  materialId: number,
  questionCount: number = 10,
  learnerId?: number
): Promise<Quiz> {
  const response = await fetch(`${BASE_URL}/learning-materials/${materialId}/generate-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question_count: questionCount, learner_id: learnerId }),
  });

  const result: ApiResponse<Quiz> = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to generate quiz from learning material');
  }
  return result.data;
}

/**
 * Generates an AI practice quiz directly from a recommended learning resource
 */
export async function generateQuizFromResource(
  resourceId: number,
  questionCount: number = 10,
  learnerId?: number
): Promise<Quiz> {
  const response = await fetch(`${BASE_URL}/learning-resources/${resourceId}/generate-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question_count: questionCount, learner_id: learnerId }),
  });

  const result: ApiResponse<Quiz> = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to generate AI quiz for course');
  }
  return result.data;
}

/**
 * Fetches full quiz details
 */
export async function getQuiz(quizId: number): Promise<Quiz> {
  const response = await fetch(`${BASE_URL}/quizzes/${quizId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch quiz (HTTP ${response.status})`);
  }
  const result: ApiResponse<Quiz> = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch quiz');
  }
  return result.data;
}

/**
 * Submits quiz attempt answers
 */
export async function submitQuizAttempt(
  quizId: number,
  learnerId: number,
  answers: Record<number, number>
): Promise<{ attempt: QuizAttempt; answers: QuizAnswerDetail[]; message: string }> {
  const response = await fetch(`${BASE_URL}/quizzes/${quizId}/attempt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ learner_id: learnerId, answers }),
  });

  const result: ApiResponse<{ attempt: QuizAttempt; answers: QuizAnswerDetail[] }> = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to submit quiz attempt');
  }
  return {
    attempt: result.data.attempt,
    answers: result.data.answers,
    message: result.message || 'Quiz attempt evaluated successfully',
  };
}

/**
 * Fetches historical quizzes for a learner
 */
export async function getLearnerQuizzes(learnerId: number): Promise<Quiz[]> {
  const response = await fetch(`${BASE_URL}/quizzes/learner/${learnerId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch learner quizzes (HTTP ${response.status})`);
  }
  const result: ApiResponse<Quiz[]> = await response.json();
  return result.data || [];
}

/**
 * Updates quiz review status (Admin audit)
 */
export async function updateQuizReview(
  quizId: number,
  status: 'approved' | 'needs_review' | 'rejected'
): Promise<Quiz> {
  const response = await fetch(`${BASE_URL}/quizzes/${quizId}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const result: ApiResponse<Quiz> = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to update review status');
  }
  return result.data;
}

/**
 * Fetches all government job families from the Universal Government Framework
 */
export async function fetchJobFamilies(): Promise<JobFamily[]> {
  const response = await fetch(`${BASE_URL}/domain/job-families`);
  if (!response.ok) {
    throw new Error(`Failed to fetch job families (HTTP ${response.status})`);
  }
  const result: ApiResponse<JobFamily[]> = await response.json();
  return result.data || [];
}

/**
 * Fetches standard roles for a specified job family
 */
export async function fetchRolesByJobFamily(familyId: string): Promise<RoleDefinition[]> {
  const response = await fetch(`${BASE_URL}/domain/job-families/${familyId}/roles`);
  if (!response.ok) {
    throw new Error(`Failed to fetch roles for family ${familyId} (HTTP ${response.status})`);
  }
  const result: ApiResponse<RoleDefinition[]> = await response.json();
  return result.data || [];
}

/**
 * Resolves a full role profile including required competencies, typical assignments, and future skills
 */
export async function fetchRoleProfile(
  roleId: string, 
  department?: string
): Promise<{ role: RoleDefinition; jobFamily?: JobFamily; futureSkills: FutureSkill[] }> {
  const params = new URLSearchParams();
  params.append('role_id', roleId);
  if (department) params.append('department', department);
  const response = await fetch(`${BASE_URL}/domain/role-profile?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to resolve role profile (HTTP ${response.status})`);
  }
  const result = await response.json();
  return result.data;
}

/**
 * Fetches future skills, optionally filtered by role
 */
export async function fetchFutureSkills(roleId?: string): Promise<FutureSkill[]> {
  const url = roleId ? `${BASE_URL}/domain/future-skills?role_id=${roleId}` : `${BASE_URL}/domain/future-skills`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch future skills (HTTP ${response.status})`);
  }
  const result: ApiResponse<FutureSkill[]> = await response.json();
  return result.data || [];
}

