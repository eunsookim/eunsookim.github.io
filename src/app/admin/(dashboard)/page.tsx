import Link from "next/link";
import { FileText, Briefcase, PlusCircle, FolderTree, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AdminRecentComments } from "@/components/admin/recent-comments";

async function getStats() {
  const supabase = await createClient();

  const [postsResult, publishedResult, projectsResult, commentsResult] = await Promise.all([
    supabase.from("posts").select("id", { count: "exact", head: true }),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("comments").select("*", { count: "exact", head: true }),
  ]);

  const totalPosts = postsResult.count ?? 0;
  const publishedPosts = publishedResult.count ?? 0;
  const draftPosts = totalPosts - publishedPosts;
  const totalProjects = projectsResult.count ?? 0;
  const totalComments = commentsResult.count ?? 0;

  return { totalPosts, publishedPosts, draftPosts, totalProjects, totalComments };
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

export default async function AdminDashboardPage() {
  const [{ totalPosts, publishedPosts, draftPosts, totalProjects, totalComments }, recentComments] =
    await Promise.all([getStats(), getRecentComments()]);

  const stats = [
    {
      label: "Total Posts",
      value: totalPosts,
      icon: FileText,
      color: "text-primary",
    },
    {
      label: "Published",
      value: publishedPosts,
      icon: FileText,
      color: "text-chart-2",
    },
    {
      label: "Drafts",
      value: draftPosts,
      icon: FileText,
      color: "text-muted-foreground",
    },
    {
      label: "Projects",
      value: totalProjects,
      icon: Briefcase,
      color: "text-chart-1",
    },
    {
      label: "Comments",
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

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-mono text-2xl font-bold text-primary">
          Dashboard
        </h1>
        <p className="mt-1 font-mono text-sm text-muted-foreground">
          <span className="text-primary">$</span> system status --overview
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
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

      {/* Recent comments */}
      <div>
        <h2 className="mb-4 font-mono text-sm font-medium text-muted-foreground">
          최근 댓글
        </h2>
        <AdminRecentComments comments={recentComments} />
      </div>
    </div>
  );
}
