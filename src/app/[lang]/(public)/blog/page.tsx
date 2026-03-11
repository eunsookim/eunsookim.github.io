import { Suspense } from "react";

import { CategoryFilter } from "@/components/blog/category-filter";
import { Pagination } from "@/components/blog/pagination";
import { PostCard } from "@/components/blog/post-card";
import { SearchBar } from "@/components/blog/search-bar";
import { createClient } from "@/lib/supabase/server";
import type { Category, PostWithRelations } from "@/lib/types";
import type { Lang } from "@/lib/i18n/utils";
import { getMessages } from "@/lib/i18n/messages";

const POSTS_PER_PAGE = 10;

/** Escape special PostgREST pattern characters to prevent injection */
function escapeSearchQuery(query: string): string {
  return query.replace(/[%_\\]/g, "\\$&");
}

interface BlogPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    category?: string;
    tag?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  const { lang } = await params;
  const t = getMessages(lang as Lang);
  const resolvedSearchParams = await searchParams;
  const currentPage = Math.max(1, Number(resolvedSearchParams.page) || 1);
  const categorySlug = resolvedSearchParams.category;
  const tagFilter = resolvedSearchParams.tag;
  const searchQuery = resolvedSearchParams.q?.trim();

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
    const escapedQuery = escapeSearchQuery(searchQuery);
    query = query.or(
      `title.ilike.%${escapedQuery}%,excerpt.ilike.%${escapedQuery}%`,
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
        <h1 className="text-3xl font-bold text-foreground">{t.blog.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === "en" ? "Dev stories and tech notes" : "개발 이야기와 기술 노트"}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Suspense fallback={null}>
          <CategoryFilter
            categories={typedCategories}
            currentCategory={categorySlug}
            lang={lang as Lang}
          />
        </Suspense>
        <Suspense fallback={null}>
          <SearchBar lang={lang as Lang} />
        </Suspense>
      </div>

      {/* Active tag filter indicator */}
      {tagFilter && (
        <p className="mb-4 text-sm text-muted-foreground">
          {lang === "en" ? "Tag:" : "태그:"}{" "}
          <span className="font-medium text-primary">{tagFilter}</span>
        </p>
      )}

      {/* Post list */}
      {typedPosts.length > 0 ? (
        <div className="grid gap-6">
          {typedPosts.map((post) => (
            <PostCard key={post.id} post={post} lang={lang as Lang} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">{t.blog.noResults}</p>
        </div>
      )}

      {/* Pagination */}
      <div className="mt-10">
        <Suspense fallback={null}>
          <Pagination currentPage={currentPage} totalPages={totalPages} lang={lang as Lang} />
        </Suspense>
      </div>
    </section>
  );
}
