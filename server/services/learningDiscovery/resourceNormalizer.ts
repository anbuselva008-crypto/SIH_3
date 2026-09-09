import type { 
  DiscoveredResource, 
  ProviderType, 
  SourceTier, 
  VerificationStatus,
  DiscoveryQuery 
} from './types.ts';
import type { SearchCandidate } from './searchProvider.ts';
import type { LearningResource } from '../../database/models.ts';
import { VerificationService } from './verificationService.ts';

export class ResourceNormalizer {
  /**
   * Cleans URL and strips marketing/tracking parameters (utm_*, ref, etc.)
   */
  public static getCanonicalUrl(rawUrl: string): string {
    try {
      const url = new URL(rawUrl);
      const cleanParams = new URLSearchParams();
      // Keep only essential course path or ID params if present
      for (const [key, value] of url.searchParams.entries()) {
        const lowerKey = key.toLowerCase();
        if (
          !lowerKey.startsWith('utm_') &&
          !lowerKey.startsWith('fbclid') &&
          !lowerKey.startsWith('gclid') &&
          lowerKey !== 'ref' &&
          lowerKey !== 'src' &&
          lowerKey !== 'source'
        ) {
          cleanParams.append(key, value);
        }
      }
      url.search = cleanParams.toString();
      return url.toString().replace(/\/$/, '');
    } catch {
      return rawUrl.trim();
    }
  }

  /**
   * Classifies domain into source tier, provider name, and provider type
   */
  public static classifyDomain(domain: string, title: string): {
    providerName: string;
    providerType: ProviderType;
    sourceTier: SourceTier;
    verificationStatus: VerificationStatus;
  } {
    const d = domain.toLowerCase();
    const t = title.toLowerCase();

    // Tier 1: Official Government
    if (d.includes('karmayogi.gov.in') || d.includes('igot.gov.in') || t.includes('igot karmayogi')) {
      return {
        providerName: 'iGOT Karmayogi',
        providerType: 'Government',
        sourceTier: 1,
        verificationStatus: 'Verified',
      };
    }

    if (d.includes('swayam.gov.in')) {
      return {
        providerName: 'SWAYAM (MoE / Govt of India)',
        providerType: 'Government',
        sourceTier: 1,
        verificationStatus: 'Verified',
      };
    }

    if (d.includes('nptel.ac.in')) {
      return {
        providerName: 'NPTEL (IITs & IISc)',
        providerType: 'University',
        sourceTier: 1,
        verificationStatus: 'Verified',
      };
    }

    if (d.includes('mospi.gov.in')) {
      return {
        providerName: 'MoSPI / NSSTA',
        providerType: 'Government',
        sourceTier: 1,
        verificationStatus: 'Verified',
      };
    }

    if (d.includes('tamilvu.org')) {
      return {
        providerName: 'Tamil Virtual Academy (Govt of Tamil Nadu)',
        providerType: 'Government',
        sourceTier: 1,
        verificationStatus: 'Verified',
      };
    }

    if (d.endsWith('.gov.in') || d.endsWith('.nic.in')) {
      // Extract specific department/portal name
      const prefix = d.replace(/\.(gov|nic)\.in$/, '');
      const cleanPrefix = prefix.replace(/\./g, ' ').toUpperCase();
      return {
        providerName: `${cleanPrefix} (Government of India)`,
        providerType: 'Government',
        sourceTier: 1,
        verificationStatus: 'Verified',
      };
    }

    if (d.endsWith('.gov') || d.endsWith('.mil')) {
      return {
        providerName: `${domain} (Official Government)`,
        providerType: 'Government',
        sourceTier: 1,
        verificationStatus: 'Verified',
      };
    }

    // Tier 2: Academic & Public Institutions
    if (d.includes('.iit') || d.includes('iitb.ac.in') || d.includes('iitd.ac.in') || d.includes('iitm.ac.in') || d.includes('iitkgp.ac.in')) {
      return {
        providerName: 'Indian Institute of Technology (IIT)',
        providerType: 'University',
        sourceTier: 2,
        verificationStatus: 'Institutional',
      };
    }

    if (d.endsWith('.ac.in') || d.endsWith('.edu.in') || d.endsWith('.edu')) {
      const parts = d.split('.');
      const instName = parts.length > 2 ? parts[parts.length - 3] : parts[0];
      const cleanInst = instName.charAt(0).toUpperCase() + instName.slice(1);
      return {
        providerName: `${cleanInst} Academic Institute`,
        providerType: 'University',
        sourceTier: 2,
        verificationStatus: 'Institutional',
      };
    }

    // Tier 3: Established Educational Platforms & Professional Bodies
    if (d.includes('coursera.org')) {
      return {
        providerName: 'Coursera',
        providerType: 'Educational Platform',
        sourceTier: 3,
        verificationStatus: 'Not Verified',
      };
    }

    if (d.includes('edx.org')) {
      return {
        providerName: 'edX',
        providerType: 'Educational Platform',
        sourceTier: 3,
        verificationStatus: 'Not Verified',
      };
    }

    if (d.includes('futurelearn.com')) {
      return {
        providerName: 'FutureLearn',
        providerType: 'Educational Platform',
        sourceTier: 3,
        verificationStatus: 'Not Verified',
      };
    }

    if (d.includes('ice.org.uk') || d.includes('asce.org') || d.includes('ieee.org')) {
      return {
        providerName: 'Professional Engineering Institution',
        providerType: 'Institutional',
        sourceTier: 3,
        verificationStatus: 'Institutional',
      };
    }

    // Tier 4: Other web learning sources
    const hostParts = domain.split('.');
    const baseName = hostParts.length >= 2 ? hostParts[hostParts.length - 2] : hostParts[0];
    const formattedName = baseName.charAt(0).toUpperCase() + baseName.slice(1);

    return {
      providerName: formattedName,
      providerType: 'Open Learning',
      sourceTier: 4,
      verificationStatus: 'Not Verified',
    };
  }

