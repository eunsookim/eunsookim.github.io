# i18n (다국어 지원) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사이트 전체를 한국어/영어 다국어로 지원한다. 서브패스 라우팅, 자동 언어 감지, DeepL 번역을 구현한다.

**Architecture:** Next.js App Router의 `[lang]` 동적 세그먼트로 서브패스 라우팅. 미들웨어에서 쿠키 > Accept-Language > IP 기반 언어 감지 후 리다이렉트. DB에 `_en` 접미사 컬럼 추가로 영어 콘텐츠 저장. 관리자 에디터에서 DeepL Free API로 자동 번역.

**Tech Stack:** Next.js 16 App Router, Supabase, DeepL Free API, TypeScript

**Note:** 이 프로젝트에는 테스트 프레임워크(jest/vitest)가 설정되어 있지 않다. 각 태스크의 검증은 `npx tsc --noEmit` (타입 체크) + `npm run build` (빌드 검증)으로 수행한다.

---

## Chunk 1: Foundation

### Task 1: i18n 유틸리티 및 타입 정의

**Files:**
- Create: `src/lib/i18n/utils.ts`
- Create: `src/lib/i18n/messages.ts`
- Modify: `src/lib/types.ts`

- [ ] **Step 1: i18n 유틸리티 파일 생성**

`src/lib/i18n/utils.ts`:
```typescript
export const SUPPORTED_LANGS = ["ko", "en"] as const;
export const DEFAULT_LANG = "ko";
export type Lang = (typeof SUPPORTED_LANGS)[number];

export function isValidLang(lang: string): lang is Lang {
  return SUPPORTED_LANGS.includes(lang as Lang);
}
```

- [ ] **Step 2: 메시지 사전 생성**

`src/lib/i18n/messages.ts` — 사이트 전체 정적 텍스트의 ko/en 버전. 키 구조:

```typescript
import type { Lang } from "./utils";

const messages = {
  ko: {
    nav: {
      home: "홈",
      blog: "블로그",
      portfolio: "포트폴리오",
      about: "소개",
    },
    hero: {
      tagline: "~/eunsookim.dev",
      heading: "$ hello world_",
      description: "기술에 대한 생각과 의견, 그리고 배움을 기록하는 개발 블로그.",
      blogButton: "Blog 보기",
      portfolioButton: "Portfolio",
    },
    blog: {
      title: "블로그",
      latestPosts: "최근 글",
      viewAll: "모든 글 보기",
      readMore: "더 읽기",
      search: "검색...",
      allCategories: "전체",
      noResults: "게시글이 없습니다.",
      prev: "이전",
      next: "다음",
    },
    portfolio: {
      title: "Portfolio",
      description: "프로젝트 포트폴리오 - 개발한 프로젝트들을 소개합니다.",
      demo: "Demo",
      github: "GitHub",
      noProjects: "프로젝트가 없습니다.",
    },
    about: {
      title: "About",
      description: "안녕하세요, 개발자 김은수입니다.",
      skills: "기술 스택",
      contact: "연락처",
    },
    series: {
      postsInSeries: "시리즈 목록",
    },
    comment: {
      title: "댓글",
      name: "이름",
      password: "비밀번호",
      content: "내용",
      submit: "작성",
      reply: "답글",
      delete: "삭제",
      deleteConfirm: "비밀번호를 입력하세요",
      deleteButton: "삭제",
      cancelButton: "취소",
      noComments: "아직 댓글이 없습니다.",
      replyTo: "답글 작성",
    },
    footer: {
      copyright: "© {year} eunsookim.dev. All rights reserved.",
    },
    lang: {
      toggle: "EN",
    },
  },
  en: {
    nav: {
      home: "Home",
      blog: "Blog",
      portfolio: "Portfolio",
      about: "About",
    },
    hero: {
      tagline: "~/eunsookim.dev",
      heading: "$ hello world_",
      description: "A dev blog recording thoughts, opinions, and learnings about technology.",
      blogButton: "View Blog",
      portfolioButton: "Portfolio",
    },
    blog: {
      title: "Blog",
      latestPosts: "Latest Posts",
      viewAll: "View all posts",
      readMore: "Read more",
      search: "Search...",
      allCategories: "All",
      noResults: "No posts found.",
      prev: "Previous",
      next: "Next",
    },
    portfolio: {
      title: "Portfolio",
      description: "Project portfolio - showcasing my development projects.",
      demo: "Demo",
      github: "GitHub",
      noProjects: "No projects yet.",
    },
    about: {
      title: "About",
      description: "Hello, I'm Eunsoo Kim, a developer.",
      skills: "Tech Stack",
      contact: "Contact",
    },
    series: {
      postsInSeries: "Posts in this series",
    },
    comment: {
      title: "Comments",
      name: "Name",
      password: "Password",
      content: "Content",
      submit: "Submit",
      reply: "Reply",
      delete: "Delete",
      deleteConfirm: "Enter your password",
      deleteButton: "Delete",
      cancelButton: "Cancel",
      noComments: "No comments yet.",
      replyTo: "Write a reply",
    },
    footer: {
      copyright: "© {year} eunsookim.dev. All rights reserved.",
    },
    lang: {
      toggle: "KO",
    },
  },
} as const;

export type Messages = (typeof messages)["ko"];

export function getMessages(lang: Lang): Messages {
  return messages[lang];
}
```

