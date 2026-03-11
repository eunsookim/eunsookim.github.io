-- ============================================================================
-- i18n columns migration
-- ============================================================================
-- Adds English translation columns to posts, projects, categories, series.
-- Must be run AFTER 001_initial_schema.sql and 002_comments.sql.
-- ============================================================================

-- posts
ALTER TABLE public.posts
  ADD COLUMN title_en TEXT,
  ADD COLUMN content_en TEXT,
  ADD COLUMN excerpt_en TEXT;

-- projects
ALTER TABLE public.projects
  ADD COLUMN title_en TEXT,
  ADD COLUMN description_en TEXT;

-- categories
ALTER TABLE public.categories
  ADD COLUMN name_en TEXT,
  ADD COLUMN description_en TEXT;

-- series
ALTER TABLE public.series
  ADD COLUMN title_en TEXT,
  ADD COLUMN description_en TEXT;
