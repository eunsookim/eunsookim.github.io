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

export async function POST(request: NextRequest) {
  try {
    const { post_id } = await request.json();
    if (!post_id || !UUID_REGEX.test(post_id)) {
      return NextResponse.json({ error: "valid post_id required" }, { status: 400 });
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || "unknown";
    const ipHash = hashIP(ip);

    const { data, error } = await supabase.rpc("record_view", {
      target_post_id: post_id,
      user_ip_hash: ipHash,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: data.counted ? "counted" : "already counted",
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
