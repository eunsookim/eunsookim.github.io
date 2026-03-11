# eunsookim.dev Blog Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack personal tech blog with admin CMS, hybrid markdown editor, and portfolio showcase.

**Architecture:** Next.js 14+ App Router on Vercel, Supabase for DB/Auth/Storage. Server Components for public pages (SEO), Client Components for admin. Green terminal theme with shadcn/ui.

**Tech Stack:** TypeScript 5+, Next.js 14+, Tailwind CSS, shadcn/ui, Supabase, @uiw/react-md-editor, giscus, next-themes, rehype-pretty-code, rehype-sanitize

**Spec:** `docs/superpowers/specs/2026-03-11-blog-design.md`

---

## File Structure

```
eunsookim.dev/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── blog/
│   │   │   ├── page.tsx
│   │   │   ├── [slug]/page.tsx
│   │   │   └── series/[slug]/page.tsx
│   │   ├── portfolio/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/page.tsx
│   │   ├── about/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── posts/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/edit/page.tsx
│   │   │   ├── portfolio/page.tsx
│   │   │   └── categories/page.tsx
│   │   └── api/auth/callback/route.ts
│   ├── components/
│   │   ├── ui/                    # shadcn auto-generated
│   │   ├── theme-provider.tsx
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   └── footer.tsx
│   │   ├── blog/
│   │   │   ├── post-card.tsx
│   │   │   ├── post-content.tsx   # rehype-sanitize for safe HTML
│   │   │   ├── category-filter.tsx
│   │   │   ├── search-bar.tsx
│   │   │   ├── series-nav.tsx
│   │   │   ├── pagination.tsx
│   │   │   └── giscus-comments.tsx
│   │   ├── portfolio/
│   │   │   └── project-card.tsx
│   │   └── admin/
│   │       ├── post-editor.tsx
│   │       ├── post-meta-bar.tsx
│   │       ├── image-upload.tsx
│   │       └── admin-sidebar.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   └── styles/globals.css
├── supabase/migrations/001_initial_schema.sql
├── middleware.ts
├── next.config.mjs
├── tailwind.config.ts
├── components.json
├── .env.local.example
├── package.json
└── tsconfig.json
```

---

## Chunk 1: Foundation (Tasks 1-6)

Project rename, Next.js init, shadcn/ui Green theme, Header/Footer layout.

Key points:
- Rename folder to `eunsookim.dev`, remove legacy files
- `npx create-next-app@latest` with App Router + src dir
- Install all dependencies including `rehype-sanitize` for safe markdown rendering
- shadcn init with Stone base, Green primary CSS variables
- ThemeProvider (system detect + manual toggle)
- Header (nav: Blog, Portfolio, About + theme toggle) + Footer

---

## Chunk 2: Data Layer & Auth (Tasks 7-12)

Types, Supabase clients, auth middleware, login page, DB schema.

Key points:
- TypeScript interfaces: Post, Project, Category, Series, PostWithRelations
- Three Supabase clients: browser (`createBrowserClient`), server (cookies), middleware
- Auth middleware protects `/admin/*` except `/admin/login`
- Login page with email/password via Supabase Auth
- SQL migration with tables, RLS policies, partial unique index

---

## Chunk 3: Blog Admin (Tasks 13-16)

Admin layout, sidebar, image upload, post editor, CRUD pages.

Key points:
- Admin sidebar with navigation + logout
- Image upload to Supabase Storage `assets` bucket (5MB limit, JPEG/PNG/WebP/GIF)
- Post editor: @uiw/react-md-editor with live preview, meta bar (category/series/tags/cover)
- Autosave to localStorage every 30s, draft save to DB (`is_published: false`)
- Admin post list with pagination (20/page), new/edit pages

---

## Chunk 4: Public Blog & Portfolio (Tasks 17-21)

Markdown renderer, blog list/detail, series, portfolio pages.

Key points:
- Server-side markdown rendering with `rehype-pretty-code` + `rehype-sanitize` (safe HTML output)
- Blog list: SSR, category filter, tag filter, ilike search, pagination (10/page)
- Blog detail: markdown content, series navigation, giscus comments
- Series page: ordered post list
- Portfolio: public list (card grid) + detail + admin management

---

## Chunk 5: Extras & Deploy (Tasks 22-26)

Categories/series management, about, homepage, SEO, deploy.

Key points:
- Admin categories page: Tabs UI (categories tab + series tab), Dialog for CRUD
- About page: hardcoded content (no DB)
- Homepage: hero + latest 5 posts
- SEO: dynamic sitemap.ts, robots.ts, metadata per page
- next.config.mjs: Supabase Storage image domains
- Vercel deploy + GitHub repo rename

