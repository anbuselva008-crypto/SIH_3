import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { LearnerService } from '../services/learnerService.ts';
import { RecommendationService } from '../services/recommendationService.ts';
import { DocumentService } from '../services/documentService.ts';
import { QuizService } from '../services/quizService.ts';
import { DomainPackService } from '../services/domainPackService.ts';
import { LearningDiscoveryService } from '../services/learningDiscovery/discoveryService.ts';
import { VerificationService } from '../services/learningDiscovery/verificationService.ts';
import { LearningPathService } from '../services/learningPath/learningPathService.ts';
import { AdaptiveLearningPlannerService } from '../services/weeklyPlanner/adaptivePlannerService.ts';
import { getActiveAIProvider } from '../services/aiProvider.ts';
import { getDbStatus } from '../database/db.ts';

const router = Router();

// Configure safe in-memory file upload middleware for learning materials
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
    if (['pdf', 'pptx', 'docx', 'txt'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file format (.${ext}). Only PDF, PPTX, DOCX, and TXT are supported.`));
    }
  },
});

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
      previous_training,
      job_family_id,
      role_id,
      language_preference
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
      job_family_id,
      role_id,
      language_preference,
    });

    // Automatically initialize personalized recommendations based on profile
    try {
      await RecommendationService.generateRecommendations(updatedProfile.id);
    } catch (e) {
      console.warn('Initial recommendation calculation deferred:', e);
    }

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
    const roleId = (req.query.role_id || req.query.role) as string | undefined;
    const questions = await LearnerService.getAssessmentQuestions(competency, roleId);

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

    // Refresh personalized recommendations dynamically after scores update
    try {
      await RecommendationService.generateRecommendations(learnerId);
    } catch (e) {
      console.warn('Recommendation refresh after assessment deferred:', e);
    }

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
    await RecommendationService.generateRecommendations(1);
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
 * GET /api/learning-resources
 * Retrieves the full catalogue of official statistical learning resources (iGOT & NSSTA).
 */
router.get('/learning-resources', async (req: Request, res: Response) => {
  try {
    const resources = await RecommendationService.getAllLearningResources();
    return res.json({
      success: true,
      count: resources.length,
      data: resources,
    });
  } catch (error) {
    console.error('Error fetching learning resources catalogue:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching learning resources',
    });
  }
});

/**
 * GET /api/learning-resources/:id
 * Retrieves specific learning resource details.
 */
router.get('/learning-resources/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const resource = await RecommendationService.getLearningResourceById(id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: 'Learning resource not found in catalogue',
      });
    }
    return res.json({
      success: true,
      data: resource,
    });
  } catch (error) {
    console.error('Error fetching learning resource:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching resource details',
    });
  }
});

/**
 * GET /api/recommendations
 * Generates or retrieves personalized learning recommendations for the specified officer.
 */
router.get('/recommendations', async (req: Request, res: Response) => {
  try {
    const rawId = req.query.learner_id || req.query.id;
    const learnerId = rawId ? parseInt(rawId as string, 10) : 1;

    // Optional query param ?regenerate=true to force re-evaluation
    const regenerate = req.query.regenerate === 'true';

    let recommendations;
    if (regenerate) {
      recommendations = await RecommendationService.generateRecommendations(learnerId);
    } else {
      recommendations = await RecommendationService.getRecommendations(learnerId);
    }

    return res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error('Error generating personalized recommendations:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error while generating recommendations',
    });
  }
});

/**
 * GET /api/recommendations/:id
 * Retrieves a specific recommendation by its record ID.
 */
router.get('/recommendations/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const recommendation = await RecommendationService.getRecommendationById(id);
    if (!recommendation) {
      return res.status(404).json({
        success: false,
        error: 'Recommendation record not found',
      });
    }
    return res.json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    console.error('Error fetching recommendation record:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while fetching recommendation',
    });
  }
});

// =========================================================================
// STAGE 5A — Intelligent Learning Resource Discovery Endpoints
// =========================================================================

/**
 * GET /api/learning-discovery & GET /api/learners/me/learning-discovery
 * Discovers and ranks relevant learning resources (hybrid: live web + demo catalogue)
 * for a specific officer's skill gap, role, and operational assignment.
 */
router.get(['/learning-discovery', '/learners/me/learning-discovery'], async (req: Request, res: Response) => {
  try {
    const rawId = req.query.learner_id || req.query.id;
    const learnerId = rawId ? parseInt(rawId as string, 10) : 1;
    const skill = (req.query.skill as string) || '';
    const forceRefresh = req.query.force_refresh === 'true' || req.query.refresh === 'true';

    const discovery = await LearningDiscoveryService.discoverForLearner(learnerId, skill, forceRefresh);

    return res.json({
      success: true,
      data: discovery,
    });
  } catch (error) {
    console.error('Error in learning discovery:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error during learning resource discovery',
    });
  }
});

/**
 * POST /api/learning-discovery/search
 * Custom search endpoint allowing explicit structured criteria.
 */
router.post('/learning-discovery/search', async (req: Request, res: Response) => {
  try {
    const {
      skill,
      role,
      assignment,
      job_family,
      department,
      language,
      learner_id,
      force_refresh,
    } = req.body;

    if (!skill || typeof skill !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Skill gap parameter is required for learning discovery',
      });
    }

    const discovery = await LearningDiscoveryService.discoverResources({
      skillGap: skill,
      roleName: role,
      assignment,
      jobFamilyName: job_family,
      department,
      preferredLanguage: language || 'en',
      learnerId: learner_id ? parseInt(learner_id, 10) : undefined,
      forceRefresh: Boolean(force_refresh),
    });

    return res.json({
      success: true,
      data: discovery,
    });
  } catch (error) {
    console.error('Error in custom learning discovery search:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error during search',
    });
  }
});

/**
 * GET /api/learners/me/best-learning-options
 * Stage 5B endpoint: returns the curated Best Match, Strong Alternatives, Comparison Table, and Future Skills.
 */
router.get('/learners/me/best-learning-options', async (req: Request, res: Response) => {
  try {
    const rawId = req.query.learner_id || req.query.id;
    const learnerId = rawId ? parseInt(rawId as string, 10) : 1;
    const skill = (req.query.skill as string) || '';
    const forceRefresh = req.query.force_refresh === 'true' || req.query.refresh === 'true';

    const discovery = await LearningDiscoveryService.discoverForLearner(learnerId, skill, forceRefresh);

    return res.json({
      success: true,
      data: {
        best_match: discovery.best_match,
        strong_alternatives: discovery.strong_alternatives || [],
        comparison_table: discovery.comparison_table || [],
        future_skills_context: discovery.future_skills_context || [],
        learner_context: discovery.learner_context,
        total_evaluated: discovery.total_found,
      },
    });
  } catch (error) {
    console.error('Error fetching best learning options:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve best learning options',
    });
  }
});

/**
 * GET /api/learning-resources/verify
 * Audits and returns real-time verification details for any URL.
 */
router.get('/learning-resources/verify', async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ success: false, error: 'url query parameter is required' });
    }

    const dummyResource: any = {
      title: (req.query.title as string) || '',
      url,
      provider_name: (req.query.provider as string) || '',
      source_type: 'web_discovered',
      description: '',
    };

    const audit = VerificationService.verifyResource(dummyResource);
    return res.json({
      success: true,
      data: audit,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Verification check failed' });
  }
});

// ==========================================
// STAGE 4 — Learning Materials & AI Quiz Endpoints
// ==========================================

/**
 * POST /api/learning-materials/upload
 * Securely uploads and extracts learning documents (PDF, PPTX, DOCX, TXT).
 */
router.post('/learning-materials/upload', upload.single('file') as any, async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file was uploaded. Please provide a valid PDF, PPTX, DOCX, or TXT file.',
      });
    }

    const learnerId = req.body.learner_id ? parseInt(req.body.learner_id, 10) : undefined;
    const learningResourceId = req.body.learning_resource_id ? parseInt(req.body.learning_resource_id, 10) : undefined;

    const result = await DocumentService.processUploadedDocument(
      file.buffer,
      file.originalname,
      file.mimetype,
      learnerId,
      learningResourceId
    );

    return res.status(201).json({
      success: true,
      message: `Document "${file.originalname}" successfully processed (${result.chunks.length} sections indexed).`,
      data: {
        material: result.material,
        page_or_section_count: result.parsedDoc.pageOrSectionCount,
        file_type: result.parsedDoc.fileType,
        chunk_count: result.chunks.length,
      },
    });
  } catch (error) {
    console.error('Error uploading learning document:', error);
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process uploaded learning document.',
    });
  }
});

/**
 * GET /api/learning-materials/:id
 * Retrieves metadata for a specific learning material.
 */
router.get('/learning-materials/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const material = await DocumentService.getMaterialById(id);
    if (!material) {
      return res.status(404).json({
        success: false,
        error: 'Learning material not found.',
      });
    }
    return res.json({
      success: true,
      data: material,
    });
  } catch (error) {
    console.error('Error fetching learning material:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve learning material.',
    });
  }
});

/**
 * GET /api/learning-materials/resource/:resourceId
 * Retrieves linked learning material for a Stage 3 learning resource.
 */
router.get('/learning-materials/resource/:resourceId', async (req: Request, res: Response) => {
  try {
    const resourceId = parseInt(req.params.resourceId, 10);
    const material = await DocumentService.getMaterialForResource(resourceId);
    if (!material) {
      return res.status(404).json({
        success: false,
        error: 'No learning material linked to this resource yet.',
      });
    }
    return res.json({
      success: true,
      data: material,
    });
  } catch (error) {
    console.error('Error fetching material for resource:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve material for resource.',
    });
  }
});

/**
 * POST /api/learning-materials/:id/generate-quiz
 * Generates grounded AI practice quiz from a learning material.
 */
router.post('/learning-materials/:id/generate-quiz', async (req: Request, res: Response) => {
  try {
    const materialId = parseInt(req.params.id, 10);
    const rawCount = req.body.question_count;
    const questionCount = rawCount === 5 || rawCount === 15 ? rawCount : 10;
    const learnerId = req.body.learner_id ? parseInt(req.body.learner_id, 10) : undefined;

    const quiz = await QuizService.generateAndSaveQuiz(materialId, {
      questionCount,
      learnerId,
    });

    return res.status(201).json({
      success: true,
      message: `AI Practice Quiz generated (${quiz.questions?.length} questions). Grounded strictly in official learning material.`,
      data: quiz,
    });
  } catch (error) {
    console.error('Error generating AI quiz from material:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "We couldn't generate the quiz right now. Please try again in a moment.",
    });
  }
});

/**
 * POST /api/learning-resources/:id/generate-quiz
 * Generates an AI practice quiz directly from a recommended learning resource.
 */
router.post('/learning-resources/:id/generate-quiz', async (req: Request, res: Response) => {
  try {
    const resourceId = parseInt(req.params.id, 10);
    const rawCount = req.body.question_count;
    const questionCount = rawCount === 5 || rawCount === 15 ? rawCount : 10;
    const learnerId = req.body.learner_id ? parseInt(req.body.learner_id, 10) : 1;

    // Locate linked material or create default
    let material = await DocumentService.getMaterialForResource(resourceId);
    if (!material) {
      // Create on-demand demo material
      const resData = await RecommendationService.getLearningResourceById(resourceId);
      if (!resData) {
        return res.status(404).json({
          success: false,
          error: 'Learning resource not found in catalogue.',
        });
      }
      const dummyBuffer = Buffer.from(
        `Official Course Notes: ${resData.title}\n\n[Section 1: Core Principles]\n${resData.description}\n\n[Section 2: Expected Outcome]\n${resData.expected_outcome}`
      );
      const created = await DocumentService.processUploadedDocument(
        dummyBuffer,
        `${resData.title.replace(/[^a-zA-Z0-9]/g, '_')}_Notes.txt`,
        'text/plain',
        learnerId,
        resourceId
      );
      material = created.material;
    }

    const quiz = await QuizService.generateAndSaveQuiz(material.id, {
      questionCount,
      learnerId,
    });

    return res.status(201).json({
      success: true,
      message: `AI Practice Quiz created for "${quiz.title}".`,
      data: quiz,
    });
  } catch (error) {
    console.error('Error generating quiz for learning resource:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "We couldn't generate the quiz right now. Please try again in a moment.",
    });
  }
});

/**
 * GET /api/quizzes/:id
 * Retrieves full quiz including questions, explanations, and source references.
 */
router.get('/quizzes/:id', async (req: Request, res: Response) => {
  try {
    const quizId = parseInt(req.params.id, 10);
    const quiz = await QuizService.getQuizById(quizId);
    return res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return res.status(404).json({
      success: false,
      error: 'Quiz not found.',
    });
  }
});

/**
 * GET /api/quizzes/:id/questions
 * Retrieves questions for an active quiz session.
 */
router.get('/quizzes/:id/questions', async (req: Request, res: Response) => {
  try {
    const quizId = parseInt(req.params.id, 10);
    const quiz = await QuizService.getQuizById(quizId);
    // Return sanitized questions without revealing correct answer during exam
    const activeQuestions = quiz.questions?.map((q) => ({
      id: q.id,
      quiz_id: q.quiz_id,
      question_text: q.question_text,
      options: q.options,
      competency: q.competency,
      difficulty: q.difficulty,
    }));

    return res.json({
      success: true,
      data: {
        quiz_id: quiz.id,
        title: quiz.title,
        competency_name: quiz.competency_name,
        question_count: quiz.question_count,
        questions: activeQuestions,
      },
    });
  } catch (error) {
    console.error('Error fetching active quiz questions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load quiz questions.',
    });
  }
});

/**
 * POST /api/quizzes/:id/attempt
 * Submits quiz answers, evaluates score, records evidence (without destroying baseline).
 */
router.post('/quizzes/:id/attempt', async (req: Request, res: Response) => {
  try {
    const quizId = parseInt(req.params.id, 10);
    const learnerId = req.body.learner_id ? parseInt(req.body.learner_id, 10) : 1;
    const answers = req.body.answers || {};

    const result = await QuizService.submitQuizAttempt({
      quiz_id: quizId,
      learner_id: learnerId,
      answers,
    });

    return res.json({
      success: true,
      message: result.message,
      data: {
        attempt: result.attempt,
        answers: result.answers,
      },
    });
  } catch (error) {
    console.error('Error submitting quiz attempt:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to evaluate quiz attempt.',
    });
  }
});

/**
 * GET /api/quizzes/:id/result/:attemptId
 * Retrieves detailed result for a quiz attempt.
 */
router.get('/quizzes/:id/result/:attemptId', async (req: Request, res: Response) => {
  try {
    const attemptId = parseInt(req.params.attemptId, 10);
    const result = await QuizService.getAttemptResult(attemptId);
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Quiz attempt record not found.',
      });
    }
    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching quiz attempt result:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch quiz result.',
    });
  }
});

/**
 * GET /api/quizzes/learner/:learnerId
 * Retrieves past quizzes taken by learner.
 */
router.get('/quizzes/learner/:learnerId', async (req: Request, res: Response) => {
  try {
    const learnerId = parseInt(req.params.learnerId, 10);
    const quizzes = await QuizService.getLearnerQuizzes(learnerId);
    return res.json({
      success: true,
      count: quizzes.length,
      data: quizzes,
    });
  } catch (error) {
    console.error('Error fetching learner quizzes:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch learner quizzes.',
    });
  }
});

/**
 * PATCH /api/quizzes/:id/review
 * Administrator review audit endpoint (approved | needs_review | rejected).
 */
router.patch('/quizzes/:id/review', async (req: Request, res: Response) => {
  try {
    const quizId = parseInt(req.params.id, 10);
    const status = req.body.status;
    if (!['approved', 'needs_review', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid review status. Must be "approved", "needs_review", or "rejected".',
      });
    }
    const updated = await QuizService.updateReviewStatus(quizId, status);
    return res.json({
      success: true,
      message: `Quiz #${quizId} review status updated to ${status}.`,
      data: updated,
    });
  } catch (error) {
    console.error('Error updating quiz review status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update review status.',
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
    const activeProvider = getActiveAIProvider();
    return res.json({
      status: 'healthy',
      stage: 'Stage 4 - AI-Powered Learning Material Intelligence & AI Quiz Generation',
      project: 'AI-Enabled Personalized Learning & Competency Gap Platform for India Official Statistical System',
      database: dbStatus,
      ai_provider: activeProvider?.name || 'Deterministic Grounded Generator',
      ai_available: Boolean(activeProvider?.isAvailable()),
      gemini_configured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0),
      groq_configured: Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0),
      groq_model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      status: 'unhealthy',
      error: String(error),
    });
  }
});

