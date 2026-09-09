import { newDb } from 'pg-mem';
import type { Learner, Competency, AssessmentQuestion } from './models.ts';
import { JOB_FAMILIES, ROLES, FUTURE_SKILLS } from './domainPacksData.ts';
import { SEED_ASSESSMENT_QUESTIONS } from './seedQuestionsData.ts';
import { SEED_LEARNING_RESOURCES } from './seedResourcesData.ts';

// PostgreSQL Database Instance initialized via in-memory PostgreSQL engine
const pgInstance = newDb();

// Initialize Schema & Seed Data
export function initDatabase() {
  console.log('[Database] Initializing PostgreSQL schema...');
  
  // Create tables using standard PostgreSQL DDL
  pgInstance.public.none(`
    CREATE TABLE IF NOT EXISTS job_families (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      code VARCHAR(20) NOT NULL,
      description TEXT NOT NULL,
      icon VARCHAR(50) NOT NULL,
      domain_color VARCHAR(50) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS roles (
      id VARCHAR(50) PRIMARY KEY,
      job_family_id VARCHAR(50) REFERENCES job_families(id) ON DELETE CASCADE,
      name VARCHAR(150) NOT NULL,
      domain VARCHAR(150) NOT NULL,
      description TEXT NOT NULL,
      typical_departments TEXT NOT NULL,
      typical_assignments TEXT NOT NULL,
      required_competencies TEXT NOT NULL,
      future_competencies TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS future_skills (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      job_family_id VARCHAR(50) NOT NULL,
      relevant_roles TEXT NOT NULL,
      prerequisites TEXT NOT NULL,
      recommended_proficiency VARCHAR(50) NOT NULL,
      explanation TEXT NOT NULL,
      suggested_resource_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS learners (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      role VARCHAR(150) NOT NULL,
      department VARCHAR(150) NOT NULL,
      email VARCHAR(150) UNIQUE,
      job_family VARCHAR(100) DEFAULT 'Official Statistics',
      job_family_id VARCHAR(50) DEFAULT 'statistics',
      role_id VARCHAR(50) DEFAULT 'statistical-officer',
      current_assignment VARCHAR(200),
      educational_qualification VARCHAR(200),
      years_of_experience INTEGER DEFAULT 0,
      previous_training TEXT,
      language_preference VARCHAR(20) DEFAULT 'en',
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
      job_family_id VARCHAR(50) DEFAULT 'statistics',
      role_id VARCHAR(50) DEFAULT 'statistical-officer',
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

    CREATE TABLE IF NOT EXISTS learning_materials (
      id SERIAL PRIMARY KEY,
      learning_resource_id INTEGER REFERENCES learning_resources(id) ON DELETE SET NULL,
      learner_id INTEGER REFERENCES learners(id) ON DELETE CASCADE,
      original_filename VARCHAR(255) NOT NULL,
      file_type VARCHAR(50) NOT NULL,
      file_size INTEGER NOT NULL,
      storage_reference TEXT,
      source_type VARCHAR(50) NOT NULL,
      processing_status VARCHAR(50) NOT NULL,
      extracted_text_reference TEXT,
      page_or_section_count INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id SERIAL PRIMARY KEY,
      learning_material_id INTEGER REFERENCES learning_materials(id) ON DELETE CASCADE,
      learning_resource_id INTEGER REFERENCES learning_resources(id) ON DELETE SET NULL,
      learner_id INTEGER REFERENCES learners(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      competency_name VARCHAR(100) NOT NULL,
      question_count INTEGER NOT NULL,
      generation_status VARCHAR(50) NOT NULL,
      review_status VARCHAR(50) DEFAULT 'approved',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id SERIAL PRIMARY KEY,
      quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
      question_text TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_option INTEGER NOT NULL CHECK (correct_option >= 0 AND correct_option <= 3),
      explanation TEXT NOT NULL,
      competency VARCHAR(100) NOT NULL,
      difficulty VARCHAR(50) NOT NULL,
      source_reference TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id SERIAL PRIMARY KEY,
      quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
      learner_id INTEGER REFERENCES learners(id) ON DELETE CASCADE,
      total_questions INTEGER NOT NULL,
      correct_count INTEGER NOT NULL,
      score_percentage INTEGER NOT NULL,
      competency VARCHAR(100) NOT NULL,
      feedback TEXT,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quiz_answers (
      id SERIAL PRIMARY KEY,
      attempt_id INTEGER REFERENCES quiz_attempts(id) ON DELETE CASCADE,
      question_id INTEGER REFERENCES quiz_questions(id) ON DELETE CASCADE,
      selected_option INTEGER NOT NULL,
      is_correct BOOLEAN NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS resource_verifications (
      id SERIAL PRIMARY KEY,
      resource_url TEXT NOT NULL UNIQUE,
      verification_status VARCHAR(50) NOT NULL,
      verification_reason TEXT NOT NULL,
      quality_tier INTEGER DEFAULT 4,
      resource_type VARCHAR(50) DEFAULT 'COURSE',
      is_accessible BOOLEAN DEFAULT TRUE,
      has_https BOOLEAN DEFAULT TRUE,
      domain_consistent BOOLEAN DEFAULT TRUE,
      verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP
    );
  `);

  // Check if data already exists
  const existingLearners = pgInstance.public.many('SELECT * FROM learners');
  seedDomainFrameworkData();
  if (existingLearners.length === 0) {
    console.log('[Database] Seeding initial Stage 1 & Stage 2 baseline...');
    seedBaselineData();
    seedQuestions();
    seedLearningResources();
    console.log('[Database] Seed completed successfully.');
  } else {
    // Ensure learning resources and questions are seeded
    const resCount = pgInstance.public.many('SELECT COUNT(*) as c FROM learning_resources')[0];
    if (Number(resCount.c) === 0) {
      seedLearningResources();
    }
    const qCount = pgInstance.public.many('SELECT COUNT(*) as c FROM assessment_questions')[0];
    if (Number(qCount.c) === 0) {
      seedQuestions();
    }
  }

  // Seed Stage 4 linked demo learning materials
  import('../services/documentService.ts').then(({ DocumentService }) => {
    DocumentService.initializeDemoMaterials().catch((err) => {
      console.warn('[Database] Demo learning materials initialization deferred:', err);
    });
  });
}

