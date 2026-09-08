import { LearnerService } from '../learnerService.ts';
import { RecommendationService } from '../recommendationService.ts';
import { DomainPackService } from '../domainPackService.ts';
import type { 
  DiscoveryQuery, 
  DiscoveryResponse, 
  DiscoveredResource 
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
    if (!targetSkill) {
      const gapReport = await LearnerService.getSkillGapAnalysis(learnerId);
      if (gapReport.priority_areas && gapReport.priority_areas.length > 0) {
        targetSkill = gapReport.priority_areas[0].name;
      } else if (gapReport.all_competencies && gapReport.all_competencies.length > 0) {
        targetSkill = gapReport.all_competencies[0].name;
      } else {
        targetSkill = 'Survey Methodology';
      }
    }

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
      forceRefresh,
    };

    return this.discoverResources(query);
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
      const rawSearch = await this.searchProvider.search(primaryQuery, 8);
      if (rawSearch && rawSearch.length > 0) {
        webSearchSuccess = true;
        webCandidates = rawSearch.map((candidate, idx) => {
          const normalized = ResourceNormalizer.normalizeWebCandidate(candidate, idx, query);
          const verification = VerificationService.verifyResource(normalized);
          normalized.verification_status = verification.status;
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
      catalogueResources = allDbResources.map(r => ResourceNormalizer.normalizeCatalogueResource(r, query));
    } catch (dbError) {
      console.warn('[LearningDiscoveryService] Error loading demo catalogue:', dbError);
    }

    // 5. Combine into unified pool and deduplicate
    const unifiedPool = ResourceNormalizer.deduplicateResources([...webCandidates, ...catalogueResources]);

    // 6. Execute deterministic ranking
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
    const otherOptions = rankedResources.slice(1, 5); // Up to 4 other options (top 3–5 total)

    const response: DiscoveryResponse = {
      success: true,
      status,
      status_message: statusMessage,
      best_match: bestMatch,
      other_options: otherOptions,
      all_resources: rankedResources,
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
}
