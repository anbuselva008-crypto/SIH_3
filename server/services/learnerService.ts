import { query, queryOne, execute, seedBaselineData } from '../database/db.ts';
import type { 
  Learner, 
  Competency, 
  LearnerResponse, 
  AssessmentQuestion, 
  SkillGapReport, 
  SkillGapItem 
} from '../database/models.ts';
import { DomainPackService } from './domainPackService.ts';

export class LearnerService {
  /**
   * Retrieves the learner profile along with aggregated score metrics and profile completion status.
   */
  static async getLearnerProfile(learnerId: number): Promise<LearnerResponse | null> {
    const learner = await queryOne<Learner>(`
      SELECT id, name, role, department, email, 
             current_assignment, educational_qualification, years_of_experience, 
             previous_training, profile_completed, is_demo, created_at,
             job_family_id, role_id, job_family, language_preference
      FROM learners
      WHERE id = ${learnerId}
    `);

    if (!learner) {
      return null;
    }

    const competencies = await query<Competency>(`
      SELECT id, learner_id, name, score, max_score, category, benchmark_target
      FROM competencies
      WHERE learner_id = ${learnerId}
      ORDER BY id ASC
    `);

    let overallScore = 0;
    let topCompetency = 'Not Assessed';
    let focusCompetency = 'Not Assessed';

    if (competencies.length > 0) {
      const sum = competencies.reduce((acc, c) => acc + c.score, 0);
      overallScore = Math.round(sum / competencies.length);

      const sortedByScore = [...competencies].sort((a, b) => b.score - a.score);
      topCompetency = `${sortedByScore[0].name} (${sortedByScore[0].score}%)`;
      focusCompetency = `${sortedByScore[sortedByScore.length - 1].name} (${sortedByScore[sortedByScore.length - 1].score}%)`;
    }

    return {
      ...learner,
      profile_completed: Boolean(learner.profile_completed),
      is_demo: Boolean(learner.is_demo),
      years_of_experience: Number(learner.years_of_experience || 0),
      overall_score: overallScore,
      competency_count: competencies.length,
      top_competency: topCompetency,
      focus_competency: focusCompetency,
    };
  }

  /**
   * Ensures default official statistical competencies exist for the learner.
   */
  static async ensureDefaultCompetencies(learnerId: number): Promise<void> {
    const existing = await query<Competency>(`
      SELECT id, name FROM competencies WHERE learner_id = ${learnerId}
    `);
    const existingNames = new Set(existing.map((c) => c.name.toLowerCase()));

    const defaults = [
      { name: 'Statistics', category: 'Methodology & Theory', target: 75 },
      { name: 'Python', category: 'Programming & Computing', target: 60 },
      { name: 'Data Analysis', category: 'Applied Analysis', target: 70 },
      { name: 'Data Visualization', category: 'Reporting & Dissemination', target: 75 },
    ];

    for (const def of defaults) {
      if (!existingNames.has(def.name.toLowerCase())) {
        await execute(`
          INSERT INTO competencies (learner_id, name, score, max_score, category, benchmark_target)
          VALUES (${learnerId}, '${def.name}', 0, 100, '${def.category}', ${def.target})
        `);
      }
    }
  }

  /**
   * Ensures competencies appropriate for the officer's specific role exist.
   * If the role has defined required competencies in the Universal Government Framework,
   * seeds those competencies; otherwise falls back gracefully to default competencies.
   */
  static async ensureRoleCompetencies(learnerId: number, roleId?: string): Promise<void> {
    const existing = await query<Competency>(`
      SELECT id, name FROM competencies WHERE learner_id = ${learnerId}
    `);
    const existingNames = new Set(existing.map((c) => c.name.toLowerCase()));

    const role = roleId ? DomainPackService.getRoleById(roleId) : undefined;
    const roleCompetencies = role ? role.required_competencies : [];

    if (roleCompetencies.length > 0) {
      for (const req of roleCompetencies) {
        const compName = req.name || (req as any).competency_name;
        if (compName && !existingNames.has(compName.toLowerCase())) {
          await execute(`
            INSERT INTO competencies (learner_id, name, score, max_score, category, benchmark_target)
            VALUES (${learnerId}, '${compName.replace(/'/g, "''")}', 0, 100, '${req.category.replace(/'/g, "''")}', ${req.benchmark_target})
          `);
        }
      }
    } else {
      await this.ensureDefaultCompetencies(learnerId);
    }
  }