export function seedDomainFrameworkData() {
  pgInstance.public.none('DELETE FROM future_skills; DELETE FROM roles; DELETE FROM job_families;');

  for (const jf of JOB_FAMILIES) {
    pgInstance.public.none(`
      INSERT INTO job_families (id, name, code, description, icon, domain_color)
      VALUES ('${jf.id}', '${jf.name.replace(/'/g, "''")}', '${jf.code}', '${jf.description.replace(/'/g, "''")}', '${jf.icon}', '${jf.domain_color}');
    `);
  }

  for (const r of ROLES) {
    pgInstance.public.none(`
      INSERT INTO roles (id, job_family_id, name, domain, description, typical_departments, typical_assignments, required_competencies, future_competencies)
      VALUES ('${r.id}', '${r.job_family_id}', '${r.name.replace(/'/g, "''")}', '${r.domain.replace(/'/g, "''")}', 
              '${r.description.replace(/'/g, "''")}', '${JSON.stringify(r.typical_departments).replace(/'/g, "''")}', 
              '${JSON.stringify(r.typical_assignments).replace(/'/g, "''")}', '${JSON.stringify(r.required_competencies).replace(/'/g, "''")}', 
              '${JSON.stringify(r.future_competencies).replace(/'/g, "''")}');
    `);
  }

  for (const fs of FUTURE_SKILLS) {
    pgInstance.public.none(`
      INSERT INTO future_skills (id, name, job_family_id, relevant_roles, prerequisites, recommended_proficiency, explanation, suggested_resource_id)
      VALUES ('${fs.id}', '${fs.name.replace(/'/g, "''")}', '${fs.job_family_id}', '${JSON.stringify(fs.relevant_roles).replace(/'/g, "''")}', 
              '${JSON.stringify(fs.prerequisites).replace(/'/g, "''")}', '${fs.recommended_proficiency}', 
              '${fs.explanation.replace(/'/g, "''")}', ${fs.suggested_resource_id || 'NULL'});
    `);
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
    INSERT INTO learners (id, name, role, department, email, job_family, job_family_id, role_id, current_assignment, educational_qualification, years_of_experience, previous_training, language_preference, profile_completed, is_demo)
    VALUES (
      1, 
      'Arun Kumar', 
      'Statistical Officer', 
      'Survey Division', 
      'arun.kumar@mospi.gov.in',
      'Official Statistics',
      'statistics',
      'statistical-officer',
      'Periodic Labour Force Survey (PLFS) Microdata Validation',
      'M.Sc. Statistics (Delhi University)',
      4,
      'National Statistical Systems Training Academy (NSSTA) Induction Program',
      'en',
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

  for (const q of SEED_ASSESSMENT_QUESTIONS) {
    pgInstance.public.none(`
      INSERT INTO assessment_questions 
      (job_family_id, role_id, competency_name, category, difficulty, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, concept_tag, weight)
      VALUES 
      ('${q.job_family_id}', '${q.role_id}', '${q.competency.replace(/'/g, "''")}', '${q.category.replace(/'/g, "''")}', '${q.difficulty}', 
       '${q.text.replace(/'/g, "''")}', '${q.a.replace(/'/g, "''")}', '${q.b.replace(/'/g, "''")}', 
       '${q.c.replace(/'/g, "''")}', '${q.d.replace(/'/g, "''")}', ${q.correct}, 
       '${q.explanation.replace(/'/g, "''")}', '${q.tag.replace(/'/g, "''")}', 1);
    `);
  }
}

export function seedLearningResources() {
  pgInstance.public.none('DELETE FROM recommendations; DELETE FROM learning_resources;');

  for (const r of SEED_LEARNING_RESOURCES) {
    pgInstance.public.none(`
      INSERT INTO learning_resources
      (id, title, source, competency, secondary_competencies, target_roles, relevant_departments, relevant_assignments, min_recommended_score, difficulty_level, prerequisites, estimated_duration, learning_type, description, expected_outcome)
      VALUES
      (${r.id}, '${r.title.replace(/'/g, "''")}', '${r.source}', '${r.competency.replace(/'/g, "''")}', 
       '${JSON.stringify(r.secondary_competencies).replace(/'/g, "''")}', '${JSON.stringify(r.target_roles).replace(/'/g, "''")}', 
       '${JSON.stringify(r.relevant_departments).replace(/'/g, "''")}', '${JSON.stringify(r.relevant_assignments).replace(/'/g, "''")}', 
       ${r.min_recommended_score}, '${r.difficulty_level}', '${JSON.stringify(r.prerequisites).replace(/'/g, "''")}', 
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
  let materialsCount = 0;
  let quizzesCount = 0;
  try {
    const m = pgInstance.public.many('SELECT COUNT(*) as count FROM learning_materials')[0];
    materialsCount = Number(m.count);
    const q = pgInstance.public.many('SELECT COUNT(*) as count FROM quizzes')[0];
    quizzesCount = Number(q.count);
  } catch {}

  return {
    engine: 'PostgreSQL (pg-mem)',
    status: 'connected',
    learners_count: Number(learnerCount.count),
    competencies_count: Number(competencyCount.count),
    questions_count: Number(questionsCount.count),
    attempts_count: Number(attemptsCount.count),
    materials_count: materialsCount,
    quizzes_count: quizzesCount,
  };
}