- [ ] **Step 3: types.ts에 영어 필드 추가**

`src/lib/types.ts` — 각 인터페이스에 영어 컬럼 추가:

Post에 추가:
```typescript
title_en: string | null;
content_en: string | null;
excerpt_en: string | null;
```

Project에 추가:
```typescript
title_en: string | null;
description_en: string | null;
```

Category에 추가:
```typescript
name_en: string | null;
description_en: string | null;
```

Series에 추가:
```typescript
title_en: string | null;
description_en: string | null;
```

- [ ] **Step 4: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 성공 (아직 새 필드를 사용하는 코드 없음)

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n/ src/lib/types.ts
git commit -m "feat: add i18n foundation (types, messages, utils)"
```

---

### Task 2: DB 마이그레이션

**Files:**
- Create: `supabase/migrations/003_i18n_columns.sql`

- [ ] **Step 1: 마이그레이션 파일 생성**

`supabase/migrations/003_i18n_columns.sql`:
```sql
-- ============================================================================
-- i18n columns migration
-- ============================================================================
-- Adds English translation columns to posts, projects, categories, series.
-- Must be run AFTER 001_initial_schema.sql and 002_comments.sql.
-- ============================================================================

-- posts
ALTER TABLE public.posts
  ADD COLUMN title_en TEXT,
  ADD COLUMN content_en TEXT,
  ADD COLUMN excerpt_en TEXT;

-- projects
ALTER TABLE public.projects
  ADD COLUMN title_en TEXT,
  ADD COLUMN description_en TEXT;

-- categories
ALTER TABLE public.categories
  ADD COLUMN name_en TEXT,
  ADD COLUMN description_en TEXT;

-- series
ALTER TABLE public.series
  ADD COLUMN title_en TEXT,
  ADD COLUMN description_en TEXT;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/003_i18n_columns.sql
git commit -m "feat: add i18n columns migration (posts, projects, categories, series)"
```

---

### Task 3: 미들웨어 — 언어 감지 + 리다이렉트

**Files:**
- Modify: `middleware.ts`
- Modify: `src/lib/supabase/middleware.ts` (import 변경 없음, 참고용)

- [ ] **Step 1: middleware.ts 재작성**

`middleware.ts` — 언어 감지 로직 추가. 우선순위: 쿠키 > Accept-Language > IP > 기본값(ko).

```typescript
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
```

핵심 변경:
- matcher 확장: 모든 페이지 라우트 매칭 (API, static 제외)
- `/admin` 경로: 기존 인증 로직 유지
- `/ko/...`, `/en/...`: 정상 통과
- 그 외 (`/`, `/blog` 등): 언어 감지 후 `/{lang}{pathname}`으로 리다이렉트

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 성공

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add i18n language detection middleware"
```

---

## Chunk 2: Route Restructuring & Layout

### Task 4: 공개 라우트를 [lang] 세그먼트 아래로 이동

**Files:**
- Move: `src/app/(public)/*` → `src/app/[lang]/(public)/*`
- Modify: `src/app/layout.tsx` — `lang` 동적 설정
- Create: `src/app/[lang]/layout.tsx` — lang 파라미터를 받아 html lang 속성 설정

이 태스크는 파일 이동과 레이아웃 수정을 동시에 수행한다. 파일 이동만으로는 빌드가 깨지므로 원자적으로 처리한다.

- [ ] **Step 1: [lang] 디렉토리 생성 및 파일 이동**

```bash
mkdir -p src/app/\[lang\]
mv src/app/\(public\) src/app/\[lang\]/\(public\)
```

- [ ] **Step 2: src/app/layout.tsx 수정**

`<html lang="en">`에서 `lang` 속성 제거 (하위 레이아웃에서 처리). RootLayout은 이제 lang을 모르므로 기본값 사용:

```typescript
// 변경 전:
<html lang="en" suppressHydrationWarning>

// 변경 후:
<html suppressHydrationWarning>
```

- [ ] **Step 3: SetHtmlLang 클라이언트 컴포넌트 생성**

Next.js App Router에서 root layout만 `<html>` 태그를 포함하며, root layout은 `[lang]` params에 접근할 수 없다. 따라서 클라이언트 컴포넌트로 `document.documentElement.lang`을 동적 설정한다.

