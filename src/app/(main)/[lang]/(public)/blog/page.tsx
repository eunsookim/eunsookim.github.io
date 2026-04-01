import { Suspense } from "react";
import type { Metadata } from "next";

import { CategorySidebar, CategorySidebarMobile } from "@/components/blog/category-sidebar";
import { Pagination } from "@/components/blog/pagination";
import { PostCard } from "@/components/blog/post-card";
import { SearchBar } from "@/components/blog/search-bar";
import { createClient } from "@/lib/supabase/server";
import type { Category, PostWithRelations, Series } from "@/lib/types";
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

export async function generateMetadata({
  params,
}: BlogPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = getMessages(lang as Lang);
  const title = `${t.blog.title} | Solvlog`;
  const description =
    lang === "en"
      ? "Dev stories and tech notes"
      : "개발 이야기와 기술 노트";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
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

  // Fetch categories and series for the filter bar
  const [{ data: categories }, { data: seriesData }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("series").select("*").order("title"),
  ]);

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

  // Fetch post counts per category
  const { data: postCountRows } = await supabase
    .from("posts")
    .select("category_id")
    .eq("is_published", true)
    .not("category_id", "is", null);

  const postCounts: Record<string, number> = {};
  let totalPostCount = 0;
  for (const row of postCountRows ?? []) {
    postCounts[row.category_id] = (postCounts[row.category_id] ?? 0) + 1;
    totalPostCount++;
  }

  const { data: posts, count } = await query;

  const totalPages = Math.ceil((count ?? 0) / POSTS_PER_PAGE);
  const typedPosts = (posts ?? []) as PostWithRelations[];
  const typedCategories = (categories ?? []) as Category[];
  const typedSeries = (seriesData ?? []) as Series[];

  const sidebarProps = {
    categories: typedCategories,
    seriesList: typedSeries,
    currentCategory: categorySlug,
    lang: lang as Lang,
    postCounts,
    totalPostCount,
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{t.blog.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === "en" ? "Dev stories and tech notes" : "개발 이야기와 기술 노트"}
        </p>
      </div>

      {/* Mobile category menu */}
      <Suspense fallback={null}>
        <CategorySidebarMobile {...sidebarProps} />
      </Suspense>

      <div className="mt-6 flex gap-8 lg:mt-0">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Search bar */}
          <div className="mb-6">
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
        </div>

        {/* Desktop sidebar — right side */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-20">
            <Suspense fallback={null}>
              <CategorySidebar {...sidebarProps} />
            </Suspense>
          </div>
        </aside>
      </div>
    </section>
  );
}
