import type { DiscoveryQuery } from './types.ts';

export class QueryBuilder {
  /**
   * Builds deterministic, intent-rich search query based on learner profile and skill gap.
   * Does not expose raw syntax to ordinary learners.
   */
  public static buildSearchQuery(params: DiscoveryQuery): {
    primaryQuery: string;
    searchIntent: string;
    keywords: string[];
  } {
    const {
      skillGap,
      roleName = '',
      jobFamilyName = '',
      assignment = '',
      preferredLanguage = 'en',
    } = params;

    const cleanSkill = skillGap.trim();
    const cleanRole = roleName.trim();
    const cleanAssignment = assignment.trim();

    // Contextual domain booster keywords
    const domainKeywords: string[] = [];
    
    // Assignment-specific keyword extraction
    if (cleanAssignment) {
      // Pick key operational words, avoiding generic noise
      const words = cleanAssignment
        .replace(/[()\/,-]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 3 && !['with', 'from', 'this', 'that', 'data'].includes(w.toLowerCase()));
      if (words.length > 0) {
        domainKeywords.push(words.slice(0, 2).join(' '));
      }
    }

    // Role-specific keyword
    if (cleanRole && !cleanRole.toLowerCase().includes('officer')) {
      domainKeywords.push(cleanRole);
    } else if (cleanRole) {
      // For things like "Statistical Officer", "Civil Engineer", "IT Officer"
      const roleCore = cleanRole.replace(/Officer|Cadre|Assistant|Junior|Senior/gi, '').trim();
      if (roleCore) {
        domainKeywords.push(roleCore);
      }
    }

    // Language qualifier if not English
    let langQualifier = '';
    if (preferredLanguage && preferredLanguage !== 'en') {
      const langNames: Record<string, string> = {
        hi: 'Hindi',
        ta: 'Tamil',
        te: 'Telugu',
        kn: 'Kannada',
        bn: 'Bengali',
        mr: 'Marathi',
        gu: 'Gujarati',
      };
      if (langNames[preferredLanguage]) {
        langQualifier = langNames[preferredLanguage];
      }
    }

    // Build focused query components:
    // Format: [Skill Gap] [domain/role] [assignment] government course training
    const queryParts: string[] = [];
    queryParts.push(cleanSkill);

    if (domainKeywords.length > 0) {
      queryParts.push(domainKeywords[0]);
    } else if (cleanRole) {
      queryParts.push(cleanRole);
    }

    if (langQualifier) {
      queryParts.push(langQualifier);
    }

    queryParts.push('government training course');

    const primaryQuery = queryParts.filter(Boolean).join(' ');

    // Human-readable search intent explanation
    const searchIntent = `Discovering structured learning resources for "${cleanSkill}" contextualized for ${cleanRole || 'public service'} in "${cleanAssignment || jobFamilyName || 'public administration'}"`;

    const keywords = [
      cleanSkill.toLowerCase(),
      cleanRole.toLowerCase(),
      cleanAssignment.toLowerCase(),
      jobFamilyName.toLowerCase(),
    ].filter(Boolean);

    return {
      primaryQuery,
      searchIntent,
      keywords,
    };
  }
}
