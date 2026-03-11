-- Comments table for anonymous comment system
CREATE TABLE public.comments (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id       UUID        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    parent_id     UUID        REFERENCES public.comments(id) ON DELETE CASCADE,
    author_name   TEXT        NOT NULL,
    password_hash TEXT        NOT NULL,
    content       TEXT        NOT NULL,
    ip_address    TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);

-- RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Public can read all comments
CREATE POLICY "Public read comments" ON public.comments
    FOR SELECT USING (true);

-- Only service_role can insert/update/delete (API routes handle auth)
-- No INSERT/UPDATE/DELETE policies for anon = denied by default with RLS enabled
-- API routes use service_role key to bypass RLS

-- Admin can delete any comment
CREATE POLICY "Admin delete comments" ON public.comments
    FOR DELETE USING (auth.uid() = 'ADMIN_UUID_HERE'::uuid);
