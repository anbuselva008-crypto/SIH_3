import { LearnerService } from '../learnerService.ts';
import { RecommendationService } from '../recommendationService.ts';
import { DomainPackService } from '../domainPackService.ts';
import type { 
  DiscoveryQuery, 
  DiscoveryResponse, 
  DiscoveredResource,
  ComparisonTableRow,
  SourceTier
} from './types.ts';
import { QueryBuilder } from './queryBuilder.ts';
import { CompositeSearchProvider, type ISearchProvider } from './searchProvider.ts';
import { ResourceNormalizer } from './resourceNormalizer.ts';
import { VerificationService } from './verificationService.ts';
import { RankingService } from './rankingService.ts';

interface CacheItem {
  timestamp: number;
  response: DiscoveryResponse;
}

export class LearningDiscoveryService {
  private static searchProvider: ISearchProvider = new CompositeSearchProvider();
  private static rankingService = new RankingService();
  private static responseCache: Map<string, CacheItem> = new Map();
  private static CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

  /**
   * Discovers and ranks relevant learning resources for an officer's skill gap.
   * Merges live web discovery with the prototype catalogue fallback.
   */
  public static async discoverForLearner(
    learnerId: number,
    skillGapName?: string,
    forceRefresh: boolean = false
  ): Promise<DiscoveryResponse> {
    // 1. Fetch learner profile
    const learner = await LearnerService.getLearnerProfile(learnerId);
    if (!learner) {
      throw new Error(`Learner with ID ${learnerId} not found`);
    }

    // Resolve Cadre Role
    const resolvedRole = DomainPackService.resolveRole(learner.role_id || learner.role, learner.department);
    const resolvedFamily = DomainPackService.getJobFamilyById(learner.job_family_id || 'stat_cadre') || 
                           DomainPackService.getJobFamilyById('statistics');

    // If no specific skill gap provided, pick the learner's #1 critical gap
    let targetSkill = (skillGapName || '').trim();
    let currentScore = 45;
    const gapReport = await LearnerService.getSkillGapAnalysis(learnerId);

    if (!targetSkill) {
      if (gapReport.priority_areas && gapReport.priority_areas.length > 0) {
        targetSkill = gapReport.priority_areas[0].name;
        currentScore = gapReport.priority_areas[0].score;
      } else if (gapReport.all_competencies && gapReport.all_competencies.length > 0) {
        targetSkill = gapReport.all_competencies[0].name;
        currentScore = gapReport.all_competencies[0].score;
      } else {
        targetSkill = 'Survey Methodology';
      }
    } else {
      const match = (gapReport.all_competencies || []).find(c => c.name.toLowerCase() === targetSkill.toLowerCase());
      if (match) {
        currentScore = match.score;
      }
    }

    // Parse previous training if stored
    let previousTraining: string[] = [];
    if (learner.previous_training) {
      if (Array.isArray(learner.previous_training)) {
        previousTraining = learner.previous_training;
      } else if (typeof learner.previous_training === 'string') {
        try {
          previousTraining = JSON.parse(learner.previous_training);
        } catch {
          previousTraining = [learner.previous_training];
        }
      }
    }

    // Fetch future skills context for this cadre role
    const futureSkills = DomainPackService.getFutureSkillsForRole(resolvedRole.id);

    const query: DiscoveryQuery = {
      skillGap: targetSkill,
      learnerId: learner.id,
      roleId: resolvedRole.id,
      roleName: resolvedRole.name,
      jobFamilyId: resolvedFamily?.id || 'statistics',
      jobFamilyName: resolvedFamily?.name || 'Official Statistics',
      department: learner.department || 'General Administration',
      assignment: learner.current_assignment || resolvedRole.typical_assignments[0] || '',
      preferredLanguage: learner.language_preference || 'en',
      desiredLevel: currentScore < 40 ? 'Beginner' : currentScore < 70 ? 'Intermediate' : 'Advanced',
      previousTraining,
      currentCompetencyScore: currentScore,
      forceRefresh,
    };

    const response = await this.discoverResources(query);

    // Attach future skills context
    if (futureSkills && futureSkills.length > 0) {
      response.future_skills_context = futureSkills.map(fs => ({
        id: fs.id,
        name: fs.name,
        recommended_proficiency: fs.recommended_proficiency || 'Intermediate',
        explanation: fs.explanation || `Strategic capability earmarked for future career milestones in ${resolvedRole.name}.`,
      }));
    }

    return response;
  }

