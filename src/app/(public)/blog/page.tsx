import { Suspense } from "react";

import { CategoryFilter } from "@/components/blog/category-filter";
import { Pagination } from "@/components/blog/pagination";
import { PostCard } from "@/components/blog/post-card";
import { SearchBar } from "@/components/blog/search-bar";
import { createClient } from "@/lib/supabase/server";
import type { Category, PostWithRelations } from "@/lib/types";

const POSTS_PER_PAGE = 10;

interface BlogPageProps {
  searchParams: Promise<{
    category?: string;
    tag?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params.page) || 1);
  const categorySlug = params.category;
  const tagFilter = params.tag;
  const searchQuery = params.q?.trim();

  const supabase = await createClient();

  // Fetch categories for the filter bar
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  // Build the posts query
  let query = supabase
    .from("posts")
    .select("*, category:categories(*)", { count: "exact" })
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  // Filter by category
  if (categorySlug) {
    // Look up the category id by slug from the already-fetched categories
    const matchedCategory = (categories ?? []).find(
      (c: Category) => c.slug === categorySlug,
    );
    if (matchedCategory) {
      query = query.eq("category_id", matchedCategory.id);
    }
  }

  // Filter by tag
  if (tagFilter) {
    query = query.contains("tags", [tagFilter]);
  }

  // Search by title or excerpt
  if (searchQuery) {
    query = query.or(
      `title.ilike.%${searchQuery}%,excerpt.ilike.%${searchQuery}%`,
    );
  }

  // Pagination
  const from = (currentPage - 1) * POSTS_PER_PAGE;
  const to = from + POSTS_PER_PAGE - 1;
  query = query.range(from, to);

  const { data: posts, count } = await query;

  const totalPages = Math.ceil((count ?? 0) / POSTS_PER_PAGE);
  const typedPosts = (posts ?? []) as PostWithRelations[];
  const typedCategories = (categories ?? []) as Category[];

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="font-mono text-3xl font-bold text-primary">
          <span className="text-muted-foreground">$</span> ls ./blog
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          개발 이야기와 기술 노트
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Suspense fallback={null}>
          <CategoryFilter
            categories={typedCategories}
            currentCategory={categorySlug}
          />
        </Suspense>
        <Suspense fallback={null}>
          <SearchBar />
        </Suspense>
      </div>

      {/* Active tag filter indicator */}
      {tagFilter && (
        <p className="mb-4 text-sm text-muted-foreground">
          태그: <span className="font-medium text-primary">{tagFilter}</span>
        </p>
      )}

      {/* Post list */}
      {typedPosts.length > 0 ? (
        <div className="grid gap-6">
          {typedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="font-mono text-muted-foreground">
            <span className="text-primary">$</span> echo &quot;게시글을 찾을 수
            없습니다&quot;
          </p>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-10">
        <Suspense fallback={null}>
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </Suspense>
      </div>
    </section>
  );
}