  /**
   * Prototype Authentication: Login or create new officer account.
   */
  static async loginOrRegister(email: string, name?: string): Promise<{ learner: LearnerResponse; isNewUser: boolean }> {
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if user already exists
    const existing = await queryOne<Learner>(`
      SELECT id FROM learners WHERE LOWER(email) = '${cleanEmail.replace(/'/g, "''")}'
    `);

    if (existing) {
      const profile = await this.getLearnerProfile(existing.id);
      if (!profile) throw new Error('Failed to load existing learner profile');
      return { learner: profile, isNewUser: false };
    }

    // Create new learner with profile_completed = FALSE
    const displayName = (name && name.trim()) ? name.trim().replace(/'/g, "''") : 'Official Statistical Officer';
    const nextIdRow = await queryOne<{ next_id: number }>(`
      SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM learners
    `);
    const nextId = nextIdRow?.next_id || 2;

    await execute(`
      INSERT INTO learners 
      (id, name, role, department, email, profile_completed, is_demo, years_of_experience)
      VALUES (${nextId}, '${displayName}', 'Statistical Officer', 'National Statistical Office', '${cleanEmail.replace(/'/g, "''")}', FALSE, FALSE, 0)
    `);

    const created = await queryOne<Learner>(`
      SELECT id FROM learners WHERE id = ${nextId}
    `);

    if (!created) throw new Error('Failed to create new learner');

    // Provision baseline competencies with 0 score (awaiting diagnostic assessment)
    await this.ensureDefaultCompetencies(created.id);

    const profile = await this.getLearnerProfile(created.id);
    if (!profile) throw new Error('Failed to retrieve newly created profile');

    return { learner: profile, isNewUser: true };
  }

  /**
   * Prototype Authentication: Retrieve demo account (Arun Kumar).
   */
  static async getDemoAccount(): Promise<LearnerResponse> {
    const demo = await this.getLearnerProfile(1);
    if (!demo) {
      // Re-seed baseline if missing
      await this.resetBaseline();
      const reloaded = await this.getLearnerProfile(1);
      if (!reloaded) throw new Error('Demo account could not be loaded');
      return reloaded;
    }
    return demo;
  }

  /**
   * Profile Setup: Saves new or updated officer profile and marks profile_completed = true.
   * Resolves Role and Job Family against the Universal Government Framework.
   */
  static async saveProfileSetup(
    learnerId: number,
    data: {
      name: string;
      role: string;
      department: string;
      current_assignment: string;
      educational_qualification: string;
      years_of_experience: number;
      previous_training?: string;
      job_family_id?: string;
      role_id?: string;
      language_preference?: string;
    }
  ): Promise<LearnerResponse> {
    // Validate required fields
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Full Name is required (minimum 2 characters).');
    }
    if (!data.role || data.role.trim().length < 2) {
      throw new Error('Designation / Role is required.');
    }
    if (!data.department || data.department.trim().length < 2) {
      throw new Error('Department is required.');
    }
    if (!data.current_assignment || data.current_assignment.trim().length < 2) {
      throw new Error('Current Assignment is required.');
    }
    if (!data.educational_qualification || data.educational_qualification.trim().length < 2) {
      throw new Error('Educational Qualification is required.');
    }
    const exp = Number(data.years_of_experience);
    if (isNaN(exp) || exp < 0 || exp > 50) {
      throw new Error('Years of Experience must be a valid non-negative number.');
    }

    // Resolve Role and Job Family via DomainPackService
    const resolvedRole = DomainPackService.resolveRole(data.role_id || data.role, data.department);
    const resolvedJobFamily = DomainPackService.getJobFamilyById(data.job_family_id || resolvedRole.job_family_id);

    const jobFamilyId = resolvedJobFamily ? resolvedJobFamily.id : resolvedRole.job_family_id;
    const roleId = resolvedRole.id;
    const jobFamilyName = resolvedJobFamily ? resolvedJobFamily.name : 'Public Service Cadre';
    const lang = (data.language_preference || 'en').trim();

    // Update in database
    await execute(`
      UPDATE learners
      SET name = '${data.name.trim().replace(/'/g, "''")}',
          role = '${data.role.trim().replace(/'/g, "''")}',
          role_id = '${roleId}',
          job_family_id = '${jobFamilyId}',
          job_family = '${jobFamilyName.replace(/'/g, "''")}',
          language_preference = '${lang.replace(/'/g, "''")}',
          department = '${data.department.trim().replace(/'/g, "''")}',
          current_assignment = '${data.current_assignment.trim().replace(/'/g, "''")}',
          educational_qualification = '${data.educational_qualification.trim().replace(/'/g, "''")}',
          years_of_experience = ${exp},
          previous_training = '${(data.previous_training || '').trim().replace(/'/g, "''")}',
          profile_completed = TRUE
      WHERE id = ${learnerId}
    `);

    // Ensure role-specific competencies exist
    await this.ensureRoleCompetencies(learnerId, roleId);

    const updated = await this.getLearnerProfile(learnerId);
    if (!updated) {
      throw new Error('Could not retrieve updated profile.');
    }
    return updated;
  }

