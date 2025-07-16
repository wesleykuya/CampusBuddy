
-- Add new columns to courses table
ALTER TABLE courses 
ADD COLUMN description text,
ADD COLUMN department text,
ADD COLUMN credits integer,
ADD COLUMN is_system_course boolean DEFAULT false,
ADD COLUMN is_active boolean DEFAULT true,
ADD COLUMN created_at timestamp DEFAULT now(),
ADD COLUMN updated_at timestamp DEFAULT now();

-- Make userId nullable for system courses
ALTER TABLE courses ALTER COLUMN user_id DROP NOT NULL;

-- Migrate data from system_courses to courses
INSERT INTO courses (name, code, description, department, credits, is_system_course, is_active, created_at, updated_at)
SELECT name, code, description, department, credits, true, is_active, created_at, updated_at
FROM system_courses;

-- Update any existing schedules that reference system_courses
-- Note: This requires manual intervention if there are conflicting IDs

-- Drop the system_courses table (uncomment when ready)
-- DROP TABLE system_courses;
