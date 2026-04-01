-- ============================================================================
-- 006: Fix RLS policies, race conditions, and is_published/status sync
-- ============================================================================
-- 1. Fix broken RLS on post_views and content_calendar (LIMIT 1 bug)
-- 2. Add atomic RPC functions for likes and views (race condition fix)
-- 3. Add trigger to sync is_published from status
--
-- Before running: Replace 'd54a8556-5ca3-4ad1-8b67-e18fc0949fa1' with your Supabase auth user UUID.
-- ============================================================================

-- ============================================================================
-- 1. Fix RLS Policies (post_views, content_calendar)
-- ============================================================================

-- post_views: drop buggy policy, recreate with correct admin check
DROP POLICY IF EXISTS "Admin read views" ON post_views;
CREATE POLICY "Admin read views" ON post_views
  FOR SELECT USING (auth.uid() = 'd54a8556-5ca3-4ad1-8b67-e18fc0949fa1'::uuid);

-- content_calendar: drop buggy policy, recreate with correct admin check
DROP POLICY IF EXISTS "Admin manage calendar" ON content_calendar;
CREATE POLICY "Admin manage calendar" ON content_calendar
  FOR ALL USING (auth.uid() = 'd54a8556-5ca3-4ad1-8b67-e18fc0949fa1'::uuid);

-- ============================================================================
-- 2. Atomic RPC: toggle_like (replaces check-then-update pattern)
-- ============================================================================

CREATE OR REPLACE FUNCTION toggle_like(target_post_id uuid, user_ip_hash text)
RETURNS json AS $$
DECLARE
  existing_id uuid;
  new_count integer;
  is_liked boolean;
BEGIN
  -- Check if already liked
  SELECT id INTO existing_id
  FROM post_likes
  WHERE post_id = target_post_id AND ip_hash = user_ip_hash;

  IF existing_id IS NOT NULL THEN
    -- Unlike: delete row and decrement
    DELETE FROM post_likes WHERE id = existing_id;
    UPDATE posts
      SET like_count = GREATEST(0, like_count - 1)
      WHERE id = target_post_id
      RETURNING like_count INTO new_count;
    is_liked := false;
  ELSE
    -- Like: insert row and increment
    INSERT INTO post_likes (post_id, ip_hash) VALUES (target_post_id, user_ip_hash);
    UPDATE posts
      SET like_count = like_count + 1
      WHERE id = target_post_id
      RETURNING like_count INTO new_count;
    is_liked := true;
  END IF;

  RETURN json_build_object('liked', is_liked, 'count', COALESCE(new_count, 0));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. Atomic RPC: record_view (replaces check-then-insert pattern)
-- ============================================================================

CREATE OR REPLACE FUNCTION record_view(target_post_id uuid, user_ip_hash text)
RETURNS json AS $$
DECLARE
  already_viewed boolean;
BEGIN
  -- Check for duplicate view within 24 hours
  SELECT EXISTS(
    SELECT 1 FROM post_views
    WHERE post_id = target_post_id
      AND ip_hash = user_ip_hash
      AND viewed_at > now() - interval '24 hours'
  ) INTO already_viewed;

  IF already_viewed THEN
    RETURN json_build_object('counted', false);
  END IF;

  -- Record view and increment count atomically
  INSERT INTO post_views (post_id, ip_hash) VALUES (target_post_id, user_ip_hash);
  UPDATE posts SET view_count = view_count + 1 WHERE id = target_post_id;

  RETURN json_build_object('counted', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. Trigger: sync is_published from status
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_is_published()
RETURNS trigger AS $$
BEGIN
  NEW.is_published := (NEW.status = 'published');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_is_published
  BEFORE INSERT OR UPDATE OF status ON posts
  FOR EACH ROW
  EXECUTE FUNCTION sync_is_published();

-- Sync existing data
UPDATE posts SET is_published = (status = 'published');