/**
 * GET /api/domain/job-families
 * Returns all government job families in the Universal Government Framework.
 */
router.get('/domain/job-families', (_req: Request, res: Response) => {
  try {
    const families = DomainPackService.getAllJobFamilies();
    return res.json({
      success: true,
      data: families,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve job families' });
  }
});

/**
 * GET /api/domain/job-families/:id/roles
 * Returns all standard cadre roles belonging to a specific job family.
 */
router.get('/domain/job-families/:id/roles', (req: Request, res: Response) => {
  try {
    const roles = DomainPackService.getRolesByJobFamily(req.params.id);
    return res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve family roles' });
  }
});

/**
 * GET /api/domain/roles
 * Returns all roles across all job families.
 */
router.get('/domain/roles', (_req: Request, res: Response) => {
  try {
    const roles = DomainPackService.getAllRoles();
    return res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve roles' });
  }
});

/**
 * GET /api/domain/role-profile
 * Resolves a role definition, required competencies, typical assignments, and future skills.
 */
router.get('/domain/role-profile', (req: Request, res: Response) => {
  try {
    const roleIdentifier = (req.query.role_id || req.query.role) as string;
    const department = req.query.department as string | undefined;
    if (!roleIdentifier) {
      return res.status(400).json({ success: false, error: 'role_id or role query parameter is required' });
    }
    const role = DomainPackService.resolveRole(roleIdentifier, department);
    const futureSkills = DomainPackService.getFutureSkillsForRole(role.id);
    const jobFamily = DomainPackService.getJobFamilyById(role.job_family_id);

    return res.json({
      success: true,
      data: {
        role,
        jobFamily,
        futureSkills,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to resolve role profile' });
  }
});

/**
 * GET /api/domain/future-skills
 * Returns strategic future skills for an officer's cadre role or all future skills.
 */
router.get('/domain/future-skills', (req: Request, res: Response) => {
  try {
    const roleId = req.query.role_id as string | undefined;
    if (roleId) {
      const skills = DomainPackService.getFutureSkillsForRole(roleId);
      return res.json({ success: true, data: skills });
    }
    const allSkills = DomainPackService.getAllFutureSkills();
    return res.json({ success: true, data: allSkills });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve future skills' });
  }
});

// ==========================================
// STAGE 5C — Personalized Learning Path Endpoints
// ==========================================

/**
 * POST /api/learning-paths/generate
 * Generates or retrieves a personalized, progressive learning path for an officer's skill gap.
 */
router.post('/learning-paths/generate', async (req: Request, res: Response) => {
  try {
    const { learner_id, skill_gap, resource, resource_id, target_score, force_new } = req.body;
    const learnerId = parseInt(learner_id, 10);
    if (isNaN(learnerId) || !skill_gap) {
      return res.status(400).json({
        success: false,
        error: 'learner_id and skill_gap are required to build a learning path.',
      });
    }

    const path = await LearningPathService.generateOrGetPath({
      learnerId,
      skillGap: skill_gap,
      resource: resource || null,
      resourceId: resource_id || null,
      targetScore: target_score ? parseInt(target_score, 10) : 75,
      forceNew: Boolean(force_new),
    });

    return res.json({
      success: true,
      data: path,
    });
  } catch (error) {
    console.error('Error generating learning path:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate learning path',
    });
  }
});

/**
 * GET /api/learners/:id/learning-paths
 * Returns all learning paths created for a learner.
 */
router.get('/learners/:id/learning-paths', async (req: Request, res: Response) => {
  try {
    const learnerId = parseInt(req.params.id, 10);
    if (isNaN(learnerId)) {
      return res.status(400).json({ success: false, error: 'Invalid learner ID' });
    }

    const paths = await LearningPathService.getLearnerPaths(learnerId);
    return res.json({
      success: true,
      data: paths,
    });
  } catch (error) {
    console.error('Error retrieving learner paths:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve learner paths',
    });
  }
});

/**
 * GET /api/learning-paths/:id
 * Returns a specific learning path with all steps and learner progress.
 */
router.get('/learning-paths/:id', async (req: Request, res: Response) => {
  try {
    const pathId = parseInt(req.params.id, 10);
    const rawLearnerId = req.query.learner_id || req.query.id;
    const learnerId = rawLearnerId ? parseInt(rawLearnerId as string, 10) : 1;

    if (isNaN(pathId) || isNaN(learnerId)) {
      return res.status(400).json({ success: false, error: 'Invalid path ID or learner ID' });
    }

    const path = await LearningPathService.getFullPathWithProgress(pathId, learnerId);
    return res.json({
      success: true,
      data: path,
    });
  } catch (error) {
    console.error('Error retrieving learning path:', error);
    return res.status(404).json({
      success: false,
      error: error instanceof Error ? error.message : 'Learning path not found',
    });
  }
});

/**
 * POST /api/learning-paths/:id/steps/:stepId/start
 * Starts a step (marks as IN_PROGRESS).
 */
router.post('/learning-paths/:id/steps/:stepId/start', async (req: Request, res: Response) => {
  try {
    const pathId = parseInt(req.params.id, 10);
    const stepId = parseInt(req.params.stepId, 10);
    const learnerId = req.body.learner_id ? parseInt(req.body.learner_id, 10) : 1;

    const path = await LearningPathService.startStep(pathId, stepId, learnerId);
    return res.json({
      success: true,
      data: path,
    });
  } catch (error) {
    console.error('Error starting step:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start step',
    });
  }
});

/**
 * POST /api/learning-paths/:id/steps/:stepId/complete
 * Marks a step as COMPLETED, records timestamp, and unlocks next step.
 */
router.post('/learning-paths/:id/steps/:stepId/complete', async (req: Request, res: Response) => {
  try {
    const pathId = parseInt(req.params.id, 10);
    const stepId = parseInt(req.params.stepId, 10);
    const learnerId = req.body.learner_id ? parseInt(req.body.learner_id, 10) : 1;

    const path = await LearningPathService.completeStep(pathId, stepId, learnerId);
    return res.json({
      success: true,
      data: path,
    });
  } catch (error) {
    console.error('Error completing step:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete step',
    });
  }
});

/**
 * GET /api/learning-paths/:id/alternatives
 * Provides verified Stage 5B alternatives for switching resource.
 */
router.get('/learning-paths/:id/alternatives', async (req: Request, res: Response) => {
  try {
    const pathId = parseInt(req.params.id, 10);
    const rawLearnerId = req.query.learner_id || req.query.id;
    const learnerId = rawLearnerId ? parseInt(rawLearnerId as string, 10) : 1;

    const alternatives = await LearningPathService.getAlternativeResources(pathId, learnerId);
    return res.json({
      success: true,
      data: alternatives,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve alternatives' });
  }
});

/**
 * POST /api/learning-paths/:id/switch-resource
 * Switches resource of an existing path to an alternative verified resource.
 */
router.post('/learning-paths/:id/switch-resource', async (req: Request, res: Response) => {
  try {
    const pathId = parseInt(req.params.id, 10);
    const { learner_id, new_resource } = req.body;
    const learnerId = parseInt(learner_id, 10);

    if (!new_resource) {
      return res.status(400).json({ success: false, error: 'new_resource is required' });
    }

    const updatedPath = await LearningPathService.switchResource(pathId, learnerId, new_resource);
    return res.json({
      success: true,
      data: updatedPath,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to switch resource',
    });
  }
});

/**
 * GET /api/learning-paths/:id/quiz
 * Connects the Assessment step to Stage 4 Grounded AI Quiz.
 */
router.get('/learning-paths/:id/quiz', async (req: Request, res: Response) => {
  try {
    const pathId = parseInt(req.params.id, 10);
    const rawLearnerId = req.query.learner_id || req.query.id;
    const learnerId = rawLearnerId ? parseInt(rawLearnerId as string, 10) : 1;

    const quiz = await LearningPathService.getOrCreatePracticeQuiz(pathId, learnerId);
    return res.json({
      success: true,
      data: quiz,
    });
  } catch (error) {
    console.error('Error fetching learning path quiz:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve learning path quiz',
    });
  }
});

// ==========================================
// STAGE 5D — Adaptive Weekly Learning Plan Routes
// ==========================================

/**
 * GET /api/learners/:id/schedule-preferences or /api/learners/me/schedule-preferences
 * Retrieves schedule availability preferences for an officer.
 */
router.get(['/learners/:id/schedule-preferences', '/learners/me/schedule-preferences'], async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id === 'me' ? null : req.params.id;
    const queryId = req.query.learner_id || req.query.id;
    const learnerId = rawId ? parseInt(rawId, 10) : queryId ? parseInt(queryId as string, 10) : 1;

    const preferences = await AdaptiveLearningPlannerService.getSchedulePreferences(learnerId);
    return res.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error('Error fetching schedule preferences:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch schedule preferences',
    });
  }
});