  /**
   * Core discovery pipeline executing web search, normalization, verification, and hybrid ranking
   */
  public static async discoverResources(query: DiscoveryQuery): Promise<DiscoveryResponse> {
    const cacheKey = `${query.learnerId || 0}:${query.skillGap.toLowerCase()}:${query.preferredLanguage || 'en'}`;

    if (!query.forceRefresh) {
      const cached = this.responseCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL_MS)) {
        return cached.response;
      }
    }

    // 2. Build deterministic query
    const { primaryQuery, searchIntent } = QueryBuilder.buildSearchQuery(query);

    let webCandidates: DiscoveredResource[] = [];
    let webSearchSuccess = false;

    // 3. Attempt Web Search via SearchProvider
    try {
      const rawSearch = await this.searchProvider.search(primaryQuery, 10);
      if (rawSearch && rawSearch.length > 0) {
        webSearchSuccess = true;
        webCandidates = rawSearch.map((candidate, idx) => {
          const normalized = ResourceNormalizer.normalizeWebCandidate(candidate, idx, query);
          const audit = VerificationService.verifyResource(normalized);
          normalized.verification_status = audit.status;
          normalized.verification_reason = audit.verification_reason;
          normalized.quality_tier = audit.quality_tier;
          normalized.resource_type = audit.resource_type;
          normalized.is_accessible = audit.is_accessible;
          normalized.has_https = audit.has_https;
          normalized.domain_consistent = audit.domain_consistent;
          normalized.verified_at = audit.verified_at;
          normalized.verification_expires_at = audit.verification_expires_at;
          return normalized;
        });
      }
    } catch (searchError) {
      console.warn('[LearningDiscoveryService] Web search provider error:', searchError);
      webSearchSuccess = false;
    }

    // 4. Retrieve matching courses from existing prototype demo catalogue
    let catalogueResources: DiscoveredResource[] = [];
    try {
      const allDbResources = await RecommendationService.getAllLearningResources();
      catalogueResources = allDbResources.map(r => {
        const normalized = ResourceNormalizer.normalizeCatalogueResource(r, query);
        const audit = VerificationService.verifyResource(normalized);
        normalized.verification_status = audit.status;
        normalized.verification_reason = audit.verification_reason;
        normalized.quality_tier = audit.quality_tier;
        normalized.resource_type = audit.resource_type;
        normalized.is_accessible = audit.is_accessible;
        normalized.has_https = audit.has_https;
        normalized.domain_consistent = audit.domain_consistent;
        normalized.verified_at = audit.verified_at;
        normalized.verification_expires_at = audit.verification_expires_at;
        return normalized;
      });
    } catch (dbError) {
      console.warn('[LearningDiscoveryService] Error loading demo catalogue:', dbError);
    }

    // 5. Combine into unified pool and deduplicate
    const unifiedPool = ResourceNormalizer.deduplicateResources([...webCandidates, ...catalogueResources]);

    // 6. Execute deterministic ranking & Stage 5B quality evaluation
    const rankedResources = this.rankingService.rankResources(unifiedPool, query);

    // 7. Calculate source breakdown
    let webCount = 0;
    let catCount = 0;
    for (const r of rankedResources) {
      if (r.source_type === 'web_discovered') webCount++;
      else catCount++;
    }

    // 8. Determine status & human-readable message
    let status: 'success' | 'fallback' = 'success';
    let statusMessage = `Found relevant learning resources tailored to your role as ${query.roleName || 'an officer'} and your current assignment.`;

    if (!webSearchSuccess || webCount === 0) {
      status = 'fallback';
      statusMessage = "We couldn't find new web resources right now. Showing available learning resources from the prototype catalogue.";
    }

    if (rankedResources.length === 0) {
      status = 'fallback';
      statusMessage = `No learning resources currently matched "${query.skillGap}". Please try another competency area.`;
    }

    const bestMatch = rankedResources.length > 0 ? rankedResources[0] : null;
    const strongAlternatives = rankedResources.filter((r, idx) => idx > 0 && r.selection_status === 'STRONG_ALTERNATIVE').slice(0, 2);
    const otherOptions = rankedResources.slice(1, 6);

    // 9. Build structured comparison table for top options
    const topForComparison = rankedResources.slice(0, 4);
    const comparisonTable: ComparisonTableRow[] = topForComparison.map(r => ({
      id: r.id,
      title: r.title,
      provider_name: r.provider_name,
      selection_status: r.selection_status || 'ALTERNATIVE',
      fit_score: r.ranking_score,
      source_tier: ((r.quality_tier || r.source_tier || 4) as any) as SourceTier,
      resource_type: r.resource_type || 'COURSE',
      verification_status: r.verification_status,
      level: r.difficulty || 'Intermediate',
      language: r.language || 'English',
      duration: r.estimated_duration || 'Self-paced',
      url: r.url,
    }));

    const response: DiscoveryResponse = {
      success: true,
      status,
      status_message: statusMessage,
      best_match: bestMatch,
      strong_alternatives: strongAlternatives,
      other_options: otherOptions,
      all_resources: rankedResources,
      comparison_table: comparisonTable,
      total_found: rankedResources.length,
      source_breakdown: {
        web_discovered: webCount,
        demo_catalogue: catCount,
      },
      search_intent: searchIntent,
      learner_context: {
        learner_id: query.learnerId,
        role: query.roleName || 'Officer',
        assignment: query.assignment || 'Government Operations',
        job_family: query.jobFamilyName || 'Civil Services',
        skill_gap: query.skillGap,
        preferred_language: query.preferredLanguage || 'en',
      },
    };

    // Cache the completed response
    this.responseCache.set(cacheKey, {
      timestamp: Date.now(),
      response,
    });

    return response;
  }

  /**
   * Alias method for discovering learning resources for a learner
   */
  public static async discover(
    learnerId: number,
    skillGapName?: string,
    forceRefresh: boolean = false
  ): Promise<DiscoveryResponse> {
    return this.discoverForLearner(learnerId, skillGapName, forceRefresh);
  }
}

export { LearningDiscoveryService as DiscoveryService };
