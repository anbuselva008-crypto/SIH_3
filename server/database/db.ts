import { newDb } from 'pg-mem';
import type { Learner, Competency, AssessmentQuestion } from './models.ts';

// PostgreSQL Database Instance initialized via in-memory PostgreSQL engine
const pgInstance = newDb();

// Initialize Schema & Seed Data
export function initDatabase() {
  console.log('[Database] Initializing PostgreSQL schema...');
  
  // Create tables using standard PostgreSQL DDL
  pgInstance.public.none(`
    CREATE TABLE IF NOT EXISTS learners (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      role VARCHAR(150) NOT NULL,
      department VARCHAR(150) NOT NULL,
      email VARCHAR(150) UNIQUE,
      current_assignment VARCHAR(200),
      educational_qualification VARCHAR(200),
      years_of_experience INTEGER DEFAULT 0,
      previous_training TEXT,
      profile_completed BOOLEAN DEFAULT FALSE,
      is_demo BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS competencies (
      id SERIAL PRIMARY KEY,
      learner_id INTEGER REFERENCES learners(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
      max_score INTEGER DEFAULT 100,
      category VARCHAR(100) NOT NULL,
      benchmark_target INTEGER DEFAULT 75,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assessment_questions (
      id SERIAL PRIMARY KEY,
      competency_name VARCHAR(100) NOT NULL,
      category VARCHAR(100) NOT NULL,
      difficulty VARCHAR(50) NOT NULL,
      question_text TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_option INTEGER NOT NULL CHECK (correct_option >= 0 AND correct_option <= 3),
      explanation TEXT NOT NULL,
      concept_tag VARCHAR(100) NOT NULL,
      weight INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assessment_attempts (
      id SERIAL PRIMARY KEY,
      learner_id INTEGER REFERENCES learners(id) ON DELETE CASCADE,
      total_questions INTEGER NOT NULL,
      correct_count INTEGER NOT NULL,
      overall_score INTEGER NOT NULL,
      scores_breakdown TEXT NOT NULL,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS learning_resources (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      source VARCHAR(50) NOT NULL,
      competency VARCHAR(100) NOT NULL,
      secondary_competencies TEXT NOT NULL,
      target_roles TEXT NOT NULL,
      relevant_departments TEXT NOT NULL,
      relevant_assignments TEXT NOT NULL,
      min_recommended_score INTEGER DEFAULT 0,
      difficulty_level VARCHAR(50) NOT NULL,
      prerequisites TEXT NOT NULL,
      estimated_duration VARCHAR(100) NOT NULL,
      learning_type VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      expected_outcome TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id SERIAL PRIMARY KEY,
      learner_id INTEGER REFERENCES learners(id) ON DELETE CASCADE,
      learning_resource_id INTEGER REFERENCES learning_resources(id) ON DELETE CASCADE,
      recommendation_score INTEGER NOT NULL,
      priority VARCHAR(50) NOT NULL,
      reason TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check if data already exists
  const existingLearners = pgInstance.public.many('SELECT * FROM learners');
  if (existingLearners.length === 0) {
    console.log('[Database] Seeding initial Stage 1 & Stage 2 baseline...');
    seedBaselineData();
    seedQuestions();
    seedLearningResources();
    console.log('[Database] Seed completed successfully.');
  } else {
    // Ensure learning resources are seeded
    const resCount = pgInstance.public.many('SELECT COUNT(*) as c FROM learning_resources')[0];
    if (Number(resCount.c) === 0) {
      seedLearningResources();
    }
  }
}

export function seedBaselineData() {
  // Clear any existing competencies or learner #1 to allow reset
  pgInstance.public.none(`
    DELETE FROM assessment_attempts WHERE learner_id = 1;
    DELETE FROM competencies WHERE learner_id = 1;
    DELETE FROM learners WHERE id = 1;
  `);

  // Seed Demo Learner (Arun Kumar - Synthetic / Demo Profile)
  pgInstance.public.none(`
    INSERT INTO learners (id, name, role, department, email, current_assignment, educational_qualification, years_of_experience, previous_training, profile_completed, is_demo)
    VALUES (
      1, 
      'Arun Kumar', 
      'Statistical Officer', 
      'Survey Division', 
      'arun.kumar@mospi.gov.in',
      'Periodic Labour Force Survey (PLFS) Microdata Validation',
      'M.Sc. Statistics (Delhi University)',
      4,
      'National Statistical Systems Training Academy (NSSTA) Induction Program',
      TRUE,
      TRUE
    );
  `);

  // Seed Initial Baseline Competencies specified in requirements:
  // Statistics: 75
  // Python: 40
  // Data Analysis: 55
  // Data Visualization: 80
  pgInstance.public.none(`
    INSERT INTO competencies (learner_id, name, score, max_score, category, benchmark_target) VALUES
    (1, 'Statistics', 75, 100, 'Methodology & Theory', 75),
    (1, 'Python', 40, 100, 'Programming & Computing', 60),
    (1, 'Data Analysis', 55, 100, 'Applied Analysis', 70),
    (1, 'Data Visualization', 80, 100, 'Reporting & Dissemination', 75);
  `);
}

export function seedQuestions() {
  pgInstance.public.none('DELETE FROM assessment_questions');

  const questions = [
    // 1. Statistics (Methodology & Theory)
    {
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
    // 2. Python (Programming & Computing)
    {
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
    // 3. Data Analysis (Applied Analysis)
    {
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
    // 4. Data Visualization (Reporting & Dissemination)
    {
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
    }
  ];

  for (const q of questions) {
    pgInstance.public.none(`
      INSERT INTO assessment_questions 
      (competency_name, category, difficulty, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, concept_tag, weight)
      VALUES 
      ('${q.competency.replace(/'/g, "''")}', '${q.category.replace(/'/g, "''")}', '${q.difficulty}', 
       '${q.text.replace(/'/g, "''")}', '${q.a.replace(/'/g, "''")}', '${q.b.replace(/'/g, "''")}', 
       '${q.c.replace(/'/g, "''")}', '${q.d.replace(/'/g, "''")}', ${q.correct}, 
       '${q.explanation.replace(/'/g, "''")}', '${q.tag.replace(/'/g, "''")}', 1);
    `);
  }
}

export function seedLearningResources() {
  pgInstance.public.none('DELETE FROM recommendations; DELETE FROM learning_resources;');

  const resources = [
    {
      id: 1,
      title: 'Python for Data Analysis',
      source: 'iGOT',
      competency: 'Python',
      secondary_competencies: JSON.stringify(['Data Analysis', 'Official Statistics']),
      target_roles: JSON.stringify(['Statistical Officer', 'Senior Statistical Officer', 'Assistant Director', 'Data Processing Assistant']),
      relevant_departments: JSON.stringify(['Survey Division', 'Survey Division (NSSO)', 'National Accounts Division', 'Price Statistics Division', 'Field Operations Division']),
      relevant_assignments: JSON.stringify(['Survey Data Analysis', 'PLFS Microdata Validation', 'Microdata Processing', 'Data Cleaning', 'Sampling']),
      min_recommended_score: 0,
      difficulty_level: 'Beginner',
      prerequisites: JSON.stringify(['Basic Computer Literacy']),
      estimated_duration: '4 weeks (self-paced)',
      learning_type: 'Course',
      description: 'Comprehensive practical training on Python, Pandas, and NumPy specifically designed for official statistical personnel working with large-scale survey schedules and administrative datasets.',
      expected_outcome: 'Ability to automate data cleaning, vectorize complex transformations, and aggregate survey microdata without manual spreadsheet intervention.'
    },
    {
      id: 2,
      title: 'Data Visualization for Government Officials',
      source: 'iGOT',
      competency: 'Data Visualization',
      secondary_competencies: JSON.stringify(['Reporting & Dissemination', 'Statistics']),
      target_roles: JSON.stringify(['Statistical Officer', 'Senior Statistical Officer', 'Assistant Director', 'Deputy Director']),
      relevant_departments: JSON.stringify(['Data Storage & Dissemination Division', 'Survey Division', 'Economic Statistics Division']),
      relevant_assignments: JSON.stringify(['Statistical Dissemination', 'Report Preparation', 'PLFS Report Release', 'Survey Data Analysis']),
      min_recommended_score: 20,
      difficulty_level: 'Beginner',
      prerequisites: JSON.stringify(['Basic Statistical Foundations']),
      estimated_duration: '3 weeks (online)',
      learning_type: 'Course',
      description: 'Standardized principles of visual statistical communication, government publication chart standards, avoiding truncated axes, and creating high-impact dashboards.',
      expected_outcome: 'Design publication-ready boxplots, thematic distributions, and zero-baseline comparative charts aligned with MoSPI reporting protocols.'
    },
    {
      id: 3,
      title: 'Introduction to AI and Machine Learning',
      source: 'iGOT',
      competency: 'AI for Statistics',
      secondary_competencies: JSON.stringify(['Python', 'Data Analysis', 'Predictive Modeling']),
      target_roles: JSON.stringify(['Assistant Director', 'Deputy Director', 'Senior Statistical Officer', 'Statistical Officer']),
      relevant_departments: JSON.stringify(['Data Storage & Dissemination Division', 'National Accounts Division', 'Survey Division']),
      relevant_assignments: JSON.stringify(['Automated Data Imputation', 'Predictive Analytics', 'Big Data', 'Record Linkage']),
      min_recommended_score: 55,
      difficulty_level: 'Intermediate',
      prerequisites: JSON.stringify(['Python for Data Analysis', 'Applied Data Analysis']),
      estimated_duration: '6 weeks (hybrid)',
      learning_type: 'Course',
      description: 'Foundational concepts of machine learning, classification, clustering, and predictive modeling for public administration and national statistical infrastructure.',
      expected_outcome: 'Evaluate ML algorithms for anomaly detection in economic registers and understand AI safety/ethical guidelines in governance.'
    },
    {
      id: 4,
      title: 'Statistical Data Management',
      source: 'iGOT',
      competency: 'Data Analysis',
      secondary_competencies: JSON.stringify(['Statistics', 'Data Quality', 'Relational Databases']),
      target_roles: JSON.stringify(['Statistical Officer', 'Senior Statistical Officer', 'Data Processing Assistant']),
      relevant_departments: JSON.stringify(['Survey Division', 'Field Operations Division', 'Economic Statistics Division']),
      relevant_assignments: JSON.stringify(['Survey Data Analysis', 'Database Scrutiny', 'Data Architecture', 'Quality Audits']),
      min_recommended_score: 30,
      difficulty_level: 'Intermediate',
      prerequisites: JSON.stringify(['Official Statistics Foundations']),
      estimated_duration: '4 weeks (self-paced)',
      learning_type: 'Course',
      description: 'Database design principles, relational querying, audit trails, and data governance frameworks for national statistical repositories.',
      expected_outcome: 'Implement multi-stage data consistency validation rules and manage relational datasets across survey rounds.'
    },
    {
      id: 5,
      title: 'R Programming for Statistical Analysis',
      source: 'iGOT',
      competency: 'Python',
      secondary_competencies: JSON.stringify(['Statistics', 'Data Analysis', 'Econometrics']),
      target_roles: JSON.stringify(['Statistical Officer', 'Senior Statistical Officer', 'Assistant Director']),
      relevant_departments: JSON.stringify(['National Accounts Division', 'Price Statistics Division', 'Survey Division']),
      relevant_assignments: JSON.stringify(['Time Series Analysis', 'Econometric Modeling', 'Survey Data Analysis', 'GSDP Compilation']),
      min_recommended_score: 35,
      difficulty_level: 'Intermediate',
      prerequisites: JSON.stringify(['Descriptive Statistics', 'Basic Computing Logic']),
      estimated_duration: '5 weeks (online)',
      learning_type: 'Course',
      description: 'Computational statistical workflows in R using Tidyverse, sampling weight adjustments, survey estimation libraries, and reproducible R Markdown reporting.',
      expected_outcome: 'Build automated estimation scripts applying sample multipliers and calculating complex survey standard errors.'
    },
    {
      id: 6,
      title: 'Survey Methodology and Sampling',
      source: 'NSSTA',
      competency: 'Statistics',
      secondary_competencies: JSON.stringify(['Methodology & Theory', 'Data Analysis', 'Sampling Design']),
      target_roles: JSON.stringify(['Statistical Officer', 'Senior Statistical Officer', 'Assistant Director', 'Field Operations Officer']),
      relevant_departments: JSON.stringify(['Survey Division (NSSO)', 'Survey Division', 'Field Operations Division']),
      relevant_assignments: JSON.stringify(['Survey Data Analysis', 'Sampling Frame Preparation', 'PLFS Microdata Validation', 'Field Investigation']),
      min_recommended_score: 20,
      difficulty_level: 'Intermediate',
      prerequisites: JSON.stringify(['Probability Theory & Basic Inference']),
      estimated_duration: '2 weeks residential (NSSTA Greater Noida)',
      learning_type: 'Training Programme',
      description: 'Rigorous institutional training on multi-stage stratified sampling designs, circular systematic sampling, sampling variance estimation, and non-sampling error control.',
      expected_outcome: 'Formulate sampling stratification protocols, determine optimal sample sizes, and evaluate design effects for socio-economic surveys.'
    },
    {
      id: 7,
      title: 'Official Statistics and Data Quality',
      source: 'NSSTA',
      competency: 'Statistics',
      secondary_competencies: JSON.stringify(['Data Quality', 'Data Analysis', 'UN-FPOS Standards']),
      target_roles: JSON.stringify(['Statistical Officer', 'Senior Statistical Officer', 'Assistant Director', 'Deputy Director']),
      relevant_departments: JSON.stringify(['Survey Division', 'Economic Statistics Division', 'National Accounts Division']),
      relevant_assignments: JSON.stringify(['Microdata Validation', 'Quality Assurance', 'Survey Oversight', 'Quality Audits']),
      min_recommended_score: 30,
      difficulty_level: 'Intermediate',
      prerequisites: JSON.stringify(['NSSTA Induction Training']),
      estimated_duration: '2 weeks residential',
      learning_type: 'Training Programme',
      description: 'National Quality Assurance Framework (NQAF), United Nations Fundamental Principles of Official Statistics, microdata editing, and item-nonresponse imputation.',
      expected_outcome: 'Design robust field scrutiny checklists and apply statistical imputation standards for survey microdata releases.'
    },
    {
      id: 8,
      title: 'GIS Applications in Official Statistics',
      source: 'NSSTA',
      competency: 'Data Visualization',
      secondary_competencies: JSON.stringify(['Spatial Analysis', 'Field Operations', 'Thematic Cartography']),
      target_roles: JSON.stringify(['Statistical Officer', 'Senior Statistical Officer', 'Assistant Director']),
      relevant_departments: JSON.stringify(['Field Operations Division', 'Survey Division', 'Data Storage & Dissemination Division']),
      relevant_assignments: JSON.stringify(['GIS / Spatial Data', 'Urban Frame Survey (UFS) Mapping', 'Geospatial Frame Preparation', 'Field Operations']),
      min_recommended_score: 30,
      difficulty_level: 'Intermediate',
      prerequisites: JSON.stringify(['Data Visualization Basics']),
      estimated_duration: '3 weeks residential',
      learning_type: 'Training Programme',
      description: 'Geographic Information Systems (GIS), digital boundary demarcation, QGIS workflows, and geospatial sample frame preparation for national census and surveys.',
      expected_outcome: 'Construct geo-referenced sampling frames, generate choropleth district maps, and validate spatial boundary polygons.'
    },
    {
      id: 9,
      title: 'Statistical Computing with R',
      source: 'NSSTA',
      competency: 'Python',
      secondary_competencies: JSON.stringify(['Data Analysis', 'Statistics', 'Simulation']),
      target_roles: JSON.stringify(['Statistical Officer', 'Senior Statistical Officer', 'Assistant Director']),
      relevant_departments: JSON.stringify(['National Accounts Division', 'Price Statistics Division', 'Survey Division']),
      relevant_assignments: JSON.stringify(['Econometric Modeling', 'Survey Data Analysis', 'Index Computation', 'Macroeconomic Estimation']),
      min_recommended_score: 40,
      difficulty_level: 'Intermediate',
      prerequisites: JSON.stringify(['Basic Statistics', 'NSSTA Induction']),
      estimated_duration: '2 weeks residential',
      learning_type: 'Training Programme',
      description: 'Hands-on lab intensive on statistical programming, bootstrapping survey variances, Monte Carlo simulation, and microdata processing pipelines.',
      expected_outcome: 'Develop automated analysis scripts for national survey microdata releases with verified reproducible standards.'
    },
    {
      id: 10,
      title: 'AI Applications in Official Statistics',
      source: 'NSSTA',
      competency: 'AI for Statistics',
      secondary_competencies: JSON.stringify(['Python', 'Machine Learning', 'Natural Language Processing']),
      target_roles: JSON.stringify(['Assistant Director', 'Deputy Director', 'Senior Statistical Officer']),
      relevant_departments: JSON.stringify(['Data Storage & Dissemination Division', 'National Accounts Division', 'Survey Division']),
      relevant_assignments: JSON.stringify(['Big Data Analytics', 'Automated Industry Classification (NIC)', 'High-Frequency Indicators']),
      min_recommended_score: 60,
      difficulty_level: 'Advanced',
      prerequisites: JSON.stringify(['Python for Data Analysis', 'Applied Data Analysis', 'Survey Methodology']),
      estimated_duration: '3 weeks intensive residential',
      learning_type: 'Training Programme',
      description: 'Cutting-edge machine learning and NLP for automated industrial code mapping (NIC/NCO), satellite imagery for agricultural estimation, and synthetic data generation.',
      expected_outcome: 'Deploy machine learning classifiers for trade and survey schedules, evaluating model auditability and algorithmic fairness.'
    },
    {
      id: 11,
      title: 'Consumer Price Index (CPI) Compilation & Price Statistics',
      source: 'NSSTA',
      competency: 'Data Analysis',
      secondary_competencies: JSON.stringify(['Statistics', 'Price Indexation', 'Index Numbers']),
      target_roles: JSON.stringify(['Statistical Officer', 'Senior Statistical Officer', 'Assistant Director']),
      relevant_departments: JSON.stringify(['Price Statistics Division', 'Economic Statistics Division']),
      relevant_assignments: JSON.stringify(['Price Statistics / CPI', 'Consumer Price Index Scrutiny', 'Inflation Analysis', 'Rural/Urban Price Collection']),
      min_recommended_score: 25,
      difficulty_level: 'Intermediate',
      prerequisites: JSON.stringify(['Index Number Theory']),
      estimated_duration: '2 weeks residential',
      learning_type: 'Training Programme',
      description: 'Laspeyres price indexing, geometric mean aggregation, elementary aggregates, web scraping for price quotes, and hedonic quality adjustments.',
      expected_outcome: 'Compute monthly headline and core inflation indices, impute missing quotations, and audit price relative consistency.'
    },
    {
      id: 12,
      title: 'National Accounts & Gross State Domestic Product (GSDP) Framework',
      source: 'NSSTA',
      competency: 'Data Analysis',
      secondary_competencies: JSON.stringify(['Statistics', 'Macroeconomics', 'SNA 2008']),
      target_roles: JSON.stringify(['Assistant Director', 'Deputy Director', 'Statistical Officer', 'Senior Statistical Officer']),
      relevant_departments: JSON.stringify(['National Accounts Division', 'Economic Statistics Division']),
      relevant_assignments: JSON.stringify(['National Accounts / GDP', 'GSDP Compilation & Sectoral Value Added', 'Gross State Domestic Product (GSDP) Compilation', 'Annual Survey of Industries (ASI) Estimation']),
      min_recommended_score: 30,
      difficulty_level: 'Intermediate',
      prerequisites: JSON.stringify(['Macroeconomic Aggregates', 'Induction Program']),
      estimated_duration: '2 weeks residential',
      learning_type: 'Training Programme',
      description: 'System of National Accounts (SNA 2008), gross value added (GVA) estimation across primary/secondary/tertiary sectors, and state income accounts.',
      expected_outcome: 'Compile sector-wise GSDP estimates, apply deflators, and reconcile corporate financial data with statistical benchmarks.'
    }
  ];

  for (const r of resources) {
    pgInstance.public.none(`
      INSERT INTO learning_resources
      (id, title, source, competency, secondary_competencies, target_roles, relevant_departments, relevant_assignments, min_recommended_score, difficulty_level, prerequisites, estimated_duration, learning_type, description, expected_outcome)
      VALUES
      (${r.id}, '${r.title.replace(/'/g, "''")}', '${r.source}', '${r.competency.replace(/'/g, "''")}', 
       '${r.secondary_competencies.replace(/'/g, "''")}', '${r.target_roles.replace(/'/g, "''")}', 
       '${r.relevant_departments.replace(/'/g, "''")}', '${r.relevant_assignments.replace(/'/g, "''")}', 
       ${r.min_recommended_score}, '${r.difficulty_level}', '${r.prerequisites.replace(/'/g, "''")}', 
       '${r.estimated_duration.replace(/'/g, "''")}', '${r.learning_type.replace(/'/g, "''")}', 
       '${r.description.replace(/'/g, "''")}', '${r.expected_outcome.replace(/'/g, "''")}');
    `);
  }
}

// Query helper for executing PostgreSQL queries
export async function query<T = any>(sql: string): Promise<T[]> {
  try {
    return pgInstance.public.many(sql) as T[];
  } catch (error) {
    console.error(`[Database Error] SQL: ${sql}`, error);
    throw error;
  }
}

// Single item query helper
export async function queryOne<T = any>(sql: string): Promise<T | null> {
  try {
    const results = pgInstance.public.many(sql);
    return (results[0] as T) || null;
  } catch (error) {
    console.error(`[Database Error] SQL: ${sql}`, error);
    throw error;
  }
}

// Execute non-returning statement
export async function execute(sql: string): Promise<void> {
  try {
    pgInstance.public.none(sql);
  } catch (error) {
    console.error(`[Database Execute Error] SQL: ${sql}`, error);
    throw error;
  }
}

// Health status check
export function getDbStatus() {
  const learnerCount = pgInstance.public.many('SELECT COUNT(*) as count FROM learners')[0];
  const competencyCount = pgInstance.public.many('SELECT COUNT(*) as count FROM competencies')[0];
  const questionsCount = pgInstance.public.many('SELECT COUNT(*) as count FROM assessment_questions')[0];
  const attemptsCount = pgInstance.public.many('SELECT COUNT(*) as count FROM assessment_attempts')[0];
  return {
    engine: 'PostgreSQL (pg-mem)',
    status: 'connected',
    learners_count: Number(learnerCount.count),
    competencies_count: Number(competencyCount.count),
    questions_count: Number(questionsCount.count),
    attempts_count: Number(attemptsCount.count),
  };
}