  /**
   * Retrieves all individual competencies for a learner.
   */
  static async getCompetencies(learnerId: number = 1): Promise<Competency[]> {
    return await query<Competency>(`
      SELECT id, learner_id, name, score, max_score, category, benchmark_target, created_at
      FROM competencies
      WHERE learner_id = ${learnerId}
      ORDER BY id ASC
    `);
  }

  /**
   * Retrieves assessment questions for a diagnostic evaluation,
   * optionally filtered by competency or cadre role.
   */
  static async getAssessmentQuestions(competency?: string, roleId?: string): Promise<AssessmentQuestion[]> {
    let sql = `
      SELECT id, job_family_id, role_id, competency_name, category, difficulty, question_text, 
             option_a, option_b, option_c, option_d, correct_option, explanation, concept_tag, weight
      FROM assessment_questions
    `;
    const conditions: string[] = [];
    if (competency) {
      conditions.push(`competency_name = '${competency.replace(/'/g, "''")}'`);
    }
    if (roleId) {
      conditions.push(`role_id = '${roleId.replace(/'/g, "''")}'`);
    }
    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }
    sql += ` ORDER BY id ASC`;

    let rows = await query<any>(sql);
    // If no questions found with specific roleId, fall back to all questions or statistical
    if (rows.length === 0 && roleId) {
      rows = await query<any>(`
        SELECT id, job_family_id, role_id, competency_name, category, difficulty, question_text, 
               option_a, option_b, option_c, option_d, correct_option, explanation, concept_tag, weight
        FROM assessment_questions
        ORDER BY id ASC
      `);
    }

