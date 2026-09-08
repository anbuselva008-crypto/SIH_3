-- ==========================================================
-- Official Statistical System Competency Platform
-- Stage 1 & Stage 2 Database Schema (PostgreSQL)
-- ==========================================================

-- 1. Learners Table (Stage 1 & Stage 1.5)
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Competencies Table
CREATE TABLE IF NOT EXISTS competencies (
  id SERIAL PRIMARY KEY,
  learner_id INTEGER NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  max_score INTEGER DEFAULT 100,
  category VARCHAR(100) NOT NULL,
  benchmark_target INTEGER DEFAULT 75,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Assessment Questions Table (Stage 2)
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Assessment Attempts Log Table (Stage 2)
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id SERIAL PRIMARY KEY,
  learner_id INTEGER NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  total_questions INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  overall_score INTEGER NOT NULL,
  scores_breakdown TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Learning Resources Catalogue (Stage 3 - iGOT & NSSTA)
CREATE TABLE IF NOT EXISTS learning_resources (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'iGOT' | 'NSSTA'
  competency VARCHAR(100) NOT NULL,
  secondary_competencies TEXT NOT NULL,
  target_roles TEXT NOT NULL,
  relevant_departments TEXT NOT NULL,
  relevant_assignments TEXT NOT NULL,
  min_recommended_score INTEGER DEFAULT 0,
  difficulty_level VARCHAR(50) NOT NULL,
  prerequisites TEXT NOT NULL,
  estimated_duration VARCHAR(100) NOT NULL,
  learning_type VARCHAR(100) NOT NULL, -- 'Course' | 'Training Programme'
  description TEXT NOT NULL,
  expected_outcome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Personalized Recommendations (Stage 3)
CREATE TABLE IF NOT EXISTS recommendations (
  id SERIAL PRIMARY KEY,
  learner_id INTEGER NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  learning_resource_id INTEGER NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
  recommendation_score INTEGER NOT NULL,
  priority VARCHAR(50) NOT NULL, -- 'HIGH PRIORITY' | 'RECOMMENDED NEXT' | 'OPTIONAL / FUTURE'
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_competencies_learner_id ON competencies(learner_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_comp ON assessment_questions(competency_name);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_learner ON assessment_attempts(learner_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_learner ON recommendations(learner_id);
CREATE INDEX IF NOT EXISTS idx_learning_resources_competency ON learning_resources(competency);

-- Baseline Seed Data
INSERT INTO learners (id, name, role, department, email)
VALUES (1, 'Arun Kumar', 'Statistical Officer', 'Survey Division', 'arun.kumar@mospi.gov.in')
ON CONFLICT (id) DO NOTHING;

INSERT INTO competencies (learner_id, name, score, max_score, category, benchmark_target) VALUES
(1, 'Statistics', 75, 100, 'Methodology & Theory', 75),
(1, 'Python', 40, 100, 'Programming & Computing', 60),
(1, 'Data Analysis', 55, 100, 'Applied Analysis', 70),
(1, 'Data Visualization', 80, 100, 'Reporting & Dissemination', 75);

