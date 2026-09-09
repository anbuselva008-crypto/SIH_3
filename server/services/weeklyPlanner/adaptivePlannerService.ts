import { query, queryOne, execute } from '../../database/db.ts';
import type {
  LearnerProfile,
  LearnerSchedulePreferences,
  WeeklyLearningPlan,
  WeeklyLearningItem,
  WeeklyCheckpoint,
  WeeklyCheckpointQuestion,
  WeeklyCheckpointResult,
  WeeklyTopicPerformance,
  WeeklyPlanWithItems,
  AvailabilityMode,
  PreferredPeriod,
  WeeklyActivityType,
  LearningPathWithProgress,
} from '../../database/models.ts';
import { LearningPathService } from '../learningPath/learningPathService.ts';

// Configurable adaptive performance thresholds
export const SCORE_MASTERY_THRESHOLD = 80;
export const SCORE_NEEDS_PRACTICE_THRESHOLD = 60;

export interface SchedulePreferencesInput {
  availability_mode?: AvailabilityMode;
  minutes_per_session?: number;
  weekly_minutes_target?: number;
  preferred_days?: string[];
  preferred_period?: PreferredPeriod;
}

export interface PlanAdjustmentInput {
  adjustment_type: 'less_time' | 'more_time' | 'need_practice' | 'already_know';
  reason?: string;
}

export class AdaptiveLearningPlannerService {
  /**
   * Retrieves schedule preferences for an officer, seeding defaults if missing.
   */
  public static async getSchedulePreferences(learnerId: number): Promise<LearnerSchedulePreferences> {
    const existing = await queryOne<LearnerSchedulePreferences>(
      `SELECT * FROM learner_schedule_preferences WHERE learner_id = ${learnerId}`
    );
    if (existing) {
      return existing;
    }

    // Default configuration for government officers
    const defaultDays = 'Monday,Wednesday,Friday,Sunday';
    await execute(`
      INSERT INTO learner_schedule_preferences 
      (learner_id, availability_mode, minutes_per_session, weekly_minutes_target, preferred_days, preferred_period)
      VALUES 
      (${learnerId}, '30_min_day', 30, 120, '${defaultDays}', 'Evening')
      ON CONFLICT (learner_id) DO NOTHING
    `);

    const created = await queryOne<LearnerSchedulePreferences>(
      `SELECT * FROM learner_schedule_preferences WHERE learner_id = ${learnerId}`
    );
    return created!;
  }

  /**
   * Updates schedule preferences and adjusts target weekly minutes.
   */
  public static async saveSchedulePreferences(
    learnerId: number,
    input: SchedulePreferencesInput
  ): Promise<LearnerSchedulePreferences> {
    const current = await this.getSchedulePreferences(learnerId);

    const mode = input.availability_mode || current.availability_mode || '30_min_day';
    const period = input.preferred_period || current.preferred_period || 'Evening';
    const daysArr = input.preferred_days || current.preferred_days.split(',').map((d) => d.trim());
    const daysStr = daysArr.join(',');

    let minutesPerSession = input.minutes_per_session || current.minutes_per_session;
    let weeklyTarget = input.weekly_minutes_target || current.weekly_minutes_target;

    // Recalculate based on mode if not explicitly overridden
    if (input.availability_mode && !input.minutes_per_session) {
      switch (mode) {
        case '15_min_day':
          minutesPerSession = 15;
          weeklyTarget = daysArr.length * 15;
          break;
        case '30_min_day':
          minutesPerSession = 30;
          weeklyTarget = daysArr.length * 30;
          break;
        case '45_min_day':
          minutesPerSession = 45;
          weeklyTarget = daysArr.length * 45;
          break;
        case '60_min_day':
          minutesPerSession = 60;
          weeklyTarget = daysArr.length * 60;
          break;
        case '2_3_hrs_week':
          minutesPerSession = Math.round(150 / Math.max(daysArr.length, 1));
          weeklyTarget = 150;
          break;
        case '5_plus_hrs_week':
          minutesPerSession = Math.round(300 / Math.max(daysArr.length, 1));
          weeklyTarget = 300;
          break;
        default:
          break;
      }
    }

    await execute(`
      UPDATE learner_schedule_preferences
      SET availability_mode = '${mode}',
          minutes_per_session = ${minutesPerSession},
          weekly_minutes_target = ${weeklyTarget},
          preferred_days = '${daysStr}',
          preferred_period = '${period}',
          updated_at = CURRENT_TIMESTAMP
      WHERE learner_id = ${learnerId}
    `);

    return this.getSchedulePreferences(learnerId);
  }

  /**
   * Retrieves or generates the active weekly learning plan for a learning path.
   */
  public static async getActiveWeeklyPlan(
    learningPathId: number,
    learnerId: number,
    forceGenerate: boolean = false
  ): Promise<WeeklyPlanWithItems> {
    if (!forceGenerate) {
      const activePlan = await queryOne<WeeklyLearningPlan>(
        `SELECT * FROM weekly_learning_plans 
         WHERE learning_path_id = ${learningPathId} AND learner_id = ${learnerId} AND status = 'ACTIVE'
         ORDER BY week_number DESC, version DESC LIMIT 1`
      );
      if (activePlan) {
        return this.assemblePlanDetails(activePlan.id);
      }
    }

    // Generate new Week 1 plan (or next week if history exists)
    return this.generateWeeklyPlan(learningPathId, learnerId);
  }

  /**
   * Retrieves the latest active weekly plan for a learner across all paths,
   * or creates one based on their top priority skill gap.
   */
  public static async getLatestWeeklyPlanForLearner(learnerId: number): Promise<WeeklyPlanWithItems | null> {
    // 1. Look for any active plan for this learner
    const active = await queryOne<WeeklyLearningPlan>(
      `SELECT * FROM weekly_learning_plans WHERE learner_id = ${learnerId} AND status = 'ACTIVE' ORDER BY id DESC LIMIT 1`
    );
    if (active) {
      return this.assemblePlanDetails(active.id);
    }

    // 2. Look for existing learning paths for this learner
    const paths = await LearningPathService.getLearnerPaths(learnerId);
    if (paths && paths.length > 0) {
      return this.getActiveWeeklyPlan(paths[0].id, learnerId, false);
    }

    // 3. If no path exists, find the highest priority skill gap and generate a path first
    const comp = await queryOne<{ name: string }>(
      `SELECT name FROM competencies WHERE learner_id = ${learnerId} ORDER BY score ASC LIMIT 1`
    );
    const skillName = comp ? comp.name : 'Python';
    const newPath = await LearningPathService.generateOrGetPath({ learnerId, skillGap: skillName, forceNew: false });
    return this.getActiveWeeklyPlan(newPath.id, learnerId, false);
  }

