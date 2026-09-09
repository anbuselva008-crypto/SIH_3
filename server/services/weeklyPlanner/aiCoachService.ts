import { groqProvider, geminiProvider } from '../aiProvider.ts';
import { query, queryOne, execute } from '../../database/db.ts';
import type {
  AICoachContext,
  AICoachDifficultyLevel,
  AILearningExplanation,
  AIPracticeExercise,
  AIScenario,
  AIScenarioEvaluation,
  AIMistakeExplanation,
  AIReflectionSummary,
  AINextWeekRecommendation,
  Learner,
  Competency,
  WeeklyLearningPlan,
  WeeklyLearningItem,
  WeeklyCheckpoint,
  WeeklyCheckpointResult,
  LearnerSchedulePreference,
} from '../../database/models.ts';

// Language name mapping for prompts
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi (हिंदी)',
  bn: 'Bengali (বাংলা)',
  te: 'Telugu (తెలుగు)',
  mr: 'Marathi (मराठी)',
  ta: 'Tamil (தமிழ்)',
  gu: 'Gujarati (ગુજરાતી)',
  ur: 'Urdu (اردو)',
  kn: 'Kannada (ಕನ್ನಡ)',
  or: 'Odia (ଓଡ଼ିଆ)',
  pa: 'Punjabi (ਪੰਜਾਬੀ)',
  ml: 'Malayalam (മലയാളം)',
};

export class AICoachService {
  /**
   * Builds the normalized AI Learning Context object.
   * Keeps sensitive information out; contains only educational, cadre, and competency metrics.
   */
  public static async buildLearningContext(
    learnerId: number,
    weeklyPlanId: number,
    language = 'en'
  ): Promise<AICoachContext> {
    // 1. Fetch learner profile
    const learner = await queryOne<Learner>(`SELECT * FROM learners WHERE id = ${learnerId}`);
    if (!learner) {
      throw new Error(`Learner #${learnerId} not found.`);
    }

    // 2. Fetch competencies & scores
    const comps = await query<Competency>(
      `SELECT name, score, benchmark_target, category FROM competencies WHERE learner_id = ${learnerId} ORDER BY score ASC`
    );
    const scoreMap: Record<string, number> = {};
    const priorityGaps: string[] = [];

    comps.forEach((c) => {
      scoreMap[c.name] = c.score;
      if (c.score < (c.benchmark_target || 75)) {
        priorityGaps.push(c.name);
      }
    });

    const targetCompetencies = comps.map((c) => c.name);

    // 3. Fetch weekly plan
    const plan = await queryOne<WeeklyLearningPlan>(
      `SELECT * FROM weekly_learning_plans WHERE id = ${weeklyPlanId}`
    );
    if (!plan) {
      throw new Error(`Weekly plan #${weeklyPlanId} not found.`);
    }

    // 4. Fetch activities
    const items = await query<WeeklyLearningItem>(
      `SELECT id, title, activity_type, topic_tag, is_completed FROM weekly_learning_items WHERE weekly_plan_id = ${weeklyPlanId}`
    );
    const completedActivities = items
      .filter((i) => i.is_completed)
      .map((i) => ({
        id: i.id,
        title: i.title,
        activityType: i.activity_type,
        topicTag: i.topic_tag,
      }));

    // 5. Fetch checkpoint performance for current plan
    const checkpoint = await queryOne<WeeklyCheckpoint>(
      `SELECT id FROM weekly_checkpoints WHERE weekly_plan_id = ${weeklyPlanId}`
    );
    let checkpointPerformance: AICoachContext['checkpointPerformance'] = null;

    if (checkpoint) {
      const res = await queryOne<WeeklyCheckpointResult>(
        `SELECT * FROM weekly_checkpoint_results WHERE checkpoint_id = ${checkpoint.id} ORDER BY id DESC LIMIT 1`
      );
      if (res) {
        checkpointPerformance = {
          scorePercentage: res.score_percentage,
          progressRating: res.progress_rating,
          strongTopics: typeof res.strong_topics === 'string' ? JSON.parse(res.strong_topics || '[]') : res.strong_topics || [],
          weakTopics: typeof res.weak_topics === 'string' ? JSON.parse(res.weak_topics || '[]') : res.weak_topics || [],
        };
      }
    }

    // 6. Fetch previous week's performance if week > 1
    let previousWeekPerformance: AICoachContext['previousWeekPerformance'] = null;
    if (plan.week_number > 1) {
      const prevPlan = await queryOne<WeeklyLearningPlan>(
        `SELECT id FROM weekly_learning_plans 
         WHERE learner_id = ${learnerId} AND learning_path_id = ${plan.learning_path_id} AND week_number = ${plan.week_number - 1} 
         ORDER BY id DESC LIMIT 1`
      );
      if (prevPlan) {
        const prevRes = await queryOne<WeeklyCheckpointResult>(
          `SELECT * FROM weekly_checkpoint_results WHERE weekly_plan_id = ${prevPlan.id} ORDER BY id DESC LIMIT 1`
        );
        if (prevRes) {
          previousWeekPerformance = {
            scorePercentage: prevRes.score_percentage,
            weakTopics: typeof prevRes.weak_topics === 'string' ? JSON.parse(prevRes.weak_topics || '[]') : prevRes.weak_topics || [],
          };
        }
      }
    }

    // 7. Schedule Preferences
    const prefs = await queryOne<LearnerSchedulePreference>(
      `SELECT * FROM learner_schedule_preferences WHERE learner_id = ${learnerId}`
    );

    return {
      officerRole: learner.role || 'Government Statistical / Administrative Officer',
      department: learner.department || 'Ministry of Statistics & Programme Implementation',
      field: learner.job_family || 'Official Statistics & Governance',
      educationalQualification: learner.educational_qualification || 'Post Graduate in Relevant Discipline',
      targetCompetencies,
      currentCompetencyScores: scoreMap,
      priorityGaps: priorityGaps.slice(0, 3),
      currentWeek: plan.week_number,
      weeklyPlan: {
        id: plan.id,
        focusTopic: plan.focus_topic,
        whyThisMatters: plan.why_this_matters,
        learningGoal: plan.learning_goal,
        adaptationReason: plan.adaptation_reason,
        momentumStatus: plan.momentum_status,
      },
      completedActivities,
      checkpointPerformance,
      previousWeekPerformance,
      preferredStudyMinutes: prefs ? prefs.minutes_per_session : 30,
      preferredStudyDays: prefs ? prefs.preferred_days.split(',').map((d) => d.trim()) : ['Monday', 'Wednesday', 'Friday'],
      preferredLanguage: language || learner.language_preference || 'en',
    };
  }

