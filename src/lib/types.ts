// ---------------------------------------------------------------------------
// Data-model interfaces – mirrors the Supabase DB schema
// ---------------------------------------------------------------------------

export interface Post {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  cover_image: string | null;
  category_id: string | null;
  series_id: string | null;
  series_order: number | null;
  is_published: boolean;
  published_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  title_en: string | null;
  content_en: string | null;
  excerpt_en: string | null;
  view_count: number;
  like_count: number;
  scheduled_at: string | null;
  status: 'draft' | 'pending_review' | 'published' | 'scheduled';
  generated_by: 'human' | 'ai' | null;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  demo_url: string | null;
  github_url: string | null;
  thumbnail: string | null;
  tech_stack: string[];
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  title_en: string | null;
  description_en: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  created_at: string;
  name_en: string | null;
  description_en: string | null;
}

export interface Series {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  title_en: string | null;
  description_en: string | null;
}

export interface PostWithRelations extends Post {
  category?: Category | null;
  series?: Series | null;
}

export interface Comment {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_name: string;
  content: string;
  created_at: string;
  // password_hash and ip_address are NOT exposed to client
}

export interface CommentWithReplies extends Comment {
  replies: Comment[];
}

export interface ContentCalendar {
  id: string;
  scheduled_date: string;
  topic: string;
  category_slug: string | null;
  tags: string[];
  key_points: string[];
  references: string[];
  status: 'pending' | 'generated' | 'published' | 'skipped';
  generated_post_id: string | null;
  created_at: string;
}