  /**
   * Core generator: Creates a week-specific adaptive learning plan.
   */
  public static async generateWeeklyPlan(
    learningPathId: number,
    learnerId: number,
    targetWeekNumber?: number
  ): Promise<WeeklyPlanWithItems> {
    // 1. Fetch learning path with progress
    const path = await LearningPathService.getFullPathWithProgress(learningPathId, learnerId);
    if (!path) {
      throw new Error(`Learning path #${learningPathId} not found for learner #${learnerId}.`);
    }

    // 2. Fetch learner profile & preferences
    const learner = await queryOne<LearnerProfile>(`SELECT * FROM learners WHERE id = ${learnerId}`);
    if (!learner) {
      throw new Error(`Learner #${learnerId} not found.`);
    }
    const preferences = await this.getSchedulePreferences(learnerId);
    const preferredDays = preferences.preferred_days.split(',').map((d) => d.trim()).filter(Boolean);
    const sessionMinutes = preferences.minutes_per_session || 30;

    // 3. Determine week number and previous week context
    const existingPlans = await query<WeeklyLearningPlan>(
      `SELECT * FROM weekly_learning_plans 
       WHERE learning_path_id = ${learningPathId} AND learner_id = ${learnerId}
       ORDER BY week_number DESC, version DESC`
    );

    const latestPlan = existingPlans[0] || null;
    const weekNumber = targetWeekNumber || (latestPlan ? latestPlan.week_number + 1 : 1);

    // If generating a new active plan, archive previous active plan
    if (latestPlan && latestPlan.status === 'ACTIVE') {
      await execute(`
        UPDATE weekly_learning_plans 
        SET status = 'PAST', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${latestPlan.id}
      `);
    }

    // 4. Inspect previous week's evidence for adaptation
    let previousResult: WeeklyCheckpointResult | null = null;
    let carriedForwardItems: WeeklyLearningItem[] = [];
    let adaptationReason: string | null = null;
    let focusTopic = '';
    let whyThisMatters = '';

    if (latestPlan) {
      previousResult = await queryOne<WeeklyCheckpointResult>(
        `SELECT * FROM weekly_checkpoint_results 
         WHERE weekly_plan_id = ${latestPlan.id} 
         ORDER BY id DESC LIMIT 1`
      );

      // Check for uncompleted items from previous week
      const uncompleted = await query<WeeklyLearningItem>(
        `SELECT * FROM weekly_learning_items 
         WHERE weekly_plan_id = ${latestPlan.id} AND is_completed = FALSE`
      );
      // Carry forward only high-priority or practical items (max 1-2 to prevent overload)
      carriedForwardItems = uncompleted.slice(0, 2);
    }

    // 5. Determine Week Theme & Adaptive Focus
    const targetComp = path.target_competency;
    const isBeginner = path.current_score < 50;

    if (weekNumber === 1) {
      if (isBeginner) {
        focusTopic = `Foundations & Operational Core of ${targetComp}`;
        whyThisMatters = `As a ${path.role_name}, mastering foundational statutory principles and terminology in ${targetComp} is critical before handling microdata validation and operational workflows in ${path.assignment_name}.`;
      } else {
        focusTopic = `Cadre Principles Review & Applied Frameworks`;
        whyThisMatters = `Calibrated to your existing ${path.current_level} proficiency (${path.current_score}/100). This week reviews government standards and jumps straight into analytical execution for ${path.assignment_name}.`;
      }
    } else {
      // Adaptive Week 2+ Logic
      const weakTopics: string[] = previousResult
        ? typeof previousResult.weak_topics === 'string'
          ? JSON.parse(previousResult.weak_topics || '[]')
          : previousResult.weak_topics || []
        : [];

      const strongTopics: string[] = previousResult
        ? typeof previousResult.strong_topics === 'string'
          ? JSON.parse(previousResult.strong_topics || '[]')
          : previousResult.strong_topics || []
        : [];

      const prevScore = previousResult ? previousResult.score_percentage : 70;

      if (weakTopics.length > 0 && prevScore < SCORE_MASTERY_THRESHOLD) {
        const primaryWeakTopic = weakTopics[0];
        focusTopic = `Targeted Reinforcement: ${primaryWeakTopic}`;
        adaptationReason = `Your Week ${weekNumber - 1} checkpoint showed that '${primaryWeakTopic}' scored below mastery (${prevScore}%). Week ${weekNumber} incorporates targeted reinforcement on this topic before advancing to higher complexity tasks.`;
        whyThisMatters = `Reinforcing ${primaryWeakTopic} directly strengthens your accuracy in ${path.assignment_name}, ensuring reliable execution in your ${path.role_name} duties.`;
      } else if (prevScore >= SCORE_MASTERY_THRESHOLD) {
        focusTopic = `Advanced Application & Scenario Execution`;
        adaptationReason = `Your Week ${weekNumber - 1} checkpoint demonstrated strong mastery (${prevScore}%). Foundational repetition has been eliminated to accelerate your practical scenario drills.`;
        whyThisMatters = `Moving directly to practical scenario problem-solving and quality assurance for ${path.assignment_name}.`;
      } else {
        focusTopic = `Applied Workflow Integration & Practice`;
        adaptationReason = `Steady progress in Week ${weekNumber - 1} (${prevScore}%). Week ${weekNumber} balances conceptual consolidation with real-world departmental examples.`;
        whyThisMatters = `Aligns standard operating procedures with your day-to-day administrative responsibilities.`;
      }
    }

    // 6. Insert new weekly plan
    const learningGoal = path.learning_goal;
    const totalPlannedMinutes = preferences.weekly_minutes_target || 120;

    await execute(`
      INSERT INTO weekly_learning_plans 
      (learner_id, learning_path_id, week_number, version, status, focus_topic, why_this_matters, adaptation_reason, learning_goal, total_planned_minutes, completed_minutes, momentum_status, week_start, week_end)
      VALUES 
      (${learnerId}, ${learningPathId}, ${weekNumber}, 1, 'ACTIVE', 
       '${focusTopic.replace(/'/g, "''")}', 
       '${whyThisMatters.replace(/'/g, "''")}', 
       ${adaptationReason ? `'${adaptationReason.replace(/'/g, "''")}'` : 'NULL'}, 
       '${learningGoal.replace(/'/g, "''")}', 
       ${totalPlannedMinutes}, 0, 'On Track', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days')
    `);

    const createdPlan = await queryOne<WeeklyLearningPlan>(
      `SELECT * FROM weekly_learning_plans 
       WHERE learning_path_id = ${learningPathId} AND learner_id = ${learnerId} 
       ORDER BY id DESC LIMIT 1`
    );

    const planId = createdPlan!.id;

    // 7. Generate balanced learning activities (4-5 activities across preferred days)
    await this.generateWeeklyItems({
      planId,
      path,
      weekNumber,
      preferredDays,
      sessionMinutes,
      isBeginner,
      targetComp,
      carriedForwardItems,
      previousResult,
    });

    // 8. Generate weekly checkpoint questions
    await this.generateWeeklyCheckpoint(planId, learnerId, learningPathId, weekNumber, targetComp, previousResult);

    return this.assemblePlanDetails(planId);
  }

  /**
   * Distributes activities into weekly blocks: LEARN, PRACTICE, REVIEW, CHECK, REFLECT.
   */
  private static async generateWeeklyItems(params: {
    planId: number;
    path: LearningPathWithProgress;
    weekNumber: number;
    preferredDays: string[];
    sessionMinutes: number;
    isBeginner: boolean;
    targetComp: string;
    carriedForwardItems: WeeklyLearningItem[];
    previousResult: WeeklyCheckpointResult | null;
  }) {
    const {
      planId,
      path,
      weekNumber,
      preferredDays,
      sessionMinutes,
      isBeginner,
      targetComp,
      carriedForwardItems,
      previousResult,
    } = params;

    const days = preferredDays.length > 0 ? preferredDays : ['Monday', 'Wednesday', 'Friday', 'Sunday'];
    let order = 1;

    // 1. Insert carried forward items first (if any)
    if (carriedForwardItems.length > 0) {
      for (const item of carriedForwardItems) {
        const assignedDay = days[(order - 1) % days.length];
        await execute(`
          INSERT INTO weekly_learning_items 
          (weekly_plan_id, day_of_week, sequence_order, title, description, activity_type, estimated_minutes, topic_tag, resource_url, is_completed, is_carried_forward, priority_level)
          VALUES 
          (${planId}, '${assignedDay}', ${order}, 
           'Reinforce: ${item.title.replace(/'/g, "''")}', 
           'Carried forward from last week to ensure solid conceptual foundation.', 
           'REVIEW', ${Math.min(item.estimated_minutes, sessionMinutes)}, 
           '${item.topic_tag.replace(/'/g, "''")}', 
           ${item.resource_url ? `'${item.resource_url}'` : 'NULL'}, 
           FALSE, TRUE, 'REINFORCEMENT')
        `);
        order++;
      }
    }

    // 2. Generate regular week items based on week number and topic-level adaptation
    const weakTopics: string[] = previousResult
      ? typeof previousResult.weak_topics === 'string'
        ? JSON.parse(previousResult.weak_topics || '[]')
        : previousResult.weak_topics || []
      : [];

    const isTopicReinforcementWeek = weekNumber > 1 && weakTopics.length > 0;
    const focusSubtopic = isTopicReinforcementWeek ? weakTopics[0] : `${targetComp} Core`;

    const standardTemplates = this.resolveWeeklyActivityTemplates(
      targetComp,
      path.role_name,
      path.assignment_name,
      weekNumber,
      isBeginner,
      focusSubtopic,
      isTopicReinforcementWeek
    );

    for (const tmpl of standardTemplates) {
      if (order > days.length + 1) break; // Keep activities strictly proportionate to schedule
      const assignedDay = days[(order - 1) % days.length];
      const estTime = Math.min(tmpl.estimatedMinutes, sessionMinutes);

      await execute(`
        INSERT INTO weekly_learning_items 
        (weekly_plan_id, day_of_week, sequence_order, title, description, activity_type, estimated_minutes, topic_tag, resource_url, is_completed, is_carried_forward, priority_level)
        VALUES 
        (${planId}, '${assignedDay}', ${order}, 
         '${tmpl.title.replace(/'/g, "''")}', 
         '${tmpl.description.replace(/'/g, "''")}', 
         '${tmpl.activityType}', ${estTime}, 
         '${tmpl.topicTag.replace(/'/g, "''")}', 
         '${path.resource_url.replace(/'/g, "''")}', 
         FALSE, FALSE, '${tmpl.priority}')
      `);
      order++;
    }
  }

  /**
   * Deterministic template resolver ensuring realistic and efficient workloads.
   */
  private static resolveWeeklyActivityTemplates(
    competency: string,
    role: string,
    assignment: string,
    weekNumber: number,
    isBeginner: boolean,
    focusSubtopic: string,
    isReinforcement: boolean
  ) {
    if (isReinforcement) {
      return [
        {
          title: `Reinforce: ${focusSubtopic} Core Principles`,
          description: `Targeted review of statutory guidelines and key frameworks for ${focusSubtopic} based on your previous checkpoint.`,
          activityType: 'REVIEW' as WeeklyActivityType,
          estimatedMinutes: 25,
          topicTag: focusSubtopic,
          priority: 'REINFORCEMENT' as const,
        },
        {
          title: `Deep-Dive: ${focusSubtopic} Field Workflows`,
          description: `Analyze end-to-end departmental procedures and official manuals governing ${focusSubtopic}.`,
          activityType: 'LEARN' as WeeklyActivityType,
          estimatedMinutes: 30,
          topicTag: focusSubtopic,
          priority: 'HIGH' as const,
        },
        {
          title: `Scenario Practice: Solving ${focusSubtopic} Challenges`,
          description: `Step-by-step problem solving with realistic government administrative scenarios.`,
          activityType: 'PRACTICE' as WeeklyActivityType,
          estimatedMinutes: 25,
          topicTag: focusSubtopic,
          priority: 'HIGH' as const,
        },
        {
          title: `Checkpoint Prep & Concept Reflection`,
          description: `Synthesize key takeaways and self-assess confidence ahead of the weekly check.`,
          activityType: 'REFLECT' as WeeklyActivityType,
          estimatedMinutes: 15,
          topicTag: focusSubtopic,
          priority: 'NORMAL' as const,
        },
      ];
    }

    if (weekNumber === 1) {
      if (isBeginner) {
        return [
          {
            title: `Learn: ${competency} Statutory Framework & Basics`,
            description: `Establish foundational definitions, administrative acts, and regulatory standards for ${competency}.`,
            activityType: 'LEARN' as WeeklyActivityType,
            estimatedMinutes: 30,
            topicTag: `${competency} Basics`,
            priority: 'HIGH' as const,
          },
          {
            title: `Study: Core Frameworks & Cadre Guidelines`,
            description: `Examine official training guidelines tailored to the ${role} cadre.`,
            activityType: 'LEARN' as WeeklyActivityType,
            estimatedMinutes: 25,
            topicTag: `${competency} Frameworks`,
            priority: 'NORMAL' as const,
          },
          {
            title: `Practice: Operational Application in ${assignment}`,
            description: `Hands-on review of microdata validation rules and quality control checklists.`,
            activityType: 'PRACTICE' as WeeklyActivityType,
            estimatedMinutes: 25,
            topicTag: `${assignment} Application`,
            priority: 'NORMAL' as const,
          },
          {
            title: `Synthesize: Weekly Notes & Reflection`,
            description: `Review mistakes, catalog key acronyms, and verify readiness for the weekly check.`,
            activityType: 'REFLECT' as WeeklyActivityType,
            estimatedMinutes: 15,
            topicTag: `${competency} Reflection`,
            priority: 'NORMAL' as const,
          },
        ];
      } else {
        return [
          {
            title: `Review: Cadre Standards & Methodological Standards`,
            description: `Rapid refresher on updated national benchmarks, omitting redundant introductory concepts.`,
            activityType: 'REVIEW' as WeeklyActivityType,
            estimatedMinutes: 20,
            topicTag: `${competency} Standards`,
            priority: 'HIGH' as const,
          },
          {
            title: `Learn: Advanced Analytical Protocols in ${assignment}`,
            description: `Explore multi-stage sampling error estimation and outlier reconciliation protocols.`,
            activityType: 'LEARN' as WeeklyActivityType,
            estimatedMinutes: 30,
            topicTag: `${assignment} Analysis`,
            priority: 'HIGH' as const,
          },
          {
            title: `Practice: Complex Data Scrubbing Scenarios`,
            description: `Work through non-trivial scenario edge cases encountered in field returns.`,
            activityType: 'PRACTICE' as WeeklyActivityType,
            estimatedMinutes: 30,
            topicTag: `Complex Scenarios`,
            priority: 'NORMAL' as const,
          },
          {
            title: `Synthesize: Performance Checklist`,
            description: `Prepare for the Weekly Knowledge Check.`,
            activityType: 'REFLECT' as WeeklyActivityType,
            estimatedMinutes: 15,
            topicTag: `${competency} Reflection`,
            priority: 'NORMAL' as const,
          },
        ];
      }
    }

    // Week 2+ Default
    return [
      {
        title: `Learn: Operational Execution in ${assignment}`,
        description: `Operationalize ${competency} methodologies across departmental data streams.`,
        activityType: 'LEARN' as WeeklyActivityType,
        estimatedMinutes: 30,
        topicTag: `${competency} Execution`,
        priority: 'HIGH' as const,
      },
      {
        title: `Practice: Realistic Cadre Case Simulations`,
        description: `Resolve practical governance challenges and evaluate evidence-based alternatives.`,
        activityType: 'PRACTICE' as WeeklyActivityType,
        estimatedMinutes: 30,
        topicTag: `Case Simulations`,
        priority: 'HIGH' as const,
      },
      {
        title: `Review: Common Pitfalls & Audit Requirements`,
        description: `Examine previous inspection findings and ensure compliance with auditing standards.`,
        activityType: 'REVIEW' as WeeklyActivityType,
        estimatedMinutes: 20,
        topicTag: `Audit & Quality`,
        priority: 'NORMAL' as const,
      },
      {
        title: `Weekly Reflection & Preparation`,
        description: `Consolidate findings before the Weekly Learning Check.`,
        activityType: 'REFLECT' as WeeklyActivityType,
        estimatedMinutes: 15,
        topicTag: `Reflection`,
        priority: 'NORMAL' as const,
      },
    ];
  }

  /**
   * Generates grounded weekly checkpoint questions with topic tags for topic-level adaptation.
   */
  private static async generateWeeklyCheckpoint(
    planId: number,
    learnerId: number,
    learningPathId: number,
    weekNumber: number,
    competency: string,
    previousResult: WeeklyCheckpointResult | null
  ) {
    await execute(`
      INSERT INTO weekly_checkpoints 
      (weekly_plan_id, learner_id, learning_path_id, week_number, title, total_questions, passing_score, competency_name)
      VALUES 
      (${planId}, ${learnerId}, ${learningPathId}, ${weekNumber}, 
       'Week ${weekNumber} Learning Check: ${competency.replace(/'/g, "''")}', 5, 60, '${competency.replace(/'/g, "''")}')
    `);

    const checkpoint = await queryOne<WeeklyCheckpoint>(
      `SELECT * FROM weekly_checkpoints WHERE weekly_plan_id = ${planId} ORDER BY id DESC LIMIT 1`
    );

    const cpId = checkpoint!.id;

    // Check if previous week had weak topics; if so, create questions heavily weighted toward that weak topic!
    const weakTopics: string[] = previousResult
      ? typeof previousResult.weak_topics === 'string'
        ? JSON.parse(previousResult.weak_topics || '[]')
        : previousResult.weak_topics || []
      : [];

    const isReinforcement = weakTopics.length > 0;
    const questions = this.resolveCheckpointQuestions(competency, weekNumber, isReinforcement ? weakTopics[0] : null);

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await execute(`
        INSERT INTO weekly_checkpoint_questions 
        (checkpoint_id, question_number, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, topic_tag, difficulty, source_reference)
        VALUES 
        (${cpId}, ${i + 1}, 
         '${q.questionText.replace(/'/g, "''")}', 
         '${q.options[0].replace(/'/g, "''")}', 
         '${q.options[1].replace(/'/g, "''")}', 
         '${q.options[2].replace(/'/g, "''")}', 
         '${q.options[3].replace(/'/g, "''")}', 
         ${q.correctOption}, 
         '${q.explanation.replace(/'/g, "''")}', 
         '${q.topicTag.replace(/'/g, "''")}', 
         '${q.difficulty}', 
         'Official Cadre Training Guide (MoSPI / NSSTA & Government Standards)')
      `);
    }
  }

  /**
   * Grounded question repository mapped by domain competency and topic tags.
   */
  private static resolveCheckpointQuestions(
    competency: string,
    weekNumber: number,
    reinforceTopic: string | null
  ) {
    const compLower = competency.toLowerCase();

    // Contract Management / Procurement (from user journey example)
    if (compLower.includes('contract') || compLower.includes('procurement')) {
      if (reinforceTopic && reinforceTopic.toLowerCase().includes('procurement')) {
        return [
          {
            questionText: 'Under public procurement rules (GFR 2017), what is the mandatory threshold for procuring goods via GeM portal?',
            options: [
              'GeM is mandatory for all common use goods and services available on the portal.',
              'GeM is strictly optional below ₹50,000.',
              'GeM is only required for international open tenders.',
              'GeM is prohibited for state government departments.',
            ],
            correctOption: 0,
            explanation: 'Under Rule 149 of GFR 2017, procurement of common use goods and services available on GeM is mandatory for Ministries and Departments.',
            topicTag: 'Procurement Lifecycle',
            difficulty: 'Medium',
          },
          {
            questionText: 'In the government tendering process, what is the primary purpose of a Two-Bid (Two-Envelope) system?',
            options: [
              'To allow contractors to negotiate prices before bid submission.',
              'To evaluate technical compliance before opening financial proposals, avoiding bias.',
              'To double the required security deposit.',
              'To eliminate micro and small enterprises from participating.',
            ],
            correctOption: 1,
            explanation: 'The two-bid system evaluates technical bids first to ensure specification compliance before financial bids are decrypted.',
            topicTag: 'Procurement Lifecycle',
            difficulty: 'Medium',
          },
          {
            questionText: 'Which condition permits Single Source or Proprietary Article Certificate (PAC) procurement?',
            options: [
              'When the purchasing officer prefers an existing vendor without justification.',
              'Only when official certification proves only one manufacturer or proprietary source exists.',
              'When the annual departmental budget is nearing expiry.',
              'Whenever the estimated contract value is under ₹10 Lakhs.',
            ],
            correctOption: 1,
            explanation: 'PAC procurement requires strict statutory justification confirming proprietary monopoly without commercial substitutes.',
            topicTag: 'Procurement Lifecycle',
            difficulty: 'Hard',
          },
          {
            questionText: 'What key milestone marks the transition from procurement phase into contract administration?',
            options: [
              'Submission of earnest money deposit (EMD).',
              'Issuance of Letter of Acceptance (LoA) / Contract Signing and submission of Performance Security.',
              'Publication of expression of interest.',
              'Opening of financial bids.',
            ],
            correctOption: 1,
            explanation: 'Issuing the formal LoA, signing the agreement, and receiving the Performance Bank Guarantee initiates contract administration.',
            topicTag: 'Contract Administration',
            difficulty: 'Medium',
          },
          {
            questionText: 'What is the standard purpose of liquidated damages (LD) in government contracts?',
            options: [
              'To penalize the contractor arbitrarily for non-delivery.',
              'Pre-estimated genuine compensation for financial loss caused by contractor delays without proof of actual damage.',
              'A bonus awarded for early project commissioning.',
              'A mechanism to cancel statutory GST obligations.',
            ],
            correctOption: 1,
            explanation: 'Liquidated damages represent pre-agreed genuine pre-estimates of damages sustained due to delay.',
            topicTag: 'Contract Administration',
            difficulty: 'Hard',
          },
        ];
      }

      // Standard Week 1 Contract Management
      return [
        {
          questionText: 'In government contracts, what makes a contract legally binding under the Indian Contract Act 1872?',
          options: [
            'Offer, unconditional acceptance, lawful consideration, competent parties, and free consent.',
            'Verbal approval by any administrative officer without written record.',
            'Unilateral agreement without consideration.',
            'Only contracts exceeding ₹1 Crore.',
          ],
          correctOption: 0,
          explanation: 'Section 10 of the Indian Contract Act defines essential elements of a valid contract including lawful consideration and competent parties.',
          topicTag: 'Contract Basics',
          difficulty: 'Easy',
        },
        {
          questionText: 'Under Article 299 of the Constitution of India, in whose name must Union contracts be executed?',
          options: [
            'The concerned Joint Secretary personally.',
            'The President of India.',
            'The Chief Vigilance Officer.',
            'The Comptroller and Auditor General.',
          ],
          correctOption: 1,
          explanation: 'Article 299(1) dictates that all contracts made in the exercise of executive power of the Union shall be expressed to be made by the President.',
          topicTag: 'Contract Basics',
          difficulty: 'Medium',
        },
        {
          questionText: 'In public procurement, what is the primary role of Earnest Money Deposit (EMD) / Bid Security?',
          options: [
            'To serve as final payment for goods supplied.',
            'To ensure the bidder does not withdraw or alter their tender during validity period.',
            'To cover shipping and customs duties.',
            'To finance the evaluation committee travel costs.',
          ],
          correctOption: 1,
          explanation: 'Bid security deters frivolous bids and guarantees that the bidder will abide by their submitted tender terms.',
          topicTag: 'Procurement Lifecycle',
          difficulty: 'Medium',
        },
        {
          questionText: 'When does a government tender notice become legally effective?',
          options: [
            'When internally drafted by the section officer.',
            'Upon formal publication on Central Public Procurement Portal (CPPP) or official gazette.',
            'When discussed in a vendor pre-bid conference.',
            'Only after the first bidder submits an offer.',
          ],
          correctOption: 1,
          explanation: 'Public notice principles require formal publication on approved public portals like CPPP to guarantee transparency.',
          topicTag: 'Procurement Lifecycle',
          difficulty: 'Medium',
        },
        {
          questionText: 'What is the maximum limit typically prescribed for Earnest Money Deposit (EMD) under GFR?',
          options: [
            '10% to 15% of estimated tender value.',
            '2% to 5% of estimated tender value.',
            'Exactly 25% of total budget.',
            'Fixed ₹1,000 irrespective of tender scale.',
          ],
          correctOption: 1,
          explanation: 'Rule 170 of GFR 2017 specifies bid security is ordinarily 2% to 5% of the estimated contract value.',
          topicTag: 'Procurement Lifecycle',
          difficulty: 'Hard',
        },
      ];
    }

    // Default Survey Methodology / Official Statistics (Arun Kumar baseline)
    return [
      {
        questionText: 'In official sample surveys conducted by NSSO/MoSPI, what distinguishes probability sampling from quota sampling?',
        options: [
          'Probability sampling gives every unit a known, non-zero probability of selection, enabling valid sampling error estimation.',
          'Probability sampling is strictly non-mathematical.',
          'Quota sampling is preferred for national economic indicators.',
          'There is no mathematical difference between the two methods.',
        ],
        correctOption: 0,
        explanation: 'Probability sampling ensures measurable selection probabilities, which allows calculation of unbiased estimators and sampling variances.',
        topicTag: 'Survey Fundamentals',
        difficulty: 'Easy',
      },
      {
        questionText: 'In the Periodic Labour Force Survey (PLFS), how are Primary Sampling Units (PSUs) defined in urban areas?',
        options: [
          'Municipal Corporation Wards.',
          'Urban Frame Survey (UFS) blocks.',
          'Pincode delivery zones.',
          'Individual household telephone directories.',
        ],
        correctOption: 1,
        explanation: 'In urban sectors, NSSO relies on Urban Frame Survey (UFS) blocks as the primary sampling frame for PSUs.',
        topicTag: 'Survey Fundamentals',
        difficulty: 'Medium',
      },
      {
        questionText: 'What is the statistical benefit of Stratified Random Sampling over Simple Random Sampling (SRS) for heterogeneous populations?',
        options: [
          'It increases sampling error across all strata.',
          'It reduces sampling variance by grouping homogeneous units within strata, improving estimation precision.',
          'It eliminates the need for any field survey staff.',
          'It permits subjective selection of preferred respondents.',
        ],
        correctOption: 1,
        explanation: 'Stratification reduces overall variance by capturing between-strata differences and sampling within homogeneous strata.',
        topicTag: 'Stratified Sampling',
        difficulty: 'Medium',
      },
      {
        questionText: 'During PLFS microdata validation, which consistency check is mandatory when cross-referencing Activity Status and Principal Status?',
        options: [
          'Verifying that Current Weekly Status (CWS) hours do not contradict Usual Status employment codes.',
          'Ensuring all respondents report identical wage values.',
          'Omitting households that report informal sector earnings.',
          'Multiplying sample weights by total national population.',
        ],
        correctOption: 0,
        explanation: 'Logical consistency between Current Weekly Status (CWS) and Usual Principal Activity is an essential automated microdata validation rule.',
        topicTag: 'Microdata Validation',
        difficulty: 'Hard',
      },
      {
        questionText: 'What is the function of the Multiplier (Sampling Weight) attached to each respondent schedule in official datasets?',
        options: [
          'To calculate field surveyor travel allowances.',
          'To inflate sample counts to represent total population estimates in national aggregates.',
          'To measure battery life of Computer Assisted Personal Interviewing (CAPI) tablets.',
          'To randomly discard excess household records.',
        ],
        correctOption: 1,
        explanation: 'Sampling weights (multipliers) are the inverse of selection probabilities used to derive representative population totals.',
        topicTag: 'Survey Fundamentals',
        difficulty: 'Medium',
      },
    ];
  }

  /**
   * Toggles completion status of a weekly learning activity and updates momentum.
   */
  public static async toggleItemCompletion(
    planId: number,
    itemId: number,
    learnerId: number
  ): Promise<WeeklyPlanWithItems> {
    const item = await queryOne<WeeklyLearningItem>(
      `SELECT * FROM weekly_learning_items WHERE id = ${itemId} AND weekly_plan_id = ${planId}`
    );
    if (!item) {
      throw new Error(`Learning item #${itemId} not found in plan #${planId}.`);
    }

    const newCompleted = !item.is_completed;
    const completedAtSql = newCompleted ? 'CURRENT_TIMESTAMP' : 'NULL';

    await execute(`
      UPDATE weekly_learning_items 
      SET is_completed = ${newCompleted}, completed_at = ${completedAtSql}
      WHERE id = ${itemId}
    `);

    // Recalculate completed minutes and momentum status
    const allItems = await query<WeeklyLearningItem>(
      `SELECT * FROM weekly_learning_items WHERE weekly_plan_id = ${planId}`
    );

    let completedMins = 0;
    let completedCount = 0;

    for (const it of allItems) {
      if (it.is_completed) {
        completedMins += it.estimated_minutes;
        completedCount++;
      }
    }

    const completionRatio = allItems.length > 0 ? completedCount / allItems.length : 0;
    let momentum: 'On Track' | 'Steady' | 'Needs Attention' = 'Needs Attention';
    if (completionRatio >= 0.7) {
      momentum = 'On Track';
    } else if (completionRatio >= 0.35) {
      momentum = 'Steady';
    }

    await execute(`
      UPDATE weekly_learning_plans 
      SET completed_minutes = ${completedMins}, momentum_status = '${momentum}', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${planId}
    `);

    return this.assemblePlanDetails(planId);
  }

  /**
   * Retrieves checkpoint questions for a weekly plan.
   */
  public static async getCheckpoint(planId: number, learnerId: number) {
    const checkpoint = await queryOne<WeeklyCheckpoint>(
      `SELECT * FROM weekly_checkpoints WHERE weekly_plan_id = ${planId} AND learner_id = ${learnerId}`
    );
    if (!checkpoint) {
      throw new Error(`Weekly checkpoint for plan #${planId} not found.`);
    }

    const questions = await query<any>(
      `SELECT * FROM weekly_checkpoint_questions WHERE checkpoint_id = ${checkpoint.id} ORDER BY question_number ASC`
    );

    const formattedQuestions: WeeklyCheckpointQuestion[] = questions.map((q) => ({
      id: q.id,
      checkpoint_id: q.checkpoint_id,
      question_number: q.question_number,
      question_text: q.question_text,
      options: [q.option_a, q.option_b, q.option_c, q.option_d],
      correct_option: q.correct_option,
      explanation: q.explanation,
      topic_tag: q.topic_tag,
      difficulty: q.difficulty,
      source_reference: q.source_reference,
      created_at: q.created_at,
    }));

    // Check if result exists
    const result = await queryOne<WeeklyCheckpointResult>(
      `SELECT * FROM weekly_checkpoint_results WHERE checkpoint_id = ${checkpoint.id} ORDER BY id DESC LIMIT 1`
    );

    return {
      checkpoint,
      questions: formattedQuestions,
      result: result ? this.formatResult(result) : null,
    };
  }

  /**
   * Submits answers for a weekly checkpoint and conducts improvement analysis.
   */
  public static async submitCheckpoint(
    planId: number,
    learnerId: number,
    answers: Record<number, number>
  ): Promise<WeeklyCheckpointResult> {
    const checkpoint = await queryOne<WeeklyCheckpoint>(
      `SELECT * FROM weekly_checkpoints WHERE weekly_plan_id = ${planId} AND learner_id = ${learnerId}`
    );
    if (!checkpoint) {
      throw new Error(`Checkpoint for plan #${planId} not found.`);
    }

    const questions = await query<any>(
      `SELECT * FROM weekly_checkpoint_questions WHERE checkpoint_id = ${checkpoint.id} ORDER BY question_number ASC`
    );

    let correctCount = 0;
    const topicStats: Record<string, { total: number; correct: number }> = {};
    const answerSummaries: any[] = [];

    for (const q of questions) {
      const selected = answers[q.id];
      const isCorrect = selected !== undefined && Number(selected) === Number(q.correct_option);
      if (isCorrect) correctCount++;

      const tag = q.topic_tag || 'General';
      if (!topicStats[tag]) topicStats[tag] = { total: 0, correct: 0 };
      topicStats[tag].total++;
      if (isCorrect) topicStats[tag].correct++;

      answerSummaries.push({
        question_id: q.id,
        question_text: q.question_text,
        selected_option: selected,
        correct_option: q.correct_option,
        is_correct: isCorrect,
        topic_tag: tag,
        explanation: q.explanation,
      });
    }

    const totalQuestions = questions.length;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

    let rating: 'Excellent' | 'Good' | 'Developing' | 'Needs Attention' = 'Developing';
    if (scorePercentage >= 80) rating = 'Excellent';
    else if (scorePercentage >= 60) rating = 'Good';
    else if (scorePercentage >= 40) rating = 'Developing';
    else rating = 'Needs Attention';

    const strongTopics: string[] = [];
    const weakTopics: string[] = [];

    for (const [tag, stats] of Object.entries(topicStats)) {
      const pct = Math.round((stats.correct / stats.total) * 100);
      if (pct >= SCORE_MASTERY_THRESHOLD) {
        strongTopics.push(tag);
      } else {
        weakTopics.push(tag);
      }

      // Record in weekly_topic_performance
      const status = pct >= SCORE_MASTERY_THRESHOLD ? 'STRONG' : pct >= SCORE_NEEDS_PRACTICE_THRESHOLD ? 'CONTINUE' : 'REINFORCE';
      await execute(`
        INSERT INTO weekly_topic_performance 
        (learner_id, weekly_plan_id, topic_name, mastery_percentage, status)
        VALUES 
        (${learnerId}, ${planId}, '${tag.replace(/'/g, "''")}', ${pct}, '${status}')
      `);
    }

    // Generate improvement interpretation
    let improvementAnalysis = '';
    let nextWeekRecommendation = '';

    if (scorePercentage >= SCORE_MASTERY_THRESHOLD) {
      improvementAnalysis = `Strong demonstrated understanding across evaluated topics (${scorePercentage}%). You have successfully met weekly cadre benchmarks.`;
      nextWeekRecommendation = `Advance to next learning phase with practical scenario drills and advanced regulatory standards.`;
    } else if (scorePercentage >= SCORE_NEEDS_PRACTICE_THRESHOLD) {
      improvementAnalysis = `Demonstrated solid foundational grasp (${scorePercentage}%), with specific areas (${weakTopics.join(', ') || 'applied scenarios'}) benefiting from additional targeted practice.`;
      nextWeekRecommendation = `Week ${checkpoint.week_number + 1} will incorporate targeted exercises on ${weakTopics[0] || 'applied workflows'} before introducing advanced concepts.`;
    } else {
      improvementAnalysis = `Learning progress indicator shows foundational concepts are still developing (${scorePercentage}%). Cadre standards require reinforcing core topics before proceeding.`;
      nextWeekRecommendation = `Week ${checkpoint.week_number + 1} plan will be recalibrated to review ${weakTopics.join(' and ') || 'foundational principles'} through guided scenarios.`;
    }

    // Persist checkpoint result
    await execute(`
      INSERT INTO weekly_checkpoint_results 
      (checkpoint_id, weekly_plan_id, learner_id, total_questions, correct_count, score_percentage, progress_rating, strong_topics, weak_topics, improvement_analysis, next_week_recommendation, answers_summary)
      VALUES 
      (${checkpoint.id}, ${planId}, ${learnerId}, ${totalQuestions}, ${correctCount}, ${scorePercentage}, 
       '${rating}', 
       '${JSON.stringify(strongTopics).replace(/'/g, "''")}', 
       '${JSON.stringify(weakTopics).replace(/'/g, "''")}', 
       '${improvementAnalysis.replace(/'/g, "''")}', 
       '${nextWeekRecommendation.replace(/'/g, "''")}', 
       '${JSON.stringify(answerSummaries).replace(/'/g, "''")}')
    `);

    // Mark weekly plan status as COMPLETED
    await execute(`
      UPDATE weekly_learning_plans 
      SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${planId}
    `);

    const result = await queryOne<WeeklyCheckpointResult>(
      `SELECT * FROM weekly_checkpoint_results WHERE checkpoint_id = ${checkpoint.id} ORDER BY id DESC LIMIT 1`
    );

    return this.formatResult(result!);
  }

  /**
   * User-controlled fast plan adjustment.
   */
  public static async adjustPlan(
    planId: number,
    learnerId: number,
    input: PlanAdjustmentInput
  ): Promise<WeeklyPlanWithItems> {
    const plan = await queryOne<WeeklyLearningPlan>(
      `SELECT * FROM weekly_learning_plans WHERE id = ${planId} AND learner_id = ${learnerId}`
    );
    if (!plan) {
      throw new Error(`Plan #${planId} not found.`);
    }

    switch (input.adjustment_type) {
      case 'less_time':
        // Reduce item durations by 25% and limit to 3 primary items
        await execute(`
          UPDATE weekly_learning_items 
          SET estimated_minutes = GREATEST(15, CAST(ROUND(estimated_minutes * 0.75) AS INTEGER))
          WHERE weekly_plan_id = ${planId}
        `);
        await execute(`
          UPDATE weekly_learning_plans 
          SET adaptation_reason = 'Plan adjusted: Reduced session durations to accommodate temporary time constraints.',
              total_planned_minutes = GREATEST(60, CAST(ROUND(total_planned_minutes * 0.75) AS INTEGER)),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${planId}
        `);
        break;

      case 'more_time':
        // Add 10 mins to practice items
        await execute(`
          UPDATE weekly_learning_items 
          SET estimated_minutes = estimated_minutes + 10
          WHERE weekly_plan_id = ${planId} AND activity_type IN ('PRACTICE', 'LEARN')
        `);
        await execute(`
          UPDATE weekly_learning_plans 
          SET adaptation_reason = 'Plan adjusted: Increased practice duration to take advantage of extra available study time.',
              total_planned_minutes = total_planned_minutes + 30,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${planId}
        `);
        break;

      case 'need_practice':
        // Elevate priority of practice items
        await execute(`
          UPDATE weekly_learning_items 
          SET priority_level = 'HIGH', activity_type = 'PRACTICE'
          WHERE weekly_plan_id = ${planId} AND sequence_order = 2
        `);
        await execute(`
          UPDATE weekly_learning_plans 
          SET adaptation_reason = 'Plan adjusted: Re-calibrated activities to emphasize practical case studies and drills.',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${planId}
        `);
        break;

      case 'already_know':
        // Mark first introductory item as completed
        await execute(`
          UPDATE weekly_learning_items 
          SET is_completed = TRUE, completed_at = CURRENT_TIMESTAMP
          WHERE weekly_plan_id = ${planId} AND sequence_order = 1
        `);
        await execute(`
          UPDATE weekly_learning_plans 
          SET adaptation_reason = 'Plan adjusted: Introductory review marked as mastered to advance immediately to applied exercises.',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${planId}
        `);
        break;
    }

    return this.assemblePlanDetails(planId);
  }

  /**
   * Retrieves full plan history for a learning path.
   */
  public static async getPlanHistory(learningPathId: number, learnerId: number): Promise<WeeklyPlanWithItems[]> {
    const plans = await query<WeeklyLearningPlan>(
      `SELECT * FROM weekly_learning_plans 
       WHERE learning_path_id = ${learningPathId} AND learner_id = ${learnerId}
       ORDER BY week_number ASC, version DESC`
    );

    const results: WeeklyPlanWithItems[] = [];
    for (const p of plans) {
      results.push(await this.assemblePlanDetails(p.id));
    }
    return results;
  }

  /**
   * Assembles a weekly plan with all its items, checkpoint status, and summary metrics.
   */
  public static async assemblePlanDetails(planId: number): Promise<WeeklyPlanWithItems> {
    const plan = await queryOne<WeeklyLearningPlan>(
      `SELECT * FROM weekly_learning_plans WHERE id = ${planId}`
    );
    if (!plan) {
      throw new Error(`Weekly plan #${planId} not found.`);
    }

    const items = await query<WeeklyLearningItem>(
      `SELECT * FROM weekly_learning_items WHERE weekly_plan_id = ${planId} ORDER BY sequence_order ASC`
    );

    const checkpoint = await queryOne<WeeklyCheckpoint>(
      `SELECT * FROM weekly_checkpoints WHERE weekly_plan_id = ${planId}`
    );

    let latestResult: WeeklyCheckpointResult | null = null;
    if (checkpoint) {
      const rawRes = await queryOne<WeeklyCheckpointResult>(
        `SELECT * FROM weekly_checkpoint_results WHERE checkpoint_id = ${checkpoint.id} ORDER BY id DESC LIMIT 1`
      );
      if (rawRes) {
        latestResult = this.formatResult(rawRes);
      }
    }

    const prefs = await this.getSchedulePreferences(plan.learner_id);
    const completedItems = items.filter((i) => i.is_completed).length;
    const completionPct = items.length > 0 ? Math.round((completedItems / items.length) * 100) : 0;

    return {
      ...plan,
      items: items.map((i) => ({
        ...i,
        is_completed: Boolean(i.is_completed),
        is_carried_forward: Boolean(i.is_carried_forward),
      })),
      checkpoint,
      latest_result: latestResult,
      is_checkpoint_completed: Boolean(latestResult),
      completion_percentage: completionPct,
      schedule_summary: {
        preferred_days: prefs.preferred_days.split(',').map((d) => d.trim()),
        minutes_per_session: prefs.minutes_per_session,
        weekly_minutes_target: prefs.weekly_minutes_target,
        preferred_period: prefs.preferred_period,
      },
    };
  }

  private static formatResult(raw: any): WeeklyCheckpointResult {
    return {
      id: raw.id,
      checkpoint_id: raw.checkpoint_id,
      weekly_plan_id: raw.weekly_plan_id,
      learner_id: raw.learner_id,
      total_questions: raw.total_questions,
      correct_count: raw.correct_count,
      score_percentage: raw.score_percentage,
      progress_rating: raw.progress_rating,
      strong_topics: typeof raw.strong_topics === 'string' ? JSON.parse(raw.strong_topics || '[]') : raw.strong_topics || [],
      weak_topics: typeof raw.weak_topics === 'string' ? JSON.parse(raw.weak_topics || '[]') : raw.weak_topics || [],
      improvement_analysis: raw.improvement_analysis,
      next_week_recommendation: raw.next_week_recommendation,
      answers_summary: typeof raw.answers_summary === 'string' ? JSON.parse(raw.answers_summary || '{}') : raw.answers_summary || {},
      completed_at: raw.completed_at,
    };
  }
}
