import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

import type { Comment, CommentWithReplies } from "@/lib/types";
import { createClient as createServerClient } from "@/lib/supabase/server";

// Service-role client for bypassing RLS on INSERT
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Fields safe to return to the client (no password_hash, no ip_address)
const PUBLIC_FIELDS =
  "id, post_id, parent_id, author_name, content, created_at";

// ---------------------------------------------------------------------------
// GET /api/comments?post_id=<uuid>
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get("post_id");

  if (!postId) {
    return NextResponse.json(
      { error: "post_id is required" },
      { status: 400 },
    );
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("comments")
    .select(PUBLIC_FIELDS)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const comments = data as Comment[];

  // Separate top-level comments and replies
  const topLevel: CommentWithReplies[] = [];
  const repliesByParent = new Map<string, Comment[]>();

  for (const c of comments) {
    if (c.parent_id === null) {
      topLevel.push({ ...c, replies: [] });
    } else {
      const list = repliesByParent.get(c.parent_id) ?? [];
      list.push(c);
      repliesByParent.set(c.parent_id, list);
    }
  }

  // Attach replies to their parent
  for (const parent of topLevel) {
    parent.replies = repliesByParent.get(parent.id) ?? [];
  }

  return NextResponse.json(topLevel);
}

// ---------------------------------------------------------------------------
// POST /api/comments
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  let body: {
    post_id?: string;
    parent_id?: string | null;
    author_name?: string;
    password?: string;
    content?: string;
    website?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { post_id, parent_id, author_name, password, content, website } = body;

  // Honeypot check — bots fill the hidden "website" field
  if (website) {
    return NextResponse.json({ success: true }); // fake success
  }

  // --- Validation -----------------------------------------------------------
  if (!post_id) {
    return NextResponse.json(
      { error: "post_id is required" },
      { status: 400 },
    );
  }

  if (
    !author_name ||
    author_name.length < 1 ||
    author_name.length > 50
  ) {
    return NextResponse.json(
      { error: "author_name must be 1-50 characters" },
      { status: 400 },
    );
  }

  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "password must be at least 6 characters" },
      { status: 400 },
    );
  }

  if (!content || content.length < 1 || content.length > 1000) {
    return NextResponse.json(
      { error: "content must be 1-1000 characters" },
      { status: 400 },
    );
  }

  // --- Depth check ----------------------------------------------------------
  if (parent_id) {
    const { data: parentComment, error: parentError } = await supabaseAdmin
      .from("comments")
      .select("id, parent_id")
      .eq("id", parent_id)
      .single();

    if (parentError || !parentComment) {
      return NextResponse.json(
        { error: "Parent comment not found" },
        { status: 400 },
      );
    }

    if (parentComment.parent_id !== null) {
      return NextResponse.json(
        { error: "Nested replies are not allowed" },
        { status: 400 },
      );
    }
  }

  // --- IP & Rate limit ------------------------------------------------------
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();

  const { data: recentComments } = await supabaseAdmin
    .from("comments")
    .select("id")
    .eq("ip_address", ip)
    .gte("created_at", oneMinuteAgo)
    .limit(1);

  if (recentComments && recentComments.length > 0) {
    return NextResponse.json(
      { error: "댓글은 1분에 1개만 작성할 수 있습니다." },
      { status: 429 },
    );
  }

  // --- Hash password & Insert -----------------------------------------------
  const passwordHash = await bcrypt.hash(password, 10);

  const { data: created, error: insertError } = await supabaseAdmin
    .from("comments")
    .insert({
      post_id,
      parent_id: parent_id ?? null,
      author_name,
      password_hash: passwordHash,
      content,
      ip_address: ip,
    })
    .select(PUBLIC_FIELDS)
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 },
    );
  }

  return NextResponse.json(created, { status: 201 });
}
