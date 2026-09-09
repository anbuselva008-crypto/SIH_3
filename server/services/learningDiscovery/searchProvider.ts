export interface SearchCandidate {
  title: string;
  url: string;
  snippet: string;
  sourceDomain?: string;
}

export interface ISearchProvider {
  name: string;
  search(query: string, limit?: number): Promise<SearchCandidate[]>;
}

interface CacheEntry {
  timestamp: number;
  results: SearchCandidate[];
}

/**
 * Curated open course index of recognized national institutions (NPTEL, SWAYAM, IITs, MeitY, MoSPI, Coursera)
 * Used as reliable secondary provider when external web search engines challenge automated requests.
 */
export const INSTITUTIONAL_WEB_COURSES: SearchCandidate[] = [
  // Civil Engineering & Infrastructure
  {
    title: 'Contract Management in Construction & Public Works - NPTEL',
    url: 'https://nptel.ac.in/courses/105106149',
    snippet: 'Comprehensive national programme covering standard bidding documents, FIDIC conditions, public procurement, risk allocation, contractor dispute resolution, and contractual administration for civil engineering projects.',
    sourceDomain: 'nptel.ac.in',
  },
  {
    title: 'CPWD Works Manual & Public Works Contract Arbitration Guidelines',
    url: 'https://cpwd.gov.in/manual/works-manual-contract-management.pdf',
    snippet: 'Official Ministry of Housing and Urban Affairs standard operating procedure and handbook on government works execution, tender documentation, contract dispute settlement, and engineer supervision.',
    sourceDomain: 'cpwd.gov.in',
  },
  {
    title: 'Software Vendor Contract & Cloud Licensing Management',
    url: 'https://it-academy.org/courses/software-licensing-contracts',
    snippet: 'Legal and technical management of SaaS enterprise agreements, open source intellectual property licenses, SLA uptime penalties, and software vendor negotiation for IT departments.',
    sourceDomain: 'it-academy.org',
  },
  {
    title: 'Quality Control and Concrete Technology - NPTEL / IIT Roorkee',
    url: 'https://nptel.ac.in/courses/105107122',
    snippet: 'Rigorous engineering quality assurance, non-destructive testing, mix design compliance, and site inspection protocols for public highway and building construction.',
    sourceDomain: 'nptel.ac.in',
  },
  {
    title: 'Foundations of Structural Analysis & Mechanics of Materials - SWAYAM',
    url: 'https://swayam.gov.in/courses/structural-analysis-foundation',
    snippet: 'Fundamental beginner to intermediate engineering principles of stress-strain relationships, beam deflection, truss analysis, and shear force diagrams for infrastructure engineers.',
    sourceDomain: 'swayam.gov.in',
  },
  {
    title: 'Advanced Multivariable Structural Dynamics & Finite Element Analysis - IIT Bombay',
    url: 'https://civil.iitb.ac.in/courses/advanced-structural-dynamics-fea',
    snippet: 'Post-graduate level advanced continuum mechanics, non-linear seismic eigenvalue solvers, and finite element discretization requiring prior completion of matrix structural analysis.',
    sourceDomain: 'civil.iitb.ac.in',
  },
  {
    title: 'Introduction to Python Programming - Open MOOC',
    url: 'https://openlearning.ac.in/courses/intro-python-basics',
    snippet: 'Introductory level basic syntax, variables, loops, and conditional statements for first-time learners with no programming experience.',
    sourceDomain: 'openlearning.ac.in',
  },
  {
    title: 'Smart Cities & Urban Infrastructure Planning - SWAYAM',
    url: 'https://swayam.gov.in/explorer?searchText=urban+infrastructure',
    snippet: 'Ministry of Education approved curriculum on municipal utility management, transit-oriented development, spatial GIS mapping, and urban infrastructure financing.',
    sourceDomain: 'swayam.gov.in',
  },
  {
    title: 'Public Procurement & General Financial Rules (GFR 2017) Compliance',
    url: 'https://nifm.ac.in/training-programmes/public-procurement',
    snippet: 'National Institute of Financial Management executive module on Government e-Marketplace (GeM), tender preparation, e-procurement guidelines, and financial audit standards.',
    sourceDomain: 'nifm.ac.in',
  },
  {
    title: 'Construction Project Management Specialization - Coursera',
    url: 'https://www.coursera.org/specializations/construction-project-management',
    snippet: 'Comprehensive training in project scheduling, cost control, structural safety, environmental clearance, and engineering contract oversight.',
    sourceDomain: 'coursera.org',
  },
  {
    title: 'Structural Health Monitoring & Retrofitting of Infrastructure - IIT Madras',
    url: 'https://civil.iitm.ac.in/shm-training',
    snippet: 'Field sensor instrumentation, load testing, bridge safety inspection, and seismic retrofitting standards for public sector civil engineers.',
    sourceDomain: 'civil.iitm.ac.in',
  },

  // Official Statistics & Survey
  {
    title: 'Survey Sampling and Official Statistics Methodology - NPTEL',
    url: 'https://nptel.ac.in/courses/111104073',
    snippet: 'Theoretical and applied foundations of multi-stage stratified sampling, Horvitz-Thompson estimation, ratio estimators, and non-sampling error modeling for government surveys.',
    sourceDomain: 'nptel.ac.in',
  },
  {
    title: 'Survey Data Collection and Analytics Specialization - Coursera',
    url: 'https://www.coursera.org/specializations/data-collection',
    snippet: 'Questionnaire design, sampling frames, response rate optimization, microdata imputation, and survey weighting adjustments from accredited university researchers.',
    sourceDomain: 'coursera.org',
  },
  {
    title: 'Applied Econometrics & National Account Aggregates - SWAYAM',
    url: 'https://swayam.gov.in/explorer?searchText=econometrics',
    snippet: 'Time-series econometrics, input-output tables, GDP deflators, and statistical modeling for economic ministries and state directorates of economics.',
    sourceDomain: 'swayam.gov.in',
  },
  {
    title: 'Python for Statistical Computing and Data Wrangling - NPTEL',
    url: 'https://nptel.ac.in/courses/106106182',
    snippet: 'Pandas, NumPy, and Scipy for survey microdata cleaning, outlier detection, and statistical hypothesis testing in modern official data pipelines.',
    sourceDomain: 'nptel.ac.in',
  },
  {
    title: 'National Statistical System & Official Data Governance - MoSPI NSSTA',
    url: 'https://mospi.gov.in/national-statistical-systems-training-academy-nssta',
    snippet: 'Official academy handbook on Collection of Statistics Act, data confidentiality, DGCIS foreign trade metrics, and index numbers computation.',
    sourceDomain: 'mospi.gov.in',
  },

  // IT, Cybersecurity & Digital Governance
  {
    title: 'Government Cybersecurity & Information Security Awareness - MeitY / CDAC',
    url: 'https://www.infosecawareness.in',
    snippet: 'National cyber defense guidelines, CERT-In compliance protocols, vulnerability management, zero-trust architecture, and secure government digital service design.',
    sourceDomain: 'infosecawareness.in',
  },
  {
    title: 'Secure Software Development & Application Security - NPTEL',
    url: 'https://nptel.ac.in/courses/106105162',
    snippet: 'OWASP Top 10 mitigation, static and dynamic code analysis, cryptographic API integration, and DevSecOps pipelines for public sector web applications.',
    sourceDomain: 'nptel.ac.in',
  },
  {
    title: 'Cloud Infrastructure & MeghRaj Government Cloud Operations - NIC',
    url: 'https://cloud.gov.in',
    snippet: 'Architectural standards, containerized microservices, high-availability clusters, and disaster recovery on National Informatics Centre national cloud platform.',
    sourceDomain: 'cloud.gov.in',
  },

  // Finance, Accounts & Administration
  {
    title: 'Public Financial Management System (PFMS) & Treasury Operations',
    url: 'https://pfms.nic.in/training',
    snippet: 'Treasury single account operations, Direct Benefit Transfer (DBT) reconciliation, expenditure tracking, and budget utilization reporting for administrative officers.',
    sourceDomain: 'pfms.nic.in',
  },
  {
    title: 'Government e-Marketplace (GeM) Procurement Mastery - GeM Academy',
    url: 'https://gem.gov.in/training',
    snippet: 'Direct purchase, L1 price comparison, reverse auction bidding, contract creation, and consignee receipt certificate (CRAC) procedures on GeM portal.',
    sourceDomain: 'gem.gov.in',
  },

  // Multilingual & Regional Language Courses (Tamil, Hindi)
  {
    title: 'Public Administration & Office Governance in Tamil (தமிழ்) - Tamil Virtual Academy',
    url: 'https://www.tamilvu.org/courses/governance-admin-tamil',
    snippet: 'Official Tamil language administrative module covering statutory procedures, government record management, and public service delivery protocols in Tamil for state civil servants.',
    sourceDomain: 'tamilvu.org',
  },
  {
    title: 'Computer Applications & Statistical Concepts in Tamil (தமிழ்) - NPTEL / IIT Madras',
    url: 'https://nptel.ac.in/courses/tamil/106106182',
    snippet: 'Comprehensive Tamil translated course for public officials on computational data analysis, statistical indices, and survey data management in Tamil.',
    sourceDomain: 'nptel.ac.in',
  },
];