  /**
   * Normalizes a web search candidate into a standardized DiscoveredResource.
   * Strictly preserves unknown/null values rather than fabricating details.
   */
  public static normalizeWebCandidate(
    candidate: SearchCandidate,
    index: number,
    query: DiscoveryQuery
  ): DiscoveredResource {
    const canonicalUrl = this.getCanonicalUrl(candidate.url);
    const domain = candidate.sourceDomain || new URL(candidate.url).hostname.replace(/^www\./, '');
    const classification = this.classifyDomain(domain, candidate.title);

    // Clean title (strip standard SEO pipe or dash suffixes like " | Coursera", " - YouTube", etc.)
    const cleanTitle = candidate.title
      .replace(/\s*[-|–—]\s*(Coursera|edX|SWAYAM|NPTEL|YouTube|Wikipedia|Scribd|PDF).*$/i, '')
      .trim();

    // Genuine language detection from candidate content (never invent language)
    const candidateText = `${candidate.title} ${candidate.snippet} ${domain}`.toLowerCase();
    let detectedLanguage = 'English';
    if (candidateText.includes('tamil') || candidateText.includes('தமிழ்') || domain.includes('tamilvu.org')) {
      detectedLanguage = 'Tamil';
    } else if (candidateText.includes('hindi') || candidateText.includes('हिंदी') || candidateText.includes('bilingual (hindi')) {
      detectedLanguage = 'Hindi';
    } else if (candidateText.includes('telugu') || candidateText.includes('తెలుగు')) {
      detectedLanguage = 'Telugu';
    }

    const finalTitle = cleanTitle || candidate.title;
    const resType = VerificationService.detectResourceType(finalTitle, candidate.snippet || '', candidate.url);

    return {
      id: `web-${Date.now()}-${index}`,
      title: finalTitle,
      url: candidate.url,
      canonical_url: canonicalUrl,
      provider_name: classification.providerName,
      provider_type: classification.providerType,
      source_tier: classification.sourceTier,
      quality_tier: classification.sourceTier,
      resource_type: resType,
      description: candidate.snippet || 'Learning resource discovered via public institutional search.',
      primary_competency: query.skillGap,
      secondary_competencies: [],
      relevant_job_families: query.jobFamilyName ? [query.jobFamilyName] : [],
      relevant_roles: query.roleName ? [query.roleName] : [],
      relevant_assignments: query.assignment ? [query.assignment] : [],
      difficulty: null, // DO NOT invent difficulty
      language: detectedLanguage,
      estimated_duration: null, // DO NOT invent duration
      source_type: 'web_discovered',
      verification_status: classification.verificationStatus,
      discovered_at: new Date().toISOString(),
      ranking_score: 0,
      match_reason: '',
      is_best_match: false,
      metadata_json: {
        domain,
        raw_snippet: candidate.snippet,
      },
    };
  }

  /**
   * Normalizes an existing prototype catalogue resource into DiscoveredResource format
   */
  public static normalizeCatalogueResource(
    resource: LearningResource,
    query: DiscoveryQuery
  ): DiscoveredResource {
    const resType = VerificationService.detectResourceType(resource.title, resource.description, '');

    return {
      id: `catalogue-${resource.id}`,
      title: resource.title,
      url: resource.source === 'iGOT' 
        ? `https://karmayogi.gov.in/app/toc/${resource.id}/overview` 
        : `https://mospi.gov.in/training/nssta/programme/${resource.id}`,
      canonical_url: `https://karmayogi.gov.in/app/toc/${resource.id}`,
      provider_name: resource.source === 'iGOT' ? 'iGOT Karmayogi (Demo Catalogue)' : 'NSSTA / MoSPI (Demo Catalogue)',
      provider_type: 'Government',
      source_tier: 1,
      quality_tier: 1,
      resource_type: resType,
      description: resource.description,
      primary_competency: resource.competency,
      secondary_competencies: resource.secondary_competencies || [],
      relevant_job_families: query.jobFamilyName ? [query.jobFamilyName] : [],
      relevant_roles: resource.target_roles || [],
      relevant_assignments: resource.relevant_assignments || [],
      difficulty: (resource.difficulty_level as any) || 'Intermediate',
      language: 'English',
      estimated_duration: resource.estimated_duration,
      source_type: 'demo_catalogue',
      verification_status: 'VERIFIED',
      discovered_at: new Date().toISOString(),
      ranking_score: 0,
      match_reason: '',
      is_best_match: false,
      metadata_json: {
        catalogue_id: resource.id,
        source: resource.source,
        expected_outcome: resource.expected_outcome,
      },
    };
  }

  /**
   * Deduplicates candidates by canonical URL and normalized title
   */
  public static deduplicateResources(resources: DiscoveredResource[]): DiscoveredResource[] {
    const seenUrls = new Set<string>();
    const seenTitles = new Set<string>();
    const unique: DiscoveredResource[] = [];

    for (const res of resources) {
      const urlKey = res.canonical_url.toLowerCase();
      const titleKey = res.title.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (!seenUrls.has(urlKey) && !seenTitles.has(titleKey)) {
        seenUrls.add(urlKey);
        seenTitles.add(titleKey);
        unique.push(res);
      }
    }

    return unique;
  }
}