`src/components/set-html-lang.tsx`:
```typescript
"use client";

import { useEffect } from "react";

export function SetHtmlLang({ lang }: { lang: string }) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
```

- [ ] **Step 4: src/app/[lang]/layout.tsx 생성**

이 레이아웃은 `[lang]` 세그먼트의 값을 검증하고, `SetHtmlLang`으로 html lang 속성을 설정한다.

```typescript
import { notFound } from "next/navigation";
import { isValidLang } from "@/lib/i18n/utils";
import { SetHtmlLang } from "@/components/set-html-lang";

interface LangLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params;

  if (!isValidLang(lang)) {
    notFound();
  }

  return (
    <>
      <SetHtmlLang lang={lang} />
      {children}
    </>
  );
}
```

lang이 `ko`나 `en`이 아니면 404. `SetHtmlLang`이 클라이언트에서 `<html lang>` 속성을 동적 설정한다.

- [ ] **Step 4: src/app/[lang]/(public)/layout.tsx 수정**

Header와 Footer에 `lang` prop 전달:

```typescript
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import type { Lang } from "@/lib/i18n/utils";

interface PublicLayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export default async function PublicLayout({ children, params }: PublicLayoutProps) {
  const { lang } = await params;

  return (
    <div className="flex min-h-svh flex-col">
      <Header lang={lang as Lang} />
      <main className="flex-1">{children}</main>
      <Footer lang={lang as Lang} />
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: move public routes under [lang] segment"
```

---

### Task 5: Header — 언어 토글 + i18n 링크

**Files:**
- Modify: `src/components/layout/header.tsx`

- [ ] **Step 1: Header에 lang prop 추가 및 링크 업데이트**

주요 변경:
1. `lang: Lang` prop 추가
2. navLinks의 href를 `/${lang}/blog` 형태로 변경
3. 로고 링크: `/${lang}`
4. pathname 비교 시 lang prefix 고려
5. 언어 전환 버튼 추가 (KO ↔ EN)

```typescript
// props에 추가:
import type { Lang } from "@/lib/i18n/utils";
import { getMessages } from "@/lib/i18n/messages";

interface HeaderProps {
  lang: Lang;
}

export function Header({ lang }: HeaderProps) {
  const pathname = usePathname();
  const messages = getMessages(lang);

  const navLinks = [
    { href: `/${lang}/blog`, label: messages.nav.blog },
    { href: `/${lang}/portfolio`, label: messages.nav.portfolio },
    { href: `/${lang}/about`, label: messages.nav.about },
  ];

  // 언어 전환: 현재 경로에서 lang prefix만 교체
  const otherLang = lang === "ko" ? "en" : "ko";
  const switchLangHref = pathname?.replace(`/${lang}`, `/${otherLang}`) ?? `/${otherLang}`;
```

언어 전환 버튼 (ThemeToggle 옆에 배치):
```tsx
function LanguageToggle({ lang, switchHref }: { lang: Lang; switchHref: string }) {
  const messages = getMessages(lang);

  const handleSwitch = () => {
    // Set cookie for preference persistence
    document.cookie = `preferred-lang=${lang === "ko" ? "en" : "ko"}; path=/; max-age=${60 * 60 * 24 * 365}`;
    window.location.href = switchHref;
  };

  return (
    <Button variant="ghost" size="icon" aria-label="Switch language" onClick={handleSwitch}>
      <span className="text-xs font-bold">{messages.lang.toggle}</span>
    </Button>
  );
}
```

로고 링크 변경:
```tsx
// 변경 전:
<Link href="/" ...>

// 변경 후:
<Link href={`/${lang}`} ...>
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/header.tsx
git commit -m "feat: header i18n (lang toggle, localized nav links)"
```

---

### Task 6: Footer i18n

**Files:**
- Modify: `src/components/layout/footer.tsx`

- [ ] **Step 1: Footer에 lang prop 추가**

Footer에 `lang` prop을 받아 `messages[lang].footer.copyright` 사용:

```typescript
import type { Lang } from "@/lib/i18n/utils";
import { getMessages } from "@/lib/i18n/messages";

interface FooterProps {
  lang: Lang;
}

export function Footer({ lang }: FooterProps) {
  const messages = getMessages(lang);
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 py-6">
      <div className="mx-auto max-w-4xl px-4 text-center font-mono text-sm text-muted-foreground">
        {messages.footer.copyright.replace("{year}", String(year))}
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/footer.tsx
git commit -m "feat: footer i18n"
```

---

## Chunk 3: Components i18n

컴포넌트에 `lang` prop을 먼저 추가한 후, 페이지에서 전달한다. 이 순서가 중요 — 페이지보다 컴포넌트를 먼저 수정해야 타입 에러 없이 커밋할 수 있다.

### Task 7: Blog 및 Portfolio 컴포넌트 i18n