export class InstitutionalDirectorySearchProvider implements ISearchProvider {
  public readonly name = 'National Institutional Open Course Directory';

  public async search(query: string, limit: number = 6): Promise<SearchCandidate[]> {
    const queryTokens = query
      .toLowerCase()
      .replace(/["',.]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2 && !['course', 'training', 'government', 'officer'].includes(t));

    if (queryTokens.length === 0) return [];

    const scored = INSTITUTIONAL_WEB_COURSES.map(item => {
      const text = `${item.title} ${item.snippet} ${item.sourceDomain}`.toLowerCase();
      let matchCount = 0;
      for (const token of queryTokens) {
        if (text.includes(token)) {
          matchCount++;
        }
      }
      return { item, score: matchCount };
    });

    const matches = scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.item);

    return matches;
  }
}

export class DuckDuckGoSearchProvider implements ISearchProvider {
  public readonly name = 'DuckDuckGo Lite Web Search';
  private static cache: Map<string, CacheEntry> = new Map();
  private static CACHE_TTL_MS = 15 * 60 * 1000;

  private static cleanText(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static unwrapUrl(rawUrl: string): string {
    try {
      if (rawUrl.startsWith('//')) {
        rawUrl = 'https:' + rawUrl;
      }
      if (rawUrl.includes('/l/?uddg=') || rawUrl.includes('duckduckgo.com/l/?')) {
        const parsed = new URL(rawUrl, 'https://duckduckgo.com');
        const real = parsed.searchParams.get('uddg');
        if (real) return decodeURIComponent(real);
      }
      return rawUrl;
    } catch {
      return rawUrl;
    }
  }

  public async search(query: string, limit: number = 8): Promise<SearchCandidate[]> {
    const cacheKey = query.trim().toLowerCase();
    const cached = DuckDuckGoSearchProvider.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < DuckDuckGoSearchProvider.CACHE_TTL_MS)) {
      return cached.results.slice(0, limit);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const postBody = new URLSearchParams({ q: query });
      const response = await fetch('https://lite.duckduckgo.com/lite/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        body: postBody.toString(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return [];
      }

      const html = await response.text();
      // If challenged by bot modal, abort gracefully
      if (html.includes('anomaly-modal') || html.includes('bots use DuckDuckGo')) {
        return [];
      }

      const candidates = this.parseDuckDuckGoLite(html, limit);

      DuckDuckGoSearchProvider.cache.set(cacheKey, {
        timestamp: Date.now(),
        results: candidates,
      });

      return candidates;
    } catch {
      clearTimeout(timeoutId);
      return [];
    }
  }

