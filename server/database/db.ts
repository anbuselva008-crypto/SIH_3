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
  `);

  // Check if data already exists
  const existingLearners = pgInstance.public.many('SELECT * FROM learners');
  if (existingLearners.length === 0) {
    console.log('[Database] Seeding initial Stage 1 & Stage 2 baseline...');
    seedBaselineData();
    seedQuestions();
    console.log('[Database] Seed completed successfully.');
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

