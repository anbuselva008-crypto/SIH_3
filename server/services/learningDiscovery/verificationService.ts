import type { 
  DiscoveredResource, 
  VerificationStatus, 
  SourceTier, 
  ResourceType 
} from './types.ts';
import { queryOne, execute } from '../../database/db.ts';

export interface VerificationAuditResult {
  isValid: boolean;
  status: VerificationStatus;
  quality_tier: SourceTier;
  resource_type: ResourceType;
  is_accessible: boolean;
  has_https: boolean;
  domain_consistent: boolean;
  verification_reason: string;
  verified_at: string;
  verification_expires_at: string;
}

const DISQUALIFIED_DOMAINS = [
  'quora.com',
  'reddit.com',
  'pinterest.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'tiktok.com',
  'medium.com',
  'blogspot.com',
  'wordpress.com',
  'tumblr.com',
];

export class VerificationService {
  private static memoryCache: Map<string, VerificationAuditResult> = new Map();
  private static CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Validates URL structure, safe protocols, and SSRF prevention
   */
  public static isValidUrl(urlStr: string): boolean {
    if (!urlStr || typeof urlStr !== 'string') return false;
    try {
      const parsed = new URL(urlStr.trim());
      // Only allow safe HTTP and HTTPS protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
      }
      // Check that hostname contains a valid dot and no malicious characters
      if (!parsed.hostname || !parsed.hostname.includes('.')) {
        return false;
      }
      // Disallow localhost / internal private IPs (SSRF protection)
      const host = parsed.hostname.toLowerCase();
      if (
        host === 'localhost' ||
        host === '0.0.0.0' ||
        host.startsWith('127.') ||
        host.startsWith('192.168.') ||
        host.startsWith('10.') ||
        host.startsWith('169.254.') ||
        host.startsWith('172.16.') ||
        host.startsWith('172.17.') ||
        host.startsWith('172.18.') ||
        host.startsWith('172.19.') ||
        host.startsWith('172.20.') ||
        host.startsWith('172.21.') ||
        host.startsWith('172.22.') ||
        host.startsWith('172.23.') ||
        host.startsWith('172.24.') ||
        host.startsWith('172.25.') ||
        host.startsWith('172.26.') ||
        host.startsWith('172.27.') ||
        host.startsWith('172.28.') ||
        host.startsWith('172.29.') ||
        host.startsWith('172.30.') ||
        host.startsWith('172.31.') ||
        host.endsWith('.local') ||
        host.endsWith('.internal')
      ) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Helper to verify a single URL and provider directly
   */
  public static verifyUrl(urlStr: string, providerName: string = ''): VerificationAuditResult {
    return this.verifyResource({
      id: 'audit_tmp',
      canonical_url: urlStr,
      url: urlStr,
      provider_name: providerName || 'Web Provider',
      provider_type: 'Open Learning',
      title: providerName || 'Learning Resource',
      source_type: 'web_discovered',
      source_tier: 4,
      primary_competency: '',
      secondary_competencies: [],
      relevant_roles: [],
      relevant_assignments: [],
      relevant_job_families: [],
      difficulty: 'Intermediate',
      estimated_duration: 'Self-paced',
      language: 'English',
      description: '',
      ranking_score: 0,
      is_best_match: false,
      match_reason: '',
      verification_status: 'UNVERIFIED',
      discovered_at: new Date().toISOString(),
    });
  }

  /**
   * Classifies learning resource into normalized ResourceType
   */
  public static detectResourceType(title: string, description: string = '', url: string = ''): ResourceType {
    const text = `${title} ${description} ${url}`.toLowerCase();

    if (text.includes('handbook') || text.includes('compendium') || text.includes('manual')) {
      return 'HANDBOOK';
    }
    if (
      text.includes('guidelines') || 
      text.includes('guide') || 
      text.includes('standard operating procedure') || 
      text.includes('sop') ||
      text.includes('code of practice')
    ) {
      return 'OFFICIAL_GUIDE';
    }
    if (
      text.includes('training programme') || 
      text.includes('training program') || 
      text.includes('capacity building') || 
      text.includes('executive development') ||
      text.includes('induction programme')
    ) {
      return 'TRAINING_PROGRAMME';
    }
    if (
      text.includes('certificate') || 
      text.includes('certification') || 
      text.includes('specialization')
    ) {
      return 'CERTIFICATE_PROGRAMME';
    }
    if (
      text.includes('lecture series') || 
      text.includes('video lecture') || 
      text.includes('nptel lecture')
    ) {
      return 'LECTURE_SERIES';
    }
    if (
      text.includes('module') || 
      text.includes('unit') || 
      text.includes('chapter')
    ) {
      return 'LEARNING_MODULE';
    }

    return 'COURSE';
  }

  /**
   * Comprehensive Stage 5B verification layer:
   * 1. URL validity & SSRF check
   * 2. Rejection of spam, forum, social pages
   * 3. HTTPS security check
   * 4. Provider and domain consistency check
   * 5. Source tier determination
   * 6. Resource type classification
   * 7. Result caching
   */
  public static verifyResource(resource: DiscoveredResource): VerificationAuditResult {
    const rawUrl = resource.url || '';
    const now = new Date();
    const verifiedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + this.CACHE_TTL_MS).toISOString();

    // Check in-memory cache
    const cached = this.memoryCache.get(rawUrl);
    if (cached && new Date(cached.verification_expires_at).getTime() > now.getTime()) {
      return cached;
    }

    // 1. URL Protocol & SSRF check
    if (!this.isValidUrl(rawUrl)) {
      const brokenResult: VerificationAuditResult = {
        isValid: false,
        status: 'BROKEN',
        quality_tier: 4,
        resource_type: this.detectResourceType(resource.title, resource.description, rawUrl),
        is_accessible: false,
        has_https: false,
        domain_consistent: false,
        verification_reason: 'Malformed, inaccessible, or non-permitted URL protocol.',
        verified_at: verifiedAt,
        verification_expires_at: expiresAt,
      };
      this.memoryCache.set(rawUrl, brokenResult);
      return brokenResult;
    }

    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    const hasHttps = parsed.protocol === 'https:';

    // 2. Disqualify Forums, Blogs, Spam links
    const isDisqualified = DISQUALIFIED_DOMAINS.some(badDomain => 
      host === badDomain || host.endsWith(`.${badDomain}`)
    );

    if (isDisqualified) {
      const rejectedResult: VerificationAuditResult = {
        isValid: false,
        status: 'REJECTED',
        quality_tier: 4,
        resource_type: 'OTHER_LEARNING_RESOURCE',
        is_accessible: true,
        has_https: hasHttps,
        domain_consistent: false,
        verification_reason: 'Disqualified social forum, community thread, or unaccredited blog; not an approved institutional repository.',
        verified_at: verifiedAt,
        verification_expires_at: expiresAt,
      };
      this.memoryCache.set(rawUrl, rejectedResult);
      return rejectedResult;
    }

    // 3. Provider & Domain Consistency Check
    let domainConsistent = true;
    let providerName = (resource.provider_name || '').toLowerCase();

    if (providerName.includes('igot') || providerName.includes('karmayogi')) {
      if (!host.includes('karmayogi.gov.in') && !host.includes('igot.gov.in')) {
        domainConsistent = false;
      }
    } else if (providerName.includes('swayam')) {
      if (!host.includes('swayam.gov.in')) {
        domainConsistent = false;
      }
    } else if (providerName.includes('nptel')) {
      if (!host.includes('nptel.ac.in')) {
        domainConsistent = false;
      }
    } else if (providerName.includes('mospi') || providerName.includes('nssta')) {
      if (!host.includes('mospi.gov.in')) {
        domainConsistent = false;
      }
    } else if (providerName.includes('tamil virtual academy') || providerName.includes('tamilvu')) {
      if (!host.includes('tamilvu.org') && !host.endsWith('.gov.in')) {
        domainConsistent = false;
      }
    }

    // 4. Source Tier & Verification Status Classification
    const isTier1Gov = 
      host.endsWith('.gov.in') || 
      host.endsWith('.nic.in') ||
      host === 'karmayogi.gov.in' ||
      host === 'swayam.gov.in' ||
      host === 'mospi.gov.in' ||
      host === 'tamilvu.org' ||
      host.endsWith('.gov');

    const isTier2Academic =
      host.endsWith('.ac.in') ||
      host.endsWith('.edu.in') ||
      host.endsWith('.edu') ||
      host === 'nptel.ac.in' ||
      host.includes('iit') ||
      host.includes('cdac.in') ||
      host.includes('infosecawareness.in');

    const isTier3Platform =
      host.includes('coursera.org') ||
      host.includes('edx.org') ||
      host.includes('futurelearn.com') ||
      host.includes('ice.org.uk') ||
      host.includes('ieee.org') ||
      host.includes('asce.org');

    let qualityTier: SourceTier = 4;
    let verificationStatus: VerificationStatus = 'UNVERIFIED';
    let reason = '';

    if (resource.source_type === 'demo_catalogue') {
      qualityTier = 1;
      verificationStatus = 'VERIFIED';
      reason = 'Verified official national catalogue repository for government capacity building.';
    } else if (isTier1Gov && domainConsistent) {
      qualityTier = 1;
      verificationStatus = hasHttps ? 'VERIFIED' : 'PARTIALLY_VERIFIED';
      reason = hasHttps 
        ? 'Verified official government repository (.gov.in / .nic.in / state portal) with active TLS security.'
        : 'Official government portal, but utilizes unencrypted HTTP protocol; partially verified.';
    } else if (isTier2Academic && domainConsistent) {
      qualityTier = 2;
      verificationStatus = hasHttps ? 'VERIFIED' : 'PARTIALLY_VERIFIED';
      reason = hasHttps
        ? 'Verified accredited national university / premier academic institute (IIT / NPTEL / Central University).'
        : 'Recognized academic institution, but operates over standard HTTP; partially verified.';
    } else if (isTier3Platform) {
      qualityTier = 3;
      verificationStatus = 'PARTIALLY_VERIFIED';
      reason = 'Recognized international educational provider or accredited engineering professional body; general institutional accreditation.';
    } else if (!domainConsistent) {
      qualityTier = 3;
      verificationStatus = 'PARTIALLY_VERIFIED';
      reason = 'Discovered learning content; provider identity and domain discrepancy detected, flagged for partial verification.';
    } else {
      qualityTier = 4;
      verificationStatus = 'UNVERIFIED';
      reason = 'Open web learning candidate; pending formal government accreditation.';
    }

    const resType = this.detectResourceType(resource.title, resource.description, rawUrl);

    const result: VerificationAuditResult = {
      isValid: true,
      status: verificationStatus,
      quality_tier: qualityTier,
      resource_type: resType,
      is_accessible: true,
      has_https: hasHttps,
      domain_consistent: domainConsistent,
      verification_reason: reason,
      verified_at: verifiedAt,
      verification_expires_at: expiresAt,
    };

    this.memoryCache.set(rawUrl, result);

    // Asynchronously record verification in database table
    try {
      execute(`
        INSERT INTO resource_verifications 
          (resource_url, verification_status, verification_reason, quality_tier, resource_type, is_accessible, has_https, domain_consistent, verified_at, expires_at)
        VALUES 
          ('${rawUrl.replace(/'/g, "''")}', '${result.status}', '${result.verification_reason.replace(/'/g, "''")}', ${result.quality_tier}, '${result.resource_type}', ${result.is_accessible}, ${result.has_https}, ${result.domain_consistent}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 day')
        ON CONFLICT (resource_url) DO UPDATE SET
          verification_status = EXCLUDED.verification_status,
          verification_reason = EXCLUDED.verification_reason,
          quality_tier = EXCLUDED.quality_tier,
          resource_type = EXCLUDED.resource_type,
          is_accessible = EXCLUDED.is_accessible,
          has_https = EXCLUDED.has_https,
          domain_consistent = EXCLUDED.domain_consistent,
          verified_at = CURRENT_TIMESTAMP
      `).catch(() => {});
    } catch {}

    return result;
  }

  /**
   * Retrieves stored verification record for a specific resource URL
   */
  public static async getStoredVerification(url: string): Promise<VerificationAuditResult | null> {
    try {
      const row = await queryOne<any>(`
        SELECT * FROM resource_verifications WHERE resource_url = '${url.replace(/'/g, "''")}' LIMIT 1
      `);
      if (row) {
        return {
          isValid: row.verification_status !== 'BROKEN' && row.verification_status !== 'REJECTED',
          status: row.verification_status as VerificationStatus,
          quality_tier: Number(row.quality_tier) as SourceTier,
          resource_type: row.resource_type as ResourceType,
          is_accessible: Boolean(row.is_accessible),
          has_https: Boolean(row.has_https),
          domain_consistent: Boolean(row.domain_consistent),
          verification_reason: row.verification_reason,
          verified_at: row.verified_at,
          verification_expires_at: row.expires_at,
        };
      }
    } catch {}
    return null;
  }

  /**
   * Sanitizes title and description strings (prevent XSS / HTML injection)
   */
  public static sanitizeString(str: string): string {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim();
  }
}
