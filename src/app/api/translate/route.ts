import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEEPL_API_URL = "https://api-free.deepl.com/v2/translate";

export async function POST(request: NextRequest) {
  // Admin authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== process.env.ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { texts } = await request.json();

  if (!Array.isArray(texts) || texts.length === 0) {
    return NextResponse.json(
      { error: "texts array required" },
      { status: 400 },
    );
  }

  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "DEEPL_API_KEY not configured" },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(DEEPL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `DeepL-Auth-Key ${apiKey}`,
      },
      body: JSON.stringify({
        text: texts,
        source_lang: "KO",
        target_lang: "EN",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `DeepL API error: ${error}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    const translations = data.translations.map(
      (t: { text: string }) => t.text,
    );

    return NextResponse.json({ translations });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
