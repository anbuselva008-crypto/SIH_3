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
  HealthResponse 
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
 * Fetches diagnostic assessment questions
 */
export async function getAssessmentQuestions(competency?: string): Promise<AssessmentQuestion[]> {
  const url = competency ? `${BASE_URL}/assessment/questions?competency=${encodeURIComponent(competency)}` : `${BASE_URL}/assessment/questions`;
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

