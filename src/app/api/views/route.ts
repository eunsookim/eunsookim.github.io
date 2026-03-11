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

export async function POST(request: NextRequest) {
  try {
    const { post_id } = await request.json();
    if (!post_id) {
      return NextResponse.json({ error: "post_id required" }, { status: 400 });
    }

    // Get IP from headers
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const ipHash = hashIP(ip);

    // Check for duplicate view within 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("post_views")
      .select("id")
      .eq("post_id", post_id)
      .eq("ip_hash", ipHash)
      .gte("viewed_at", twentyFourHoursAgo)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ message: "already counted" });
    }

    // Record view and increment count
    await supabase.from("post_views").insert({ post_id, ip_hash: ipHash });
    await supabase.rpc("increment_view_count", { target_post_id: post_id });

    return NextResponse.json({ message: "counted" });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