---

## Pre-flight Checklist

Before starting implementation, verify these are ready:
- [ ] Supabase project created (Dashboard accessible)
- [ ] Supabase admin account created (email/password) — note the user UUID
- [ ] Vercel account ready
- [ ] GitHub repo accessible
- [ ] giscus configured on GitHub repo (enable Discussions, get repo ID and category ID)
- [ ] Domain `eunsookim.dev` purchased (optional, can use `*.vercel.app` initially)

---

## Task Details

### Task 1: Project Rename & Cleanup
- [ ] Rename `/Users/kim/eunsookim.github.io` → `/Users/kim/eunsookim.dev`
- [ ] Remove: `index.html`, `GEMINI.md`, `.gemini/`, `.specify/`, `specs/`
- [ ] Commit: `chore: rename project to eunsookim.dev, remove legacy files`

### Task 2: Initialize Next.js
- [ ] `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`
- [ ] Verify: `npm run dev` starts without errors
- [ ] Commit: `feat: initialize Next.js 14 with TypeScript and Tailwind`

### Task 3: Install Dependencies
- [ ] Core: `@supabase/supabase-js @supabase/ssr next-themes @uiw/react-md-editor rehype-pretty-code rehype-sanitize shiki`
- [ ] Markdown: `unified remark-parse remark-rehype rehype-stringify @tailwindcss/typography`
- [ ] Icons: `lucide-react`
- [ ] Dev: `@testing-library/react @testing-library/jest-dom jest jest-environment-jsdom`
- [ ] Verify: `npm run build` succeeds
- [ ] Commit: `feat: install all project dependencies`

### Task 4: Configure shadcn/ui with Green Theme
- [ ] `npx shadcn@latest init` (New York, Stone, CSS variables)
- [ ] Set Green theme CSS variables in `globals.css` (Stone background + green-500 primary for light, green-400 for dark)
- [ ] Install components: `button card input label tabs badge toast dropdown-menu dialog select separator sheet textarea`
- [ ] Commit: `feat: configure shadcn/ui with Green terminal theme`

### Task 5: Theme Provider & Root Layout
- [ ] Create `src/components/theme-provider.tsx` (next-themes wrapper)
- [ ] Update `src/app/layout.tsx`: ThemeProvider with `attribute="class"`, `defaultTheme="system"`, `enableSystem`
- [ ] Placeholder `src/app/page.tsx` with green "eunsookim.dev" text
- [ ] Commit: `feat: add ThemeProvider with system detection and root layout`

### Task 6: Header & Footer
- [ ] `src/components/layout/header.tsx`: sticky header, logo, nav (Blog/Portfolio/About), theme toggle (Sun/Moon)
- [ ] `src/components/layout/footer.tsx`: copyright
- [ ] Add to root layout
- [ ] Verify: theme toggle switches dark/light mode correctly
- [ ] Commit: `feat: add Header with navigation and theme toggle, Footer`

### Task 7: TypeScript Types
- [ ] `src/lib/types.ts`: Post, Project, Category, Series, PostWithRelations interfaces
- [ ] Commit: `feat: add TypeScript interfaces for all data models`

### Task 8: Supabase Client Setup
- [ ] `.env.local.example` with explicit env var list:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only, for bypassing RLS when needed)
  - `ADMIN_USER_ID` (admin UUID for middleware/API route admin verification)
  - `NEXT_PUBLIC_GISCUS_REPO`, `NEXT_PUBLIC_GISCUS_REPO_ID`, `NEXT_PUBLIC_GISCUS_CATEGORY_ID`
- [ ] Copy to `.env.local` and fill in actual values
- [ ] `src/lib/supabase/client.ts`: `createBrowserClient`
- [ ] `src/lib/supabase/server.ts`: `createServerClient` with cookies
- [ ] `src/lib/supabase/middleware.ts`: `updateSession` with `/admin/*` protection + **admin user check** (verify `user.id === ADMIN_USER_ID` env var, redirect non-admin authenticated users to `/`)
- [ ] Commit: `feat: configure Supabase clients (browser, server, middleware)`

### Task 9: Auth Middleware
- [ ] `middleware.ts` at project root, matcher: `/admin/:path*`
- [ ] Calls `updateSession`: redirects unauthenticated to `/admin/login`, redirects non-admin users to `/`
- [ ] Verify: accessing `/admin` without login redirects to `/admin/login`
- [ ] Commit: `feat: add auth middleware protecting /admin routes`

