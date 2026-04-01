-- ============================================================================
-- 008: Rename category_group values from 'blog' → 'dev', add 'talk' group
-- Groups: 'dev' (개발), 'talk' (잡담), 'portfolio' (포트폴리오)
-- ============================================================================

-- Migrate existing 'blog' group to 'dev'
UPDATE public.categories
  SET category_group = 'dev'
  WHERE category_group = 'blog';

-- Update default for new categories
ALTER TABLE public.categories
  ALTER COLUMN category_group SET DEFAULT 'dev';
