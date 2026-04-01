import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const tab = searchParams.get("tab");
  const offset = (page - 1) * PAGE_SIZE;

  if (tab === "ai") {
    const { data, count } = await supabase
      .from("posts")
      .select("*, category:categories(name)", { count: "exact" })
      .eq("status", "pending_review")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    return Response.json({
      posts: data ?? [],
      total: count ?? 0,
      hasMore: offset + PAGE_SIZE < (count ?? 0),
    });
  }

  // "all" tab: pending_review first, then rest by created_at desc
  const { count: pendingCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending_review");

  const { count: totalCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true });

  const pc = pendingCount ?? 0;
  const tc = totalCount ?? 0;
  let posts: Record<string, unknown>[] = [];

  if (offset < pc) {
    // Still within pending_review range
    const pendingNeeded = Math.min(PAGE_SIZE, pc - offset);
    const { data: pendingPosts } = await supabase
      .from("posts")
      .select("*, category:categories(name)")
      .eq("status", "pending_review")
      .order("created_at", { ascending: false })
      .range(offset, offset + pendingNeeded - 1);

    posts = pendingPosts ?? [];

    // Fill remaining page with other posts
    if (posts.length < PAGE_SIZE) {
      const remaining = PAGE_SIZE - posts.length;
      const { data: otherPosts } = await supabase
        .from("posts")
        .select("*, category:categories(name)")
        .neq("status", "pending_review")
        .order("created_at", { ascending: false })
        .range(0, remaining - 1);

      posts = [...posts, ...(otherPosts ?? [])];
    }
  } else {
    // Past pending_review, fetch only others
    const otherOffset = offset - pc;
    const { data: otherPosts } = await supabase
      .from("posts")
      .select("*, category:categories(name)")
      .neq("status", "pending_review")
      .order("created_at", { ascending: false })
      .range(otherOffset, otherOffset + PAGE_SIZE - 1);

    posts = otherPosts ?? [];
  }

  return Response.json({
    posts,
    total: tc,
    hasMore: offset + PAGE_SIZE < tc,
  });
}