### Task 10: Auth Callback Route
- [ ] `src/app/api/auth/callback/route.ts`: exchange code for session, redirect to `/admin`
- [ ] Commit: `feat: add Supabase auth callback route handler`

### Task 11: Admin Login Page
- [ ] `src/app/admin/login/page.tsx`: email + password form, Supabase `signInWithPassword`
- [ ] Error display: wrong credentials → "이메일 또는 비밀번호가 올바르지 않습니다" toast
- [ ] Verify: login with admin credentials → redirect to `/admin`
- [ ] Commit: `feat: add admin login page with Supabase Auth`

### Task 12: Database Schema
- [ ] `supabase/migrations/001_initial_schema.sql`: categories, series (with `updated_at`), posts, projects tables + RLS + indexes
- [ ] Ensure `series` table includes `updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL` per spec
- [ ] Run in Supabase SQL Editor (replace `ADMIN_UUID_HERE` with actual admin UUID)
- [ ] Create Supabase Storage bucket `assets` (public read, authenticated admin upload)
- [ ] Verify: tables visible in Supabase Dashboard, RLS policies active
- [ ] Commit: `feat: add database schema with tables, indexes, and RLS policies`

### Task 13: Admin Layout & Sidebar
- [ ] `src/components/admin/admin-sidebar.tsx`: nav items (Dashboard, Posts, Portfolio, Categories), logout
- [ ] `src/app/admin/layout.tsx`: auth check (redirect if !user), sidebar + content area
- [ ] `src/app/admin/page.tsx`: dashboard with post/project counts
- [ ] Commit: `feat: add admin layout with sidebar, logout, and dashboard`

### Task 14: Image Upload Component
- [ ] `src/components/admin/image-upload.tsx`: drag-drop to Supabase Storage `assets` bucket
- [ ] Validation: 5MB limit, JPEG/PNG/WebP/GIF only
- [ ] Storage path: accepts `folder` prop (e.g., `temp/{uuid}` or `blog/{slug}`)
- [ ] Error handling: Toast on upload failure with retry guidance
- [ ] Verify: upload a test image, verify public URL works
- [ ] Commit: `feat: add image upload component with Supabase Storage`

### Task 15: Post Editor & Meta Bar
- [ ] `src/components/admin/post-meta-bar.tsx`: category/series selects, tag input with badges, cover image upload
- [ ] `src/components/admin/post-editor.tsx`:
  - Title/slug/excerpt inputs, MDEditor (live preview)
  - Autosave to localStorage every 30s
  - Draft save: `is_published: false` to DB
  - Publish: `is_published: true`, set `published_at`
  - `beforeunload` warning on unsaved changes
  - Image upload folder: `temp/{uuid}` for new posts, `blog/{slug}` for existing
  - On save: move temp images to `blog/{slug}/` path (Supabase Storage copy + delete)
- [ ] Verify: create a draft, reload page, verify localStorage recovery works
- [ ] Verify: attempt to close browser tab with unsaved changes, verify warning appears
- [ ] Commit: `feat: add post editor with markdown preview, meta bar, and autosave`

### Task 16: Admin Post Pages
- [ ] `src/app/admin/posts/page.tsx`: list with pagination (20/page), draft/published badge
- [ ] `src/app/admin/posts/new/page.tsx`: fetch categories/series, render PostEditor
- [ ] `src/app/admin/posts/[id]/edit/page.tsx`: fetch post + categories/series, render PostEditor with data
- [ ] Commit: `feat: add admin post pages (list, new, edit)`

### Task 17: Markdown Renderer
- [ ] `src/components/blog/post-content.tsx`: unified + remark-parse + remark-rehype + rehype-pretty-code + rehype-sanitize + rehype-stringify
- [ ] Uses `rehype-sanitize` to prevent XSS — sanitization happens before HTML output
- [ ] Renders sanitized HTML string via `dangerouslySetInnerHTML` (safe because rehype-sanitize strips dangerous elements/attributes before reaching this point)
- [ ] Add `@tailwindcss/typography` plugin to tailwind config for prose styling
- [ ] Verify: render markdown with code block, verify syntax highlighting appears
- [ ] Commit: `feat: add server-side markdown renderer with code highlighting and sanitization`