/**
 * PUT /api/learners/:id/schedule-preferences or /api/learners/me/schedule-preferences
 * Updates availability mode, session minutes, study days, and study period.
 */
router.put(['/learners/:id/schedule-preferences', '/learners/me/schedule-preferences'], async (req: Request, res: Response) => {
  try {
    const rawId = req.params.id === 'me' ? null : req.params.id;
    const queryId = req.body.learner_id || req.query.learner_id;
    const learnerId = rawId ? parseInt(rawId, 10) : queryId ? parseInt(queryId as string, 10) : 1;

    const updated = await AdaptiveLearningPlannerService.saveSchedulePreferences(learnerId, req.body);
    return res.json({
      success: true,
      message: 'Schedule preferences updated successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('Error saving schedule preferences:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save schedule preferences',
    });
  }
});

/**
 * GET /api/learners/:id/weekly-plan/latest
 * Retrieves the latest or active weekly learning plan for this learner across all paths.
 */
router.get('/learners/:id/weekly-plan/latest', async (req: Request, res: Response) => {
  try {
    const learnerId = parseInt(req.params.id, 10);
    const plan = await AdaptiveLearningPlannerService.getLatestWeeklyPlanForLearner(learnerId);
    return res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error('Error fetching latest weekly plan for learner:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve latest weekly plan',
    });
  }
});