**Files:**
- Modify: `src/components/blog/post-card.tsx`
- Modify: `src/components/blog/category-filter.tsx`
- Modify: `src/components/blog/search-bar.tsx`
- Modify: `src/components/blog/pagination.tsx`
- Modify: `src/components/blog/series-nav.tsx`
- Modify: `src/components/blog/comment-section.tsx`
- Modify: `src/components/portfolio/project-card.tsx`

모든 컴포넌트에 동일 패턴 적용:
1. `lang: Lang` prop 추가 (옵셔널이 아닌 필수)
2. 링크에 `/${lang}/` prefix 추가
3. 하드코딩 텍스트를 `getMessages(lang)` 사용
4. 데이터 표시 시 lang에 따라 `_en` 필드 선택

- [ ] **Step 1: PostCard**

```typescript
import type { Lang } from "@/lib/i18n/utils";

interface PostCardProps {
  post: PostWithRelations;
  lang: Lang;
}

export function PostCard({ post, lang }: PostCardProps) {
  const title = lang === "en" ? (post.title_en ?? post.title) : post.title;
  const excerpt = lang === "en" ? (post.excerpt_en ?? post.excerpt) : post.excerpt;
  // 링크: /${lang}/blog/${post.slug}
```

- [ ] **Step 2: CategoryFilter**

```typescript
interface CategoryFilterProps {
  categories: Category[];
  lang: Lang;
}
```

카테고리 이름: `lang === "en" ? (cat.name_en ?? cat.name) : cat.name`
"전체" 라벨: `t.blog.allCategories`

- [ ] **Step 3: SearchBar**

placeholder: `t.blog.search`

- [ ] **Step 4: Pagination**

이전/다음 라벨: `t.blog.prev`, `t.blog.next`

- [ ] **Step 5: SeriesNav**

시리즈 제목: lang에 따라 `title_en ?? title`
포스트 제목: lang에 따라 `title_en ?? title`
링크: `/${lang}/blog/${post.slug}`

- [ ] **Step 6: CommentSection**

```typescript
interface CommentSectionProps {
  postId: string;
  lang: Lang;
}
```

폼 라벨: `t.comment.name`, `t.comment.password`, `t.comment.content`
버튼: `t.comment.submit`, `t.comment.reply`, `t.comment.delete`
다이얼로그: `t.comment.deleteConfirm`, `t.comment.deleteButton`, `t.comment.cancelButton`
빈 상태: `t.comment.noComments`

- [ ] **Step 7: ProjectCard**

```typescript
interface ProjectCardProps {
  project: Project;
  lang: Lang;
}
```

제목/설명: lang에 따라 `_en` 필드 선택.
링크: `/${lang}/portfolio/${project.slug}`

- [ ] **Step 8: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 페이지에서 아직 lang prop을 전달하지 않아 에러 발생 가능. 페이지 수정은 다음 Chunk에서 수행.

- [ ] **Step 9: Commit**

```bash
git add src/components/blog/ src/components/portfolio/
git commit -m "feat: blog and portfolio components i18n (lang prop added)"
```

---

## Chunk 4: Public Pages i18n

모든 공개 페이지를 수정하여 `lang` param을 받고, 컴포넌트에 전달한다.
Chunk 3에서 컴포넌트에 `lang` prop이 이미 추가되었으므로, 페이지에서 전달만 하면 된다.

### Task 8: Homepage i18n

**Files:**
- Modify: `src/app/[lang]/(public)/page.tsx`

- [ ] **Step 1: params에 lang 추가, 메시지 사용**

```typescript
import type { Lang } from "@/lib/i18n/utils";
import { getMessages } from "@/lib/i18n/messages";

// params 타입 (기존에 없었으므로 추가)
interface HomePageProps {
  params: Promise<{ lang: string }>;
}

export default async function Home({ params }: HomePageProps) {
  const { lang } = await params;
  const t = getMessages(lang as Lang);
  const posts = await getLatestPosts();
```

변경해야 할 하드코딩 텍스트:
- `"~/eunsookim.dev"` → `t.hero.tagline`
- `"$ hello world_"` → `t.hero.heading`
- `"기술에 대한 생각과 의견..."` → `t.hero.description`
- `"Blog 보기"` → `t.hero.blogButton`
- `"Portfolio"` → `t.hero.portfolioButton`
- `"# 최근 글"` → 별도 구성: `<span className="text-primary">#</span> {t.blog.latestPosts}`
- `"모든 글 보기"` → `t.blog.viewAll`

링크 변경:
- `href="/blog"` → `href={\`/${lang}/blog\`}`
- `href="/portfolio"` → `href={\`/${lang}/portfolio\`}`

PostCard에 `lang` prop 전달:
```tsx
<PostCard key={post.id} post={post} lang={lang as Lang} />
```

- [ ] **Step 2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 성공 (Chunk 3에서 컴포넌트의 lang prop이 이미 추가됨)

- [ ] **Step 3: Commit**

