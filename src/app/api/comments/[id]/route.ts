import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

import { createClient as createServerClient } from "@/lib/supabase/server";

// Service-role client for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ---------------------------------------------------------------------------
// DELETE /api/comments/[id]
// ---------------------------------------------------------------------------
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // --- Fetch the comment first ----------------------------------------------
  const { data: comment, error: fetchError } = await supabaseAdmin
    .from("comments")
    .select("id, password_hash")
    .eq("id", id)
    .single();

  if (fetchError || !comment) {
    return NextResponse.json(
      { error: "Comment not found" },
      { status: 404 },
    );
  }

  // --- Admin check ----------------------------------------------------------
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdmin =
    user != null && user.id === process.env.ADMIN_USER_ID;

  if (isAdmin) {
    const { error: deleteError } = await supabaseAdmin
      .from("comments")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  }

  // --- Password check -------------------------------------------------------
  let body: { password?: string };

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { password } = body;

  if (!password) {
    return NextResponse.json(
      { error: "Password is required" },
      { status: 401 },
    );
  }

  const match = await bcrypt.compare(password, comment.password_hash);

  if (!match) {
    return NextResponse.json(
      { error: "Wrong password" },
      { status: 401 },
    );
  }

  const { error: deleteError } = await supabaseAdmin
    .from("comments")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
