-- ============================================================================
-- 007: Add category_group column for sidebar grouping
-- Groups: 'blog' (개발 지식), 'portfolio' (포트폴리오)
-- ============================================================================

ALTER TABLE public.categories
  ADD COLUMN category_group TEXT NOT NULL DEFAULT 'blog';
