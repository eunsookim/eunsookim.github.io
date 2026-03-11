import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function hashIP(ip: string): string {
  return crypto
    .createHash("sha256")
    .update(ip + (process.env.CRON_SECRET || "salt"))
    .digest("hex");
}

function getIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get("post_id");
  if (!postId) {
    return NextResponse.json({ error: "post_id required" }, { status: 400 });
  }

  const ipHash = hashIP(getIP(request));

  // Check if this IP already liked
  const { data: existing } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("ip_hash", ipHash)
    .limit(1);

  // Get total count
  const { data: post } = await supabase
    .from("posts")
    .select("like_count")
    .eq("id", postId)
    .single();

  return NextResponse.json({
    liked: existing !== null && existing.length > 0,
    count: post?.like_count ?? 0,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { post_id } = await request.json();
    if (!post_id) {
      return NextResponse.json({ error: "post_id required" }, { status: 400 });
    }

    const ipHash = hashIP(getIP(request));

    // Check if already liked
    const { data: existing } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", post_id)
      .eq("ip_hash", ipHash)
      .limit(1);

    if (existing && existing.length > 0) {
      // Unlike — delete and decrement
      await supabase.from("post_likes").delete().eq("id", existing[0].id);
      const { data: post } = await supabase
        .from("posts")
        .select("like_count")
        .eq("id", post_id)
        .single();
      const newCount = Math.max(0, (post?.like_count ?? 0) - 1);
      await supabase.from("posts").update({ like_count: newCount }).eq("id", post_id);

      return NextResponse.json({ liked: false, count: newCount });
    } else {
      // Like — insert and increment
      await supabase.from("post_likes").insert({ post_id, ip_hash: ipHash });
      const { data: post } = await supabase
        .from("posts")
        .select("like_count")
        .eq("id", post_id)
        .single();
      const newCount = (post?.like_count ?? 0) + 1;
      await supabase.from("posts").update({ like_count: newCount }).eq("id", post_id);

      return NextResponse.json({ liked: true, count: newCount });
    }
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
