export interface AssessmentQuestionSeed {
  job_family_id: string;
  role_id: string;
  competency: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  text: string;
  a: string;
  b: string;
  c: string;
  d: string;
  correct: number;
  explanation: string;
  tag: string;
}

export const SEED_ASSESSMENT_QUESTIONS: AssessmentQuestionSeed[] = [
  // =========================================================================
  // 1. OFFICIAL STATISTICS (Existing 8 questions)
  // =========================================================================
  {
    job_family_id: 'statistics',
    role_id: 'statistical-officer',
    competency: 'Statistics',
    category: 'Methodology & Theory',
    difficulty: 'Intermediate',
    text: 'In stratified multi-stage sampling for NSSO socio-economic surveys, what is the primary statistical rationale for stratifying primary sampling units (PSUs) prior to selection?',
    a: 'To minimize field investigation travel allowance costs only',
    b: 'To reduce sampling variance and ensure adequate representation of diverse socio-demographic strata',
    c: 'To eliminate non-sampling errors completely from field schedules',
    d: 'To discard the requirement of applying multiplier survey weights',
    correct: 1,
    explanation: 'Stratification groups homogeneous units together, which significantly reduces the within-stratum sampling variance and guarantees precision across subpopulations.',
    tag: 'Sampling Design & Stratification'
  },
  {
    job_family_id: 'statistics',
    role_id: 'statistical-officer',
    competency: 'Statistics',
    category: 'Methodology & Theory',
    difficulty: 'Advanced',
    text: 'In official survey operations, how does a Non-Sampling Error primarily differ from a Sampling Error?',
    a: 'Non-sampling error shrinks to zero automatically as the sample fraction increases',
    b: 'Sampling error arises only from manual arithmetic mistakes during data entry',
    c: 'Non-sampling error can arise from non-response, reporting bias, and coding flaws, and occurs in both sample surveys and complete censuses',
    d: 'Sampling error is present exclusively in complete population censuses',
    correct: 2,
    explanation: 'Non-sampling errors stem from operational, coverage, measurement, and processing issues that affect both sample surveys and complete censuses alike.',
    tag: 'Survey Quality & Error Classification'
  },
  {
    job_family_id: 'statistics',
    role_id: 'statistical-officer',
    competency: 'Python',
    category: 'Programming & Computing',
    difficulty: 'Intermediate',
    text: 'When processing large microdata sets in Python (e.g. Annual Survey of Industries), which methodology achieves maximum performance over row-wise Python `for` loop iterations?',
    a: 'Iterating with `for index, row in df.iterrows()` with nested loops',
    b: 'Vectorized operations or NumPy/Pandas array-level broadcast expressions implemented in C',
    c: 'Parsing columns into individual native Python string objects',
    d: 'Serializing each row to disk using file open/write loops',
    correct: 1,
    explanation: 'Vectorized Pandas operations avoid Python interpreter overhead by utilizing pre-compiled C/Fortran SIMD instructions across entire memory blocks.',
    tag: 'Vectorized Data Processing'
  },
  {
    job_family_id: 'statistics',
    role_id: 'statistical-officer',
    competency: 'Python',
    category: 'Programming & Computing',
    difficulty: 'Beginner',
    text: 'When preparing survey variables in Pandas, which code snippet properly imputes missing values in column `income` with its group-specific median by `state`?',
    a: '`df[\'income\'].fillna(df[\'income\'].mean())`',
    b: '`df[\'income\'] = df.groupby(\'state\')[\'income\'].transform(lambda x: x.fillna(x.median()))`',
    c: '`df.dropna(subset=[\'income\'])`',
    d: '`df[\'income\'].replace(None, 0)`',
    correct: 1,
    explanation: '`df.groupby(\'state\')[\'income\'].transform(...)` aligns group-specific statistics (median) back to the original index without changing DataFrame row cardinality.',
    tag: 'Missing Data Imputation in Pandas'
  },
  {
    job_family_id: 'statistics',
    role_id: 'statistical-officer',
    competency: 'Data Analysis',
    category: 'Applied Analysis',
    difficulty: 'Intermediate',
    text: 'In compiling the Consumer Price Index (CPI) for official inflation monitoring, which index structure utilizes fixed base-period expenditure weights?',
    a: 'Paasche Price Index',
    b: 'Laspeyres Price Index',
    c: 'Fisher Ideal Index',
    d: 'Tornqvist Exponential Index',
    correct: 1,
    explanation: 'The Laspeyres Price Index evaluates price changes using base-period fixed quantity/expenditure shares as weighting coefficients.',
    tag: 'Index Numbers & Price Statistics'
  },
  {
    job_family_id: 'statistics',
    role_id: 'statistical-officer',
    competency: 'Data Analysis',
    category: 'Applied Analysis',
    difficulty: 'Intermediate',
    text: 'Under the standard Interquartile Range (IQR) exploratory analysis technique, which threshold defines an extreme data outlier in reported household consumption?',
    a: 'Values strictly within 1 standard deviation from the sample mean',
    b: 'Values falling below Q1 - 1.5*IQR or exceeding Q3 + 1.5*IQR',
    c: 'Any value that exceeds the 50th percentile median',
    d: 'Any response with a zero value in binary indicator variables',
    correct: 1,
    explanation: 'The Tukey fence defines potential outliers as data points located outside the interval [Q1 - 1.5*IQR, Q3 + 1.5*IQR].',
    tag: 'Outlier Detection & Data Cleansing'
  },
  {
    job_family_id: 'statistics',
    role_id: 'statistical-officer',
    competency: 'Data Visualization',
    category: 'Reporting & Dissemination',
    difficulty: 'Intermediate',
    text: 'When communicating skewed wage or income distribution across informal workers from PLFS reports, which visualization layout is most statistically rigorous?',
    a: 'Exploded 3D Pie Chart',
    b: 'Box-and-Whisker Plot or Kernel Density Violin Plot displaying quartiles and spread',
    c: 'Donut Chart with decorative gauge rings',
    d: 'Stacked area chart without normalized percentages',
    correct: 1,
    explanation: 'Boxplots and Violin plots explicitly present median, interquartile range, skewness, and extreme values without distortion.',
    tag: 'Statistical Charting Standards'
  },
  {
    job_family_id: 'statistics',
    role_id: 'statistical-officer',
    competency: 'Data Visualization',
    category: 'Reporting & Dissemination',
    difficulty: 'Beginner',
    text: 'Why do official national statistical dissemination standards strictly discourage truncating the baseline (non-zero Y-axis) on bar charts showing comparative counts?',
    a: 'Non-zero baselines require higher display resolution to render',
    b: 'Truncating the baseline distorts the visual area ratio of bars, exaggerating trivial differences between statistical entities',
    c: 'Bar charts cannot mathematically be calculated without negative numbers',
    d: 'It breaks compatibility with black-and-white printing presses',
    correct: 1,
    explanation: 'In bar charts, visual height and area correspond directly to magnitude. Truncating the baseline misleads viewers into perceiving disproportionate variance.',
    tag: 'Visualization Ethics & Integrity'
  },

  // =========================================================================
  // 2. ENGINEERING & PUBLIC WORKS (Civil Engineer)
  // =========================================================================
  {
    job_family_id: 'engineering',
    role_id: 'civil-engineer',
    competency: 'Project Management',
    category: 'Project Execution & Scheduling',
    difficulty: 'Intermediate',
    text: 'In public infrastructure highway construction, when calculating the Critical Path Method (CPM), what is the total float of an activity on the critical path?',
    a: 'Greater than 30 days buffer',
    b: 'Zero, because any delay on a critical path activity causes a direct day-for-day project completion delay',
    c: 'Equal to half the duration of the preceding foundation activity',
    d: 'Unlimited, as long as financial milestones are verified by the executive engineer',
    correct: 1,
    explanation: 'Activities on the critical path have zero total float. Any delay in critical activities extends the overall completion deadline of the project under public works guidelines.',
    tag: 'CPM Scheduling & Float Analysis'
  },
  {
    job_family_id: 'engineering',
    role_id: 'civil-engineer',
    competency: 'Contract Management',
    category: 'Legal & Public Works Contracts',
    difficulty: 'Intermediate',
    text: 'Under CPWD Works Manual and standard EPC public procurement contracts, under what condition can Liquidated Damages (LD) be legally levied on a construction agency?',
    a: 'Whenever the engineer dislikes the brand of scaffolding used on site',
    b: 'When delay in project completion occurs solely due to contractor default without justified extension of time granted',
    c: 'Automatically at 20% on the day of initial tender opening',
    d: 'Only if the arbitration tribunal dissolves the contract completely',
    correct: 1,
    explanation: 'Liquidated damages are pre-estimated compensations levied for unexcused project delays caused by the contractor, subject to the contractual ceiling (usually 10% of contract value).',
    tag: 'Liquidated Damages & Time Extensions'
  },
  {
    job_family_id: 'engineering',
    role_id: 'civil-engineer',
    competency: 'Cost Estimation',
    category: 'Financial & Schedule of Rates',
    difficulty: 'Intermediate',
    text: 'In formulating a Detailed Project Report (DPR) estimate using the Delhi Schedule of Rates (DSR), why must the "Lead and Lift" factor be separately analyzed for earthwork and aggregates?',
    a: 'To calculate the vehicle registration taxes in neighboring states',
    b: 'Because carriage costs vary significantly based on distance from authorized borrow pits/quarries and vertical elevation handling',
    c: 'Lead and lift are only applicable to electrical fixtures',
    d: 'To circumvent the need for administrative financial sanction',
    correct: 1,
    explanation: 'Carriage (lead) and vertical hauling (lift) depend on site geography and approved quarry distances, requiring specific rate analysis beyond basic schedule base rates.',
    tag: 'Rate Analysis & Lead/Lift Calculation'
  },
  {
    job_family_id: 'engineering',
    role_id: 'civil-engineer',
    competency: 'Quality Assurance',
    category: 'Material Testing & Structural Standards',
    difficulty: 'Advanced',
    text: 'As per Indian Standard IS 456 for structural concrete quality control, how many specimen cubes constitute a single test sample for 28-day compressive strength verification?',
    a: '1 solitary cube test',
    b: '3 test cubes, whose average represents the sample strength, provided individual variations are within ±15% of the average',
    c: '10 cubes regardless of pouring volume',
    d: 'Cubes are not required if digital slump testing was documented',
    correct: 1,
    explanation: 'IS 456 mandates that three test specimens cast from the same concrete batch be tested at 28 days, with individual variations not exceeding ±15% of the three-cube average.',
    tag: 'IS 456 Concrete Compressive Strength'
  },
  {
    job_family_id: 'engineering',
    role_id: 'civil-engineer',
    competency: 'Safety & Compliance',
    category: 'Site Safety & Environmental Compliance',
    difficulty: 'Beginner',
    text: 'Under National Building Code (NBC) Part 7 construction safety provisions, which precaution is mandatory for deep trench excavations exceeding 1.5 metres in depth?',
    a: 'No safety precautions are required if soil is clayey',
    b: 'Adequate timber shoring or sloping/benching of sides and safe access ladders within every 7.5 metres',
    c: 'Covering the trench with thin tarpaulin sheets without barricading',
    d: 'Allowing heavy excavator movement right on the edge of un-shored trenches',
    correct: 1,
    explanation: 'NBC Part 7 mandates shoring or step-sloping for deep excavations over 1.5m to prevent catastrophic soil collapse, along with rapid ladder egress routes.',
    tag: 'NBC Construction Site Safety'
  },

  // =========================================================================
  // 3. HEALTH & FAMILY WELFARE (Medical Officer)
  // =========================================================================
  {
    job_family_id: 'health',
    role_id: 'medical-officer',
    competency: 'Public Health',
    category: 'Community Medicine & Disease Prevention',
    difficulty: 'Intermediate',
    text: 'In national immunization cold chain monitoring for polio and measles vaccines, what does a Stage 3 or 4 color change on a Vaccine Vial Monitor (VVM) indicate to the Medical Officer?',
    a: 'The vaccine is at peak potency and must be diluted immediately',
    b: 'The inner square has matched or become darker than the outer circle, indicating cumulative heat exposure, and the vaccine MUST NOT be used',
    c: 'The vaccine has frozen and should be thawed at 37°C',
    d: 'The vaccine vial has expired its packaging date only',
    correct: 1,
    explanation: 'A VVM indicates cumulative heat exposure. When the inner square matches or is darker than the outer reference ring (Stage 3 or 4), the vaccine must be discarded.',
    tag: 'Vaccine Cold Chain & VVM Protocols'
  },
  {
    job_family_id: 'health',
    role_id: 'medical-officer',
    competency: 'Health Programme Management',
    category: 'National Health Missions & Resource Planning',
    difficulty: 'Intermediate',
    text: 'Under National Health Mission (NHM) guidelines, how should Untied Funds allocated to Primary Health Centres (PHCs) and Rogi Kalyan Samitis (RKS) be properly utilized?',
    a: 'For personal medical allowances of the doctor in charge',
    b: 'For urgent local facility improvements, emergency medicines, patient amenities, and minor infection control maintenance with RKS committee approval',
    c: 'Untied funds can only be returned to the treasury unspent at year end',
    d: 'Exclusively for purchasing high-end diagnostic MRI equipment',
    correct: 1,
    explanation: 'NHM Untied Funds provide decentralized financial flexibility for urgent facility maintenance, cleanliness, minor equipment repairs, and immediate patient welfare.',
    tag: 'NHM Untied Grants & RKS Guidelines'
  },
  {
    job_family_id: 'health',
    role_id: 'medical-officer',
    competency: 'Clinical Governance',
    category: 'Medical Standards & Patient Safety',
    difficulty: 'Intermediate',
    text: 'Under the Bio-Medical Waste Management Rules 2016, in which color-coded container must contaminated anatomical waste and soiled cotton swabs be discarded?',
    a: 'Blue cardboard boxes with puncture-proof lining',
    b: 'Yellow non-chlorinated plastic bags for incineration or deep burial',
    c: 'Red plastic bags for autoclaving and recycling',
    d: 'Standard green municipal waste bins',
    correct: 1,
    explanation: 'Yellow non-chlorinated bags are strictly designated for human anatomical waste, soiled dressings, cotton swabs, and expired medicines intended for incineration.',
    tag: 'Biomedical Waste Segregation'
  },
  {
    job_family_id: 'health',
    role_id: 'medical-officer',
    competency: 'Health Data Management',
    category: 'Health Information Systems & Surveillance',
    difficulty: 'Intermediate',
    text: 'In the Integrated Health Information Platform (IHIP) for disease surveillance, what is the key operational difference between "S" (Suspect) and "L" (Laboratory) reporting forms?',
    a: 'S forms are filled by surgeons only; L forms by municipal leaders',
    b: 'S forms log syndromic/presumptive clinical cases reported by ANMs/medical officers; L forms log confirmed pathogen laboratory test results',
    c: 'S forms are confidential and never forwarded to state surveillance units',
    d: 'L forms are only used during global pandemics',
    correct: 1,
    explanation: 'IHIP syndromic (S) reporting provides early warning from field clinical presentation, while laboratory (L) reporting confirms biological etiology for targeted outbreak response.',
    tag: 'IHIP Surveillance & HMIS Indicators'
  },

  // =========================================================================
  // 4. FINANCE & ACCOUNTS (Finance Officer)
  // =========================================================================
  {
    job_family_id: 'finance',
    role_id: 'finance-officer',
    competency: 'Public Financial Management',
    category: 'Fiscal Governance & PFMS',
    difficulty: 'Intermediate',
    text: 'Under the revised Single Nodal Agency (SNA) framework in PFMS for Centrally Sponsored Schemes (CSS), how are central grant funds released to implementing agencies?',
    a: 'Funds are transferred to commercial fixed deposits across thousands of sub-district bank accounts',
    b: 'Funds flow through a single dedicated SNA bank account with zero-balance subsidiary accounts ensuring Just-in-Time release and real-time expenditure visibility',
    c: 'Funds are distributed in cash through treasury currency chests',
    d: 'Funds can be parked indefinitely without state matching share contribution',
    correct: 1,
    explanation: 'The SNA model eliminates idle parking of central scheme funds by maintaining a single state nodal account with child zero-balance accounts that draw funds on demand.',
    tag: 'PFMS Single Nodal Agency (SNA) Model'
  },
  {
    job_family_id: 'finance',
    role_id: 'finance-officer',
    competency: 'Budgeting',
    category: 'Appropriation & Estimates',
    difficulty: 'Advanced',
    text: 'Under General Financial Rules (GFR) 2017, what is the statutory restriction regarding "Re-appropriation" of government budgetary funds by a department?',
    a: 'Re-appropriation can be done freely from capital outlay to revenue heads without sanction',
    b: 'Re-appropriation is strictly prohibited between voted and charged items, and funds cannot be re-appropriated to meet expenditure on a "New Service" not sanctioned by Parliament',
    c: 'Funds can be transferred to external private trusts without audit scrutiny',
    d: 'Re-appropriation requires unanimous vote by all district collectors',
    correct: 1,
    explanation: 'GFR rules prohibit re-appropriating funds between voted and charged expenditure, or from capital to revenue, or toward any "New Service" without parliamentary approval.',
    tag: 'Budget Appropriation & Re-appropriation'
  },
  {
    job_family_id: 'finance',
    role_id: 'finance-officer',
    competency: 'Government Accounting',
    category: 'Treasury Accounting & Standards',
    difficulty: 'Intermediate',
    text: 'When preparing monthly civil accounts, what is the primary accounting purpose of a "Treasury Suspense Head"?',
    a: 'To write off fraudulent payments permanently',
    b: 'To temporarily park transactions that cannot be allocated immediately to the final receipt or expenditure head pending verification',
    c: 'To store surplus government revenue before dividend distribution',
    d: 'To bypass reconciliation with the Reserve Bank of India (RBI)',
    correct: 1,
    explanation: 'Suspense heads record debits or credits temporarily until the final accounting classification or supporting voucher is identified and cleared.',
    tag: 'Treasury Suspense Head Reconciliation'
  },
  {
    job_family_id: 'finance',
    role_id: 'finance-officer',
    competency: 'Audit',
    category: 'Statutory & Compliance Scrutiny',
    difficulty: 'Intermediate',
    text: 'In Comptroller and Auditor General of India (C&AG) auditing, how does a "Performance Audit" differ fundamentally from a "Compliance / Financial Audit"?',
    a: 'Performance audit focuses only on verifying the arithmetic addition of cash vouchers',
    b: 'Performance audit assesses whether the program achieved its intended objectives with the 3 Es: Economy, Efficiency, and Effectiveness',
    c: 'Compliance audit checks future predictive artificial intelligence models',
    d: 'Performance audit is conducted solely by internal departmental accountants',
    correct: 1,
    explanation: 'Performance audits evaluate whether government programs operate with economy, efficiency, and effectiveness, while compliance audits verify conformity with rules and authorities.',
    tag: 'C&AG Performance vs Compliance Audit'
  },
  {
    job_family_id: 'finance',
    role_id: 'finance-officer',
    competency: 'Financial Rules',
    category: 'GFR 2017 & Procurement Norms',
    difficulty: 'Intermediate',
    text: 'Under Rule 149 of General Financial Rules (GFR) 2017 and GeM guidelines, what is the procurement mandate for goods and services available on the Government e-Marketplace (GeM)?',
    a: 'GeM procurement is optional and discouraged for central ministries',
    b: 'Procurement through GeM is mandatory for all items available on the portal, adhering to threshold limits for direct purchase, L1 comparison, and reverse auction',
    c: 'Ministries must bypass GeM for all purchases exceeding ₹25,000',
    d: 'Only imported goods may be purchased through GeM',
    correct: 1,
    explanation: 'Rule 149 of GFR 2017 makes it mandatory for all central government ministries and departments to procure goods and services available on GeM.',
    tag: 'GFR Rule 149 & GeM Mandatory Use'
  },

  // =========================================================================
  // 5. INFORMATION TECHNOLOGY & DIGITAL GOVERNANCE (IT Officer)
  // =========================================================================
  {
    job_family_id: 'it',
    role_id: 'it-officer',
    competency: 'Cybersecurity',
    category: 'Security Audits & Vulnerability Assessment',
    difficulty: 'Advanced',
    text: 'Under the mandatory CERT-In cybersecurity directions issued under IT Act Section 70B, within what timeframe must government departments report confirmed cyber incidents (e.g. ransomware, data breach)?',
    a: 'Within 30 working days after internal review',
    b: 'Within 6 hours of noticing the incident or being brought to notice',
    c: 'Only during the annual fiscal audit review',
    d: 'Cyber incidents are never required to be reported to CERT-In',
    correct: 1,
    explanation: 'CERT-In directives mandate all government entities and service providers to report specified cybersecurity incidents within 6 hours of discovery.',
    tag: 'CERT-In 6-Hour Incident Reporting'
  },
  {
    job_family_id: 'it',
    role_id: 'it-officer',
    competency: 'Software Engineering',
    category: 'Application Architecture & APIs',
    difficulty: 'Intermediate',
    text: 'When integrating government citizen services with national registries (like DigiLocker or e-Pramaan), why is the OAuth 2.0 Authorization Code Flow with PKCE preferred over basic authentication?',
    a: 'It requires zero digital certificate encryption',
    b: 'It avoids storing citizen passwords in the client application, provides scoped short-lived access tokens, and prevents authorization code interception',
    c: 'It runs without an active internet connection',
    d: 'It allows unrestricted root access to the entire server filesystem',
    correct: 1,
    explanation: 'OAuth2 with PKCE ensures delegated authorization without exposing credentials, exchanging short-lived signed tokens and preventing code interception attacks.',
    tag: 'Secure API Standards & OAuth2 PKCE'
  },
  {
    job_family_id: 'it',
    role_id: 'it-officer',
    competency: 'Cloud',
    category: 'Government Cloud & Containerization',
    difficulty: 'Intermediate',
    text: 'In the Government of India MeghRaj Cloud adoption policy, what is the Recovery Point Objective (RPO) designed to measure in disaster recovery planning?',
    a: 'The time taken to reboot the physical server rack',
    b: 'The maximum acceptable age of data that can be lost when a disaster disrupts cloud services',
    c: 'The total financial salary paid to database engineers',
    d: 'The network bandwidth between state capitals',
    correct: 1,
    explanation: 'RPO defines the maximum tolerable data loss measured in time backward from the moment of disruption to the most recent recoverable data snapshot.',
    tag: 'MeghRaj Cloud & DR RPO/RTO Metrics'
  },
  {
    job_family_id: 'it',
    role_id: 'it-officer',
    competency: 'Data Engineering',
    category: 'Database Management & ETL',
    difficulty: 'Advanced',
    text: 'When architecting a high-volume citizen entitlement registry (e.g. 50 crore records), which indexing strategy prevents full-table sequential scans on composite queries like `(state_code, status, updated_at)`?',
    a: 'Removing all indexes to save storage space',
    b: 'Creating a composite B-Tree index with the leading column matching the most selective filtering predicate',
    c: 'Storing the entire database in an unformatted plaintext file',
    d: 'Running queries only during midnight maintenance windows',
    correct: 1,
    explanation: 'Composite B-Tree indexes satisfy multi-column query filters efficiently when the leading index columns match the search predicates, avoiding costly full table scans.',
    tag: 'Relational Indexing & Query Optimization'
  },
  {
    job_family_id: 'it',
    role_id: 'it-officer',
    competency: 'Digital Governance',
    category: 'e-Governance Frameworks & Standards',
    difficulty: 'Intermediate',
    text: 'What is the primary architectural mandate of the India Enterprise Architecture (IndEA) 2.0 framework for government digital services?',
    a: 'Building closed, siloed proprietary applications for every individual department',
    b: 'Adopting a "Federated Architecture" with Open APIs, reusable digital public infrastructure, and interoperable citizen registries',
    c: 'Eliminating all digital identity authentication',
    d: 'Requiring paper copies for every electronic form submission',
    correct: 1,
    explanation: 'IndEA 2.0 mandates federated, interoperable microservices using open APIs and standardized digital public goods to prevent departmental data silos.',
    tag: 'IndEA 2.0 & Digital Public Goods'
  },

  // =========================================================================
  // 6. PUBLIC ADMINISTRATION (Administrative Officer / General Cadre)
  // =========================================================================
  {
    job_family_id: 'administration',
    role_id: 'administrative-officer',
    competency: 'Public Administration',
    category: 'CSMOP & Government Operations',
    difficulty: 'Intermediate',
    text: 'Under the Central Secretariat Manual of Office Procedure (CSMOP), what is the proper administrative practice when recording an official "Note" on a file?',
    a: 'Using emotional adjectives and unverified personal opinions',
    b: 'Stating the problem concisely, summarizing relevant rules/precedents, analyzing implications, and framing clear actionable recommendations',
    c: 'Refusing to sign or date the note to preserve anonymity',
    d: 'Destroying previous notes that had conflicting opinions',
    correct: 1,
    explanation: 'CSMOP mandates objective, factual, concise notes that state relevant rules and precedents, analyze the situation objectively, and frame clear recommendations.',
    tag: 'CSMOP Noting & Drafting Standards'
  },
  {
    job_family_id: 'administration',
    role_id: 'administrative-officer',
    competency: 'Procurement',
    category: 'GeM & Public Tendering',
    difficulty: 'Intermediate',
    text: 'When floating a custom bid for goods on the Government e-Marketplace (GeM), which practice is strictly forbidden to ensure fair competition?',
    a: 'Specifying functional technical specifications and performance benchmarks',
    b: 'Tailoring specifications to suit a single preferred vendor or citing specific proprietary brand names without PAC approval',
    c: 'Setting clear delivery timelines and destination locations',
    d: 'Requiring valid GST and PAN registrations from bidders',
    correct: 1,
    explanation: 'Public procurement rules forbid restrictive specifications that favor a specific vendor or brand unless an authorized Proprietary Article Certificate (PAC) is approved.',
    tag: 'Transparent GeM Procurement Norms'
  },
  {
    job_family_id: 'administration',
    role_id: 'administrative-officer',
    competency: 'Citizen Service',
    category: 'Grievance Redressal & Sevottam',
    difficulty: 'Intermediate',
    text: 'Under the Department of Administrative Reforms and Public Grievances (DARPG) guidelines for CPGRAMS, what is the maximum time limit for resolving public grievances?',
    a: '1 year from submission',
    b: 'Within 21 to 30 days, with reasoned, speaking replies provided to the citizen',
    c: 'Grievances can be closed arbitrarily without informing the citizen',
    d: 'Only after the citizen appears in person at the capital',
    correct: 1,
    explanation: 'DARPG guidelines mandate resolution of CPGRAMS grievances within 21–30 days with a clear, reasoned reply addressing each grievance issue raised.',
    tag: 'CPGRAMS Redressal Timelines & Standards'
  },
  {
    job_family_id: 'administration',
    role_id: 'administrative-officer',
    competency: 'Office Procedures',
    category: 'e-Office & Records Management',
    difficulty: 'Beginner',
    text: 'In the national e-Office digital file management system, what happens when an electronic file is "Sent" to another officer?',
    a: 'The sending officer retains full write access to continue editing simultaneously',
    b: 'An immutable digital audit trail timestamp is logged, and the file moves securely to the recipient’s inbox with editing lock',
    c: 'The file is converted into an untracked email attachment',
    d: 'Previous versions of file documents are permanently purged',
    correct: 1,
    explanation: 'e-Office maintains a tamper-proof digital audit log recording sender, receiver, timestamp, and IP address, ensuring absolute administrative accountability.',
    tag: 'e-Office Audit Trail & Movement Controls'
  }
];
