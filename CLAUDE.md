# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal developer blog & portfolio site for eunsookim.dev ("Solvlog"). Built with Next.js 16 (App Router), Supabase (database + auth), and deployed on Vercel. Supports Korean/English i18n with automatic language detection.

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint (flat config, next/core-web-vitals + typescript)
```

No test framework is configured.

## Architecture

### Routing Structure

The app uses Next.js App Router with two top-level route groups:

- **`/[lang]/(public)/`** - Public pages (landing, blog, portfolio, about). `lang` is `"ko"` or `"en"`. Middleware in `src/middleware.ts` auto-detects language (cookie > Accept-Language > IP country > default `ko`) and redirects bare paths to `/{lang}/...`.
- **`/admin/`** - Dashboard for managing posts, categories, portfolio, and content calendar. Protected by Supabase auth (single admin user via RLS `auth.uid()` check).
- **`/api/`** - Route handlers: auth callback, comments CRUD, likes, views, translation, and Vercel cron jobs.

### Data Layer

- **Supabase** is the primary database. Tables: `posts`, `projects`, `categories`, `series`, `comments`, `content_calendar`. Migrations live in `supabase/migrations/` (numbered SQL files).
- **Two Supabase clients**: `src/lib/supabase/server.ts` (Server Components/Route Handlers, uses cookies) and `src/lib/supabase/client.ts` (Client Components, browser client).
- **Firebase Storage** is used only for image uploads (`src/lib/firebase.ts`).
- **Gemini API** generates AI blog drafts (`src/lib/gemini.ts`, model: `gemini-2.5-flash`).

### i18n

Custom lightweight i18n (no library). `src/lib/i18n/utils.ts` defines supported langs (`ko`, `en`) and `DEFAULT_LANG` (`ko`). `src/lib/i18n/messages.ts` has all UI strings as a typed object. DB content uses `_en` suffix columns (e.g., `title_en`, `content_en`) for English translations.

### Styling

- **Tailwind CSS v4** with `@tailwindcss/postcss` plugin (not the classic `tailwind.config.js` approach).
- **shadcn/ui** (base-nova style) components in `src/components/ui/`. CSS variables defined in `src/app/globals.css` with oklch colors. Green-themed primary color.
- Custom `@utility` directives for landing page effects (`glass-card`, `glow-primary`).

### Component Organization

- `src/components/ui/` - shadcn/ui primitives (button, card, dialog, etc.)
- `src/components/landing/` - Landing page sections with framer-motion animations
- `src/components/blog/` - Blog feature components (comments, likes, search, ToC, etc.)
- `src/components/admin/` - Admin dashboard components (editor, sidebar, image upload)
- `src/components/layout/` - Header and Footer
- `src/components/portfolio/` - Portfolio project cards

### Vercel Cron Jobs

Defined in `vercel.json`:
- `/api/cron/publish-scheduled` - Publishes scheduled posts (hourly)
- `/api/cron/generate-draft` - AI-generates blog drafts from content calendar (daily at 03:00 UTC)

### Path Alias

`@/*` maps to `./src/*` (configured in `tsconfig.json`).

### Key Conventions

- Blog content is Markdown stored in Supabase, rendered via unified/remark/rehype pipeline with shiki syntax highlighting.
- Images from Supabase storage use `*.supabase.co` remote pattern (configured in `next.config.ts`).
- Admin auth uses Supabase email/password with a single admin UUID hardcoded in RLS policies.
- Data model interfaces mirror the DB schema in `src/lib/types.ts`.
