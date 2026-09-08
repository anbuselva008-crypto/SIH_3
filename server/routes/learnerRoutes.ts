import { Router, type Request, type Response } from 'express';
import { LearnerService } from '../services/learnerService.ts';
import { getDbStatus } from '../database/db.ts';

const router = Router();

/**
 * POST /api/auth/login
 * Prototype Login: Authenticate officer by email address.
 */
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid official email address.',
      });
    }

    const { learner, isNewUser } = await LearnerService.loginOrRegister(email);

    return res.json({
      success: true,
      data: learner,
      isNewUser,
    });
  } catch (error) {
    console.error('Error during officer login:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error during login',
    });
  }
});

/**
 * POST /api/auth/register
 * Register a new statistical officer account.
 */
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid official email address.',
      });
    }

    const { learner, isNewUser } = await LearnerService.loginOrRegister(email, name);

    return res.status(201).json({
      success: true,
      data: learner,
      isNewUser,
    });
  } catch (error) {
    console.error('Error registering officer:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error during registration',
    });
  }
});

/**
 * POST /api/auth/demo
 * Hackathon Demonstration: Load Arun Kumar demo profile.
 */
router.post('/auth/demo', async (req: Request, res: Response) => {
  try {
    const demoLearner = await LearnerService.getDemoAccount();
    return res.json({
      success: true,
      data: demoLearner,
    });
  } catch (error) {
    console.error('Error loading demo account:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load synthetic demo account',
    });
  }
});

/**
 * POST /api/profile/setup
 * First-Time Profile Setup: Saves complete officer background and unlocks assessment.
 */
router.post('/profile/setup', async (req: Request, res: Response) => {
  try {
    const { 
      learner_id, 
      name, 
      role, 
      department, 
      current_assignment, 
      educational_qualification, 
      years_of_experience, 
      previous_training 
    } = req.body;

    if (!learner_id) {
      return res.status(400).json({
        success: false,
        error: 'learner_id is required.',
      });
    }

    const updatedProfile = await LearnerService.saveProfileSetup(parseInt(learner_id, 10), {
      name,
      role,
      department,
      current_assignment,
      educational_qualification,
      years_of_experience: Number(years_of_experience),
      previous_training,
    });

    return res.json({
      success: true,
      message: 'Officer profile successfully configured. Ready for competency assessment.',
      data: updatedProfile,
    });
  } catch (error) {
    console.error('Error saving profile setup:', error);
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Validation error in profile submission',
    });
  }
});

/**
 * GET /api/learner or /api/learner/:id
 * Retrieves the specified learner profile with overall competency score.
 */
router.get(['/learner', '/learner/:id'], async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id || req.query.learner_id || req.query.id;
    const learnerId = rawId ? parseInt(rawId as string, 10) : 1;
    const learner = await LearnerService.getLearnerProfile(learnerId);

    if (!learner) {
      return res.status(404).json({
        success: false,
        error: 'Learner profile not found',
      });
    }

    return res.json({
      success: true,
      data: learner,
    });
  } catch (error) {
    console.error('Error fetching learner:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching learner profile',
    });
  }
});

/**
 * GET /api/competencies
 * Retrieves individual competency scores and indicators for the learner.
 */
router.get('/competencies', async (req: Request, res: Response) => {
  try {
    const learnerId = req.query.learner_id ? parseInt(req.query.learner_id as string, 10) : 1;
    const competencies = await LearnerService.getCompetencies(learnerId);

    return res.json({
      success: true,
      count: competencies.length,
      data: competencies,
    });
  } catch (error) {
    console.error('Error fetching competencies:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching competencies',
    });
  }
});

/**
 * GET /api/assessment/questions
 * Retrieves questions for diagnostic or baseline assessment.
 */
router.get('/assessment/questions', async (req: Request, res: Response) => {
  try {
    const competency = req.query.competency as string | undefined;
    const questions = await LearnerService.getAssessmentQuestions(competency);

    return res.json({
      success: true,
      count: questions.length,
      data: questions,
    });
  } catch (error) {
    console.error('Error fetching assessment questions:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching assessment questions',
    });
  }
});

/**
 * POST /api/assessment/submit
 * Submits learner answers, dynamically updates PostgreSQL competency scores,
 * and generates immediate feedback and skill-gap re-evaluations.
 */
router.post('/assessment/submit', async (req: Request, res: Response) => {
  try {
    const learnerId = req.body.learner_id ? parseInt(req.body.learner_id, 10) : 1;
    const answers = req.body.answers || {};

    const evaluation = await LearnerService.submitAssessment(learnerId, answers);

    return res.json({
      success: true,
      message: 'Assessment evaluated successfully. Competency scores dynamically updated in database.',
      data: evaluation,
    });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while evaluating assessment',
    });
  }
});

/**
 * GET /api/skill-gap
 * Returns comprehensive skill gap analysis, benchmark variances, and prioritized focus areas.
 */
router.get('/skill-gap', async (req: Request, res: Response) => {
  try {
    const learnerId = req.query.learner_id ? parseInt(req.query.learner_id as string, 10) : 1;
    const gapReport = await LearnerService.getSkillGapAnalysis(learnerId);

    return res.json({
      success: true,
      data: gapReport,
    });
  } catch (error) {
    console.error('Error generating skill gap analysis:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while generating skill gap report',
    });
  }
});

/**
 * POST /api/assessment/reset
 * Resets Arun Kumar back to initial baseline data for demo reproducibility.
 */
router.post('/assessment/reset', async (req: Request, res: Response) => {
  try {
    await LearnerService.resetBaseline();
    const learner = await LearnerService.getLearnerProfile(1);
    const competencies = await LearnerService.getCompetencies(1);
    const gapReport = await LearnerService.getSkillGapAnalysis(1);

    return res.json({
      success: true,
      message: 'Learner baseline reset to initial values (Stats: 75, Python: 40, Analysis: 55, Viz: 80).',
      data: {
        learner,
        competencies,
        gapReport,
      },
    });
  } catch (error) {
    console.error('Error resetting baseline:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while resetting baseline',
    });
  }
});

/**
 * GET /api/health
 * Verifies backend and database connectivity.
 */
router.get('/health', (req: Request, res: Response) => {
  try {
    const dbStatus = getDbStatus();
    return res.json({
      status: 'healthy',
      stage: 'Stage 2 - Assessment, Dynamic Scoring & Skill Gap Analysis',
      project: 'AI-Enabled Personalized Learning & Competency Gap Platform for India Official Statistical System',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      status: 'unhealthy',
      error: String(error),
    });
  }
});

export default router;

