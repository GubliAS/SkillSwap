-- Phase 1a: Add student_level and course code columns to profiles

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS student_level INTEGER CHECK (student_level IN (100, 200, 300, 400)),
  ADD COLUMN IF NOT EXISTS courses_to_teach JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS courses_to_learn JSONB NOT NULL DEFAULT '[]'::jsonb;

-- GIN indexes for fast JSONB search on course codes
CREATE INDEX IF NOT EXISTS idx_profiles_courses_to_teach ON profiles USING GIN (courses_to_teach);
CREATE INDEX IF NOT EXISTS idx_profiles_courses_to_learn ON profiles USING GIN (courses_to_learn);
