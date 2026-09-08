/**
 * STAGE 4 — Competency Mapping Service
 * Enforces alignment between generated questions/learning materials
 * and the official Indian Statistical System competency taxonomy.
 */

export const KNOWN_COMPETENCIES: string[] = [
  'Statistics',
  'Python',
  'Data Analysis',
  'Data Visualization',
  'Survey Methodology',
  'National Accounts',
  'Price Statistics',
  'Official Statistics',
  'Sampling Theory',
  'Machine Learning',
];

const SYNONYM_MAP: Record<string, string> = {
  // Python & Coding
  'python programming': 'Python',
  'pandas': 'Python',
  'numpy': 'Python',
  'scripting': 'Python',
  'code': 'Python',
  
  // Statistics & Sampling
  'statistical theory': 'Statistics',
  'mathematical statistics': 'Statistics',
  'probability': 'Statistics',
  'sampling': 'Statistics',
  'sample survey': 'Survey Methodology',
  'survey design': 'Survey Methodology',
  'field survey': 'Survey Methodology',
  'plfs': 'Survey Methodology',
  'stratified sampling': 'Statistics',
  'hypothesis testing': 'Statistics',
  
  // Data Analysis & National Accounts
  'data processing': 'Data Analysis',
  'macroeconomics': 'Data Analysis',
  'gdp': 'National Accounts',
  'gsdp': 'National Accounts',
  'national accounts': 'National Accounts',
  'cpi': 'Price Statistics',
  'consumer price index': 'Price Statistics',
  'inflation': 'Price Statistics',
  'index numbers': 'Price Statistics',
  'economic statistics': 'Data Analysis',
  'eda': 'Data Analysis',

  // Visualization
  'charts': 'Data Visualization',
  'dashboard': 'Data Visualization',
  'matplotlib': 'Data Visualization',
  'seaborn': 'Data Visualization',
  'power bi': 'Data Visualization',
  'gis': 'Data Visualization',
  'mapping': 'Data Visualization',
};

export class CompetencyMapper {
  /**
   * Maps an arbitrary label or question context into the approved taxonomy.
   */
  public static mapCompetency(
    suggestedLabel?: string | null,
    resourceCompetency?: string | null,
    fallbackContext?: string | null
  ): string {
    // 1. Direct match against known vocabulary
    if (suggestedLabel) {
      const trimmed = suggestedLabel.trim();
      const exactMatch = KNOWN_COMPETENCIES.find(
        (c) => c.toLowerCase() === trimmed.toLowerCase()
      );
      if (exactMatch) return exactMatch;

      // Check synonyms
      const lower = trimmed.toLowerCase();
      for (const [key, mapped] of Object.entries(SYNONYM_MAP)) {
        if (lower.includes(key)) {
          return mapped;
        }
      }
    }

    // 2. Inherit from linked Stage 3 learning resource competency if valid
    if (resourceCompetency) {
      const match = KNOWN_COMPETENCIES.find(
        (c) => c.toLowerCase() === resourceCompetency.trim().toLowerCase()
      );
      if (match) return match;
    }

    // 3. Scan context/title hints
    if (fallbackContext) {
      const lowerContext = fallbackContext.toLowerCase();
      for (const [key, mapped] of Object.entries(SYNONYM_MAP)) {
        if (lowerContext.includes(key)) {
          return mapped;
        }
      }
      for (const comp of KNOWN_COMPETENCIES) {
        if (lowerContext.includes(comp.toLowerCase())) {
          return comp;
        }
      }
    }

    // 4. Controlled fallback when no relation is detectable
    return 'Competency mapping unavailable';
  }

  /**
   * Checks whether a competency label belongs to the official cadre taxonomy.
   */
  public static isValidCompetency(label: string): boolean {
    return KNOWN_COMPETENCIES.includes(label);
  }
}
