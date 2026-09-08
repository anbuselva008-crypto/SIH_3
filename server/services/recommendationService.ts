import { query, queryOne, execute } from '../database/db.ts';
import type { 
  Learner, 
  LearningResource, 
  RecommendationItem, 
  RecommendationResponse,
  SkillGapReport,
  SkillGapItem
} from '../database/models.ts';
import { LearnerService } from './learnerService.ts';
import { DomainPackService } from './domainPackService.ts';

interface RawLearningResource {
  id: number;
  title: string;
  source: 'iGOT' | 'NSSTA';
  competency: string;
  secondary_competencies: string;
  target_roles: string;
  relevant_departments: string;
  relevant_assignments: string;
  min_recommended_score: number;
  difficulty_level: 'Beginner' | 'Intermediate' | 'Advanced';
  prerequisites: string;
  estimated_duration: string;
  learning_type: 'Course' | 'Training Programme';
  description: string;
  expected_outcome: string;
  created_at?: string;
}

interface RawRecommendation {
  id: number;
  rec_id?: number;
  learner_id: number;
  learning_resource_id: number;
  recommendation_score: number;
  priority: 'HIGH PRIORITY' | 'RECOMMENDED NEXT' | 'OPTIONAL / FUTURE';
  reason: string;
  created_at?: string;
}