/**
 * POST /api/learning-paths/:id/weekly-plan/generate
 * Generates or activates a weekly learning plan for the specified learning path.
 */
router.post('/learning-paths/:id/weekly-plan/generate', async (req: Request, res: Response) => {
  try {
    const pathId = parseInt(req.params.id, 10);
    const rawLearnerId = req.body.learner_id || req.body.learnerId || req.query.learner_id;
    const learnerId = rawLearnerId ? parseInt(rawLearnerId as string, 10) : 1;
    const forceGenerate = Boolean(req.body.force_generate || req.body.forceNew);

    const plan = await AdaptiveLearningPlannerService.getActiveWeeklyPlan(pathId, learnerId, forceGenerate);
    return res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error('Error generating weekly plan:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate weekly plan',
    });
  }
});

/**
 * GET /api/learning-paths/:id/weekly-plan/current
 * Retrieves the current active weekly learning plan.
 */
router.get('/learning-paths/:id/weekly-plan/current', async (req: Request, res: Response) => {
  try {
    const pathId = parseInt(req.params.id, 10);
    const rawLearnerId = req.query.learner_id || req.query.id;
    const learnerId = rawLearnerId ? parseInt(rawLearnerId as string, 10) : 1;

    const plan = await AdaptiveLearningPlannerService.getActiveWeeklyPlan(pathId, learnerId, false);
    return res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error('Error fetching current weekly plan:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve active weekly plan',
    });
  }
});

