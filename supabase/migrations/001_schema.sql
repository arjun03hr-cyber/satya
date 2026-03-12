-- Truth Guard / SatyaKavach AI — Database Schema
-- Corrected: column names now match the actual backend insert logic in api/analyze.ts
-- Run this in your Supabase SQL Editor (Project → SQL Editor → New Query)
-- If the tables already exist, the IF NOT EXISTS / OR REPLACE clauses handle re-runs safely.

-- ============================================================
-- 1. Profiles table (auto-populated on signup via trigger)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. Analysis history table
-- Column names MUST match api/analyze.ts insert payload exactly.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.analysis_history (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  -- user_id references auth.users directly so the service_role backend insert always works,
  -- even if a profiles row hasn't been created yet (e.g. first login race condition).
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content      TEXT        NOT NULL,                  -- the analyzed text (was wrongly named input_text)
  input_hash   TEXT        NOT NULL DEFAULT '',       -- sha256 of content, used for cache dedup
  verdict      TEXT        NOT NULL DEFAULT 'UNVERIFIED'
                           CHECK (verdict IN ('REAL', 'FAKE', 'MISLEADING', 'UNVERIFIED')),
  confidence   INTEGER     NOT NULL DEFAULT 0,        -- 0-100
  risk_score   INTEGER     NOT NULL DEFAULT 0,        -- sensationalism score (was wrongly named fake_risk_score)
  explanation  TEXT        NOT NULL DEFAULT '',
  key_points   JSONB       NOT NULL DEFAULT '[]',
  sources      JSONB       NOT NULL DEFAULT '[]',
  categories   JSONB       NOT NULL DEFAULT '{}',     -- {bias, sensationalism, logicalConsistency}
  flagged      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. Admin logs table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  action      TEXT        NOT NULL CHECK (action IN ('delete', 'flag', 'unflag', 'role_change')),
  target_type TEXT        NOT NULL CHECK (target_type IN ('analysis', 'user')),
  target_id   TEXT        NOT NULL,
  details     TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_analysis_user       ON public.analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_verdict    ON public.analysis_history(verdict);
CREATE INDEX IF NOT EXISTS idx_analysis_created    ON public.analysis_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_hash       ON public.analysis_history(input_hash);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created  ON public.admin_logs(created_at DESC);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs     ENABLE ROW LEVEL SECURITY;

-- -------- profiles policies --------
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- -------- analysis_history policies --------
-- NOTE: The backend uses the service_role key which bypasses RLS for server-side inserts.
-- These policies apply to frontend / anon-key queries only.

CREATE POLICY "Users can view own analyses"
  ON public.analysis_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own analyses"
  ON public.analysis_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all analyses"
  ON public.analysis_history FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update analyses"
  ON public.analysis_history FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete analyses"
  ON public.analysis_history FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- -------- admin_logs policies --------
CREATE POLICY "Admins can view logs"
  ON public.admin_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert logs"
  ON public.admin_logs FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- Trigger: auto-create profile row on new user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING; -- safe for re-runs
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
