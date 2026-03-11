import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateBlogDraft } from "@/lib/gemini";

export async function GET(request: NextRequest) {
  // Vercel Cron 인증
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // 오늘 날짜의 pending 캘린더 항목 조회
  const today = new Date().toISOString().split("T")[0];
  const { data: calendarItems } = await supabase
    .from("content_calendar")
    .select("*")
    .eq("scheduled_date", today)
    .eq("status", "pending");

  if (!calendarItems || calendarItems.length === 0) {
    return NextResponse.json({ message: "No pending items for today" });
  }

  const results = [];

  for (const item of calendarItems) {
    // Gemini로 초안 생성
    const draft = await generateBlogDraft({
      topic: item.topic,
      keyPoints: item.key_points,
      references: item.references,
      categorySlug: item.category_slug,
    });

    // 카테고리 ID 조회
    let categoryId = null;
    if (item.category_slug) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", item.category_slug)
        .single();
      categoryId = cat?.id ?? null;
    }

    // 포스트 저장
    const slug = draft.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const { data: post } = await supabase
      .from("posts")
      .insert({
        slug,
        title: draft.title,
        content: draft.content,
        excerpt: draft.excerpt,
        tags: draft.tags,
        category_id: categoryId,
        is_published: false,
        status: "pending_review",
        generated_by: "ai",
      })
      .select("id")
      .single();

    // 캘린더 상태 업데이트
    await supabase
      .from("content_calendar")
      .update({
        status: "generated",
        generated_post_id: post?.id,
      })
      .eq("id", item.id);

    results.push({ topic: item.topic, postId: post?.id });
  }

  return NextResponse.json({ generated: results });
}
