-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. Roles Enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'rep', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Programs Table
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL, -- e.g., 'CS-2028'
  is_public BOOLEAN DEFAULT true,
  created_by UUID, -- REFERENCES public.users(id) - Added later due to chicken-egg
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial programs
INSERT INTO public.programs (name, invite_code, is_public) VALUES 
('Computer Science 2028', 'CS-2028', true),
('Software Engineering 2028', 'SE-2028', true)
ON CONFLICT (invite_code) DO NOTHING;

-- Protect programs table with RLS
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read programs" 
ON public.programs FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Reps and Admins can create programs" 
ON public.programs FOR INSERT 
TO authenticated 
WITH CHECK (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('rep', 'admin')
);

CREATE POLICY "Creators can update their programs" 
ON public.programs FOR UPDATE 
TO authenticated 
USING (
  created_by = auth.uid() OR 
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role user_role DEFAULT 'student',
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Protect users table with RLS
-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

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

-- 3. Assignments Table
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  difficulty_score INTEGER DEFAULT 5 CHECK (difficulty_score >= 1 AND difficulty_score <= 10),
  status assignment_status DEFAULT 'pending',
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Protect assignments table with RLS
-- RLS Scoped by Program
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read assignments in their program" 
ON public.assignments FOR SELECT TO authenticated 
USING (program_id = (SELECT program_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create assignments in their program" 
ON public.assignments FOR INSERT TO authenticated 
WITH CHECK (
  auth.uid() = created_by AND 
  program_id = (SELECT program_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Creators can update their pending assignments" 
ON public.assignments FOR UPDATE TO authenticated 
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
  COUNT(DISTINCT u.id) FILTER (WHERE up.status = 'finished') AS finished_count,
  COUNT(DISTINCT u.id) FILTER (WHERE up.status = 'in_progress') AS started_count,
  COUNT(DISTINCT u.id) AS total_cohort_in_program,
  CASE 
    WHEN COUNT(DISTINCT u.id) = 0 THEN 0
    ELSE ROUND((COUNT(DISTINCT u.id) FILTER (WHERE up.status = 'finished')::NUMERIC / COUNT(DISTINCT u.id)) * 100)
  END AS finished_percentage,
  CASE 
    WHEN COUNT(DISTINCT u.id) = 0 THEN 0
    ELSE ROUND((COUNT(DISTINCT u.id) FILTER (WHERE up.status IN ('in_progress', 'finished'))::NUMERIC / COUNT(DISTINCT u.id)) * 100)
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


-- 8. Schedules Table (The AI Eye)
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  module_name TEXT NOT NULL,
  course_code TEXT,
  venue TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read schedules in their program" 
ON public.schedules FOR SELECT 
TO authenticated 
USING (program_id = (SELECT program_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Reps can manage schedules" 
ON public.schedules FOR ALL 
TO authenticated 
USING (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('rep', 'admin')
);

-- 9. Schedule Overrides (Cancellations)
CREATE TABLE IF NOT EXISTS public.schedule_overrides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  schedule_id UUID REFERENCES public.schedules(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  is_cancelled BOOLEAN DEFAULT false,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(schedule_id, override_date)
);

ALTER TABLE public.schedule_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read overrides in their program" 
ON public.schedule_overrides FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.schedules s
    WHERE s.id = schedule_id
    AND s.program_id = (SELECT program_id FROM public.users WHERE id = auth.uid())
  )
);

CREATE POLICY "Reps can manage overrides" 
ON public.schedule_overrides FOR ALL 
TO authenticated 
USING (
  (SELECT role FROM users WHERE id = auth.uid()) IN ('rep', 'admin')
);