export class RecommendationService {
  /**
   * Parse database JSON strings safely
   */
  private static parseJsonArray(str: string): string[] {
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return str ? str.split(',').map(s => s.trim()) : [];
    }
  }

  /**
   * Format raw resource record into typed model
   */
  private static formatResource(row: RawLearningResource): LearningResource {
    return {
      id: row.id,
      title: row.title,
      source: row.source,
      competency: row.competency,
      secondary_competencies: this.parseJsonArray(row.secondary_competencies),
      target_roles: this.parseJsonArray(row.target_roles),
      relevant_departments: this.parseJsonArray(row.relevant_departments),
      relevant_assignments: this.parseJsonArray(row.relevant_assignments),
      min_recommended_score: Number(row.min_recommended_score) || 0,
      difficulty_level: row.difficulty_level,
      prerequisites: this.parseJsonArray(row.prerequisites),
      estimated_duration: row.estimated_duration,
      learning_type: row.learning_type,
      description: row.description,
      expected_outcome: row.expected_outcome,
      created_at: row.created_at,
    };
  }

  /**
   * Get all available learning resources from catalogue
   */
  public static async getAllLearningResources(): Promise<LearningResource[]> {
    const rows = await query<RawLearningResource>('SELECT * FROM learning_resources ORDER BY id ASC');
    return rows.map(r => this.formatResource(r));
  }

  /**
   * Get specific learning resource by ID
   */
  public static async getLearningResourceById(id: number): Promise<LearningResource | null> {
    const row = await queryOne<RawLearningResource>(`SELECT * FROM learning_resources WHERE id = ${id}`);
    return row ? this.formatResource(row) : null;
  }

  /**
   * Calculate personalized recommendations for a specific learner
   * using deterministic, explainable scoring criteria.
   */
  public static async generateRecommendations(learnerId: number): Promise<RecommendationResponse> {
    const learner = await LearnerService.getLearnerProfile(learnerId);
    if (!learner) {
      throw new Error(`Learner with ID ${learnerId} not found`);
    }

    const gapReport = await LearnerService.getSkillGapAnalysis(learnerId);
    const resources = await this.getAllLearningResources();

    // Map competencies to quick lookups
    const compMap = new Map<string, SkillGapItem>();
    for (const comp of gapReport.all_competencies) {
      compMap.set(comp.name.toLowerCase(), comp);
    }

    const officerRole = (learner.role || '').toLowerCase();
    const officerDept = (learner.department || '').toLowerCase();
    const officerAssignment = (learner.current_assignment || '').toLowerCase();
    const officerEducation = (learner.educational_qualification || '').toLowerCase();
    const officerTraining = (learner.previous_training || '').toLowerCase();

    // Resolve Officer Cadre Role via DomainPackService
    const resolvedRole = DomainPackService.resolveRole(learner.role_id || learner.role, learner.department);
    const roleReqCompetencies = new Map(resolvedRole.required_competencies.map(rc => [(rc.name || (rc as any).competency_name || '').toLowerCase(), rc]));
    const futureSkills = DomainPackService.getFutureSkillsForRole(resolvedRole.id);
    const typicalAssignments = resolvedRole.typical_assignments.map(a => a.toLowerCase());

    const scoredItems: Array<{
      resource: LearningResource;
      score: number;
      priority: 'HIGH PRIORITY' | 'RECOMMENDED NEXT' | 'OPTIONAL / FUTURE';
      reason: string;
      currentScore: number;
      targetScore: number;
    }> = [];

    for (const res of resources) {
      const resCompName = res.competency.toLowerCase();
      const titleLower = res.title.toLowerCase();
      const compItem = compMap.get(resCompName);
      const currentCompScore = compItem ? compItem.score : 50;
      const targetCompScore = compItem ? compItem.benchmark_target : 70;
      const gap = compItem ? compItem.gap : 0;

      let score = 0;
      const reasonParts: string[] = [];

      // A. Skill-Gap & Cadre Competency Match (0 to 45 pts)
      if (compItem) {
        if (compItem.status === 'critical_gap') {
          score += 42;
          reasonParts.push(`Your current ${res.competency} competency (${compItem.score}%) has a critical deficit of ${compItem.gap}% below the role benchmark (${compItem.benchmark_target}%)`);
        } else if (compItem.status === 'moderate_gap') {
          score += 26;
          reasonParts.push(`Your ${res.competency} score (${compItem.score}%) is ${compItem.gap}% below the departmental target`);
        } else {
          score += 5;
        }
      } else {
        // Domain specific topics (e.g. AI, GIS, Cadre topics)
        // Check secondary competencies
        const hasSecondaryGap = res.secondary_competencies.some(sec => {
          const item = compMap.get(sec.toLowerCase());
          return item && item.gap > 0;
        });
        if (hasSecondaryGap) {
          score += 20;
        }
      }

      // Check if competency is a mandatory requirement for this cadre
      if (roleReqCompetencies.has(resCompName) || res.secondary_competencies.some(s => roleReqCompetencies.has(s.toLowerCase()))) {
        score += 12;
        const rc = roleReqCompetencies.get(resCompName);
        const crit = rc?.criticality ? ` (${rc.criticality})` : '';
        reasonParts.push(`Mandatory core competency requirement${crit} for the ${resolvedRole.name} cadre`);
      }

      // B. Current Operational Assignment & Department Match (0 to 25 pts)
      let assignmentMatched = false;
      let domainRelevanceBoost = 0;

      // Check against role's typical operational assignments
      for (const typAssign of typicalAssignments) {
        if (officerAssignment.includes(typAssign) || typAssign.includes(officerAssignment)) {
          if (res.relevant_assignments.some(ra => ra.toLowerCase().includes(typAssign) || typAssign.includes(ra.toLowerCase()))) {
            assignmentMatched = true;
            domainRelevanceBoost = 25;
            reasonParts.push(`Directly targets your core operational duties in "${learner.current_assignment || typAssign}"`);
            break;
          }
        }
      }

      // Check explicit assignment keywords
      if (!assignmentMatched) {
        if (officerAssignment.includes('cpi') || officerAssignment.includes('price')) {
          if (titleLower.includes('cpi') || titleLower.includes('price') || titleLower.includes('inflation')) {
            assignmentMatched = true;
            domainRelevanceBoost = 25;
            reasonParts.push(`Directly targets your core duties in Price Statistics and Consumer Price Index compilation`);
          }
        } else if (officerAssignment.includes('gis') || officerAssignment.includes('spatial') || officerAssignment.includes('mapping')) {
          if (titleLower.includes('gis') || titleLower.includes('spatial') || res.competency.toLowerCase().includes('gis')) {
            assignmentMatched = true;
            domainRelevanceBoost = 25;
            reasonParts.push(`Directly targets your core duties in GIS and spatial sample frame preparation`);
          }
        } else if (officerAssignment.includes('survey') || officerAssignment.includes('plfs') || officerAssignment.includes('microdata') || officerAssignment.includes('sampling')) {
          if (titleLower.includes('survey') || titleLower.includes('sampling') || titleLower.includes('python for data analysis') || titleLower.includes('data management')) {
            assignmentMatched = true;
            domainRelevanceBoost = 25;
            reasonParts.push(`Directly supports your operational assignment in "${learner.current_assignment || 'Survey Data Analysis'}"`);
          }
        } else if (officerAssignment.includes('national accounts') || officerAssignment.includes('gdp') || officerAssignment.includes('gsdp')) {
          if (titleLower.includes('national accounts') || titleLower.includes('gsdp') || titleLower.includes('gva')) {
            assignmentMatched = true;
            domainRelevanceBoost = 25;
            reasonParts.push(`Directly supports your assignment in National Accounts and State Domestic Product estimation`);
          }
        }
      }

      if (!assignmentMatched) {
        for (const relAssign of res.relevant_assignments) {
          const lowerAssign = relAssign.toLowerCase();
          if (officerAssignment.includes(lowerAssign) || lowerAssign.split(' ').some(w => w.length > 3 && officerAssignment.includes(w))) {
            assignmentMatched = true;
            domainRelevanceBoost = 20;
            reasonParts.push(`Directly supports your assignment duties in "${learner.current_assignment || 'current operations'}"`);
            break;
          }
        }
      }

      let deptMatched = false;
      for (const relDept of res.relevant_departments) {
        const lowerDept = relDept.toLowerCase();
        if (officerDept.includes(lowerDept) || lowerDept.split(' ').some(w => w.length > 4 && officerDept.includes(w))) {
          deptMatched = true;
          break;
        }
      }

      if (domainRelevanceBoost > 0) {
        score += domainRelevanceBoost;
      } else if (deptMatched) {
        score += 15;
        reasonParts.push(`Aligned with ${learner.department} mandate`);
      }

      // C. Target Role Match (0 to 15 pts)
      const roleMatched = res.target_roles.some(tr => {
        const trLower = tr.toLowerCase();
        return trLower.includes(resolvedRole.id) ||
               resolvedRole.name.toLowerCase().includes(trLower) ||
               trLower.includes(resolvedRole.name.toLowerCase()) ||
               officerRole.includes(trLower) ||
               trLower.includes(officerRole);
      });
      if (roleMatched) {
        score += 15;
      } else {
        score += 4;
      }

      // D. Future Skills Alignment Boost (0 to 15 pts)
      const matchedFutureSkill = futureSkills.find(fs => {
        const sName = (fs.name || (fs as any).skill_name || '').toLowerCase();
        return Boolean(sName && (titleLower.includes(sName) || resCompName.includes(sName)));
      });
      if (matchedFutureSkill) {
        score += 15;
        const sName = matchedFutureSkill.name || (matchedFutureSkill as any).skill_name;
        reasonParts.push(`Cultivates high-impact Future Skill in "${sName}" for modern governance`);
      }

      // D. Educational Background Relevance (0 to 10 pts)
      if (officerEducation.includes('statistic') || officerEducation.includes('m.sc')) {
        // Officer already has strong theoretical foundation; prioritize technical computing / programming
        if (res.competency.toLowerCase() === 'python' || res.title.toLowerCase().includes('python') || res.title.toLowerCase().includes('computing') || res.title.toLowerCase().includes('r ')) {
          score += 10;
          if (compItem && compItem.gap > 0) {
            reasonParts.push(`Leverages your strong background in ${learner.educational_qualification || 'Statistics'} to accelerate data pipeline automation`);
          }
        }
      } else if (officerEducation.includes('computer') || officerEducation.includes('b.tech') || officerEducation.includes('mca')) {
        // Computer background: prioritize official statistical methodology
        if (res.competency.toLowerCase() === 'statistics' || res.title.toLowerCase().includes('sampling') || res.title.toLowerCase().includes('methodology')) {
          score += 10;
          reasonParts.push(`Strengthens official statistical sampling methodology to complement your technical background`);
        }
      } else if (officerEducation.includes('economic') || officerEducation.includes('econometrics')) {
        if (res.title.toLowerCase().includes('price') || res.title.toLowerCase().includes('cpi') || res.title.toLowerCase().includes('national accounts')) {
          score += 10;
          reasonParts.push(`Directly builds upon your economic qualification in ${learner.educational_qualification || 'Economics'}`);
        }
      }

      // E. Previous Training Deduplication & Progression
      let completedPreviously = false;
      if (officerTraining.length > 0) {
        if (officerTraining.includes('python') && (titleLower.includes('introduction to python') || titleLower.includes('basic python'))) {
          completedPreviously = true;
          score -= 35;
        } else if (officerTraining.includes('python') && titleLower.includes('python for data analysis')) {
          // Acknowledge basic python and recommend next stage
          reasonParts.push(`Builds upon your prior background in "${learner.previous_training}" to advance into official data pipelines`);
        } else if (officerTraining.includes('induction') && titleLower.includes('induction')) {
          completedPreviously = true;
          score -= 30;
        } else if (officerTraining.includes('nssta') && res.source === 'NSSTA' && titleLower.includes('induction')) {
          completedPreviously = true;
          score -= 25;
        }
      }

      // F. Prerequisites & Learning Progression Check
      // If advanced course requires minimum score that officer does not meet
      let prerequisiteBlocked = false;
      let missingPrereqMessage = '';

      // Check if learner is unassessed (all scores 0)
      const isUnassessed = gapReport.all_competencies.every(c => c.score === 0);

      if (res.min_recommended_score > 0) {
        // Advanced courses (min_score >= 50) like AI/ML are blocked if prerequisite foundation not met
        if (res.min_recommended_score >= 50) {
          let foundationScore = currentCompScore;
          if (res.competency.includes('AI') || res.title.includes('AI')) {
            const pyComp = compMap.get('python');
            foundationScore = pyComp ? pyComp.score : currentCompScore;
          }
          if (foundationScore < res.min_recommended_score) {
            prerequisiteBlocked = true;
            missingPrereqMessage = `Requires foundational competency level of ${res.min_recommended_score}% (current: ${foundationScore}%)`;
          }
        } else if (!isUnassessed && currentCompScore < res.min_recommended_score) {
          prerequisiteBlocked = true;
          missingPrereqMessage = `Requires foundational competency level of ${res.min_recommended_score}% (current: ${currentCompScore}%)`;
        }
      }

      // Priority Categorization
      let priority: 'HIGH PRIORITY' | 'RECOMMENDED NEXT' | 'OPTIONAL / FUTURE';

      if (prerequisiteBlocked) {
        priority = 'OPTIONAL / FUTURE';
        score = Math.min(score, 40); // Cap score so it stays in future section
      } else if (completedPreviously) {
        priority = 'OPTIONAL / FUTURE';
      } else if (score >= 68 && (compItem ? compItem.gap > 0 : true)) {
        priority = 'HIGH PRIORITY';
      } else if (score >= 42) {
        priority = 'RECOMMENDED NEXT';
      } else {
        priority = 'OPTIONAL / FUTURE';
      }

      // Construct final human-readable reason
      let finalReason = '';
      if (prerequisiteBlocked) {
        finalReason = `Scheduled for your future learning milestone. ${missingPrereqMessage}.`;
      } else if (reasonParts.length > 0) {
        finalReason = `Recommended because ${reasonParts.join(' and ')}.`;
      } else if (priority === 'HIGH PRIORITY') {
        finalReason = `Recommended as an immediate priority to bridge your primary role competency benchmark.`;
      } else if (priority === 'RECOMMENDED NEXT') {
        finalReason = `Recommended next step to broaden your official statistical analysis toolkit.`;
      } else {
        finalReason = `Elective capability enhancement for career development in official statistics.`;
      }

      scoredItems.push({
        resource: res,
        score: Math.max(5, Math.min(100, score)),
        priority,
        reason: finalReason,
        currentScore: currentCompScore,
        targetScore: targetCompScore,
      });
    }

    // Sort scored items: HIGH PRIORITY first, then by score descending
    const priorityWeight = {
      'HIGH PRIORITY': 3,
      'RECOMMENDED NEXT': 2,
      'OPTIONAL / FUTURE': 1,
    };

    scoredItems.sort((a, b) => {
      const pDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (pDiff !== 0) return pDiff;
      return b.score - a.score;
    });

    // Clean existing recommendations for this learner in database
    await execute(`DELETE FROM recommendations WHERE learner_id = ${learnerId}`);

    // Persist new recommendations into database
    for (const item of scoredItems) {
      await execute(`
        INSERT INTO recommendations 
        (learner_id, learning_resource_id, recommendation_score, priority, reason)
        VALUES 
        (${learnerId}, ${item.resource.id}, ${item.score}, '${item.priority}', '${item.reason.replace(/'/g, "''")}');
      `);
    }

    return this.getRecommendations(learnerId);
  }

  /**
   * Fetch stored recommendations for learner
   */
  public static async getRecommendations(learnerId: number): Promise<RecommendationResponse> {
    const rawRecs = await query<RawRecommendation & {
      title: string;
      source: 'iGOT' | 'NSSTA';
      competency: string;
      secondary_competencies: string;
      target_roles: string;
      relevant_departments: string;
      relevant_assignments: string;
      min_recommended_score: number;
      difficulty_level: 'Beginner' | 'Intermediate' | 'Advanced';
      prerequisites: string;
      estimated_duration: string;
      learning_type: 'Course' | 'Training Programme';
      description: string;
      expected_outcome: string;
    }>(`
      SELECT 
        r.id as rec_id,
        r.learner_id,
        r.learning_resource_id,
        r.recommendation_score,
        r.priority,
        r.reason,
        r.created_at,
        lr.*
      FROM recommendations r
      JOIN learning_resources lr ON r.learning_resource_id = lr.id
      WHERE r.learner_id = ${learnerId}
      ORDER BY 
        CASE 
          WHEN r.priority = 'HIGH PRIORITY' THEN 1
          WHEN r.priority = 'RECOMMENDED NEXT' THEN 2
          ELSE 3
        END,
        r.recommendation_score DESC
    `);

    // If no recommendations exist yet for this learner, generate them on the fly
    if (rawRecs.length === 0) {
      return this.generateRecommendations(learnerId);
    }

    const gapReport = await LearnerService.getSkillGapAnalysis(learnerId);
    const compScoreMap = new Map<string, { score: number; target: number }>();
    for (const c of gapReport.all_competencies) {
      compScoreMap.set(c.name.toLowerCase(), { score: c.score, target: c.benchmark_target });
    }

    const allItems: RecommendationItem[] = rawRecs.map(row => {
      const resource = this.formatResource(row);
      const cMeta = compScoreMap.get(resource.competency.toLowerCase()) || { score: 50, target: 70 };
      return {
        id: row.rec_id || row.id,
        learner_id: row.learner_id,
        learning_resource_id: row.learning_resource_id,
        recommendation_score: row.recommendation_score,
        priority: row.priority as any,
        reason: row.reason,
        resource,
        current_competency_score: cMeta.score,
        target_competency_score: cMeta.target,
        created_at: row.created_at,
      };
    });

    const highPriority = allItems.filter(i => i.priority === 'HIGH PRIORITY');
    const recommendedNext = allItems.filter(i => i.priority === 'RECOMMENDED NEXT');
    const optionalFuture = allItems.filter(i => i.priority === 'OPTIONAL / FUTURE');

    // Identify "YOUR NEXT LEARNING STEP"
    // Top recommendation from High Priority, or first recommendation if none
    const nextStep = highPriority.length > 0 ? highPriority[0] : (recommendedNext[0] || allItems[0] || null);

    return {
      learner_id: learnerId,
      next_step: nextStep,
      high_priority: highPriority,
      recommended_next: recommendedNext,
      optional_future: optionalFuture,
      all_recommendations: allItems,
    };
  }

  /**
   * Get single recommendation detail by recommendation ID
   */
  public static async getRecommendationById(recId: number): Promise<RecommendationItem | null> {
    const row = await queryOne<RawRecommendation & RawLearningResource & { rec_id: number }>(`
      SELECT 
        r.id as rec_id,
        r.learner_id,
        r.learning_resource_id,
        r.recommendation_score,
        r.priority,
        r.reason,
        r.created_at,
        lr.*
      FROM recommendations r
      JOIN learning_resources lr ON r.learning_resource_id = lr.id
      WHERE r.id = ${recId}
    `);

    if (!row) return null;

    const resource = this.formatResource(row);
    const gapReport = await LearnerService.getSkillGapAnalysis(row.learner_id);
    const compItem = gapReport.all_competencies.find(c => c.name.toLowerCase() === resource.competency.toLowerCase());

    return {
      id: row.rec_id,
      learner_id: row.learner_id,
      learning_resource_id: row.learning_resource_id,
      recommendation_score: row.recommendation_score,
      priority: row.priority as any,
      reason: row.reason,
      resource,
      current_competency_score: compItem ? compItem.score : 50,
      target_competency_score: compItem ? compItem.benchmark_target : 70,
      created_at: row.created_at,
    };
  }
}
