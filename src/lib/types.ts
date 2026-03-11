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
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  created_at: string;
}

export interface Series {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostWithRelations extends Post {
  category?: Category | null;
  series?: Series | null;
}
