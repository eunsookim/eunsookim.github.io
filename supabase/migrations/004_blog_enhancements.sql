-- 004_blog_enhancements.sql

-- A3: 조회수
ALTER TABLE posts ADD COLUMN view_count integer NOT NULL DEFAULT 0;

-- A6: 좋아요
ALTER TABLE posts ADD COLUMN like_count integer NOT NULL DEFAULT 0;

-- A9: 예약 발행
ALTER TABLE posts ADD COLUMN scheduled_at timestamptz;

-- C: AI 초안
ALTER TABLE posts ADD COLUMN status text NOT NULL DEFAULT 'draft'
  CHECK (status IN ('draft', 'pending_review', 'published', 'scheduled'));
ALTER TABLE posts ADD COLUMN generated_by text
  CHECK (generated_by IN ('human', 'ai'));

-- 기존 데이터 마이그레이션
UPDATE posts SET status = 'published' WHERE is_published = true;
UPDATE posts SET status = 'draft' WHERE is_published = false;
UPDATE posts SET generated_by = 'human' WHERE generated_by IS NULL;

-- A3: 조회수 중복 방지 테이블
CREATE TABLE post_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  ip_hash text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_views_lookup ON post_views(post_id, ip_hash, viewed_at);

-- A6: 좋아요 중복 방지 테이블
CREATE TABLE post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, ip_hash)
);

-- C1: 콘텐츠 캘린더 테이블
CREATE TABLE content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_date date NOT NULL,
  topic text NOT NULL,
  category_slug text,
  tags text[] DEFAULT '{}',
  key_points text[] DEFAULT '{}',
  "references" text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'generated', 'published', 'skipped')),
  generated_post_id uuid REFERENCES posts(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- A3: 조회수 증가 RPC
CREATE OR REPLACE FUNCTION increment_view_count(target_post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE posts SET view_count = view_count + 1 WHERE id = target_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS 정책
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

-- post_views: 누구나 INSERT (조회 기록), 읽기는 관리자만
CREATE POLICY "Anyone can record views" ON post_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read views" ON post_views FOR SELECT USING (auth.uid() = (SELECT id FROM auth.users LIMIT 1));

-- post_likes: 누구나 INSERT/SELECT, DELETE는 자기 IP만
CREATE POLICY "Anyone can like" ON post_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Anyone can unlike" ON post_likes FOR DELETE USING (true);

-- content_calendar: 관리자만 전체 접근
CREATE POLICY "Admin manage calendar" ON content_calendar FOR ALL USING (auth.uid() = (SELECT id FROM auth.users LIMIT 1));