```bash
git add src/app/\\[lang\\]/\\(public\\)/page.tsx
git commit -m "feat: homepage i18n"
```

---

### Task 9: Blog 목록 페이지 i18n

**Files:**
- Modify: `src/app/[lang]/(public)/blog/page.tsx`

- [ ] **Step 1: params에 lang 추가**

```typescript
interface BlogPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{
    category?: string;
    tag?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function BlogPage({ params, searchParams }: BlogPageProps) {
  const { lang } = await params;
  const t = getMessages(lang as Lang);
```

- [ ] **Step 2: 카테고리 이름 i18n**

카테고리 표시 시 `lang === "en"`이면 `category.name_en ?? category.name` 사용. CategoryFilter 컴포넌트에 `lang` 전달.

- [ ] **Step 3: 검색/페이지네이션 컴포넌트에 lang 전달**

```tsx
<SearchBar lang={lang as Lang} />
<CategoryFilter categories={typedCategories} lang={lang as Lang} />
<Pagination ... lang={lang as Lang} />
<PostCard post={post} lang={lang as Lang} />
```

- [ ] **Step 4: 정적 텍스트 교체**

하드코딩된 한국어 텍스트를 `t.blog.*`로 교체.

- [ ] **Step 5: Commit**

```bash
git add src/app/\\[lang\\]/\\(public\\)/blog/page.tsx
git commit -m "feat: blog list page i18n"
```

---

### Task 10: Blog 상세 페이지 + 시리즈 페이지 i18n

**Files:**
- Modify: `src/app/[lang]/(public)/blog/[slug]/page.tsx`
- Modify: `src/app/[lang]/(public)/blog/series/[slug]/page.tsx`

- [ ] **Step 1: Blog 상세 params에 lang 추가**

```typescript
interface BlogPostPageProps {
  params: Promise<{ lang: string; slug: string }>;
}
```

- [ ] **Step 2: 콘텐츠 lang에 따라 선택**

```typescript
const { lang, slug } = await params;
const post = await getPost(slug);
// 제목, 내용, 요약: lang에 따라 선택
const title = lang === "en" ? (post.title_en ?? post.title) : post.title;
const content = lang === "en" ? (post.content_en ?? post.content) : post.content;
const excerpt = lang === "en" ? (post.excerpt_en ?? post.excerpt) : post.excerpt;
```

- [ ] **Step 3: generateMetadata에서 lang 반영**

```typescript
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { lang, slug } = await params;
  const post = await getPost(slug);
  const title = lang === "en" ? (post?.title_en ?? post?.title) : post?.title;
  // ...
}
```

- [ ] **Step 4: 하위 컴포넌트에 lang 전달**

```tsx
<CommentSection postId={post.id} lang={lang as Lang} />
<SeriesNav ... lang={lang as Lang} />
```

링크에 lang prefix:
- 카테고리 링크: `/${lang}/blog?category=${post.category.slug}`
- 태그 링크: `/${lang}/blog?tag=${tag}`

- [ ] **Step 5: 시리즈 페이지도 동일 패턴 적용**

`src/app/[lang]/(public)/blog/series/[slug]/page.tsx`:
```typescript
interface SeriesPageProps {
  params: Promise<{ lang: string; slug: string }>;
}
```

시리즈 제목: `lang === "en" ? (series.title_en ?? series.title) : series.title`
포스트 제목도 동일 패턴.

- [ ] **Step 6: Commit**

```bash
git add src/app/\\[lang\\]/\\(public\\)/blog/
git commit -m "feat: blog detail and series pages i18n"
```

---

### Task 11: Portfolio 페이지 i18n

**Files:**
- Modify: `src/app/[lang]/(public)/portfolio/page.tsx`
- Modify: `src/app/[lang]/(public)/portfolio/[slug]/page.tsx`

- [ ] **Step 1: Portfolio 목록 페이지**

```typescript
interface PortfolioPageProps {
  params: Promise<{ lang: string }>;
}

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  const { lang } = await params;
  const t = getMessages(lang as Lang);
```

ProjectCard에 lang 전달. 제목/설명: lang에 따라 `title_en ?? title` 패턴.

- [ ] **Step 2: Portfolio 상세 페이지**

```typescript
interface PortfolioDetailPageProps {
  params: Promise<{ lang: string; slug: string }>;
}
```

`project.title` → lang에 따라 `title_en` 사용.
`project.description` → lang에 따라 `description_en` 사용.
metadata도 동일 패턴.

- [ ] **Step 3: 정적 텍스트 교체**

하드코딩된 한국어 → `t.portfolio.*` 사용.

- [ ] **Step 4: Commit**

```bash
git add src/app/\\[lang\\]/\\(public\\)/portfolio/
git commit -m "feat: portfolio pages i18n"
```

---

### Task 12: About 페이지 i18n

