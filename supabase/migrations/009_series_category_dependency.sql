-- ============================================================================
-- Series → Category Dependency Migration
-- ============================================================================
-- Makes series subordinate to categories:
--   1. series.category_id NOT NULL FK → categories
--   2. posts.category_id NOT NULL (every post must have a category)
--   3. Trigger to auto-sync post.category_id from its series
-- ============================================================================

-- 1. Add category_id to series (NOT NULL, FK to categories)
ALTER TABLE public.series
  ADD COLUMN category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE;

CREATE INDEX idx_series_category ON public.series(category_id);

-- 2. Make posts.category_id NOT NULL
ALTER TABLE public.posts
  ALTER COLUMN category_id SET NOT NULL;

-- 3. Trigger: when a post is assigned to a series, auto-set its category_id
--    to match the series' category_id.
CREATE OR REPLACE FUNCTION sync_post_category_from_series()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.series_id IS NOT NULL THEN
    SELECT category_id INTO NEW.category_id
    FROM public.series
    WHERE id = NEW.series_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_post_category
  BEFORE INSERT OR UPDATE OF series_id ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION sync_post_category_from_series();
