-- ============================================================================
-- Initial Schema Migration for eunsookim.dev
-- ============================================================================
-- Creates the core tables (categories, series, posts, projects),
-- indexes, Row Level Security policies, and admin access controls.
--
-- Before running this migration:
--   Replace all occurrences of 'ADMIN_UUID_HERE' with your actual
--   Supabase auth user UUID.
-- ============================================================================

-- ============================================================================
-- 1. Tables (ordered by FK dependencies)
-- ============================================================================

-- categories (no FK dependencies)
CREATE TABLE public.categories (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        UNIQUE NOT NULL,
    slug        TEXT        UNIQUE NOT NULL,
    description TEXT,
    color       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- series (no FK dependencies)
CREATE TABLE public.series (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT        NOT NULL,
    slug        TEXT        UNIQUE NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- posts (depends on categories, series)
CREATE TABLE public.posts (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    slug         TEXT        UNIQUE NOT NULL,
    title        TEXT        NOT NULL,
    content      TEXT,
    excerpt      TEXT,
    cover_image  TEXT,
    category_id  UUID        REFERENCES public.categories(id) ON DELETE SET NULL,
    series_id    UUID        REFERENCES public.series(id) ON DELETE SET NULL,
    series_order INT,
    is_published BOOLEAN     NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    tags         TEXT[]      NOT NULL DEFAULT '{}',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- projects (no FK dependencies)
CREATE TABLE public.projects (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        TEXT        UNIQUE NOT NULL,
    title       TEXT        NOT NULL,
    description TEXT,
    demo_url    TEXT,
    github_url  TEXT,
    thumbnail   TEXT,
    tech_stack  TEXT[]      NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. Indexes
-- ============================================================================

-- Ensure unique series_order within a series (only when series_id is set)
CREATE UNIQUE INDEX idx_posts_series_order
    ON public.posts(series_id, series_order)
    WHERE series_id IS NOT NULL;

-- ============================================================================
-- 3. Row Level Security
-- ============================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. RLS Policies
-- ============================================================================

-- posts: public can read published posts only; admin has full access
CREATE POLICY "Public read published posts" ON public.posts
    FOR SELECT USING (is_published = true);

CREATE POLICY "Admin manage posts" ON public.posts
    FOR ALL USING (auth.uid() = 'ADMIN_UUID_HERE'::uuid);

-- projects: public can read all; admin has full access
CREATE POLICY "Public read projects" ON public.projects
    FOR SELECT USING (true);

CREATE POLICY "Admin manage projects" ON public.projects
    FOR ALL USING (auth.uid() = 'ADMIN_UUID_HERE'::uuid);

-- categories: public can read all; admin has full access
CREATE POLICY "Public read categories" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Admin manage categories" ON public.categories
    FOR ALL USING (auth.uid() = 'ADMIN_UUID_HERE'::uuid);

-- series: public can read all; admin has full access
CREATE POLICY "Public read series" ON public.series
    FOR SELECT USING (true);

CREATE POLICY "Admin manage series" ON public.series
    FOR ALL USING (auth.uid() = 'ADMIN_UUID_HERE'::uuid);

-- ============================================================================
-- 5. Storage Policy Notes
-- ============================================================================
-- Storage bucket 'assets' configuration (do this in Supabase Dashboard):
-- 1. Create bucket named 'assets' (public)
-- 2. Public read: Allow all SELECT
-- 3. Admin upload/delete: auth.uid() = 'ADMIN_UUID_HERE'::uuid for INSERT/UPDATE/DELETE
