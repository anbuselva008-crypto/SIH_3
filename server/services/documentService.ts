import { query, queryOne, execute } from '../database/db.ts';
import { DocumentParser, type ParsedDocument } from './documentParser.ts';
import { TextChunker, type DocumentChunk } from './textChunker.ts';
import type { LearningMaterial } from '../database/models.ts';

// In-memory document storage cache for fast chunk retrieval
const documentChunksCache = new Map<number, DocumentChunk[]>();

export class DocumentService {
  /**
   * Initializes linked prototype materials for Stage 3 courses into PostgreSQL.
   */
  public static async initializeDemoMaterials(): Promise<void> {
    const existing = await query<LearningMaterial>(
      `SELECT * FROM learning_materials WHERE source_type = 'linked_demo_resource'`
    );
    if (existing.length > 0) {
      return;
    }

    console.log('[DocumentService] Seeding Stage 4 linked prototype learning materials...');

    const demoMaterials = [
      {
        resourceId: 1, // Python for Data Analysis
        filename: 'Python_Statistical_Data_Analysis_Module_Notes.pdf',
        fileType: 'pdf',
        fileSize: 245000,
        pageCount: 6,
        text: `Official Training Material: Python for Data Analysis & Statistical Computing
National Statistical Systems Training Academy (NSSTA) & iGOT Karmayogi Prototype Notes

[Page 1: Introduction to Python for Statistical Operations]
Python is utilized across official statistical workflows to modernize data ingestion, validation, cleaning, and tabulation.
Key libraries include Pandas for structured tabular data, NumPy for high-performance array operations, and Statsmodels for econometric modeling.
The core data structure in Pandas is the DataFrame, a 2-dimensional labeled data structure with columns of potentially different types.
Unlike spreadsheet applications, Python scripts ensure 100% reproducible data transformations, essential for official national surveys and census operations.

[Page 2: Tabular Data Cleaning and Survey Wrangling]
Official survey microdata frequently contains missing values, out-of-range codes, and non-sampling discrepancies.
In Pandas, missing data is recognized as NaN (Not a Number) or None.
The dropna() function removes missing values, while fillna() allows systematic imputation using statistical measures such as mean, median, or hot-deck donor matching.
Data types must be strictly validated: categorical survey codes (e.g. NIC 2008 industrial classifications) must be mapped to categorical or string types, preventing inadvertent arithmetic on nominal identifiers.

[Page 3: Grouped Operations and Aggregation]
The split-apply-combine strategy is implemented through df.groupby().
In survey analysis, estimators must calculate stratified means, district totals, and sector aggregates.
Example: df.groupby(['State', 'Sector'])['Household_Expenditure'].agg(['mean', 'std', 'count']).
Vectorized operations in Pandas avoid slow Python loops, processing millions of survey records in fractions of a second while eliminating indexing errors.

[Page 4: Survey Weights and Multipliers]
In stratified sample surveys, every sample unit represents a known number of population units, given by the sampling weight (multiplier).
To calculate an unbiased population mean, weighted aggregations must be computed:
Weighted Mean = Sum(Weight * Value) / Sum(Weight).
Pandas allows direct weighted computations using NumPy's np.average(df['Income'], weights=df['Multiplier']).
Failing to incorporate sampling weights produces biased estimates whenever selection probabilities differ across strata.

[Page 5: Merging Administrative Data and Survey Schedules]
Administrative databases (such as GSTN, MCA21, or EPFO) must often be linked with sample survey frames.
The pd.merge() function supports inner, left, right, and outer joins based on primary keys (e.g., enterprise UIN).
Data reconciliation protocols require checking key consistency, identifying orphaned records, and computing linkage rates before statistical tabulation.

[Page 6: Automated Export and Validation Checks]
Cleaned and tabulated outputs are validated using automated assertions (e.g. verifying that sector percentages sum to 100%).
Results are exported into standardized formats including CSV, Parquet, and Excel tables formatted according to MoSPI dissemination guidelines.`,
      },
      {
        resourceId: 2, // Sample Survey Design
        filename: 'Sample_Survey_Design_and_Estimation_Handbook.pdf',
        fileType: 'pdf',
        fileSize: 312000,
        pageCount: 5,
        text: `Official Training Material: Sample Survey Design & Estimation Methodologies
National Statistical Systems Training Academy (NSSTA) Cadre Guide

[Page 1: Foundations of Probability Sampling]
In India's official statistical system, probability sampling forms the cornerstone of large-scale socio-economic surveys conducted by NSSO.
Every sampling unit in the target population must have a known, non-zero probability of selection.
Non-probability sampling (convenience or quota sampling) is unacceptable for official statistics because sampling errors cannot be mathematically evaluated.

[Page 2: Stratified Sampling and Efficiency]
Stratification involves dividing a heterogeneous population into mutually exclusive, internally homogeneous subgroups called strata.
Independent samples are then drawn from each stratum.
Stratification achieves three primary objectives:
1. Increased precision (reduced sampling variance) compared to Simple Random Sampling (SRS) of identical size.
2. Guaranteed representation of administrative subdivisions (e.g., rural and urban sectors of each district).
3. Facilitation of tailored sampling designs suited to varying sub-population characteristics.

[Page 3: Multi-Stage Cluster Sampling in NSSO]
NSS surveys universally employ a stratified multi-stage design.
First Stage Units (FSUs) are typically Census villages in rural areas and Urban Frame Survey (UFS) blocks in urban areas.
Ultimate Stage Units (USUs) are households or enterprises from which final survey data is gathered.
While clustering increases sampling variance relative to SRS due to positive intra-cluster correlation, it drastically reduces field travel costs and makes national enumeration operationally viable.

[Page 4: Multipliers and Estimation Formulas]
The design weight of a sample unit is the reciprocal of its inclusion probability: W_i = 1 / Pi_i.
In multi-stage sampling, the overall weight is the product of stage-specific multipliers: W = W_stage1 * W_stage2 * W_stage3.
Post-stratification and non-response adjustments calibrate sample weights against known external population totals (e.g. Census projections), reducing both variance and non-response bias.

[Page 5: Sampling and Non-Sampling Errors]
Total Survey Error consists of sampling error and non-sampling error.
Sampling error arises from examining a sample rather than the full census and diminishes as sample size increases.
Non-sampling errors encompass frame defects, respondent recall errors, enumerator bias, and data entry mistakes.
Unlike sampling error, non-sampling errors may increase with larger sample sizes due to diminished administrative oversight in field enumeration.`,
      },
      {
        resourceId: 3, // Data Visualization & Dashboarding
        filename: 'Data_Visualization_Standards_MoSPI.docx',
        fileType: 'docx',
        fileSize: 180000,
        pageCount: 4,
        text: `Official Training Material: Data Visualization & Dashboarding for Official Statistics
MoSPI Official Style Manual & NSSTA Practical Guide

[Section 1: Principles of Official Data Visualization]
Data graphics published by statistical agencies must adhere to strict principles of clarity, scientific integrity, accessibility, and visual economy.
Visualizations should reveal high-level macroeconomic trends, geographic distributions, and demographic disparities without distorting underlying magnitudes.
Every graphic must include:
1. Comprehensive title specifying metric, time period, and unit of measurement.
2. Source attribution citing the primary survey or administrative register.
3. Explicit notes detailing coverage, methodology revisions, or preliminary status.

[Section 2: Chart Selection Guidelines]
- Line charts: Reserved strictly for continuous temporal trends (e.g. monthly CPI inflation over a 5-year series).
- Bar charts: Suitable for discrete categorical comparisons (e.g. Labour Force Participation Rate across states).
- Choropleth maps: Ideal for thematic spatial indicators at State or District resolution, using standardized census shapefiles.
- Pie charts: Heavily discouraged for more than 4 categories due to human optical limitations in assessing angular area.

[Section 3: Color Contrast and Accessibility]
Official visualizations must remain readable when printed in monochrome grayscale.
Avoid red-green palettes that disadvantage color-blind users; adopt color-blind safe palettes (such as Viridis, ColorBrewer blue-orange schemes).
High-contrast text labels (minimum 4.5:1 ratio against background) ensure compliance with Government of India Web Accessibility Standards.

[Section 4: Interactive Dashboards for Cadre Decision Support]
Modern statistical portals utilize interactive dashboards for dynamic data exploration.
Dashboards must support drill-down capabilities from national indicators to state and district levels, clear indicator filtering, and instant raw data export for academic researchers.`,
      },
      {
        resourceId: 4, // Official Statistics System in India
        filename: 'Official_Statistics_System_in_India_Architecture.pptx',
        fileType: 'pptx',
        fileSize: 420000,
        pageCount: 5,
        text: `Official Training Material: Official Statistics System in India: Mandate, Architecture & Standards
National Statistical Systems Training Academy (NSSTA) Induction Program

[Slide 1: Constitutional and Institutional Architecture]
The Indian Official Statistical System is decentralized both laterally among central ministries and vertically between the Union and State governments.
At the apex is the Ministry of Statistics and Programme Implementation (MoSPI).
MoSPI comprises two main operational wings:
1. Central Statistics Office (CSO) - responsible for National Accounts, Consumer Price Index, and statistical standards.
2. National Sample Survey Office (NSSO) - responsible for large-scale socio-economic surveys, agricultural statistics, and industrial surveys.

[Slide 2: National Statistical Commission (NSC)]
Set up in 2005 based on the recommendations of the Rangarajan Commission.
The NSC serves as an independent apex advisory body to evolve statistical standards, oversee national survey priorities, and maintain statistical integrity.
The NSC reviews the quality, timeliness, and credibility of core statistical indicators.

[Slide 3: Legal Mandate: Collection of Statistics Act]
The Collection of Statistics Act, 2008 (and 2017 Amendment) provides the statutory authority to collect socio-economic, industrial, and demographic data.
Key provisions:
- Mandatory duty of respondents to furnish factual statistical information.
- Stringent confidentiality protections: microdata collected under the Act cannot be used as evidence for taxation, police prosecution, or legal actions against respondents.
- Severe penalties for deliberate false disclosure or unauthorized leakage by statistical officials.

[Slide 4: Key Statistical Products of MoSPI]
- National Accounts: Quarterly and Annual Gross Domestic Product (GDP) and Gross Value Added (GVA).
- Price Indices: Monthly Consumer Price Index (CPI) Rural, Urban, and Combined with 2012 base.
- Industrial Statistics: Index of Industrial Production (IIP) and Annual Survey of Industries (ASI).
- Household Surveys: Periodic Labour Force Survey (PLFS), Household Consumption Expenditure Survey (HCES).

[Slide 5: Data Quality Assurance Framework]
Statistical credibility relies on the UN Fundamental Principles of Official Statistics:
Relevance, Impartiality, Professional Standards, Sound Methodology, Confidentiality, and Transparency.
Officers must apply standardized classification codes (NIC, NCO, NPC) to ensure harmonized international comparability.`,
      },
      {
        resourceId: 11, // CPI Compilation
        filename: 'Consumer_Price_Index_Compilation_Manual.pdf',
        fileType: 'pdf',
        fileSize: 280000,
        pageCount: 4,
        text: `Official Training Material: Consumer Price Index (CPI) Compilation & Price Statistics
Price Statistics Division, MoSPI & NSSTA

[Page 1: Scope and Conceptual Framework of CPI]
The Consumer Price Index (CPI) measures changes over time in the general level of prices of goods and services that households acquire for the purpose of consumption.
MoSPI compiles CPI separately for Rural, Urban, and Combined sectors with base year 2012=100.
The basket of items and weighting diagrams are derived from the nationwide Household Consumption Expenditure Surveys (HCES) conducted by NSSO.

[Page 2: Laspeyres Price Index Formula and Modifications]
CPI employs a modified Laspeyres formula with base-period expenditure weights:
I = Sum[ W_i * (P_t,i / P_0,i) ] / Sum[ W_i ] * 100,
where W_i represents the item expenditure weight in the base period, P_t,i is the current price of item i, and P_0,i is the base period price.
At the elementary aggregate level, price relatives are aggregated using geometric means to minimize upward substitution bias.

[Page 3: Field Price Collection and Quotation Scrutiny]
Prices are gathered weekly from selected rural markets and monthly from designated urban markets by field enumerators.
Price scrutiny requires detecting outlier fluctuations exceeding +/-20% without administrative justification.
When specific branded goods become unavailable, strict replacement rules apply: comparable items are substituted with appropriate quality adjustments.

[Page 4: Core Inflation and Headline Index Dissemination]
Headline Inflation reflects the comprehensive Consumer Price Index encompassing food, fuel, clothing, housing, and miscellaneous groups.
Core Inflation excludes volatile food and fuel components, revealing underlying macroeconomic demand pressures.
Indices are released punctually on the 12th of every month under strict market embargo protocols.`,
      },
      {
        resourceId: 12, // National Accounts
        filename: 'National_Accounts_and_GSDP_Compilation_Framework.pdf',
        fileType: 'pdf',
        fileSize: 340000,
        pageCount: 4,
        text: `Official Training Material: National Accounts & Gross State Domestic Product (GSDP) Framework
National Accounts Division (NAD), MoSPI & Directorate of Economics and Statistics (DES)

[Page 1: System of National Accounts (SNA 2008) Overview]
India's national accounting framework is compliant with the internationally accepted System of National Accounts (SNA 2008).
Gross Domestic Product (GDP) represents the aggregate monetary value of all final goods and services produced within the economic territory of the country during a given accounting year.
Gross Value Added (GVA) at basic prices is calculated as:
GVA at Basic Prices = Output at Basic Prices - Intermediate Consumption.
GDP at Market Prices = GVA at Basic Prices + Product Taxes - Product Subsidies.

[Page 2: Sectoral Classification and Estimation Methods]
The economy is segregated into three major sectors:
1. Primary Sector: Agriculture, Forestry, Fishing, and Mining.
2. Secondary Sector: Manufacturing, Construction, Electricity, Gas, and Water Supply.
3. Tertiary Sector: Trade, Transport, Financial Services, Real Estate, Public Administration, and Defence.
Depending on data availability, three approaches are utilized: Production Approach, Income Approach, and Expenditure Approach.

[Page 3: Gross State Domestic Product (GSDP) Compilation]
GSDP measures the economic volume of goods and services produced within the geographic boundaries of a specific State or Union Territory.
State Directorates of Economics and Statistics (DES) compile GSDP using both supra-regional allocation methods (for railways, communications, and banking) and direct regional estimation (for state agriculture and industry).
Standardizing methodologies across States prevents double-counting and ensures alignment with national GDP aggregates.

[Page 4: Deflators and Real vs. Nominal Estimates]
Nominal GDP/GSDP reflects output valued at current market prices, including inflationary price changes.
Real GDP/GSDP is computed at constant base-year prices using implicit price deflators (IPD), measuring genuine physical volume growth.
Accurate deflator selection (WPI vs CPI vs Sector-specific price indices) is critical to avoiding under- or over-estimation of real economic expansion.`,
      },
    ];

    for (const m of demoMaterials) {
      await query(`
        INSERT INTO learning_materials
        (learning_resource_id, original_filename, file_type, file_size, storage_reference, source_type, processing_status, extracted_text_reference, page_or_section_count)
        VALUES
        (${m.resourceId}, '${m.filename}', '${m.fileType}', ${m.fileSize}, 'internal://demo/${m.filename}', 'linked_demo_resource', 'ready', '${m.text.slice(0, 500).replace(/'/g, "''")}', ${m.pageCount});
      `);

      // Retrieve inserted id
      const inserted = await queryOne<LearningMaterial>(
        `SELECT id FROM learning_materials WHERE original_filename = '${m.filename}' ORDER BY id DESC LIMIT 1`
      );
      if (inserted) {
        // Parse and cache chunks in memory
        const sections = m.text
          .split(/(?=\[Page \d+:|\[Section \d+:|\[Slide \d+:)/)
          .filter((s) => s.trim().length > 0)
          .map((s, idx) => ({
            title: s.slice(0, 50).split('\n')[0].replace(/[\[\]]/g, '').trim(),
            text: s.trim(),
            pageOrSlide: idx + 1,
          }));

        const chunks = TextChunker.chunkSections(sections);
        documentChunksCache.set(inserted.id, chunks);
      }
    }

    console.log('[DocumentService] Prototype demo learning materials successfully initialized.');
  }

  /**
   * Retrieves material by ID.
   */
  public static async getMaterialById(id: number): Promise<LearningMaterial | null> {
    return queryOne<LearningMaterial>(`SELECT * FROM learning_materials WHERE id = ${id}`);
  }

  /**
   * Retrieves the material associated with a learning resource (demo or user upload).
   */
  public static async getMaterialForResource(resourceId: number): Promise<LearningMaterial | null> {
    return queryOne<LearningMaterial>(
      `SELECT * FROM learning_materials WHERE learning_resource_id = ${resourceId} ORDER BY id DESC LIMIT 1`
    );
  }

  /**
   * Retrieves or parses chunks for a given material.
   */
  public static async getChunksForMaterial(materialId: number): Promise<DocumentChunk[]> {
    if (documentChunksCache.has(materialId)) {
      return documentChunksCache.get(materialId)!;
    }

    // Material record
    const material = await this.getMaterialById(materialId);
    if (!material) {
      throw new Error(`Learning material #${materialId} not found.`);
    }

    // If it's a demo material, reconstruct chunks from embedded text
    const demoResourceText = this.getDemoTextForResource(material.learning_resource_id || 0);
    if (demoResourceText) {
      const sections = demoResourceText
        .split(/(?=\[Page \d+:|\[Section \d+:|\[Slide \d+:)/)
        .filter((s) => s.trim().length > 0)
        .map((s, idx) => ({
          title: s.slice(0, 50).split('\n')[0].replace(/[\[\]]/g, '').trim(),
          text: s.trim(),
          pageOrSlide: idx + 1,
        }));
      const chunks = TextChunker.chunkSections(sections);
      documentChunksCache.set(materialId, chunks);
      return chunks;
    }

    // If text reference exists
    const text = material.extracted_text_reference || 'Official statistical learning guide.';
    const defaultSections = [{ title: material.original_filename, text, pageOrSlide: 1 }];
    const chunks = TextChunker.chunkSections(defaultSections);
    documentChunksCache.set(materialId, chunks);
    return chunks;
  }

  /**
   * Processes an uploaded document from the officer.
   */
  public static async processUploadedDocument(
    buffer: Buffer,
    originalFilename: string,
    mimeType: string,
    learnerId?: number,
    learningResourceId?: number
  ): Promise<{ material: LearningMaterial; parsedDoc: ParsedDocument; chunks: DocumentChunk[] }> {
    // 1. Validation: File size limit (15MB)
    const MAX_SIZE = 15 * 1024 * 1024;
    if (buffer.length > MAX_SIZE) {
      throw new Error('File size exceeds the 15MB limit. Please upload a smaller document.');
    }

    // 2. Validate format
    const ext = originalFilename.split('.').pop()?.toLowerCase() || '';
    const allowed = ['pdf', 'pptx', 'docx', 'txt'];
    if (!allowed.includes(ext)) {
      throw new Error(
        `Unsupported file type ".${ext}". Allowed learning formats: PDF, PPTX, DOCX, TXT.`
      );
    }

    // 3. Parse content
    const parsedDoc = await DocumentParser.parse(buffer, originalFilename, mimeType);

    // 4. Chunk content
    const chunks = TextChunker.chunkSections(parsedDoc.sections);

    // 5. Insert into database
    const safeFilename = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeExcerpt = parsedDoc.text.slice(0, 1000).replace(/'/g, "''");
    const lId = learnerId || 'NULL';
    const rId = learningResourceId || 'NULL';

    await execute(`
      INSERT INTO learning_materials
      (learning_resource_id, learner_id, original_filename, file_type, file_size, storage_reference, source_type, processing_status, extracted_text_reference, page_or_section_count)
      VALUES
      (${rId}, ${lId}, '${safeFilename}', '${parsedDoc.fileType}', ${buffer.length}, 'upload://${safeFilename}', 'user_upload', 'ready', '${safeExcerpt}', ${parsedDoc.pageOrSectionCount});
    `);

    const inserted = await queryOne<LearningMaterial>(
      `SELECT * FROM learning_materials WHERE original_filename = '${safeFilename}' ORDER BY id DESC LIMIT 1`
    );

    if (!inserted) {
      throw new Error('Failed to record learning material metadata in database.');
    }

    // Cache chunks in memory
    documentChunksCache.set(inserted.id, chunks);

    return {
      material: inserted,
      parsedDoc,
      chunks,
    };
  }

  private static getDemoTextForResource(resourceId: number): string | null {
    switch (resourceId) {
      case 1:
        return `Official Training Material: Python for Data Analysis & Statistical Computing
[Page 1: Introduction to Python for Statistical Operations]
Python is utilized across official statistical workflows to modernize data ingestion, validation, cleaning, and tabulation.
Key libraries include Pandas for structured tabular data, NumPy for high-performance array operations, and Statsmodels for econometric modeling.
The core data structure in Pandas is the DataFrame, a 2-dimensional labeled data structure with columns of potentially different types.
Unlike spreadsheet applications, Python scripts ensure 100% reproducible data transformations, essential for official national surveys and census operations.
[Page 2: Tabular Data Cleaning and Survey Wrangling]
Official survey microdata frequently contains missing values, out-of-range codes, and non-sampling discrepancies.
In Pandas, missing data is recognized as NaN (Not a Number) or None.
The dropna() function removes missing values, while fillna() allows systematic imputation using statistical measures such as mean, median, or hot-deck donor matching.
Data types must be strictly validated: categorical survey codes (e.g. NIC 2008 industrial classifications) must be mapped to categorical or string types.
[Page 3: Grouped Operations and Aggregation]
The split-apply-combine strategy is implemented through df.groupby().
In survey analysis, estimators must calculate stratified means, district totals, and sector aggregates.
Example: df.groupby(['State', 'Sector'])['Household_Expenditure'].agg(['mean', 'std', 'count']).
Vectorized operations in Pandas avoid slow Python loops, processing millions of survey records in fractions of a second while eliminating indexing errors.
[Page 4: Survey Weights and Multipliers]
In stratified sample surveys, every sample unit represents a known number of population units, given by the sampling weight (multiplier).
To calculate an unbiased population mean, weighted aggregations must be computed:
Weighted Mean = Sum(Weight * Value) / Sum(Weight).
Pandas allows direct weighted computations using NumPy's np.average(df['Income'], weights=df['Multiplier']).
Failing to incorporate sampling weights produces biased estimates whenever selection probabilities differ across strata.
[Page 5: Merging Administrative Data and Survey Schedules]
Administrative databases (such as GSTN, MCA21, or EPFO) must often be linked with sample survey frames.
The pd.merge() function supports inner, left, right, and outer joins based on primary keys (e.g., enterprise UIN).
Data reconciliation protocols require checking key consistency, identifying orphaned records, and computing linkage rates before statistical tabulation.
[Page 6: Automated Export and Validation Checks]
Cleaned and tabulated outputs are validated using automated assertions (e.g. verifying that sector percentages sum to 100%).
Results are exported into standardized formats including CSV, Parquet, and Excel tables formatted according to MoSPI dissemination guidelines.`;

      case 2:
        return `Official Training Material: Sample Survey Design & Estimation Methodologies
[Page 1: Foundations of Probability Sampling]
In India's official statistical system, probability sampling forms the cornerstone of large-scale socio-economic surveys conducted by NSSO.
Every sampling unit in the target population must have a known, non-zero probability of selection.
Non-probability sampling (convenience or quota sampling) is unacceptable for official statistics because sampling errors cannot be mathematically evaluated.
[Page 2: Stratified Sampling and Efficiency]
Stratification involves dividing a heterogeneous population into mutually exclusive, internally homogeneous subgroups called strata.
Independent samples are then drawn from each stratum.
Stratification achieves increased precision compared to Simple Random Sampling (SRS) of identical size, guarantees representation of administrative subdivisions, and facilitates tailored sampling designs.
[Page 3: Multi-Stage Cluster Sampling in NSSO]
NSS surveys universally employ a stratified multi-stage design.
First Stage Units (FSUs) are Census villages in rural areas and Urban Frame Survey (UFS) blocks in urban areas.
Ultimate Stage Units (USUs) are households or enterprises.
While clustering increases sampling variance relative to SRS due to positive intra-cluster correlation, it drastically reduces field travel costs and makes national enumeration operationally viable.
[Page 4: Multipliers and Estimation Formulas]
The design weight of a sample unit is the reciprocal of its inclusion probability: W_i = 1 / Pi_i.
In multi-stage sampling, the overall weight is the product of stage-specific multipliers: W = W_stage1 * W_stage2 * W_stage3.
Post-stratification and non-response adjustments calibrate sample weights against known external population totals.
[Page 5: Sampling and Non-Sampling Errors]
Total Survey Error consists of sampling error and non-sampling error.
Sampling error arises from examining a sample rather than the full census and diminishes as sample size increases.
Non-sampling errors encompass frame defects, respondent recall errors, enumerator bias, and data entry mistakes.`;

      default:
        return null;
    }
  }
}