/**
 * GET /api/learning-paths/:id/weekly-plan/history
 * Retrieves all weekly plans (past and active) for this learning path.
 */
router.get('/learning-paths/:id/weekly-plan/history', async (req: Request, res: Response) => {
  try {
    const pathId = parseInt(req.params.id, 10);
    const rawLearnerId = req.query.learner_id || req.query.id;
    const learnerId = rawLearnerId ? parseInt(rawLearnerId as string, 10) : 1;

    const history = await AdaptiveLearningPlannerService.getPlanHistory(pathId, learnerId);
    return res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching plan history:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve plan history',
    });
  }
});

/**
 * POST /api/weekly-plans/:id/items/:itemId/complete or /toggle
 * Marks or toggles completion of a weekly learning item.
 */
router.post(['/weekly-plans/:id/items/:itemId/complete', '/weekly-plans/:id/items/:itemId/toggle'], async (req: Request, res: Response) => {
  try {
    const planId = parseInt(req.params.id, 10);
    const itemId = parseInt(req.params.itemId, 10);
    const rawLearnerId = req.body.learner_id || req.query.learner_id;
    const learnerId = rawLearnerId ? parseInt(rawLearnerId as string, 10) : 1;

    const updatedPlan = await AdaptiveLearningPlannerService.toggleItemCompletion(planId, itemId, learnerId);
    return res.json({
      success: true,
      message: 'Weekly task status updated successfully.',
      data: updatedPlan,
    });
  } catch (error) {
    console.error('Error updating weekly task:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update weekly task',
    });
  }
});