### Task 18: Blog List Page
- [ ] `src/components/blog/post-card.tsx`: cover image, category badge, title, excerpt, tags, date
- [ ] `src/components/blog/category-filter.tsx`: clickable badges, URL search params
- [ ] `src/components/blog/search-bar.tsx`: input with search icon, URL search params
- [ ] `src/components/blog/pagination.tsx`: page buttons, preserves existing search params
- [ ] `src/app/blog/page.tsx`: SSR, Supabase query with filters (category, tag, ilike search on title + excerpt), pagination (10/page)
- [ ] Commit: `feat: add blog list page with category filter, search, and pagination`

### Task 19: Blog Detail Page
- [ ] `src/components/blog/series-nav.tsx`: series title, ordered post list, prev/next links
- [ ] `src/components/blog/giscus-comments.tsx`: dynamic script loading, theme sync with `resolvedTheme` from next-themes. Uses env vars: `NEXT_PUBLIC_GISCUS_REPO`, `NEXT_PUBLIC_GISCUS_REPO_ID`, `NEXT_PUBLIC_GISCUS_CATEGORY_ID`. Mapping: `pathname`
- [ ] `src/app/blog/[slug]/page.tsx`: SSR, metadata generation (title + description), markdown render, series nav, giscus
- [ ] Verify: giscus comment widget loads and theme matches current dark/light mode
- [ ] Commit: `feat: add blog detail page with markdown rendering, series nav, and giscus`

### Task 20: Series Page
- [ ] `src/app/blog/series/[slug]/page.tsx`: series info + ordered published posts list
- [ ] Commit: `feat: add series detail page with ordered post list`

### Task 21: Portfolio Pages
- [ ] `src/components/portfolio/project-card.tsx`: thumbnail, title, description, tech stack badges
- [ ] `src/app/portfolio/page.tsx`: SSR grid, all projects
- [ ] `src/app/portfolio/[slug]/page.tsx`: detail with demo/GitHub links
- [ ] `src/app/admin/portfolio/page.tsx`: CRUD with Dialog forms (title, slug, description, demo_url, github_url, tech_stack, thumbnail)
- [ ] Commit: `feat: add portfolio pages (public list/detail, admin management)`

### Task 22: Admin Categories/Series
- [ ] `src/app/admin/categories/page.tsx`: Tabs (카테고리/시리즈), Dialog for add/edit, delete with confirmation
- [ ] Categories CRUD: name, slug, description, color (hex picker)
- [ ] Series CRUD: title, slug, description
- [ ] Commit: `feat: add admin categories and series management with tabs`

### Task 23: About Page
- [ ] `src/app/about/page.tsx`: hardcoded intro, skills, contact
- [ ] Commit: `feat: add about page with hardcoded content`

### Task 24: Homepage
- [ ] Update `src/app/page.tsx`: hero section + latest 5 posts (SSR) + links to blog/portfolio
- [ ] Commit: `feat: build homepage with hero, latest posts, and navigation`

### Task 25: SEO & Config
- [ ] `next.config.mjs`: Supabase Storage image domains
- [ ] `src/app/sitemap.ts`: dynamic sitemap from published posts + projects
- [ ] `src/app/robots.ts`: allow all, sitemap URL
- [ ] Commit: `feat: configure Next.js, add sitemap and robots.txt for SEO`

### Task 26: Final Verification & Deploy
- [ ] `npm run build` — verify success
- [ ] Manual test checklist:
  - [ ] `/admin/login` → login with admin credentials
  - [ ] `/admin` → dashboard shows correct counts
  - [ ] `/admin/posts/new` → create draft, verify autosave, publish
  - [ ] `/admin/posts` → verify post appears in list
  - [ ] `/blog` → verify published post appears, category filter works, search works
  - [ ] `/blog/[slug]` → verify markdown render, code highlighting, giscus loads
  - [ ] `/admin/categories` → add category, verify it appears in filter
  - [ ] `/admin/portfolio` → add project
  - [ ] `/portfolio` → verify project appears
  - [ ] Theme toggle → verify dark/light switches everywhere including giscus
  - [ ] Image upload → verify 5MB limit, file type restriction
- [ ] Rename GitHub repo: `eunsookim.github.io` → `eunsookim.dev`
- [ ] Import to Vercel, set all env vars, deploy
- [ ] Verify production URL works
- [ ] Commit: `chore: final build verification`

---

## Summary

| Chunk | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-6 | Foundation: rename, Next.js, shadcn, Green theme, layout |
| 2 | 7-12 | Data layer: types, Supabase clients, auth, DB schema |
| 3 | 13-16 | Blog admin: sidebar, image upload, editor, CRUD pages |
| 4 | 17-21 | Public pages: markdown render, blog list/detail, portfolio |
| 5 | 22-26 | Extras: categories, about, homepage, SEO, deploy |
