import Link from "next/link";
import { PlusCircle } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { PostsInfiniteList } from "@/components/admin/posts-infinite-list";

const PAGE_SIZE = 20;

const TABS = [
  { key: "all", label: "전체 글", href: "/admin/posts" },
  { key: "ai", label: "AI 초안", href: "/admin/posts?tab=ai" },
] as const;

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === "ai" ? "ai" : "all";

  const supabase = await createClient();

  let posts: Record<string, unknown>[] = [];
  let total = 0;

  if (activeTab === "ai") {
    const { data, count } = await supabase
      .from("posts")
      .select("*, category:categories(name)", { count: "exact" })
      .eq("status", "pending_review")
      .order("created_at", { ascending: false })
      .range(0, PAGE_SIZE - 1);

    posts = data ?? [];
    total = count ?? 0;
  } else {
    // pending_review first, then rest
    const { data: pendingPosts, count: pendingCount } = await supabase
      .from("posts")
      .select("*, category:categories(name)", { count: "exact" })
      .eq("status", "pending_review")
      .order("created_at", { ascending: false });

    const { count: totalCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true });

    const pc = pendingCount ?? 0;
    total = totalCount ?? 0;

    if (pc >= PAGE_SIZE) {
      posts = (pendingPosts ?? []).slice(0, PAGE_SIZE);
    } else {
      const remaining = PAGE_SIZE - pc;
      const { data: otherPosts } = await supabase
        .from("posts")
        .select("*, category:categories(name)")
        .neq("status", "pending_review")
        .order("created_at", { ascending: false })
        .range(0, remaining - 1);

      posts = [...(pendingPosts ?? []), ...(otherPosts ?? [])];
    }
  }

  const hasMore = PAGE_SIZE < total;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-primary">Posts</h1>
          <p className="mt-1 text-sm text-muted-foreground">글 목록 관리</p>
        </div>
        <Button render={<Link href="/admin/posts/new" />}>
          <PlusCircle className="size-4" />
          New Post
        </Button>
      </div>

      {/* Tabs */}
      <nav className="flex gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={`px-4 py-2 font-mono text-sm transition-colors ${
              activeTab === t.key
                ? "border-b-2 border-primary font-semibold text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {/* Post list with infinite scroll */}
      <PostsInfiniteList
        key={activeTab}
        initialPosts={posts as never[]}
        initialHasMore={hasMore}
        activeTab={activeTab}
      />
    </div>
  );
}