/**
 * POST /api/weekly-plans/:id/checkpoint/start
 * Retrieves questions for taking the weekly checkpoint.
 */
router.post('/weekly-plans/:id/checkpoint/start', async (req: Request, res: Response) => {
  try {
    const planId = parseInt(req.params.id, 10);
    const rawLearnerId = req.body.learner_id || req.query.learner_id;
    const learnerId = rawLearnerId ? parseInt(rawLearnerId as string, 10) : 1;

    const checkpointData = await AdaptiveLearningPlannerService.getCheckpoint(planId, learnerId);
    return res.json({
      success: true,
      data: checkpointData,
    });
  } catch (error) {
    console.error('Error starting checkpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start weekly checkpoint',
    });
  }
});

/**
 * POST /api/weekly-plans/:id/checkpoint/submit
 * Submits answers for weekly checkpoint and triggers improvement analysis.
 */
router.post('/weekly-plans/:id/checkpoint/submit', async (req: Request, res: Response) => {
  try {
    const planId = parseInt(req.params.id, 10);
    const rawLearnerId = req.body.learner_id || req.body.learnerId;
    const learnerId = rawLearnerId ? parseInt(rawLearnerId as string, 10) : 1;
    const answers = req.body.answers || {};

    const result = await AdaptiveLearningPlannerService.submitCheckpoint(planId, learnerId, answers);
    return res.json({
      success: true,
      message: 'Weekly check evaluated successfully. Topic-level adaptation ready.',
      data: result,
    });
  } catch (error) {
    console.error('Error submitting checkpoint:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to evaluate checkpoint',
    });
  }
});

