-- ─────────────────────────────────────────────────────────────────────
-- archived_assignments: receipt table for past-due assignments
-- Run this once in Supabase SQL editor
-- ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.archived_assignments (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    original_id   uuid NOT NULL,          -- original assignments.id
    program_id    uuid,
    title         text NOT NULL,
    description   text,
    due_date      timestamptz,
    task_type     text,
    resource_url  text,
    created_by    uuid,
    created_at    timestamptz,
    archived_at   timestamptz NOT NULL DEFAULT now()
);

-- Index for queries by program
CREATE INDEX IF NOT EXISTS idx_archived_program ON public.archived_assignments(program_id);
CREATE INDEX IF NOT EXISTS idx_archived_due ON public.archived_assignments(due_date);

-- Allow service role full access (used by cron), read-only for authenticated users
ALTER TABLE public.archived_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON public.archived_assignments
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read" ON public.archived_assignments
    FOR SELECT TO authenticated USING (true);