  private parseDuckDuckGoLite(html: string, limit: number): SearchCandidate[] {
    const results: SearchCandidate[] = [];
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*class=['"]result-link['"][^>]*>([\s\S]*?)<\/a>/gi;
    const snippetRegex = /<td[^>]*class=['"]result-snippet['"][^>]*>([\s\S]*?)<\/td>/gi;

    const links: Array<{ url: string; title: string }> = [];
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(html)) !== null) {
      const rawUrl = match[1];
      const title = DuckDuckGoSearchProvider.cleanText(match[2]);
      const url = DuckDuckGoSearchProvider.unwrapUrl(rawUrl);

      if (url.startsWith('http') && !url.includes('duckduckgo.com')) {
        links.push({ url, title });
      }
    }

    const snippets: string[] = [];
    while ((match = snippetRegex.exec(html)) !== null) {
      snippets.push(DuckDuckGoSearchProvider.cleanText(match[1]));
    }

    for (let i = 0; i < links.length && results.length < limit; i++) {
      const { url, title } = links[i];
      const snippet = snippets[i] || '';

      if (!title || !url) continue;

      let domain = '';
      try {
        domain = new URL(url).hostname.replace(/^www\./, '');
      } catch {
        continue;
      }

      if (domain.includes('facebook') || domain.includes('twitter') || domain.includes('instagram') || domain.includes('pinterest')) {
        continue;
      }

      results.push({
        title,
        url,
        snippet,
        sourceDomain: domain,
      });
    }

    return results;
  }
}

