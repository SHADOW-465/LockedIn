-- =============================================================
-- LOCKEDIN-X · Chastity Core Tables Migration
-- Project: ompdzvxzxuptsdexrxah
-- Apply via: Supabase Dashboard > SQL Editor
-- =============================================================

-- 1. behavior_logs
CREATE TABLE IF NOT EXISTS public.behavior_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('touch','urge','removal')),
    intensity INTEGER CHECK (intensity >= 1 AND intensity <= 10),
    reason TEXT,
    notes TEXT,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. proof_schedules
CREATE TABLE IF NOT EXISTS public.proof_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    scheduled_at DATE NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    missed BOOLEAN DEFAULT FALSE,
    photo_url TEXT,
    ai_verified BOOLEAN,
    verification_score NUMERIC(4,2),
    verification_details JSONB DEFAULT '{}',
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. memoir_chapters
CREATE TABLE IF NOT EXISTS public.memoir_chapters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'A New Chapter',
    summary TEXT,
    ai_intro TEXT,
    cover_photo_url TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. memoir_pages
CREATE TABLE IF NOT EXISTS public.memoir_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES public.memoir_chapters(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    page_date DATE NOT NULL,
    day_number INTEGER,
    morning_completed BOOLEAN DEFAULT FALSE,
    evening_completed BOOLEAN DEFAULT FALSE,
    mood TEXT,
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 10),
    journal_text TEXT,
    intention TEXT,
    ai_narration TEXT,
    photos JSONB DEFAULT '[]',
    cover_photo_url TEXT,
    milestones JSONB DEFAULT '[]',
    behavior_summary JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_behavior_logs_user_date ON public.behavior_logs(user_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_behavior_logs_session ON public.behavior_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_behavior_logs_type ON public.behavior_logs(user_id, type);
CREATE INDEX IF NOT EXISTS idx_proof_schedules_user_date ON public.proof_schedules(user_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_memoir_pages_user_date ON public.memoir_pages(user_id, page_date);
CREATE INDEX IF NOT EXISTS idx_memoir_pages_chapter ON public.memoir_pages(chapter_id);

-- ── Row Level Security ──────────────────────────────────────────
ALTER TABLE public.behavior_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memoir_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memoir_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_behavior_logs" ON public.behavior_logs
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_proof_schedules" ON public.proof_schedules
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_memoir_chapters" ON public.memoir_chapters
    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_memoir_pages" ON public.memoir_pages
    FOR ALL USING (auth.uid() = user_id);

-- ── updated_at trigger ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_memoir_chapters_updated_at') THEN
        CREATE TRIGGER trg_memoir_chapters_updated_at
            BEFORE UPDATE ON public.memoir_chapters
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_memoir_pages_updated_at') THEN
        CREATE TRIGGER trg_memoir_pages_updated_at
            BEFORE UPDATE ON public.memoir_pages
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
END $$;

