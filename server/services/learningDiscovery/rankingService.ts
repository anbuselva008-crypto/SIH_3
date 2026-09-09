import type { 
  DiscoveredResource, 
  DiscoveryQuery, 
  RankingScores, 
  Stage5BQualityBreakdown,
  SelectionStatus,
  CompetencyMatchQuality,
  SourceTier
} from './types.ts';
import { VerificationService } from './verificationService.ts';

export class RankingService {
  /**
   * Evaluates relevance and calculates deterministic Stage 5B score for a candidate
   */
  public scoreResource(resource: DiscoveredResource, query: DiscoveryQuery): {
    totalScore: number;
    stage5bBreakdown: Stage5BQualityBreakdown;
    legacyBreakdown: RankingScores;
    competencyMatchQuality: CompetencyMatchQuality;
    selectionStatus: SelectionStatus;
    selectionReason: string;
    structuredReasons: string[];
    whyNotRecommended?: string;
    prerequisiteWarning?: string;
    isDuplicateTraining?: boolean;
    isRelevant: boolean;
  } {
    const textPool = [
      resource.title,
      resource.description,
      resource.primary_competency,
      ...(resource.secondary_competencies || []),
      ...(resource.relevant_assignments || []),
      ...(resource.relevant_roles || []),
      ...(resource.relevant_job_families || []),
      resource.url || ''
    ].filter(Boolean).join(' ').toLowerCase();

    const cleanSkill = (query.skillGap || '').toLowerCase();
    const cleanRole = (query.roleName || '').toLowerCase();
    const cleanAssignment = (query.assignment || '').toLowerCase();
    const cleanFamily = (query.jobFamilyName || '').toLowerCase();
    const cleanDept = (query.department || '').toLowerCase();

    const structuredReasons: string[] = [];
    let whyNotRecommended: string | undefined = undefined;
    let prerequisiteWarning: string | undefined = undefined;
    let isDuplicateTraining = false;
    let penalties = 0;

    // -------------------------------------------------------------
    // 1. Competency Match Quality (Max 25 pts)
    // -------------------------------------------------------------
    let competencyScore = 0;
    let matchQuality: CompetencyMatchQuality = 'NO_MATCH';
    const skillWords = cleanSkill.split(/[\s,/-]+/).filter(w => w.length > 2);

    if (
      textPool.includes(cleanSkill) || 
      (resource.primary_competency && resource.primary_competency.toLowerCase() === cleanSkill)
    ) {
      competencyScore = 25;
      matchQuality = 'DIRECT_MATCH';
      structuredReasons.push(`Directly targets priority competency: ${query.skillGap}`);
    } else if (skillWords.length > 1 && skillWords.every(w => textPool.includes(w))) {
      competencyScore = 22;
      matchQuality = 'STRONG_MATCH';
      structuredReasons.push(`Comprehensive coverage of ${query.skillGap} core requirements`);
    } else if (skillWords.some(w => textPool.includes(w))) {
      competencyScore = 14;
      matchQuality = 'PARTIAL_MATCH';
      structuredReasons.push(`Partial modular alignment with ${query.skillGap}`);
    } else if ((resource.secondary_competencies || []).some(sc => sc.toLowerCase().includes(cleanSkill))) {
      competencyScore = 15;
      matchQuality = 'PARTIAL_MATCH';
      structuredReasons.push(`Secondary competency match for ${query.skillGap}`);
    } else {
      competencyScore = 0;
      matchQuality = 'NO_MATCH';
    }

    // Negative filter: if completely unrelated to the skill, filter out immediately
    if (competencyScore === 0) {
      return {
        totalScore: 0,
        stage5bBreakdown: {
          competencyMatch: 0, assignmentMatch: 0, roleMatch: 0, jobFamilyMatch: 0,
          sourceAuthority: 0, levelFit: 0, languageFit: 0, trainingContext: 0,
          penalties: -100, totalScore: 0
        },
        legacyBreakdown: { skillMatch: 0, assignmentMatch: 0, roleMatch: 0, jobFamilyMatch: 0, sourceQuality: 0, difficultyFit: 0, languageFit: 0, totalScore: 0 },
        competencyMatchQuality: 'NO_MATCH',
        selectionStatus: 'NOT_RECOMMENDED',
        selectionReason: 'Content does not align with the requested competency.',
        structuredReasons: [],
        whyNotRecommended: 'Resource does not mention or cover the required skill gap.',
        isRelevant: false,
      };
    }

    // Domain cross-contamination check:
    // If learner wants Civil/Infra/Contract Management, penalize unrelated IT software coding
    const isTechSkill = cleanSkill.includes('python') || cleanSkill.includes('machine learning') || cleanSkill.includes('software') || cleanSkill.includes('cyber');
    if (!isTechSkill && (textPool.includes('saas enterprise') || textPool.includes('software licensing') || textPool.includes('python coding') || textPool.includes('deep learning'))) {
      penalties -= 15;
      whyNotRecommended = 'Focuses on IT and software licensing rather than public works infrastructure engineering.';
    }

    // -------------------------------------------------------------
    // 2. Assignment Match (Max 20 pts)
    // -------------------------------------------------------------
    let assignmentScore = 4; // baseline neutral
    if (cleanAssignment) {
      const assignWords = cleanAssignment.replace(/[()\/,-]/g, ' ').split(/\s+/).filter(w => w.length > 3);
      if (
        (resource.relevant_assignments || []).some(ra => ra.toLowerCase() === cleanAssignment) ||
        (resource.relevant_assignments || []).some(ra => ra.toLowerCase().includes(cleanAssignment)) ||
        textPool.includes(cleanAssignment)
      ) {
        assignmentScore = 20;
        structuredReasons.push(`Highly aligned with current assignment: ${query.assignment}`);
      } else if (assignWords.length > 0 && assignWords.some(w => textPool.includes(w))) {
        assignmentScore = 15;
        structuredReasons.push(`Direct application to ${query.assignment} project scope`);
      } else {
        // Check if conflicting assignment
        if (cleanAssignment.includes('urban') || cleanAssignment.includes('infrastructure') || cleanAssignment.includes('works')) {
          if (textPool.includes('software vendor') || textPool.includes('it department')) {
            assignmentScore = 0;
            penalties -= 15;
            whyNotRecommended = 'Tailored for IT departmental administration, not civil urban infrastructure works.';
          }
        }
      }
    }

    // -------------------------------------------------------------
    // 3. Role Match (Max 15 pts)
    // -------------------------------------------------------------
    let roleScore = 3; // baseline neutral
    if (cleanRole) {
      const roleCore = cleanRole.replace(/Officer|Cadre|Assistant|Junior|Senior|Executive/gi, '').trim();
      if (
        (resource.relevant_roles || []).some(rr => rr.toLowerCase() === cleanRole) ||
        (resource.relevant_roles || []).some(rr => rr.toLowerCase().includes(cleanRole)) ||
        textPool.includes(cleanRole)
      ) {
        roleScore = 15;
        structuredReasons.push(`Tailored for ${query.roleName} cadre responsibilities`);
      } else if (roleCore && textPool.includes(roleCore)) {
        roleScore = 12;
        structuredReasons.push(`Relevant to core ${roleCore} function`);
      } else {
        // Cross-role conflict
        if (cleanRole.includes('civil engineer') && (textPool.includes('software developer') || textPool.includes('data scientist'))) {
          roleScore = 0;
          penalties -= 10;
        }
      }
    }

    // -------------------------------------------------------------
    // 4. Job Family Alignment (Max 10 pts)
    // -------------------------------------------------------------
    let jobFamilyScore = 2; // baseline
    if (cleanFamily) {
      const famWords = cleanFamily.split(/\s+/).filter(w => w.length > 3);
      if (textPool.includes(cleanFamily) || famWords.some(w => textPool.includes(w))) {
        jobFamilyScore = 10;
      } else if ((resource.relevant_job_families || []).some(rf => rf.toLowerCase().includes(cleanFamily))) {
        jobFamilyScore = 10;
      }
    }

    // -------------------------------------------------------------
    // 5. Source Authority Tier (Max 15 pts)
    // -------------------------------------------------------------
    let sourceScore = 4;
    const tier = resource.quality_tier || resource.source_tier || 4;
    if (tier === 1) {
      sourceScore = 15;
      structuredReasons.push(`Verified official national repository (${resource.provider_name})`);
    } else if (tier === 2) {
      sourceScore = 12;
      structuredReasons.push(`Accredited premier academic institute (${resource.provider_name})`);
    } else if (tier === 3) {
      sourceScore = 8;
      structuredReasons.push(`Recognized professional educational body (${resource.provider_name})`);
    } else {
      sourceScore = 4;
    }

    // Penalties for broken or unverified status
    if (resource.verification_status === 'BROKEN') {
      penalties -= 50;
      whyNotRecommended = 'Resource URL is inaccessible or invalid protocol.';
    } else if (resource.verification_status === 'REJECTED') {
      penalties -= 50;
      whyNotRecommended = 'Unaccredited forum or personal blog; disqualified as institutional learning resource.';
    }

    // -------------------------------------------------------------
    // 6. Level & Prerequisite Fit (Max 5 pts)
    // -------------------------------------------------------------
    let levelScore = 3;
    const resLevel = (resource.difficulty || '').toLowerCase();
    const queryLevel = (query.desiredLevel || '').toLowerCase();
    const currentScore = query.currentCompetencyScore ?? 45; // default moderate gap

    // Case: Learner is beginner (score < 40 or desiredLevel = beginner)
    const isLearnerBeginner = currentScore < 40 || queryLevel === 'beginner';

    if (textPool.includes('post-graduate') || textPool.includes('advanced continuum') || resLevel === 'advanced') {
      if (isLearnerBeginner) {
        levelScore = 0;
        penalties -= 10;
        prerequisiteWarning = 'Prerequisite foundations recommended before taking advanced post-graduate coursework.';
        if (!whyNotRecommended) {
          whyNotRecommended = 'Advanced curriculum with unfulfilled prerequisites for current learner proficiency level.';
        }
      } else {
        levelScore = 5;
        structuredReasons.push('Calibrated for advanced practitioners');
      }
    } else if (resLevel === 'beginner' || textPool.includes('fundamental') || textPool.includes('foundations')) {
      if (isLearnerBeginner) {
        levelScore = 5;
        structuredReasons.push('Calibrated for current proficiency baseline with foundational coverage');
      } else {
        levelScore = 3;
      }
    } else {
      // Intermediate / All levels
      levelScore = 5;
    }

    // -------------------------------------------------------------
    // 7. Language Fit (Max 5 pts)
    // -------------------------------------------------------------
    let languageScore = 3;
    const prefLang = (query.preferredLanguage || 'en').toLowerCase();
    const resLang = (resource.language || 'English').toLowerCase();

    const langCodeToName: Record<string, string> = {
      en: 'english',
      hi: 'hindi',
      ta: 'tamil',
      te: 'telugu',
      kn: 'kannada',
      bn: 'bengali',
      mr: 'marathi',
      gu: 'gujarati',
    };
    const targetLangName = langCodeToName[prefLang] || prefLang;

    if (prefLang === 'en') {
      languageScore = resLang.includes('english') ? 5 : 3;
    } else {
      if (resLang.includes(targetLangName) || textPool.includes(targetLangName)) {
        languageScore = 5;
        structuredReasons.push(`Available in your preferred language (${targetLangName.charAt(0).toUpperCase() + targetLangName.slice(1)})`);
      } else if (resLang.includes('english')) {
        languageScore = 3; // English fallback
      } else {
        languageScore = 1;
      }
    }

    // -------------------------------------------------------------
    // 8. Training Context & Non-duplication (Max 5 pts)
    // -------------------------------------------------------------
    let trainingScore = 5;
    const prevTraining = query.previousTraining || [];

    if (prevTraining.length > 0) {
      const isDuplicate = prevTraining.some(pt => {
        const cleanPt = pt.toLowerCase().trim();
        return (
          resource.title.toLowerCase().includes(cleanPt) ||
          cleanPt.includes(resource.title.toLowerCase()) ||
          (cleanPt.includes('python') && textPool.includes('intro-python-basics')) ||
          (cleanPt.includes('basic') && textPool.includes('introductory level basic'))
        );
      });

      if (isDuplicate) {
        isDuplicateTraining = true;
        trainingScore = 0;
        penalties -= 15;
        if (!whyNotRecommended) {
          whyNotRecommended = 'Learner profile records prior completion of basic introductory training. More applied or advanced training prioritized.';
        }
      } else {
        trainingScore = 5;
      }
    }

    // Calculate Final 100-pt Score
    const rawTotal = 
      competencyScore + 
      assignmentScore + 
      roleScore + 
      jobFamilyScore + 
      sourceScore + 
      levelScore + 
      languageScore + 
      trainingScore + 
      penalties;

    const totalScore = Math.max(0, Math.min(100, Math.round(rawTotal)));

    // Determine Selection Status
    let selectionStatus: SelectionStatus = 'ALTERNATIVE';
    if (totalScore >= 80 && !whyNotRecommended) {
      selectionStatus = 'BEST_MATCH';
    } else if (totalScore >= 60 && !whyNotRecommended) {
      selectionStatus = 'STRONG_ALTERNATIVE';
    } else if (totalScore >= 40) {
      selectionStatus = 'ALTERNATIVE';
    } else if (totalScore >= 20) {
      selectionStatus = 'LOW_PRIORITY';
    } else {
      selectionStatus = 'NOT_RECOMMENDED';
    }

    // Executive Selection Reason
    let selectionReason = '';
    if (selectionStatus === 'BEST_MATCH') {
      selectionReason = `Selected as Best Match because it provides direct verified alignment with ${query.skillGap} for a ${query.roleName || 'government officer'} in ${query.assignment || 'active duty'}, backed by ${resource.provider_name}.`;
    } else if (selectionStatus === 'STRONG_ALTERNATIVE') {
      selectionReason = `Strong secondary option with high institutional authority and solid coverage of ${query.skillGap}.`;
    } else {
      selectionReason = `Alternative reference covering aspects of ${query.skillGap}.`;
    }

    const stage5bBreakdown: Stage5BQualityBreakdown = {
      competencyMatch: Math.round(competencyScore),
      assignmentMatch: Math.round(assignmentScore),
      roleMatch: Math.round(roleScore),
      jobFamilyMatch: Math.round(jobFamilyScore),
      sourceAuthority: Math.round(sourceScore),
      levelFit: Math.round(levelScore),
      languageFit: Math.round(languageScore),
      trainingContext: Math.round(trainingScore),
      penalties: Math.round(penalties),
      totalScore,
    };

    const legacyBreakdown: RankingScores = {
      skillMatch: Math.round(competencyScore * 1.2),
      assignmentMatch: Math.round(assignmentScore),
      roleMatch: Math.round(roleScore),
      jobFamilyMatch: Math.round(jobFamilyScore),
      sourceQuality: Math.round(sourceScore),
      difficultyFit: Math.round(levelScore),
      languageFit: Math.round(languageScore),
      totalScore,
    };

    const isRelevant = totalScore >= 25 && resource.verification_status !== 'BROKEN' && resource.verification_status !== 'REJECTED';

    return {
      totalScore,
      stage5bBreakdown,
      legacyBreakdown,
      competencyMatchQuality: matchQuality,
      selectionStatus,
      selectionReason,
      structuredReasons,
      whyNotRecommended,
      prerequisiteWarning,
      isDuplicateTraining,
      isRelevant,
    };
  }