/**
 * Tavily AI Web Search Provider
 * Secure, server-side only integration for live learning resource discovery.
 * Uses TAVILY_API_KEY environment variable. Never exposes or logs the key.
 */
export class TavilySearchProvider implements ISearchProvider {
  public readonly name = 'Tavily Search API';
  private static cache: Map<string, CacheEntry> = new Map();
  private static CACHE_TTL_MS = 15 * 60 * 1000;

  public async search(query: string, limit: number = 8): Promise<SearchCandidate[]> {
    const apiKey = process.env.TAVILY_API_KEY?.trim();
    if (!apiKey) {
      return [];
    }

    const cacheKey = query.trim().toLowerCase();
    const cached = TavilySearchProvider.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < TavilySearchProvider.CACHE_TTL_MS)) {
      return cached.results.slice(0, limit);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          query,
          search_depth: 'basic',
          include_answer: false,
          max_results: limit,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[TavilySearchProvider] Tavily search returned HTTP ${response.status}`);
        return [];
      }

      const json: any = await response.json();
      if (!json || !Array.isArray(json.results)) {
        return [];
      }

      const candidates: SearchCandidate[] = [];
      for (const item of json.results) {
        if (!item.url || !item.title) continue;

        let domain = '';
        try {
          const parsed = new URL(item.url);
          domain = parsed.hostname.replace(/^www\./, '').toLowerCase();
        } catch {
          continue;
        }

        // Filter out social media / non-learning domains
        const blockedDomains = [
          'facebook.com', 'twitter.com', 'x.com', 'instagram.com',
          'pinterest.com', 'tiktok.com', 'reddit.com', 'quora.com'
        ];
        if (blockedDomains.some(b => domain.includes(b))) {
          continue;
        }

        candidates.push({
          title: item.title,
          url: item.url,
          snippet: item.content || '',
          sourceDomain: domain,
        });
      }

      TavilySearchProvider.cache.set(cacheKey, {
        timestamp: Date.now(),
        results: candidates,
      });

      return candidates.slice(0, limit);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn('[TavilySearchProvider] Tavily request failed or timed out:', err.name || err.message);
      return [];
    }
  }
}

/**
 * Composite search provider:
 * 1. Tries Tavily AI web search if TAVILY_API_KEY is configured
 * 2. Falls back to DuckDuckGo lite search
 * 3. Falls back to curated National Institutional Open Course Directory
 */
export class CompositeSearchProvider implements ISearchProvider {
  public readonly name = 'Composite Web & Institutional Discovery';
  private tavily = new TavilySearchProvider();
  private ddg = new DuckDuckGoSearchProvider();
  private inst = new InstitutionalDirectorySearchProvider();

  public async search(query: string, limit: number = 8): Promise<SearchCandidate[]> {
    // 1. Try Tavily first if API key is present
    if (process.env.TAVILY_API_KEY?.trim()) {
      try {
        const tavilyResults = await this.tavily.search(query, limit);
        if (tavilyResults.length > 0) {
          return tavilyResults;
        }
      } catch {
        // Fall through safely to backup providers
      }
    }

    // 2. Try DuckDuckGo
    try {
      const ddgResults = await this.ddg.search(query, limit);
      if (ddgResults.length > 0) {
        return ddgResults;
      }
    } catch {
      // Fall through safely to backup provider
    }

    // 3. Fallback to curated Institutional Open Course Directory
    return this.inst.search(query, limit);
  }
}

