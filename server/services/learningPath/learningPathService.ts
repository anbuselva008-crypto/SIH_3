import { query, queryOne, execute } from '../../database/db.ts';
import type { 
  LearnerProfile, 
  CompetencyItem, 
  LearningPath, 
  LearningPathStep, 
  LearnerPathStepProgress, 
  LearningPathWithProgress, 
  StepStatus 
} from '../../database/models.ts';
import { DiscoveryService } from '../learningDiscovery/discoveryService.ts';
import type { DiscoveredResource } from '../learningDiscovery/types.ts';
import { PathGenerator } from './pathGenerator.ts';
import type { GeneratePathRequest, PathSummaryItem } from './types.ts';
import { QuizService } from '../quizService.ts';

export class LearningPathService {
  /**
   * Generates or retrieves an existing personalized learning path for the learner and competency.
   */
  public static async generateOrGetPath(req: GeneratePathRequest): Promise<LearningPathWithProgress> {
    const { learnerId, skillGap, forceNew } = req;

    // 1. Fetch learner profile
    const learner = await queryOne<LearnerProfile>(`SELECT * FROM learners WHERE id = ${learnerId}`);
    if (!learner) {
      throw new Error(`Learner with ID ${learnerId} not found.`);
    }

    // 2. Fetch learner competencies
    const allCompetencies = await query<CompetencyItem>(
      `SELECT * FROM competencies WHERE learner_id = ${learnerId}`
    );
    const targetComp = allCompetencies.find(
      (c) => c.competency_name.toLowerCase() === skillGap.toLowerCase()
    );
    const currentScore = targetComp ? targetComp.current_score : 30;

    // 3. If not forceNew, check if an existing learning path exists
    if (!forceNew) {
      const existing = await queryOne<LearningPath>(
        `SELECT * FROM learning_paths 
         WHERE learner_id = ${learnerId} AND LOWER(target_competency) = LOWER('${skillGap.replace(/'/g, "''")}')
         ORDER BY id DESC LIMIT 1`
      );
      if (existing) {
        return this.getFullPathWithProgress(existing.id, learnerId);
      }
    }

    // 4. Resolve the Best Match learning resource
    let chosenResource: DiscoveredResource | null = req.resource || null;

    if (!chosenResource && req.resourceId) {
      // Check catalogue or discovery
      const discoveryResult = await DiscoveryService.discover(learnerId, skillGap, false);
      chosenResource = discoveryResult.all_resources.find((r) => String(r.id) === String(req.resourceId)) || null;
    }

    if (!chosenResource) {
      // Discover Best Match automatically via Stage 5B
      const discoveryResult = await DiscoveryService.discover(learnerId, skillGap, false);
      chosenResource = discoveryResult.best_match;
      if (!chosenResource && discoveryResult.all_resources.length > 0) {
        chosenResource = discoveryResult.all_resources[0];
      }
    }

    if (!chosenResource) {
      // Create guaranteed fallback resource representation
      chosenResource = {
        id: `res-${Date.now()}`,
        title: `${skillGap} Principles & Official Training`,
        url: 'https://igotkarmayogi.gov.in',
        provider_name: 'iGOT Karmayogi / NSSTA',
        source_tier: 1,
        description: `National training programme addressing ${skillGap} for government officials.`,
        primary_competency: skillGap,
        secondary_competencies: [],
        relevant_job_families: [],
        relevant_roles: [learner.role],
        relevant_assignments: [learner.current_assignment],
        difficulty: 'Beginner',
        language: 'English',
        estimated_duration: '4 weeks',
        source_type: 'demo_catalogue',
        verification_status: 'VERIFIED',
        ranking_score: 90,
        match_reason: `Tailored curriculum for ${learner.role}.`,
        discovered_at: new Date().toISOString(),
      };
    }

    // 5. Generate deterministic progressive learning path plan
    const plan = PathGenerator.generate(
      learner,
      skillGap,
      currentScore,
      chosenResource,
      allCompetencies,
      req.targetScore || 75
    );

    // 6. Persist learning path
    await execute(`
      INSERT INTO learning_paths (
        learner_id, target_competency, current_score, target_score,
        current_level, target_level, learning_goal, role_name, assignment_name,
        resource_id, resource_title, resource_url, provider_name, resource_type,
        is_official_structure, structure_label, total_steps, future_skill_note
      ) VALUES (
        ${learnerId},
        '${plan.targetCompetency.replace(/'/g, "''")}',
        ${plan.currentScore},
        ${plan.targetScore},
        '${plan.currentLevel}',
        '${plan.targetLevel}',
        '${plan.learningGoal.replace(/'/g, "''")}',
        '${plan.roleName.replace(/'/g, "''")}',
        '${plan.assignmentName.replace(/'/g, "''")}',
        '${(plan.resourceId || '').replace(/'/g, "''")}',
        '${plan.resourceTitle.replace(/'/g, "''")}',
        '${plan.resourceUrl.replace(/'/g, "''")}',
        '${plan.providerName.replace(/'/g, "''")}',
        '${plan.resourceType.replace(/'/g, "''")}',
        ${plan.isOfficialStructure},
        '${plan.structureLabel.replace(/'/g, "''")}',
        ${plan.totalSteps},
        ${plan.futureSkillNote ? `'${plan.futureSkillNote.replace(/'/g, "''")}'` : 'NULL'}
      );
    `);

    const insertedPath = await queryOne<LearningPath>(
      `SELECT * FROM learning_paths 
       WHERE learner_id = ${learnerId} 
       ORDER BY id DESC LIMIT 1`
    );
    if (!insertedPath) {
      throw new Error('Failed to create learning path in database.');
    }

    // 7. Persist learning path steps and initialize step progress
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      await execute(`
        INSERT INTO learning_path_steps (
          learning_path_id, step_number, title, purpose, step_type,
          competency, estimated_effort, prerequisite, prerequisite_met,
          resource_url, section_ref, completion_condition
        ) VALUES (
          ${insertedPath.id},
          ${step.stepNumber},
          '${step.title.replace(/'/g, "''")}',
          '${step.purpose.replace(/'/g, "''")}',
          '${step.stepType}',
          '${step.competency.replace(/'/g, "''")}',
          ${step.estimatedEffort ? `'${step.estimatedEffort.replace(/'/g, "''")}'` : 'NULL'},
          ${step.prerequisite ? `'${step.prerequisite.replace(/'/g, "''")}'` : 'NULL'},
          ${step.prerequisiteMet},
          ${step.resourceUrl ? `'${step.resourceUrl.replace(/'/g, "''")}'` : 'NULL'},
          ${step.sectionRef ? `'${step.sectionRef.replace(/'/g, "''")}'` : 'NULL'},
          '${step.completionCondition.replace(/'/g, "''")}'
        );
      `);

      const insertedStep = await queryOne<LearningPathStep>(
        `SELECT * FROM learning_path_steps 
         WHERE learning_path_id = ${insertedPath.id} AND step_number = ${step.stepNumber}`
      );

      if (insertedStep) {
        // Step 1 begins IN_PROGRESS, subsequent steps are LOCKED until previous steps complete
        const initialStatus: StepStatus = i === 0 ? 'IN_PROGRESS' : 'LOCKED';
        await execute(`
          INSERT INTO learner_path_step_progress (
            learner_id, learning_path_id, step_id, status, started_at
          ) VALUES (
            ${learnerId},
            ${insertedPath.id},
            ${insertedStep.id},
            '${initialStatus}',
            ${i === 0 ? 'CURRENT_TIMESTAMP' : 'NULL'}
          );
        `);
      }
    }

    return this.getFullPathWithProgress(insertedPath.id, learnerId);
  }

  /**
   * Retrieves all learning paths created for a learner.
   */
  public static async getLearnerPaths(learnerId: number): Promise<PathSummaryItem[]> {
    const paths = await query<LearningPath>(
      `SELECT * FROM learning_paths WHERE learner_id = ${learnerId} ORDER BY updated_at DESC, id DESC`
    );

    const summaries: PathSummaryItem[] = [];
    for (const p of paths) {
      const steps = await query<LearningPathStep>(
        `SELECT * FROM learning_path_steps WHERE learning_path_id = ${p.id} ORDER BY step_number ASC`
      );
      const progress = await query<LearnerPathStepProgress>(
        `SELECT * FROM learner_path_step_progress WHERE learner_id = ${learnerId} AND learning_path_id = ${p.id}`
      );

      const progressMap = new Map(progress.map((pr) => [pr.step_id, pr.status]));
      const completedCount = steps.filter((s) => progressMap.get(s.id) === 'COMPLETED').length;
      const progressPct = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;
      
      const activeStep = steps.find((s) => progressMap.get(s.id) === 'IN_PROGRESS') ||
        steps.find((s) => progressMap.get(s.id) !== 'COMPLETED') || steps[0];

      let overallStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' = 'NOT_STARTED';
      if (completedCount === steps.length && steps.length > 0) {
        overallStatus = 'COMPLETED';
      } else if (completedCount > 0 || progress.some((pr) => pr.status === 'IN_PROGRESS')) {
        overallStatus = 'IN_PROGRESS';
      }

      summaries.push({
        id: p.id,
        target_competency: p.target_competency,
        current_level: p.current_level,
        target_level: p.target_level,
        learning_goal: p.learning_goal,
        resource_title: p.resource_title,
        provider_name: p.provider_name,
        total_steps: steps.length,
        completed_steps_count: completedCount,
        progress_percentage: progressPct,
        active_step_number: activeStep ? activeStep.step_number : 1,
        status: overallStatus,
        updated_at: p.updated_at,
      });
    }

    return summaries;
  }

  /**
   * Retrieves a full learning path with step progress for a learner.
   */
  public static async getFullPathWithProgress(pathId: number, learnerId: number): Promise<LearningPathWithProgress> {
    const path = await queryOne<LearningPath>(
      `SELECT * FROM learning_paths WHERE id = ${pathId} AND learner_id = ${learnerId}`
    );
    if (!path) {
      throw new Error(`Learning path #${pathId} not found for learner #${learnerId}.`);
    }

    const steps = await query<LearningPathStep>(
      `SELECT * FROM learning_path_steps WHERE learning_path_id = ${pathId} ORDER BY step_number ASC`
    );

    const progressRecords = await query<LearnerPathStepProgress>(
      `SELECT * FROM learner_path_step_progress 
       WHERE learning_path_id = ${pathId} AND learner_id = ${learnerId}`
    );

    const progressMap = new Map(progressRecords.map((p) => [p.step_id, p]));

    const stepsWithProgress = steps.map((step) => {
      const pr = progressMap.get(step.id);
      return {
        ...step,
        status: (pr ? pr.status : 'LOCKED') as StepStatus,
        started_at: pr?.started_at || null,
        completed_at: pr?.completed_at || null,
      };
    });

    const completedStepsCount = stepsWithProgress.filter((s) => s.status === 'COMPLETED').length;
    const progressPercentage = steps.length > 0 ? Math.round((completedStepsCount / steps.length) * 100) : 0;

    const activeStep = stepsWithProgress.find((s) => s.status === 'IN_PROGRESS') ||
      stepsWithProgress.find((s) => s.status !== 'COMPLETED') || stepsWithProgress[0];

    return {
      ...path,
      steps: stepsWithProgress,
      completed_steps_count: completedStepsCount,
      progress_percentage: progressPercentage,
      active_step_number: activeStep ? activeStep.step_number : 1,
    };
  }

  /**
   * Starts a step (marks as IN_PROGRESS).
   */
  public static async startStep(pathId: number, stepId: number, learnerId: number): Promise<LearningPathWithProgress> {
    const existing = await queryOne<LearnerPathStepProgress>(
      `SELECT * FROM learner_path_step_progress 
       WHERE learning_path_id = ${pathId} AND step_id = ${stepId} AND learner_id = ${learnerId}`
    );

    if (existing) {
      await execute(`
        UPDATE learner_path_step_progress 
        SET status = 'IN_PROGRESS', started_at = COALESCE(started_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existing.id}
      `);
    } else {
      await execute(`
        INSERT INTO learner_path_step_progress (
          learner_id, learning_path_id, step_id, status, started_at
        ) VALUES (
          ${learnerId}, ${pathId}, ${stepId}, 'IN_PROGRESS', CURRENT_TIMESTAMP
        );
      `);
    }

    await execute(`UPDATE learning_paths SET updated_at = CURRENT_TIMESTAMP WHERE id = ${pathId}`);

    return this.getFullPathWithProgress(pathId, learnerId);
  }

  /**
   * Completes a step, sets completed_at, and automatically unlocks the next step.
   */
  public static async completeStep(pathId: number, stepId: number, learnerId: number): Promise<LearningPathWithProgress> {
    const existing = await queryOne<LearnerPathStepProgress>(
      `SELECT * FROM learner_path_step_progress 
       WHERE learning_path_id = ${pathId} AND step_id = ${stepId} AND learner_id = ${learnerId}`
    );

    if (existing) {
      await execute(`
        UPDATE learner_path_step_progress 
        SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existing.id}
      `);
    } else {
      await execute(`
        INSERT INTO learner_path_step_progress (
          learner_id, learning_path_id, step_id, status, started_at, completed_at
        ) VALUES (
          ${learnerId}, ${pathId}, ${stepId}, 'COMPLETED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        );
      `);
    }

    // Identify current step number
    const currentStep = await queryOne<LearningPathStep>(
      `SELECT * FROM learning_path_steps WHERE id = ${stepId}`
    );

    if (currentStep) {
      // Find the next step in this path
      const nextStep = await queryOne<LearningPathStep>(
        `SELECT * FROM learning_path_steps 
         WHERE learning_path_id = ${pathId} AND step_number = ${currentStep.step_number + 1}`
      );

      if (nextStep) {
        const nextProgress = await queryOne<LearnerPathStepProgress>(
          `SELECT * FROM learner_path_step_progress 
           WHERE learning_path_id = ${pathId} AND step_id = ${nextStep.id} AND learner_id = ${learnerId}`
        );

        if (nextProgress && nextProgress.status === 'LOCKED') {
          await execute(`
            UPDATE learner_path_step_progress 
            SET status = 'IN_PROGRESS', started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${nextProgress.id}
          `);
        } else if (!nextProgress) {
          await execute(`
            INSERT INTO learner_path_step_progress (
              learner_id, learning_path_id, step_id, status, started_at
            ) VALUES (
              ${learnerId}, ${pathId}, ${nextStep.id}, 'IN_PROGRESS', CURRENT_TIMESTAMP
            );
          `);
        }
      }
    }

    await execute(`UPDATE learning_paths SET updated_at = CURRENT_TIMESTAMP WHERE id = ${pathId}`);

    return this.getFullPathWithProgress(pathId, learnerId);
  }

  /**
   * Provides verified alternative learning resources from Stage 5B so learner can switch if desired.
   */
  public static async getAlternativeResources(pathId: number, learnerId: number): Promise<DiscoveredResource[]> {
    const path = await queryOne<LearningPath>(
      `SELECT * FROM learning_paths WHERE id = ${pathId} AND learner_id = ${learnerId}`
    );
    if (!path) return [];

    const discovery = await DiscoveryService.discover(learnerId, path.target_competency, false);
    return (discovery.strong_alternatives && discovery.strong_alternatives.length > 0)
      ? discovery.strong_alternatives
      : discovery.other_options;
  }

  /**
   * Switches the primary resource of an existing path to an alternative verified resource,
   * preserving completed progress if appropriate or regenerating steps based on new modules.
   */
  public static async switchResource(
    pathId: number,
    learnerId: number,
    newResource: DiscoveredResource
  ): Promise<LearningPathWithProgress> {
    const existing = await queryOne<LearningPath>(
      `SELECT * FROM learning_paths WHERE id = ${pathId} AND learner_id = ${learnerId}`
    );
    if (!existing) {
      throw new Error(`Learning path #${pathId} not found.`);
    }

    return this.generateOrGetPath({
      learnerId,
      skillGap: existing.target_competency,
      resource: newResource,
      targetScore: existing.target_score,
      forceNew: true,
    });
  }

  /**
   * Connects the Practice Assessment step to Stage 4 Grounded AI Quiz.
   */
  public static async getOrCreatePracticeQuiz(pathId: number, learnerId: number): Promise<any> {
    const path = await queryOne<LearningPath>(
      `SELECT * FROM learning_paths WHERE id = ${pathId} AND learner_id = ${learnerId}`
    );
    if (!path) {
      throw new Error(`Learning path #${pathId} not found.`);
    }

    // 1. Check if a quiz exists for this learner and competency
    const existingQuiz = await queryOne<any>(
      `SELECT * FROM quizzes 
       WHERE learner_id = ${learnerId} AND LOWER(competency_name) = LOWER('${path.target_competency.replace(/'/g, "''")}')
       ORDER BY id DESC LIMIT 1`
    );

    if (existingQuiz) {
      return QuizService.getQuizWithQuestions(existingQuiz.id);
    }

    // 2. Check if a learning material exists
    let material = await queryOne<any>(
      `SELECT * FROM learning_materials 
       WHERE LOWER(original_filename) LIKE '%${path.target_competency.toLowerCase().slice(0, 5)}%'
       LIMIT 1`
    );

    if (!material) {
      // Pick first available demo material or create on-demand
      material = await queryOne<any>(`SELECT * FROM learning_materials LIMIT 1`);
    }

    if (material) {
      return QuizService.generateAndSaveQuiz(material.id, {
        questionCount: 5,
        learnerId,
      });
    }

    throw new Error('No learning materials available to generate practice quiz.');
  }
}
