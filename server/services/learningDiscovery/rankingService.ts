import type { DiscoveredResource, DiscoveryQuery, RankingScores } from './types.ts';

export interface RankingWeights {
  skillMatch: number;        // 30
  assignmentMatch: number;   // 20
  roleMatch: number;         // 15
  jobFamilyMatch: number;    // 10
  sourceQuality: number;     // 15
  difficultyFit: number;     // 5
  languageFit: number;       // 5
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  skillMatch: 30,
  assignmentMatch: 20,
  roleMatch: 15,
  jobFamilyMatch: 10,
  sourceQuality: 15,
  difficultyFit: 5,
  languageFit: 5,
};

export class RankingService {
  private weights: RankingWeights;

  constructor(weights: Partial<RankingWeights> = {}) {
    this.weights = { ...DEFAULT_RANKING_WEIGHTS, ...weights };
  }

  /**
   * Evaluates relevance and calculates deterministic score for a candidate
   */
  public scoreResource(resource: DiscoveredResource, query: DiscoveryQuery): {
    totalScore: number;
    breakdown: RankingScores;
    isRelevant: boolean;
    reason: string;
  } {
    const textPool = `${resource.title} ${resource.description} ${(resource.secondary_competencies || []).join(' ')}`.toLowerCase();
    const cleanSkill = (query.skillGap || '').toLowerCase();
    const cleanRole = (query.roleName || '').toLowerCase();
    const cleanAssignment = (query.assignment || '').toLowerCase();
    const cleanFamily = (query.jobFamilyName || '').toLowerCase();

    // 1. Skill Match (Max 30 pts)
    let skillScore = 0;
    const skillWords = cleanSkill.split(/\s+/).filter(w => w.length > 2);
    
    if (textPool.includes(cleanSkill)) {
      skillScore = this.weights.skillMatch;
    } else if (skillWords.length > 1 && skillWords.every(w => textPool.includes(w))) {
      skillScore = this.weights.skillMatch * 0.9;
    } else if (skillWords.some(w => textPool.includes(w))) {
      skillScore = this.weights.skillMatch * 0.5;
    }

    // Negative filtering: if the resource does not even mention the skill or any of its words, it is irrelevant!
    if (skillScore === 0) {
      return {
        totalScore: 0,
        breakdown: { skillMatch: 0, assignmentMatch: 0, roleMatch: 0, jobFamilyMatch: 0, sourceQuality: 0, difficultyFit: 0, languageFit: 0, totalScore: 0 },
        isRelevant: false,
        reason: 'Unmatched skill topic',
      };
    }

    // Irrelevant topic penalty:
    // If skill is Contract Management or Civil Engineering, penalize Python / ML unless explicitly requested
    const isTechSkill = cleanSkill.includes('python') || cleanSkill.includes('machine learning') || cleanSkill.includes('data science');
    if (!isTechSkill) {
      if (textPool.includes('learn python') || textPool.includes('deep learning') || textPool.includes('machine learning in python')) {
        skillScore = Math.max(0, skillScore - 15);
      }
    }

    // 2. Assignment Match (Max 20 pts)
    let assignmentScore = 0;
    if (cleanAssignment) {
      const assignWords = cleanAssignment.replace(/[()\/,-]/g, ' ').split(/\s+/).filter(w => w.length > 3);
      if (textPool.includes(cleanAssignment)) {
        assignmentScore = this.weights.assignmentMatch;
      } else if (assignWords.some(w => textPool.includes(w))) {
        assignmentScore = this.weights.assignmentMatch * 0.7;
      } else if (resource.relevant_assignments.some(ra => ra.toLowerCase().includes(cleanAssignment))) {
        assignmentScore = this.weights.assignmentMatch * 0.9;
      }
    }

    // 3. Role Match (Max 15 pts)
    let roleScore = 0;
    if (cleanRole) {
      const roleCore = cleanRole.replace(/Officer|Cadre|Assistant|Junior|Senior/gi, '').trim();
      if (textPool.includes(cleanRole)) {
        roleScore = this.weights.roleMatch;
      } else if (roleCore && textPool.includes(roleCore)) {
        roleScore = this.weights.roleMatch * 0.8;
      } else if (resource.relevant_roles.some(rr => rr.toLowerCase().includes(cleanRole))) {
        roleScore = this.weights.roleMatch * 0.9;
      }
    }

    // 4. Job Family Match (Max 10 pts)
    let jobFamilyScore = 0;
    if (cleanFamily) {
      const famWords = cleanFamily.split(/\s+/).filter(w => w.length > 3);
      if (textPool.includes(cleanFamily) || famWords.some(w => textPool.includes(w))) {
        jobFamilyScore = this.weights.jobFamilyMatch;
      } else if (resource.relevant_job_families.some(rf => rf.toLowerCase().includes(cleanFamily))) {
        jobFamilyScore = this.weights.jobFamilyMatch;
      }
    }

    // 5. Source Quality / Tier Match (Max 15 pts)
    let sourceScore = 0;
    if (resource.source_tier === 1) {
      sourceScore = this.weights.sourceQuality; // 15 pts (Gov / iGOT / SWAYAM / NPTEL)
    } else if (resource.source_tier === 2) {
      sourceScore = this.weights.sourceQuality * 0.8; // 12 pts (Institutes / Universities)
    } else if (resource.source_tier === 3) {
      sourceScore = this.weights.sourceQuality * 0.6; // 9 pts (Coursera / edX / ICE)
    } else {
      sourceScore = this.weights.sourceQuality * 0.3; // 4.5 pts
    }

    // 6. Difficulty Fit (Max 5 pts)
    let difficultyScore = 0;
    if (resource.difficulty) {
      if (query.desiredLevel && resource.difficulty.toLowerCase() === query.desiredLevel.toLowerCase()) {
        difficultyScore = this.weights.difficultyFit;
      } else {
        difficultyScore = this.weights.difficultyFit * 0.6;
      }
    } else {
      difficultyScore = this.weights.difficultyFit * 0.5; // Unknown difficulty
    }

    // 7. Language Fit (Max 5 pts)
    let languageScore = 0;
    const prefLang = query.preferredLanguage || 'en';
    if (prefLang !== 'en') {
      if (resource.language.toLowerCase().includes('hindi') && prefLang === 'hi') {
        languageScore = this.weights.languageFit;
      } else if (resource.language.toLowerCase().includes(prefLang)) {
        languageScore = this.weights.languageFit;
      } else {
        languageScore = this.weights.languageFit * 0.4; // English fallback
      }
    } else {
      languageScore = this.weights.languageFit;
    }

    const totalScore = Math.round(
      skillScore + assignmentScore + roleScore + jobFamilyScore + sourceScore + difficultyScore + languageScore
    );

    // Build concise, deterministic explanation for the learner
    const reasonParts: string[] = [];
    reasonParts.push(`Recommended because ${query.skillGap} is one of your priority competency gaps`);

    if (cleanAssignment && assignmentScore > 0) {
      reasonParts.push(`and your current operational assignment is ${query.assignment}`);
    } else if (cleanRole && roleScore > 0) {
      reasonParts.push(`and aligns with your duties as a ${query.roleName}`);
    }

    if (resource.source_tier === 1) {
      reasonParts.push(`via verified public government infrastructure`);
    } else if (resource.source_tier === 2) {
      reasonParts.push(`offered by an accredited national academic institution`);
    }

    const reason = reasonParts.join(' ') + '.';

    const breakdown: RankingScores = {
      skillMatch: Math.round(skillScore),
      assignmentMatch: Math.round(assignmentScore),
      roleMatch: Math.round(roleScore),
      jobFamilyMatch: Math.round(jobFamilyScore),
      sourceQuality: Math.round(sourceScore),
      difficultyFit: Math.round(difficultyScore),
      languageFit: Math.round(languageScore),
      totalScore,
    };

    // Minimum threshold for relevance
    const isRelevant = totalScore >= 35;

    return {
      totalScore,
      breakdown,
      isRelevant,
      reason,
    };
  }

  /**
   * Ranks an array of resources, assigns match reason, and marks the best match
   */
  public rankResources(resources: DiscoveredResource[], query: DiscoveryQuery): DiscoveredResource[] {
    const scoredList: DiscoveredResource[] = [];

    for (const res of resources) {
      const evaluation = this.scoreResource(res, query);
      if (evaluation.isRelevant) {
        scoredList.push({
          ...res,
          ranking_score: evaluation.totalScore,
          ranking_breakdown: evaluation.breakdown,
          match_reason: evaluation.reason,
        });
      }
    }

    // Sort descending by total ranking score
    scoredList.sort((a, b) => b.ranking_score - a.ranking_score);

    // Mark the #1 best match
    if (scoredList.length > 0) {
      scoredList[0].is_best_match = true;
    }

    return scoredList;
  }
}