**Files:**
- Modify: `src/app/[lang]/(public)/about/page.tsx`

- [ ] **Step 1: params에 lang 추가**

```typescript
interface AboutPageProps {
  params: Promise<{ lang: string }>;
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { lang } = await params;
  const t = getMessages(lang as Lang);
```

- [ ] **Step 2: 정적 텍스트 교체**

- 페이지 제목, 설명: `t.about.*` 사용
- SKILLS 객체의 키 (Languages, Frontend 등)는 영어이므로 변경 불필요
- metadata의 title, description: lang에 따라 다른 값

- [ ] **Step 3: generateMetadata를 동적으로 변경**

```typescript
export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = getMessages(lang as Lang);
  return {
    title: t.about.title,
    description: t.about.description,
  };
}
```

기존 `export const metadata` (정적)를 `generateMetadata` 함수(동적)로 교체.

- [ ] **Step 4: Commit**

```bash
git add src/app/\\[lang\\]/\\(public\\)/about/page.tsx
git commit -m "feat: about page i18n"
```

---

## Chunk 5: Admin & Translation

### Task 13: Translate API Route

**Files:**
- Create: `src/app/api/translate/route.ts`
- Modify: `.env.local.example`

- [ ] **Step 1: API 라우트 생성**

`src/app/api/translate/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEEPL_API_URL = "https://api-free.deepl.com/v2/translate";

export async function POST(request: NextRequest) {
  // Admin authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== process.env.ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { texts } = await request.json();

  if (!Array.isArray(texts) || texts.length === 0) {
    return NextResponse.json({ error: "texts array required" }, { status: 400 });
  }

  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "DEEPL_API_KEY not configured" }, { status: 500 });
  }

  try {
    const response = await fetch(DEEPL_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `DeepL-Auth-Key ${apiKey}` },
      body: JSON.stringify({
        text: texts,
        source_lang: "KO",
        target_lang: "EN",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: `DeepL API error: ${error}` }, { status: response.status });
    }

    const data = await response.json();
    const translations = data.translations.map((t: { text: string }) => t.text);

    return NextResponse.json({ translations });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Translation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

요청 형태: `POST /api/translate { texts: ["한국어 텍스트1", "한국어 텍스트2"] }`
응답 형태: `{ translations: ["English text1", "English text2"] }`

- [ ] **Step 2: .env.local.example 업데이트**

추가:
```
# DeepL Translation
DEEPL_API_KEY=your-deepl-api-key
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/translate/route.ts .env.local.example
git commit -m "feat: add translate API route (DeepL Free)"
```

---

### Task 14: Post Editor — ko/en 탭 + 번역 버튼

**Files:**
- Modify: `src/components/admin/post-editor.tsx`

이 태스크는 가장 복잡한 컴포넌트 변경이다. 에디터에 한국어/영어 탭을 추가하고, "번역" 버튼으로 DeepL API를 호출한다.

- [ ] **Step 1: 영어 필드 상태 추가**

```typescript
// 기존 state 아래에 추가:
const [titleEn, setTitleEn] = useState(post?.title_en ?? "");
const [excerptEn, setExcerptEn] = useState(post?.excerpt_en ?? "");
const [contentEn, setContentEn] = useState(post?.content_en ?? "");
const [translating, setTranslating] = useState(false);
const [editorTab, setEditorTab] = useState<"ko" | "en">("ko");
```

- [ ] **Step 2: 번역 함수 추가**

```typescript
const handleTranslate = useCallback(async () => {
  if (!title.trim() && !content.trim()) {
    toast.error("번역할 한국어 콘텐츠가 없습니다.");
    return;
  }

  setTranslating(true);
  try {
    const texts = [title, excerpt, content].filter(Boolean);
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts }),
    });

    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error || "Translation failed");
    }

    const { translations } = await res.json();
    let idx = 0;
    if (title) setTitleEn(translations[idx++]);
    if (excerpt) setExcerptEn(translations[idx++]);
    if (content) setContentEn(translations[idx++]);

    setEditorTab("en");
    toast.success("번역 완료. 영어 탭에서 확인/교정하세요.");
  } catch (err) {
    const message = err instanceof Error ? err.message : "번역에 실패했습니다.";
    toast.error(message);
  } finally {
    setTranslating(false);
  }
}, [title, excerpt, content]);
```

- [ ] **Step 3: UI에 탭 추가**

Tabs 컴포넌트로 한국어/영어 전환. 제목, 요약, 본문 영역을 탭으로 감싼다.

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// 제목 + 요약 + 본문 영역을 Tabs로 감싸기:
<Tabs value={editorTab} onValueChange={(v) => setEditorTab(v as "ko" | "en")}>
  <div className="flex items-center justify-between">
    <TabsList>
      <TabsTrigger value="ko">한국어</TabsTrigger>
      <TabsTrigger value="en">English</TabsTrigger>
    </TabsList>
    <Button
      variant="outline"
      size="sm"
      onClick={handleTranslate}
      disabled={translating}
    >
      {translating ? <Loader2 className="size-4 animate-spin" /> : <Languages className="size-4" />}
      번역
    </Button>
  </div>

  <TabsContent value="ko">
    {/* 기존 한국어 제목/요약/본문 UI 그대로 */}
  </TabsContent>

  <TabsContent value="en">
    {/* 영어 제목 */}
    <div className="space-y-1.5">
      <Label htmlFor="post-title-en">Title (EN)</Label>
      <Input id="post-title-en" value={titleEn} onChange={(e) => { setTitleEn(e.target.value); markDirty(); }} />
    </div>
    {/* 영어 요약 */}
    <div className="space-y-1.5">
      <Label htmlFor="post-excerpt-en">Excerpt (EN)</Label>
      <Textarea id="post-excerpt-en" value={excerptEn} onChange={(e) => { setExcerptEn(e.target.value); markDirty(); }} rows={2} />
    </div>
    {/* 영어 본문 */}
    <div className="space-y-1.5">
      <Label>Content (EN)</Label>
      <div data-color-mode={colorMode}>
        <MDEditor value={contentEn} onChange={(val) => { setContentEn(val ?? ""); markDirty(); }} height={500} preview="live" />
      </div>
    </div>
  </TabsContent>
</Tabs>
```