  /**
   * Deterministic difficulty calculation:
   * <60%   -> Foundational
   * 60-79% -> Applied
   * >=80%  -> Advanced
   */
  public static resolveDifficulty(context: AICoachContext, topic?: string): AICoachDifficultyLevel {
    // If checkpoint performance is recorded, use checkpoint score
    if (context.checkpointPerformance) {
      const score = context.checkpointPerformance.scorePercentage;
      if (score < 60) return 'Foundational';
      if (score < 80) return 'Applied';
      return 'Advanced';
    }

    // Check specific competency score if topic matches
    if (topic && context.currentCompetencyScores[topic] !== undefined) {
      const score = context.currentCompetencyScores[topic];
      if (score < 60) return 'Foundational';
      if (score < 80) return 'Applied';
      return 'Advanced';
    }

    // Fallback: average of priority gaps or default Applied
    const scores = Object.values(context.currentCompetencyScores);
    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg < 55) return 'Foundational';
      if (avg < 75) return 'Applied';
      return 'Advanced';
    }

    return 'Applied';
  }

  /**
   * PHASE 6: Personalized Learning Explanation
   */
  public static async explainTopic(
    context: AICoachContext,
    topic: string,
    itemId?: number
  ): Promise<AILearningExplanation> {
    const difficulty = this.resolveDifficulty(context, topic);
    const langName = LANGUAGE_NAMES[context.preferredLanguage] || 'English';

    const systemPrompt = `You are the AI-Powered Adaptive Learning Coach for Indian Government Officers under Mission Karmayogi and national cadre standards.
Your role is to provide a grounded, practical, crystal-clear explanation of official administrative/statistical topics.
Calibrate explanation difficulty strictly to: ${difficulty}.
The target officer:
- Role: ${context.officerRole}
- Department: ${context.department}
- Cadre/Field: ${context.field}
- Degree: ${context.educationalQualification}

Language Requirement:
- Respond in ${langName}. If non-English, ensure terminology is authentic, dignified, and understandable to a public servant.
- Keep output in valid JSON ONLY.`;

    const prompt = `Explain the following topic for this officer:
Topic: "${topic}"
Weekly Focus: "${context.weeklyPlan.focusTopic}"
Why It Matters: "${context.weeklyPlan.whyThisMatters}"
Difficulty Band: ${difficulty}

Return JSON with this exact schema:
{
  "title": "Topic title in ${langName}",
  "simpleExplanation": "Clear, accessible explanation of the concept in 2-3 structured paragraphs without unnecessary academic jargon.",
  "keyPoints": [
    "Key statutory or procedural point 1",
    "Key procedural point 2",
    "Key point 3"
  ],
  "practicalExample": "A realistic scenario or concrete administrative use case from ${context.department} demonstrating how this applies.",
  "commonMistakes": [
    "Common administrative error or pitfall 1",
    "Common pitfall 2"
  ],
  "estimatedMinutes": 5,
  "cadreContext": "1 sentence on why this is vital for a ${context.officerRole}."
}`;

    const fallback = (): AILearningExplanation =>
      this.getFallbackExplanation(context, topic, difficulty);

    const result = await this.executeAIWithFallback(
      prompt,
      systemPrompt,
      fallback,
      'EXPLAIN',
      context,
      topic,
      itemId
    );

    return result;
  }

  /**
   * PHASE 7: AI-Generated Practice Exercise
   */
  public static async generatePractice(
    context: AICoachContext,
    topic: string,
    itemId?: number
  ): Promise<AIPracticeExercise> {
    const difficulty = this.resolveDifficulty(context, topic);
    const langName = LANGUAGE_NAMES[context.preferredLanguage] || 'English';

    const systemPrompt = `You are the AI-Powered Adaptive Learning Coach for Indian Government Officers.
Generate a targeted, practical, on-the-job practice exercise strictly calibrated to: ${difficulty}.
Difficulty Rule:
- Foundational: Step-by-step guided task with explicit parameters and clear instructions.
- Applied: Real-world administrative scenario requiring data cross-validation, standard operating procedure (SOP) application, or operational decision-making.
- Advanced: Complex scenario involving conflicting directives, data discrepancies, quality assurance audits, or executive reporting.

Language: ${langName}.
Return valid JSON ONLY.`;

    const prompt = `Generate a practice exercise for:
Officer: ${context.officerRole} at ${context.department}
Topic: "${topic}"
Difficulty Level: ${difficulty}
Weekly Goal: "${context.weeklyPlan.learningGoal}"

Return JSON matching this schema:
{
  "title": "Exercise title in ${langName}",
  "instructions": "Clear step-by-step guidance on how the officer should approach this practice task.",
  "scenario": "A concise real-world administrative or statistical context from ${context.department}.",
  "task": "Specific task or calculation or audit action the officer needs to perform.",
  "expectedOutcome": "The precise standard or solution of successful execution according to cadre guidelines.",
  "estimatedMinutes": ${context.preferredStudyMinutes || 20},
  "difficultyLevel": "${difficulty}",
  "competencyInvolved": "${topic}"
}`;

    const fallback = (): AIPracticeExercise =>
      this.getFallbackPractice(context, topic, difficulty);

    const result = await this.executeAIWithFallback(
      prompt,
      systemPrompt,
      fallback,
      'PRACTICE',
      context,
      topic,
      itemId
    );

    return result;
  }

  /**
   * PHASE 8: AI Scenario Coach
   */
  public static async generateScenario(
    context: AICoachContext,
    topic: string,
    itemId?: number
  ): Promise<AIScenario> {
    const difficulty = this.resolveDifficulty(context, topic);
    const langName = LANGUAGE_NAMES[context.preferredLanguage] || 'English';

    const systemPrompt = `You are the AI Administrative Scenario Coach for Indian Government Officers.
Create a high-stakes or typical daily workplace scenario that tests decision-making under government rules (e.g. GFR, Official Statistics Act, Census/NSS manuals, or RTI/SOPs).
Difficulty level: ${difficulty}.
Language: ${langName}.
Output valid JSON ONLY.`;

    const prompt = `Create a decision scenario for:
Role: ${context.officerRole} (${context.department})
Topic: "${topic}"
Difficulty: ${difficulty}

Return JSON with this schema:
{
  "title": "Scenario Title in ${langName}",
  "situation": "Detailed administrative situation (3-4 sentences) outlining a dilemma, data anomaly, or operational challenge faced by the officer.",
  "decisionQuestion": "What is the most appropriate action for you to take in accordance with cadre rules?",
  "options": [
    "Option A description",
    "Option B description",
    "Option C description",
    "Option D description"
  ],
  "correctOption": 0,
  "rationale": "Comprehensive explanation of why the correct option complies with standards and why other choices are flawed or non-compliant.",
  "competencyInvolved": "${topic}",
  "difficultyLevel": "${difficulty}"
}`;

    const fallback = (): AIScenario =>
      this.getFallbackScenario(context, topic, difficulty);

    const result = await this.executeAIWithFallback(
      prompt,
      systemPrompt,
      fallback,
      'SCENARIO',
      context,
      topic,
      itemId
    );

    return result;
  }

  /**
   * Evaluate Scenario Response
   */
  public static async evaluateScenarioResponse(
    context: AICoachContext,
    scenario: AIScenario,
    selectedOption: number,
    language = 'en'
  ): Promise<AIScenarioEvaluation> {
    const isCorrect = selectedOption === scenario.correctOption;
    const langName = LANGUAGE_NAMES[language] || 'English';

    if (isCorrect) {
      return {
        isCorrect: true,
        selectedOption,
        correctOption: scenario.correctOption,
        rationale: scenario.rationale,
        competencyInvolved: scenario.competencyInvolved,
        improvementTip: `Excellent decision. Your response demonstrates high fidelity to official protocols in ${scenario.competencyInvolved}.`,
        practicalApplication: `In daily assignments at ${context.department}, maintain this rigor when evaluating primary submissions or documentation.`,
        retryScenario: null,
      };
    }

    // If incorrect, provide AI feedback and an alternate retry challenge
    const systemPrompt = `You are an AI Coach for Indian Government Officers.
The officer made an incorrect choice in a scenario exercise.
Analyze the selection constructively, explain the oversight according to government guidelines, and provide an encouraging tip.
Language: ${langName}.
Return valid JSON ONLY.`;

    const prompt = `Scenario: ${scenario.situation}
Question: ${scenario.decisionQuestion}
Selected Option (${selectedOption}): "${scenario.options[selectedOption]}"
Correct Option (${scenario.correctOption}): "${scenario.options[scenario.correctOption]}"
Competency: ${scenario.competencyInvolved}

Return JSON matching:
{
  "improvementTip": "Empathetic, constructive guidance explaining why the selected option falls short of official standard.",
  "practicalApplication": "Concrete tip on what to verify next time in ${context.department}."
}`;

    try {
      const aiResponse = await this.callAI(prompt, systemPrompt);
      const parsed = JSON.parse(this.cleanJSON(aiResponse));
      return {
        isCorrect: false,
        selectedOption,
        correctOption: scenario.correctOption,
        rationale: scenario.rationale,
        competencyInvolved: scenario.competencyInvolved,
        improvementTip: parsed.improvementTip || 'Option selected deviates from standard cadre procedures.',
        practicalApplication: parsed.practicalApplication || 'Always consult official manuals prior to signing off on field microdata.',
        retryScenario: null,
      };
    } catch {
      return {
        isCorrect: false,
        selectedOption,
        correctOption: scenario.correctOption,
        rationale: scenario.rationale,
        competencyInvolved: scenario.competencyInvolved,
        improvementTip: `While option ${String.fromCharCode(65 + selectedOption)} might appear plausible, standard procedures require prioritizing official statutory validation rules over discretionary approximations.`,
        practicalApplication: `In ${context.department}, refer directly to the departmental handbook and cross-check primary schedules.`,
        retryScenario: null,
      };
    }
  }

  /**
   * PHASE 9: Checkpoint Mistake Explanation with Interactive Retry Question
   */
  public static async explainMistake(
    context: AICoachContext,
    questionText: string,
    selectedOptionText: string,
    correctOptionText: string,
    topicTag: string,
    existingExplanation?: string,
    language = 'en'
  ): Promise<AIMistakeExplanation> {
    const langName = LANGUAGE_NAMES[language] || 'English';

    const systemPrompt = `You are the AI Learning Coach for Indian Government Officials analyzing a missed weekly checkpoint question.
Your goal is to turn this mistake into an instant mastery opportunity.
Explain clearly:
1. What went wrong (the common misconception)
2. Why it matters in administrative practice
3. The exact core concept/rule to remember
4. A concrete example
5. A fresh, targeted 4-option retry question testing the same concept so the officer can test their new understanding right away!
Language: ${langName}.
Return valid JSON ONLY.`;

    const prompt = `Officer Role: ${context.officerRole} (${context.department})
Topic Tag: "${topicTag}"
Missed Question: "${questionText}"
Officer Selected: "${selectedOptionText}"
Correct Answer: "${correctOptionText}"
Cadre Reference: "${existingExplanation || 'Standard administrative procedure'}"

Generate a complete JSON response matching this schema:
{
  "whatWentWrong": "Explain the specific flaw or misconception behind selecting '${selectedOptionText}'.",
  "whyItMatters": "Explain the real-world consequence or departmental implication of this error in ${context.department}.",
  "correctConcept": "The exact principle or statutory rule that makes '${correctOptionText}' correct.",
  "example": "A concrete departmental example illustrating the correct rule in action.",
  "retryQuestion": {
    "questionText": "A new practice question testing the same underlying concept.",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "correctOption": 0,
    "explanation": "Clear rationale for the retry question."
  }
}`;

    const fallback = (): AIMistakeExplanation =>
      this.getFallbackMistake(context, questionText, selectedOptionText, correctOptionText, topicTag, existingExplanation);

    const result = await this.executeAIWithFallback(
      prompt,
      systemPrompt,
      fallback,
      'MISTAKE',
      context,
      topicTag
    );

    return result;
  }

  /**
   * PHASE 10: Weekly Reflection Summary
   */
  public static async generateWeeklyReflection(
    context: AICoachContext,
    language = 'en'
  ): Promise<AIReflectionSummary> {
    const langName = LANGUAGE_NAMES[language] || 'English';
    const completedCount = context.completedActivities.length;
    const score = context.checkpointPerformance?.scorePercentage ?? null;

    const systemPrompt = `You are the AI Weekly Learning Coach for an Indian Government Official.
Generate an encouraging, executive-level end-of-week reflection.
Highlight tangible skill gains, areas needing continued attention, and recommendations for the upcoming week.
Language: ${langName}.
Return valid JSON ONLY.`;

    const prompt = `Officer: ${context.officerRole}, ${context.department}
Week: ${context.currentWeek}
Focus Topic: "${context.weeklyPlan.focusTopic}"
Completed Activities: ${completedCount} sessions (${context.completedActivities.map((a) => a.title).join(', ')})
Checkpoint Score: ${score !== null ? `${score}%` : 'Not yet attempted'}
Strong Areas: ${context.checkpointPerformance?.strongTopics?.join(', ') || 'Consistent study habits'}
Areas Needing Reinforcement: ${context.checkpointPerformance?.weakTopics?.join(', ') || 'Advanced application'}
Priority Skill Gaps: ${context.priorityGaps.join(', ')}

Return JSON matching this schema:
{
  "whatYouImproved": [
    "Specific improvement 1 achieved this week",
    "Specific improvement 2"
  ],
  "whatStillNeedsAttention": [
    "Specific area 1 requiring further practice",
    "Specific area 2"
  ],
  "whatToFocusOnNext": [
    "High-leverage focus 1 for next week",
    "High-leverage focus 2"
  ],
  "coachMessage": "Personalized, motivational coaching note in 2-3 sentences addressing the officer respectfully.",
  "completionScoreRatio": "${completedCount} activities logged • ${score !== null ? `${score}% score` : 'Checkpoint pending'}"
}`;

    const fallback = (): AIReflectionSummary => this.getFallbackReflection(context);

    const result = await this.executeAIWithFallback(
      prompt,
      systemPrompt,
      fallback,
      'REFLECTION',
      context,
      context.weeklyPlan.focusTopic
    );

    return result;
  }

  /**
   * PHASE 11: Next-Week AI Personalization Recommendation
   */
  public static async recommendNextWeek(
    context: AICoachContext,
    language = 'en'
  ): Promise<AINextWeekRecommendation> {
    const langName = LANGUAGE_NAMES[language] || 'English';
    const score = context.checkpointPerformance?.scorePercentage ?? 70;

    // Deterministic direction
    let adaptiveDirection: AINextWeekRecommendation['adaptiveDirection'] = 'Consolidation';
    let difficultyLevel: AICoachDifficultyLevel = 'Applied';

    if (score < 60) {
      adaptiveDirection = 'Reinforcement';
      difficultyLevel = 'Foundational';
    } else if (score >= 80) {
      adaptiveDirection = 'Advanced Acceleration';
      difficultyLevel = 'Advanced';
    }

    const systemPrompt = `You are the AI Learning Coach for Indian Government Officers.
Recommend personalized topics, activity focus, and study cadence for the upcoming week based on the deterministic adaptive direction: ${adaptiveDirection} (${difficultyLevel}).
Language: ${langName}.
Return valid JSON ONLY.`;

    const prompt = `Officer: ${context.officerRole} (${context.department})
Current Week: ${context.currentWeek}
Checkpoint Score: ${score}%
Adaptive Direction: ${adaptiveDirection} (${difficultyLevel})
Weak Topics: ${context.checkpointPerformance?.weakTopics?.join(', ') || 'None'}
Strong Topics: ${context.checkpointPerformance?.strongTopics?.join(', ') || 'General Core'}
Priority Cadre Gaps: ${context.priorityGaps.join(', ')}

Return JSON matching:
{
  "priorityArea": "Clear topic title for next week aligned with ${adaptiveDirection}",
  "reason": "Personalized rationale explaining how this matches the officer's performance and cadre role.",
  "recommendedActivities": [
    "Activity 1 title (e.g. Targeted review / drill)",
    "Activity 2 title (e.g. Hands-on workflow)",
    "Activity 3 title (e.g. Departmental scenario)"
  ],
  "recommendedMinutes": ${context.preferredStudyMinutes * 4 || 120},
  "difficultyLevel": "${difficultyLevel}",
  "adaptiveDirection": "${adaptiveDirection}"
}`;

    const fallback = (): AINextWeekRecommendation =>
      this.getFallbackNextWeek(context, adaptiveDirection, difficultyLevel, score);

    const result = await this.executeAIWithFallback(
      prompt,
      systemPrompt,
      fallback,
      'NEXT_WEEK',
      context,
      context.weeklyPlan.focusTopic
    );

    return result;
  }

  // =========================================================================
  // Core AI Execution & Resilient Fallback Engine
  // =========================================================================

  private static async executeAIWithFallback<T>(
    prompt: string,
    systemPrompt: string,
    fallbackGenerator: () => T,
    actionType: string,
    context: AICoachContext,
    topic?: string,
    itemId?: number
  ): Promise<T & { isFallback?: boolean; provider?: string }> {
    const isGroqConfigured = groqProvider.isAvailable();
    const isGeminiConfigured = geminiProvider.isAvailable();

    if (!isGroqConfigured && !isGeminiConfigured) {
      console.log(`[AICoach] No AI API keys configured. Using grounded deterministic fallback for ${actionType}.`);
      const fallbackData = fallbackGenerator();
      await this.logInteraction(context, actionType, topic, fallbackData, 'Deterministic Fallback', true);
      return { ...fallbackData, isFallback: true, provider: 'Standard Cadre Engine' };
    }

    try {
      // Execute with 12s timeout to guarantee UI responsiveness
      const aiResponse = await Promise.race([
        this.callAI(prompt, systemPrompt),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('AI generation timed out (12s threshold).')), 12000)
        ),
      ]);

      const cleaned = this.cleanJSON(aiResponse);
      const parsed = JSON.parse(cleaned);

      const providerName = isGroqConfigured ? 'Groq (Llama 3.3)' : 'Gemini 2.5 Flash';
      await this.logInteraction(context, actionType, topic, parsed, providerName, false);

      return { ...parsed, isFallback: false, provider: providerName };
    } catch (err: any) {
      console.warn(`[AICoach] AI Generation failed for ${actionType}: ${err?.message}. Activating deterministic fallback.`);
      const fallbackData = fallbackGenerator();
      await this.logInteraction(context, actionType, topic, fallbackData, 'Fallback after error', true);
      return { ...fallbackData, isFallback: true, provider: 'Standard Cadre Engine (Offline)' };
    }
  }

  private static async callAI(prompt: string, systemPrompt: string): Promise<string> {
    if (groqProvider.isAvailable()) {
      return groqProvider.generateCompletion(prompt, systemPrompt, {
        temperature: 0.2,
        maxTokens: 2500,
        jsonMode: true,
      });
    }

    if (geminiProvider.isAvailable()) {
      return geminiProvider.generateCompletion(prompt, systemPrompt, {
        temperature: 0.2,
        maxTokens: 2500,
        jsonMode: true,
      });
    }

    throw new Error('No AI provider available.');
  }

  private static cleanJSON(raw: string): string {
    let text = raw.trim();
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return text.trim();
  }

  private static async logInteraction(
    context: AICoachContext,
    actionType: string,
    topicTag: string | undefined,
    outputData: any,
    provider: string,
    isFallback: boolean
  ): Promise<void> {
    try {
      const outputJson = JSON.stringify(outputData).replace(/'/g, "''");
      const safeTopic = (topicTag || context.weeklyPlan.focusTopic).replace(/'/g, "''");
      await execute(`
        INSERT INTO ai_coach_interactions 
        (learner_id, weekly_plan_id, interaction_type, competency_name, topic_tag, language, ai_output, provider, is_fallback)
        VALUES 
        (${context.weeklyPlan.id ? context.weeklyPlan.id : 1}, 
         ${context.weeklyPlan.id}, 
         '${actionType}', 
         '${safeTopic}', 
         '${safeTopic}', 
         '${context.preferredLanguage}', 
         '${outputJson}', 
         '${provider}', 
         ${isFallback ? 'TRUE' : 'FALSE'})
      `);
    } catch (err) {
      // Non-blocking interaction log
      console.warn('[AICoach] Failed to log interaction in database:', err);
    }
  }

  // =========================================================================
  // Grounded Deterministic Fallback Data Generators
  // =========================================================================

  private static getFallbackExplanation(
    context: AICoachContext,
    topic: string,
    difficulty: AICoachDifficultyLevel
  ): AILearningExplanation {
    return {
      title: `${topic}: Official Procedural Overview`,
      simpleExplanation: `In your role as a ${context.officerRole} within ${context.department}, ${topic} forms the backbone of operational compliance and analytical accuracy. At the ${difficulty} level, standard operating procedures dictate that all primary inputs must be cross-verified against official gazetted guidelines, ensuring systematic auditability and error minimization across official returns.`,
      keyPoints: [
        `Strict adherence to statutory definitions and data validation protocols for ${topic}.`,
        `Mandatory documentation of discrepancies, outlier treatments, and supervisory approvals.`,
        `Periodic reconciliation against centralized databases to prevent systemic misreporting.`,
      ],
      practicalExample: `During quarterly schedule aggregation in ${context.department}, an officer validates field submissions against historical benchmarks. Implementing automated range checks on ${topic} catches anomalies before final compilation.`,
      commonMistakes: [
        `Accepting unverified summary sheets without checking primary microdata schedules.`,
        `Bypassing secondary verification during peak reporting deadlines.`,
      ],
      estimatedMinutes: 5,
      cadreContext: `Essential for ${context.officerRole} cadre baseline competency and promotion assessment benchmarks.`,
    };
  }

  private static getFallbackPractice(
    context: AICoachContext,
    topic: string,
    difficulty: AICoachDifficultyLevel
  ): AIPracticeExercise {
    return {
      title: `Hands-On Cadre Task: ${topic} Execution Drill`,
      instructions: `Review the provided administrative sample. Identify discrepancies, apply official validation rules, and document your resolution in accordance with standard departmental procedures.`,
      scenario: `A district office has submitted monthly schedules for ${context.department}. One series shows an abrupt variance of +38% compared to the historical trend, with missing explanatory remarks in the validation checklist.`,
      task: `1. Reconcile the reported figures against benchmark bounds.\n2. Flag outlier entries and draft a formal clarification query.\n3. Complete the standardized inspection register entry for ${topic}.`,
      expectedOutcome: `Properly isolated anomaly, validated statutory threshold application, and complete audit trail compliant with ${context.field} standards.`,
      estimatedMinutes: context.preferredStudyMinutes || 25,
      difficultyLevel: difficulty,
      competencyInvolved: topic,
    };
  }

  private static getFallbackScenario(
    context: AICoachContext,
    topic: string,
    difficulty: AICoachDifficultyLevel
  ): AIScenario {
    return {
      title: `Administrative Dilemma: Validating Discrepant Submissions in ${topic}`,
      situation: `You are reviewing an urgent report compiled for ministerial review in ${context.department}. A subordinate officer reports that field validation for 15% of the data points could not be completed due to network outages, but proposes using historical imputation without flagging the unverified proportion to meet the deadline.`,
      decisionQuestion: `As a ${context.officerRole}, what is the correct administrative action?`,
      options: [
        `Approve the report as submitted to avoid missing the critical ministerial deadline.`,
        `Reject the entire report and request a 30-day extension from the Ministry.`,
        `Include the available verified data, clearly disclose the 15% provisional status with explanatory caveats, and initiate expedited secondary verification.`,
        `Substitute the missing data with estimations from an unrelated private study.`,
      ],
      correctOption: 2,
      rationale: `According to Indian official statistical and administrative norms, maintaining transparency regarding data reliability and provisional status is paramount. Misrepresenting provisional data as fully validated violates data integrity protocols. Option C balances timely reporting with statutory honesty.`,
      competencyInvolved: topic,
      difficultyLevel: difficulty,
    };
  }

  private static getFallbackMistake(
    context: AICoachContext,
    questionText: string,
    selectedOptionText: string,
    correctOptionText: string,
    topicTag: string,
    existingExplanation?: string
  ): AIMistakeExplanation {
    return {
      whatWentWrong: `Selecting '${selectedOptionText}' overlooks the statutory requirement for explicit validation and documentation standards under ${topicTag}.`,
      whyItMatters: `In ${context.department}, this misconception could lead to premature sign-off on unverified records, introducing audit vulnerabilities or skewed official policy indicators.`,
      correctConcept: `The correct principle is: ${correctOptionText}. ${existingExplanation || 'Official guidelines require rigorous verification prior to publication or filing.'}`,
      example: `When reviewing field inspection returns, an officer must always verify source schedules rather than relying on estimated summaries alone.`,
      retryQuestion: {
        questionText: `Under standard cadre procedures for ${topicTag}, what is the mandatory first step when encountering conflicting source records?`,
        options: [
          `Cross-examine the primary source schedules and consult the official verification manual.`,
          `Average the conflicting numbers and proceed without notes.`,
          `Discard the conflicting observations completely.`,
          `Delegate the decision to an external vendor.`,
        ],
        correctOption: 0,
        explanation: `Cadre standard operating procedures require checking primary source schedules and consulting the verification handbook before any reconciliation or adjustment.`,
      },
    };
  }

  private static getFallbackReflection(context: AICoachContext): AIReflectionSummary {
    const completedCount = context.completedActivities.length;
    const score = context.checkpointPerformance?.scorePercentage;

    return {
      whatYouImproved: [
        `Successfully logged ${completedCount} weekly learning sessions aligned with your cadre milestones.`,
        `Strengthened familiarity with core statutory rules and operational workflows in ${context.weeklyPlan.focusTopic}.`,
      ],
      whatStillNeedsAttention: context.checkpointPerformance?.weakTopics && context.checkpointPerformance.weakTopics.length > 0
        ? context.checkpointPerformance.weakTopics.map((w) => `Reinforce application scenarios in '${w}'.`)
        : [`Consolidate advanced quality assurance drills and speed in scenario analysis.`],
      whatToFocusOnNext: [
        `Apply learned principles directly to upcoming field schedules and departmental returns.`,
        `Complete the upcoming weekly checkpoint to track competency score upgrades.`,
      ],
      coachMessage: `Commendable dedication to your professional development, Officer. Consistent engagement with these micro-learning modules directly elevates your cadre readiness and analytical precision across ${context.department}.`,
      completionScoreRatio: `${completedCount} sessions logged • ${score !== undefined && score !== null ? `${score}% checkpoint score` : 'Checkpoint ready'}`,
    };
  }

  private static getFallbackNextWeek(
    context: AICoachContext,
    adaptiveDirection: AINextWeekRecommendation['adaptiveDirection'],
    difficultyLevel: AICoachDifficultyLevel,
    score: number
  ): AINextWeekRecommendation {
    let priorityArea = '';
    let reason = '';
    const recommendedActivities: string[] = [];

    if (adaptiveDirection === 'Reinforcement') {
      const weak = context.checkpointPerformance?.weakTopics?.[0] || context.priorityGaps[0] || 'Core Verification Standards';
      priorityArea = `Targeted Reinforcement: ${weak}`;
      reason = `Your Week ${context.currentWeek} checkpoint scored ${score}%. Week ${context.currentWeek + 1} allocates focused foundational review on ${weak} to ensure reliable operational accuracy.`;
      recommendedActivities.push(
        `Foundational Review: Statutory Guidelines for ${weak}`,
        `Guided Error Detection Drill`,
        `Step-by-Step Practical Exercise`
      );
    } else if (adaptiveDirection === 'Advanced Acceleration') {
      priorityArea = `Advanced Scenario & Quality Assurance Auditing`;
      reason = `Your Week ${context.currentWeek} checkpoint demonstrated high mastery (${score}%). Introductory review is bypassed to accelerate your administrative decision-making practice.`;
      recommendedActivities.push(
        `Multi-district Data Quality Audit Scenario`,
        `Complex Administrative Exception Handling Drill`,
        `Executive Summary & Briefing Simulation`
      );
    } else {
      priorityArea = `Applied Administrative Workflows & Integration`;
      reason = `Steady progress in Week ${context.currentWeek} (${score}%). Week ${context.currentWeek + 1} balances conceptual consolidation with real-world departmental examples.`;
      recommendedActivities.push(
        `Applied Departmental Workflow Simulation`,
        `Cross-verification of Monthly Returns`,
        `Scenario-based Practice Exercise`
      );
    }

    return {
      priorityArea,
      reason,
      recommendedActivities,
      recommendedMinutes: context.preferredStudyMinutes * 4 || 120,
      difficultyLevel,
      adaptiveDirection,
    };
  }
}
