import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { SUPPORTED_LANGS, DEFAULT_LANG } from "@/lib/i18n/utils";

function detectLanguage(request: NextRequest): string {
  // 1. Cookie
  const cookieLang = request.cookies.get("preferred-lang")?.value;
  if (cookieLang && SUPPORTED_LANGS.includes(cookieLang as any)) {
    return cookieLang;
  }

  // 2. Accept-Language header
  const acceptLang = request.headers.get("accept-language") ?? "";
  if (acceptLang.toLowerCase().includes("ko")) {
    return "ko";
  }

  // 3. IP country (Vercel header)
  const country = request.headers.get("x-vercel-ip-country");
  if (country === "KR") {
    return "ko";
  }

  // 4. Default
  return DEFAULT_LANG;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes: existing auth check
  if (pathname.startsWith("/admin")) {
    return await updateSession(request);
  }

  // API routes: pass through (handled by matcher exclusion, but extra safety)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Check if pathname starts with a supported language
  const pathSegments = pathname.split("/");
  const pathLang = pathSegments[1]; // e.g., "ko" or "en"

  if (SUPPORTED_LANGS.includes(pathLang as any)) {
    // Valid language prefix — pass through
    return NextResponse.next();
  }

  // No valid language prefix — detect and redirect
  const lang = detectLanguage(request);
  const newUrl = request.nextUrl.clone();
  newUrl.pathname = `/${lang}${pathname}`;
  return NextResponse.redirect(newUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|.*\\..*).*)"],
};