`Languages` 아이콘: `import { Languages } from "lucide-react"`

- [ ] **Step 4: handleSave에 영어 필드 포함**

payload에 추가:
```typescript
const payload = {
  // ... 기존 필드 ...
  title_en: titleEn.trim() || null,
  excerpt_en: excerptEn.trim() || null,
  content_en: contentEn || null,
};
```

- [ ] **Step 5: DraftState에 영어 필드 추가**

```typescript
interface DraftState {
  // ... 기존 필드 ...
  titleEn: string;
  excerptEn: string;
  contentEn: string;
}
```

자동 저장/복원 로직에 영어 필드 포함.

- [ ] **Step 6: 타입 체크**

Run: `npx tsc --noEmit`

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/post-editor.tsx
git commit -m "feat: post editor ko/en tabs with DeepL translation"
```

---

### Task 15: Admin Portfolio — 영어 필드 입력

**Files:**
- Modify: `src/app/admin/(dashboard)/portfolio/page.tsx`

- [ ] **Step 1: ProjectForm에 영어 필드 추가**

```typescript
type ProjectForm = {
  // ... 기존 필드 ...
  title_en: string;
  description_en: string;
};

const emptyForm: ProjectForm = {
  // ... 기존 필드 ...
  title_en: "",
  description_en: "",
};
```

- [ ] **Step 2: Dialog 폼 UI에 영어 입력 필드 추가**

기존 title/description 아래에 영어 필드 추가:
```tsx
<div className="space-y-1.5">
  <Label htmlFor="project-title-en">Title (EN)</Label>
  <Input id="project-title-en" value={form.title_en} onChange={...} />
</div>
<div className="space-y-1.5">
  <Label htmlFor="project-desc-en">Description (EN)</Label>
  <Textarea id="project-desc-en" value={form.description_en} onChange={...} rows={3} />
</div>
```

- [ ] **Step 3: 저장 payload에 영어 필드 포함**

```typescript
const payload = {
  // ... 기존 ...
  title_en: form.title_en.trim() || null,
  description_en: form.description_en.trim() || null,
};
```

- [ ] **Step 4: 편집 시 기존 영어 데이터 로드**

`handleEdit` 함수에서:
```typescript
setForm({
  // ... 기존 ...
  title_en: project.title_en ?? "",
  description_en: project.description_en ?? "",
});
```

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/\\(dashboard\\)/portfolio/page.tsx
git commit -m "feat: admin portfolio English field inputs"
```

---

### Task 16: Admin Categories/Series + PostMetaBar — 영어 필드 입력

**Files:**
- Modify: `src/app/admin/(dashboard)/categories/page.tsx`
- Modify: `src/components/admin/post-meta-bar.tsx`

- [ ] **Step 1: CategoryForm에 영어 필드 추가**

```typescript
type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  color: string;
  name_en: string;
  description_en: string;
};
```

- [ ] **Step 2: SeriesForm에도 영어 필드 추가**

```typescript
type SeriesForm = {
  title: string;
  slug: string;
  description: string;
  title_en: string;
  description_en: string;
};
```

- [ ] **Step 3: 각 Dialog 폼에 영어 입력 추가**

카테고리 Dialog: name_en, description_en
시리즈 Dialog: title_en, description_en

- [ ] **Step 4: 저장 및 편집 로직에 영어 필드 포함**

기존 패턴과 동일하게 payload에 영어 필드 추가.

- [ ] **Step 5: PostMetaBar에 영어명 표시**