/**
 * GET /api/weekly-plans/:id/result
 * Retrieves the latest result and improvement analysis for a weekly plan.
 */
router.get('/weekly-plans/:id/result', async (req: Request, res: Response) => {
  try {
    const planId = parseInt(req.params.id, 10);
    const rawLearnerId = req.query.learner_id || req.query.id;
    const learnerId = rawLearnerId ? parseInt(rawLearnerId as string, 10) : 1;

    const data = await AdaptiveLearningPlannerService.getCheckpoint(planId, learnerId);
    if (!data.result) {
      return res.status(404).json({
        success: false,
        error: 'No checkpoint result found for this plan. Please complete the check first.',
      });
    }

    return res.json({
      success: true,
      data: data.result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch result',
    });
  }
});

/**
 * POST /api/weekly-plans/:id/generate-next-week
 * Adapts and generates next week's plan based on current checkpoint and progress evidence.
 */
router.post('/weekly-plans/:id/generate-next-week', async (req: Request, res: Response) => {
  try {
    const planId = parseInt(req.params.id, 10);
    const rawLearnerId = req.body.learner_id || req.body.learnerId;
    const learnerId = rawLearnerId ? parseInt(rawLearnerId as string, 10) : 1;

    const currentPlan = await AdaptiveLearningPlannerService.assemblePlanDetails(planId);
    const nextWeekPlan = await AdaptiveLearningPlannerService.generateWeeklyPlan(
      currentPlan.learning_path_id,
      learnerId,
      currentPlan.week_number + 1
    );

    return res.json({
      success: true,
      message: `Week ${nextWeekPlan.week_number} plan generated with adaptive focus.`,
      data: nextWeekPlan,
    });
  } catch (error) {
    console.error('Error generating next week plan:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate next week plan',
    });
  }
});

/**
 * POST /api/weekly-plans/:id/adjust
 * Rapid user-controlled plan adjustment (less time, more time, need practice, already know).
 */
router.post('/weekly-plans/:id/adjust', async (req: Request, res: Response) => {
  try {
    const planId = parseInt(req.params.id, 10);
    const rawLearnerId = req.body.learner_id || req.body.learnerId;
    const learnerId = rawLearnerId ? parseInt(rawLearnerId as string, 10) : 1;
    const { adjustment_type, reason } = req.body;

    if (!['less_time', 'more_time', 'need_practice', 'already_know'].includes(adjustment_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid adjustment_type. Must be "less_time", "more_time", "need_practice", or "already_know".',
      });
    }

    const adjustedPlan = await AdaptiveLearningPlannerService.adjustPlan(planId, learnerId, {
      adjustment_type,
      reason,
    });

    return res.json({
      success: true,
      message: 'Weekly plan adjusted to your preferences.',
      data: adjustedPlan,
    });
  } catch (error) {
    console.error('Error adjusting plan:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to adjust weekly plan',
    });
  }
});

export default router;

