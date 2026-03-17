-- Add lecturer column to schedules table
ALTER TABLE public.schedules 
ADD COLUMN IF NOT EXISTS lecturer TEXT;

-- Refresh schema cache (optional hint for some environments)
NOTIFY pgrst, 'reload schema';