`src/components/admin/post-meta-bar.tsx` — 카테고리/시리즈 Select 드롭다운에서 영어명도 함께 표시. 관리자가 영어 사용자에게 어떻게 보이는지 확인 가능:

```tsx
// SelectItem에서:
<SelectItem value={cat.id}>
  {cat.name} {cat.name_en ? `(${cat.name_en})` : ""}
</SelectItem>
```

시리즈 Select도 동일 패턴:
```tsx
<SelectItem value={series.id}>
  {series.title} {series.title_en ? `(${series.title_en})` : ""}
</SelectItem>
```

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/\\(dashboard\\)/categories/page.tsx src/components/admin/post-meta-bar.tsx
git commit -m "feat: admin categories/series English fields + post-meta-bar i18n display"
```

---

## Chunk 6: SEO & Finalization

### Task 17: Sitemap + hreflang

**Files:**
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: sitemap에 ko/en URL 모두 포함**

```typescript
import { SUPPORTED_LANGS } from "@/lib/i18n/utils";

const BASE_URL = "https://eunsookim.dev";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data: posts } = await supabase.from("posts").select("slug, updated_at").eq("is_published", true);
  const { data: projects } = await supabase.from("projects").select("slug, updated_at");

  const entries: MetadataRoute.Sitemap = [];

  // Static pages — generate for each language
  const staticPaths = ["", "/blog", "/portfolio", "/about"];
  for (const lang of SUPPORTED_LANGS) {
    for (const path of staticPaths) {
      entries.push({
        url: `${BASE_URL}/${lang}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? "weekly" : path === "/blog" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.8,
        alternates: {
          languages: {
            ...Object.fromEntries(
              SUPPORTED_LANGS.map((l) => [l, `${BASE_URL}/${l}${path}`])
            ),
            "x-default": `${BASE_URL}/ko${path}`,
          },
        },
      });
    }
  }

  // Blog posts
  for (const post of posts ?? []) {
    for (const lang of SUPPORTED_LANGS) {
      entries.push({
        url: `${BASE_URL}/${lang}/blog/${post.slug}`,
        lastModified: new Date(post.updated_at),
        changeFrequency: "weekly",
        priority: 0.6,
        alternates: {
          languages: Object.fromEntries(
            SUPPORTED_LANGS.map((l) => [l, `${BASE_URL}/${l}/blog/${post.slug}`])
          ),
        },
      });
    }
  }

  // Portfolio
  for (const project of projects ?? []) {
    for (const lang of SUPPORTED_LANGS) {
      entries.push({
        url: `${BASE_URL}/${lang}/portfolio/${project.slug}`,
        lastModified: new Date(project.updated_at),
        changeFrequency: "monthly",
        priority: 0.5,
        alternates: {
          languages: Object.fromEntries(
            SUPPORTED_LANGS.map((l) => [l, `${BASE_URL}/${l}/portfolio/${project.slug}`])
          ),
        },
      });
    }
  }

  return entries;
}
```

Next.js의 `alternates.languages`가 자동으로 `hreflang` 태그를 생성한다.

- [ ] **Step 2: 중복 제거**

각 URL을 한 번만 포함하도록 수정 — 같은 slug의 ko/en을 별도 항목으로 넣되, alternates로 서로 연결.

실제로 위 코드는 lang별로 항목을 만들므로 중복이 아니라 정상이다. 각 `/${lang}/blog/slug`는 별도 URL이다.

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat: sitemap with ko/en URLs and hreflang alternates"
```

---

### Task 18: 빌드 검증 및 최종 정리

**Files:**
- 전체 프로젝트

- [ ] **Step 1: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음

- [ ] **Step 2: 빌드**

Run: `npm run build`
Expected: 성공. 모든 라우트가 `[lang]/(public)` 아래에 정상 등록.

- [ ] **Step 3: 빌드 에러 수정**

에러가 있으면 수정. 일반적인 에러:
- 누락된 `lang` prop
- import 경로 변경
- 타입 불일치

- [ ] **Step 4: 최종 커밋**

```bash
git add -A
git commit -m "fix: resolve build issues for i18n implementation"
```

- [ ] **Step 5: dev 서버 실행 및 수동 테스트**

Run: `npm run dev`

수동 확인 항목:
- `http://localhost:3000/` → `/ko`로 리다이렉트 (한국 IP/브라우저 기준)
- `http://localhost:3000/ko` → 한국어 홈페이지
- `http://localhost:3000/en` → 영어 홈페이지
- `http://localhost:3000/ko/blog` → 한국어 블로그 목록
- `http://localhost:3000/en/blog` → 영어 블로그 목록
- 헤더 언어 토글 클릭 → 언어 전환
- `/admin` → 기존 로그인 동작 유지
- `/admin/posts/new` → ko/en 탭, 번역 버튼 확인