  /**
   * Ranks an array of resources, assigns Stage 5B metadata, and isolates Best Match & Strong Alternatives
   */
  public rankResources(resources: DiscoveredResource[], query: DiscoveryQuery): DiscoveredResource[] {
    const scoredList: DiscoveredResource[] = [];

    for (const res of resources) {
      const evaluation = this.scoreResource(res, query);
      if (evaluation.isRelevant) {
        scoredList.push({
          ...res,
          ranking_score: evaluation.totalScore,
          ranking_breakdown: evaluation.legacyBreakdown,
          stage5b_breakdown: evaluation.stage5bBreakdown,
          competency_match_quality: evaluation.competencyMatchQuality,
          selection_status: evaluation.selectionStatus,
          selection_reason: evaluation.selectionReason,
          structured_reasons: evaluation.structuredReasons,
          why_not_recommended: evaluation.whyNotRecommended,
          prerequisite_warning: evaluation.prerequisiteWarning,
          is_duplicate_training: evaluation.isDuplicateTraining,
          match_reason: evaluation.selectionReason,
        });
      }
    }

    // Sort strictly descending by total ranking score
    scoredList.sort((a, b) => b.ranking_score - a.ranking_score);

    // Re-calibrate selection statuses among ranked items
    if (scoredList.length > 0) {
      scoredList[0].is_best_match = true;
      scoredList[0].selection_status = 'BEST_MATCH';

      for (let i = 1; i < scoredList.length; i++) {
        scoredList[i].is_best_match = false;
        if (scoredList[i].ranking_score >= 60 && !scoredList[i].why_not_recommended) {
          scoredList[i].selection_status = 'STRONG_ALTERNATIVE';
        } else if (scoredList[i].ranking_score >= 35) {
          scoredList[i].selection_status = 'ALTERNATIVE';
        } else {
          scoredList[i].selection_status = 'LOW_PRIORITY';
        }
      }
    }

    return scoredList;
  }
}
