-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. Programs Table (New)
CREATE TABLE public.programs (
  id TEXT PRIMARY KEY, -- e.g., 'CS-2024', 'LAW-2025'
  name TEXT NOT NULL,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Protect programs table
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read programs" ON public.programs FOR SELECT TO authenticated, anon USING (true);

-- Seed some initial programs (Optional, can be done via Dashboard)
INSERT INTO public.programs (id, name, department) VALUES 
('CS-2028', 'Computer Science 2028', 'Science'),
('SE-2028', 'Software Engineering 2028', 'Engineering')
ON CONFLICT (id) DO NOTHING;

-- 1. Users Table (Extends Supabase Auth)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  cohort_year INTEGER,
  program_id TEXT REFERENCES public.programs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Protect users table with RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles" 
ON public.users FOR SELECT 
TO authenticated, anon 
USING (true);

CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
TO authenticated, anon 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.users FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Trigger to automatically create a user profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Assignments Table (The Core Engine)
CREATE TYPE assignment_status AS ENUM ('pending', 'verified');

CREATE TABLE public.assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  difficulty_score INTEGER DEFAULT 5 CHECK (difficulty_score >= 1 AND difficulty_score <= 10),
  status assignment_status DEFAULT 'pending',
  program_id TEXT REFERENCES public.programs(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Protect assignments table with RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read assignments" 
ON public.assignments FOR SELECT 
TO authenticated, anon 
USING (true);

CREATE POLICY "Authenticated users can propose assignments" 
ON public.assignments FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their pending assignments" 
ON public.assignments FOR UPDATE 
TO authenticated 
USING (auth.uid() = created_by AND status = 'pending');

-- 3. Verifications Table
CREATE TABLE public.verifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, user_id) -- Prevent users from verifying twice
);

ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read verifications" 
ON public.verifications FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can create their own verifications" 
ON public.verifications FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Trigger to automatically mark assignment 'verified' after 2 unique confirmations
CREATE OR REPLACE FUNCTION check_verification_threshold()
RETURNS TRIGGER AS $$
DECLARE
  verification_count INT;
BEGIN
  -- Count verifications for this assignment
  SELECT COUNT(*) INTO verification_count 
  FROM public.verifications 
  WHERE assignment_id = NEW.assignment_id;

  -- If 1 or more, update the assignment status
  IF verification_count >= 1 THEN
    UPDATE public.assignments
    SET status = 'verified'
    WHERE id = NEW.assignment_id AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_verification_added
  AFTER INSERT ON public.verifications
  FOR EACH ROW EXECUTE PROCEDURE check_verification_threshold();

-- 4. User Progress Table (The Pulse Tracker)
CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'finished');

CREATE TABLE public.user_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
  status progress_status DEFAULT 'not_started',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, assignment_id)
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all progress (for class percentages)" 
ON public.user_progress FOR SELECT 
TO authenticated, anon 
USING (true);

CREATE POLICY "Users can insert own progress" 
ON public.user_progress FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" 
ON public.user_progress FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);
-- 5. Assignment Pulse Stats View
-- Calculates what percentage of the cohort has started or finished an assignment
CREATE OR REPLACE VIEW public.assignment_pulse_stats AS
SELECT 
  a.id AS assignment_id,
  COUNT(up.user_id) FILTER (WHERE up.status = 'finished') AS finished_count,
  COUNT(up.user_id) FILTER (WHERE up.status = 'in_progress') AS started_count,
  (SELECT COUNT(*) FROM public.users) AS total_cohort,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.users) = 0 THEN 0
    ELSE ROUND((COUNT(up.user_id) FILTER (WHERE up.status = 'finished')::NUMERIC / (SELECT COUNT(*) FROM public.users)) * 100)
  END AS finished_percentage,
  CASE 
    WHEN (SELECT COUNT(*) FROM public.users) = 0 THEN 0
    ELSE ROUND((COUNT(up.user_id) FILTER (WHERE up.status IN ('in_progress', 'finished'))::NUMERIC / (SELECT COUNT(*) FROM public.users)) * 100)
  END AS involvement_percentage
FROM 
  public.assignments a
LEFT JOIN 
  public.user_progress up ON a.id = up.assignment_id
GROUP BY 
  a.id;

-- Grant access to authenticated users
GRANT SELECT ON public.assignment_pulse_stats TO authenticated;

-- Add hint for PostgREST to recognize the relationship
COMMENT ON VIEW public.assignment_pulse_stats IS E'@foreignKey (assignment_id) references assignments (id)';
-- 6. User Subscriptions (Web Push)
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, subscription)
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own subscriptions"
ON public.user_subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own subscriptions"
ON public.user_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
ON public.user_subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 7. Task Type Migration (run in Supabase SQL Editor if not already applied)
-- Adds task_type, resource_url, and location columns to assignments
CREATE TYPE IF NOT EXISTS task_type_enum AS ENUM ('assignment', 'quiz', 'online_test', 'physical_test');

ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS task_type task_type_enum DEFAULT 'assignment',
  ADD COLUMN IF NOT EXISTS resource_url TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT;

