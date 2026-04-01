import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function hashIP(ip: string): string {
  const salt = process.env.IP_HASH_SALT;
  if (!salt) throw new Error("IP_HASH_SALT environment variable is required");
  return crypto.createHash("sha256").update(ip + salt).digest("hex");
}

function getIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get("post_id");
  if (!postId || !UUID_REGEX.test(postId)) {
    return NextResponse.json({ error: "valid post_id required" }, { status: 400 });
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
    if (!post_id || !UUID_REGEX.test(post_id)) {
      return NextResponse.json({ error: "valid post_id required" }, { status: 400 });
    }

    const ipHash = hashIP(getIP(request));

    const { data, error } = await supabase.rpc("toggle_like", {
      target_post_id: post_id,
      user_ip_hash: ipHash,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
