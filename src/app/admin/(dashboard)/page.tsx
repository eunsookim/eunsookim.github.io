import Link from "next/link";
import {
  FileText,
  Briefcase,
  PlusCircle,
  FolderTree,
  MessageSquare,
  Eye,
  Heart,
  AlertCircle,
  TrendingUp,
  Crown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AdminRecentComments } from "@/components/admin/recent-comments";

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getStats() {
  const supabase = await createClient();

  const [publishedResult, commentsResult, pendingResult, publishedPostsData] =
    await Promise.all([
      // 발행 글 수
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true),
      // 총 댓글 수
      supabase.from("comments").select("*", { count: "exact", head: true }),
      // AI 초안 대기 수
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending_review"),
      // 발행 글의 view_count, like_count 합산용
      supabase
        .from("posts")
        .select("view_count, like_count")
        .eq("is_published", true),
    ]);

  const publishedPosts = publishedResult.count ?? 0;
  const totalComments = commentsResult.count ?? 0;
  const pendingDrafts = pendingResult.count ?? 0;

  const rows = publishedPostsData.data ?? [];
  const totalViews = rows.reduce((sum, r) => sum + (r.view_count ?? 0), 0);
  const totalLikes = rows.reduce((sum, r) => sum + (r.like_count ?? 0), 0);

  return { publishedPosts, totalViews, totalLikes, totalComments, pendingDrafts };
}

async function getPopularPosts() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("posts")
    .select("title, slug, view_count, like_count")
    .eq("is_published", true)
    .order("view_count", { ascending: false })
    .limit(5);

  return data ?? [];
}

async function getViewTrend() {
  const supabase = await createClient();

  // 최근 7일간의 post_views 조회
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const { data } = await supabase
    .from("post_views")
    .select("viewed_at")
    .gte("viewed_at", sevenDaysAgo.toISOString());

  // 날짜별 집계
  const countsByDate: Record<string, number> = {};

  // 7일치 날짜 초기화
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    countsByDate[key] = 0;
  }

  // 데이터 집계
  for (const row of data ?? []) {
    const key = new Date(row.viewed_at).toISOString().slice(0, 10);
    if (key in countsByDate) {
      countsByDate[key]++;
    }
  }

  return Object.entries(countsByDate).map(([date, count]) => ({ date, count }));
}

async function getRecentComments() {
  const supabase = await createClient();

  const { data: comments } = await supabase
    .from("comments")
    .select("id, author_name, content, created_at, post_id, posts(title, slug)")
    .order("created_at", { ascending: false })
    .limit(10);

  // Supabase returns the joined `posts` as an array; normalize to single object
  return (comments ?? []).map((c) => ({
    ...c,
    posts: Array.isArray(c.posts) ? (c.posts[0] ?? null) : c.posts,
  }));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminDashboardPage() {
  const [
    { publishedPosts, totalViews, totalLikes, totalComments, pendingDrafts },
    popularPosts,
    viewTrend,
    recentComments,
  ] = await Promise.all([
    getStats(),
    getPopularPosts(),
    getViewTrend(),
    getRecentComments(),
  ]);

  const stats = [
    {
      label: "발행 글",
      value: publishedPosts,
      icon: FileText,
      color: "text-primary",
    },
    {
      label: "총 조회수",
      value: totalViews,
      icon: Eye,
      color: "text-chart-1",
    },
    {
      label: "총 좋아요",
      value: totalLikes,
      icon: Heart,
      color: "text-chart-2",
    },
    {
      label: "총 댓글",
      value: totalComments,
      icon: MessageSquare,
      color: "text-chart-3",
    },
  ];

  const quickActions = [
    { href: "/admin/posts/new", label: "New Post", icon: PlusCircle },
    { href: "/admin/posts", label: "Manage Posts", icon: FileText },
    { href: "/admin/portfolio", label: "Manage Portfolio", icon: Briefcase },
    { href: "/admin/categories", label: "Manage Categories", icon: FolderTree },
  ];

  const maxViewCount = Math.max(...viewTrend.map((d) => d.count), 1);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-mono text-2xl font-bold text-primary">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">시스템 현황</p>
      </div>

      {/* AI 초안 대기 알림 */}
      {pendingDrafts > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <AlertCircle className="size-5 shrink-0 text-amber-500" />
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            AI 초안 대기 중인 글이{" "}
            <span className="font-bold">{pendingDrafts}건</span> 있습니다.
          </p>
          <Link
            href="/admin/posts?status=pending_review"
            className="ml-auto text-xs font-medium text-amber-600 underline underline-offset-2 hover:text-amber-500 dark:text-amber-400"
          >
            확인하기
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-mono text-xs font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className={cn("size-4", stat.color)} />
              </CardHeader>
              <CardContent>
                <div className={cn("font-mono text-2xl font-bold", stat.color)}>
                  {formatNumber(stat.value)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 7일 조회수 트렌드 */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 font-mono text-sm font-medium text-muted-foreground">
          <TrendingUp className="size-4" />
          최근 7일 조회수 트렌드
        </h2>
        <Card>
          <CardContent className="pt-2">
            <div className="flex items-end gap-2" style={{ height: "160px" }}>
              {viewTrend.map((day) => {
                const heightPercent =
                  maxViewCount > 0
                    ? Math.max((day.count / maxViewCount) * 100, 2)
                    : 2;
                return (
                  <div
                    key={day.date}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      {day.count}
                    </span>
                    <div
                      className="w-full rounded-t bg-primary/80 transition-all"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {formatShortDate(day.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 하단: 인기 글 + 최근 댓글 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 인기 글 Top 5 */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 font-mono text-sm font-medium text-muted-foreground">
            <Crown className="size-4" />
            인기 글 Top 5
          </h2>
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {popularPosts.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  발행된 글이 없습니다.
                </div>
              ) : (
                popularPosts.map((post, index) => (
                  <div
                    key={post.slug}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold",
                        index === 0
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="block truncate text-sm font-medium text-foreground hover:text-primary"
                      >
                        {post.title}
                      </Link>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="size-3" />
                        {formatNumber(post.view_count ?? 0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="size-3" />
                        {formatNumber(post.like_count ?? 0)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* 최근 댓글 */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 font-mono text-sm font-medium text-muted-foreground">
            <MessageSquare className="size-4" />
            최근 댓글
          </h2>
          <AdminRecentComments comments={recentComments} />
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-4 font-mono text-sm font-medium text-muted-foreground">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Icon className="size-4" />
                {action.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