    return rows.map((r) => ({
      id: r.id,
      competency_name: r.competency_name,
      category: r.category,
      difficulty: r.difficulty,
      question_text: r.question_text,
      options: [r.option_a, r.option_b, r.option_c, r.option_d],
      correct_option: r.correct_option,
      explanation: r.explanation,
      concept_tag: r.concept_tag,
      weight: r.weight || 1,
    }));
  }

  /**
   * Evaluates user assessment submissions, dynamically updates competency scores in PostgreSQL,
   * logs the attempt, and returns real-time feedback and revised skill gaps.
   */
  static async submitAssessment(
    learnerId: number = 1,
    answers: Record<number, number>
  ): Promise<{
    learner_id: number;
    total_questions: number;
    correct_count: number;
    overall_assessment_percentage: number;
    competency_results: Record<string, { total: number; correct: number; score: number }>;
    question_breakdown: Array<{
      question_id: number;
      competency: string;
      question_text: string;
      selected_option: number;
      correct_option: number;
      is_correct: boolean;
      explanation: string;
      concept_tag: string;
    }>;
    updated_gap_report: SkillGapReport;
  }> {
    await this.ensureDefaultCompetencies(learnerId);
    const questions = await this.getAssessmentQuestions();

    const competencyMap: Record<string, { total: number; correct: number }> = {};
    const questionBreakdown: Array<{
      question_id: number;
      competency: string;
      question_text: string;
      selected_option: number;
      correct_option: number;
      is_correct: boolean;
      explanation: string;
      concept_tag: string;
    }> = [];

    let totalCorrect = 0;

    for (const q of questions) {
      if (!competencyMap[q.competency_name]) {
        competencyMap[q.competency_name] = { total: 0, correct: 0 };
      }
      competencyMap[q.competency_name].total += 1;

      const selectedOption = answers[q.id];
      const isCorrect = selectedOption !== undefined && Number(selectedOption) === q.correct_option;

      if (isCorrect) {
        competencyMap[q.competency_name].correct += 1;
        totalCorrect += 1;
      }

      questionBreakdown.push({
        question_id: q.id,
        competency: q.competency_name,
        question_text: q.question_text,
        selected_option: selectedOption !== undefined ? Number(selectedOption) : -1,
        correct_option: q.correct_option,
        is_correct: isCorrect,
        explanation: q.explanation,
        concept_tag: q.concept_tag,
      });
    }

    const competencyResults: Record<string, { total: number; correct: number; score: number }> = {};

    // Dynamic Scoring: update the PostgreSQL competencies table
    for (const [compName, stats] of Object.entries(competencyMap)) {
      const dynamicScore = Math.round((stats.correct / stats.total) * 100);
      competencyResults[compName] = {
        total: stats.total,
        correct: stats.correct,
        score: dynamicScore,
      };

      // Update in database for this learner
      await execute(`
        UPDATE competencies
        SET score = ${dynamicScore}
        WHERE learner_id = ${learnerId} AND name = '${compName.replace(/'/g, "''")}'
      `);
    }

    const totalQuestions = questions.length;
    const overallPercentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    // Record assessment attempt in PostgreSQL
    const breakdownJson = JSON.stringify(competencyResults).replace(/'/g, "''");
    await execute(`
      INSERT INTO assessment_attempts 
      (learner_id, total_questions, correct_count, overall_score, scores_breakdown)
      VALUES (${learnerId}, ${totalQuestions}, ${totalCorrect}, ${overallPercentage}, '${breakdownJson}')
    `);

    // Fetch updated skill gap analysis after score update
    const updatedGapReport = await this.getSkillGapAnalysis(learnerId);

    return {
      learner_id: learnerId,
      total_questions: totalQuestions,
      correct_count: totalCorrect,
      overall_assessment_percentage: overallPercentage,
      competency_results: competencyResults,
      question_breakdown: questionBreakdown,
      updated_gap_report: updatedGapReport,
    };
  }

  /**
   * Generates a rigorous Skill Gap Analysis and prioritized focus areas
   * for the officer's specific cadre role and competencies.
   */
  static async getSkillGapAnalysis(learnerId: number = 1): Promise<SkillGapReport> {
    const competencies = await this.getCompetencies(learnerId);
    const learner = await queryOne<Learner>(`SELECT role, role_id, department FROM learners WHERE id = ${learnerId}`);

    // Resolve role definition for dynamic criticality metadata
    const resolvedRole = learner 
      ? DomainPackService.resolveRole(learner.role_id || learner.role, learner.department)
      : undefined;

    const roleReqMap = new Map<string, any>();
    if (resolvedRole?.required_competencies) {
      for (const rc of resolvedRole.required_competencies) {
        const cName = rc.name || (rc as any).competency_name;
        if (cName) {
          roleReqMap.set(cName.toLowerCase(), rc);
        }
      }
    }

    const criticalityMeta: Record<string, { roleCriticality: string; defaultAction: string }> = {
      'Python': {
        roleCriticality: 'High Criticality — Required for automated survey data pipeline, large-scale NSSO microdata cleansing, and reproducible official statistics.',
        defaultAction: 'Master Pandas vectorization, group transformations, and automated survey data validation routines.',
      },
      'Data Analysis': {
        roleCriticality: 'High Criticality — Core duty for sample estimation, Tukey outlier screening, and consumer price index computation.',
        defaultAction: 'Focus on price index construction formulas and robust non-parametric variance analysis.',
      },
      'Statistics': {
        roleCriticality: 'Foundational Criticality — Baseline standard for multi-stage stratified sampling and survey variance estimation.',
        defaultAction: 'Reinforce sampling frame error controls and design-based variance reduction.',
      },
      'Data Visualization': {
        roleCriticality: 'Dissemination Criticality — Required for MoSPI publication standards and non-misleading visual reporting.',
        defaultAction: 'Maintain ethical data visualization practices, boxplot quartile displays, and zero-baseline charts.',
      },
    };

    const evaluatedItems: SkillGapItem[] = competencies.map((c) => {
      const gap = Math.max(0, c.benchmark_target - c.score);
      const gapPercentage = c.benchmark_target > 0 ? Math.round((gap / c.benchmark_target) * 100) : 0;

      let status: 'benchmark_met' | 'moderate_gap' | 'critical_gap' = 'benchmark_met';
      let priorityLevel: 'High' | 'Medium' | 'Low' = 'Low';

      if (gap > 15) {
        status = 'critical_gap';
        priorityLevel = 'High';
      } else if (gap > 0) {
        status = 'moderate_gap';
        priorityLevel = 'Medium';
      } else {
        status = 'benchmark_met';
        priorityLevel = 'Low';
      }

      let roleCrit = 'Operational Competency for ' + (resolvedRole?.name || 'Government Officer') + '.';
      let defAction = 'Follow recommended government training curricula.';

      if (criticalityMeta[c.name]) {
        roleCrit = criticalityMeta[c.name].roleCriticality;
        defAction = criticalityMeta[c.name].defaultAction;
      } else {
        const rc = roleReqMap.get(c.name.toLowerCase());
        if (rc) {
          roleCrit = `${rc.criticality} — Essential competency for ${resolvedRole?.name || 'cadre'} duties in ${c.category}.`;
          defAction = `Complete targeted curricula in ${c.name} to meet target level (${rc.target_level}).`;
        }
      }

      return {
        competency_id: c.id,
        name: c.name,
        category: c.category,
        score: c.score,
        benchmark_target: c.benchmark_target,
        gap,
        gap_percentage: gapPercentage,
        status,
        priority_level: priorityLevel,
        priority_rank: 0, // to be ranked
        role_criticality: roleCrit,
        action_directive:
          status === 'critical_gap'
            ? `Critical Priority: Deficit of ${gap}% below benchmark. ${defAction}`
            : status === 'moderate_gap'
            ? `Moderate Priority: Deficit of ${gap}%. Bridge remaining delta through focused module review.`
            : `Benchmark Achieved: Met/exceeded standard (+${c.score - c.benchmark_target}%). Recommended for advanced elective mentoring.`,
      };
    });

    // Rank priority areas: higher gap first, then by domain importance
    const sortedForRanking = [...evaluatedItems].sort((a, b) => {
      if (b.gap !== a.gap) {
        return b.gap - a.gap;
      }
      return a.name.localeCompare(b.name);
    });

    sortedForRanking.forEach((item, index) => {
      item.priority_rank = index + 1;
    });

    const totalSum = competencies.reduce((acc, c) => acc + c.score, 0);
    const targetSum = competencies.reduce((acc, c) => acc + c.benchmark_target, 0);
    const overallScore = competencies.length > 0 ? Math.round(totalSum / competencies.length) : 0;
    const targetAverage = competencies.length > 0 ? Math.round(targetSum / competencies.length) : 75;
    const overallGap = Math.max(0, targetAverage - overallScore);

    const criticalGapsCount = evaluatedItems.filter((i) => i.status === 'critical_gap').length;
    const moderateGapsCount = evaluatedItems.filter((i) => i.status === 'moderate_gap').length;
    const metCount = evaluatedItems.filter((i) => i.status === 'benchmark_met').length;

    // Filter priority areas (items needing focus)
    const priorityAreas = sortedForRanking.filter((i) => i.gap > 0);

    return {
      learner_id: learnerId,
      overall_score: overallScore,
      target_average: targetAverage,
      overall_gap: overallGap,
      critical_gaps_count: criticalGapsCount,
      moderate_gaps_count: moderateGapsCount,
      met_count: metCount,
      priority_areas: priorityAreas,
      all_competencies: sortedForRanking,
    };
  }

  /**
   * Resets Arun Kumar back to the initial baseline for demo purposes.
   */
  static async resetBaseline(): Promise<void> {
    seedBaselineData();
  }
}

