# Landing Page "Gradient Glow" Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the eunsookim.dev landing page with a "Gradient Glow" visual concept — rich animations (typing, 3D tilt, parallax, stagger), glassmorphism cards, and interactive mouse-tracking effects while maintaining the existing page structure.

**Architecture:** Server Component page (`page.tsx`) fetches data, then renders Client Component sections that handle animations via `framer-motion`. Each section is an isolated client component in `src/components/landing/`. Shared hooks (`useReducedMotion`, `useMousePosition`) live in `src/hooks/`. All colors use existing oklch CSS tokens from `globals.css`.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, framer-motion (new), tw-animate-css (existing), Supabase, lucide-react

**Spec:** `docs/superpowers/specs/2026-03-12-landing-page-redesign.md`

---

## File Map

### New Files

| File | Responsibility |
|------|---------------|
| `src/hooks/use-reduced-motion.ts` | `prefers-reduced-motion` media query hook |
| `src/hooks/use-mouse-position.ts` | Mouse position tracking hook (normalized) |
| `src/components/landing/gradient-orb.tsx` | Animated background gradient orb with parallax |
| `src/components/landing/typing-animation.tsx` | SSR-safe typing effect with cursor blink |
| `src/components/landing/scroll-progress.tsx` | Top-of-page scroll progress bar |
| `src/components/landing/gradient-divider.tsx` | Teal gradient section divider |
| `src/components/landing/section-fade-in.tsx` | Scroll-triggered fade-in wrapper (framer-motion) |
| `src/components/landing/glassmorphism-card.tsx` | Glass card with backdrop-blur + oklch color-mix |
| `src/components/landing/tilt-card.tsx` | 3D tilt card with mouse-position-based rotation |
| `src/components/landing/hero-section.tsx` | Hero: orb, typing title, tagline, CTAs, scroll indicator |
| `src/components/landing/tech-stack-section.tsx` | Tech stack grid with stagger + magnetic hover |
| `src/components/landing/featured-projects-section.tsx` | Featured project cards with 3D tilt |
| `src/components/landing/latest-posts-section.tsx` | Post cards grid with stagger + hover glow |
| `src/components/landing/footer-cta-section.tsx` | "Let's Connect" CTA with links |
| `supabase/migrations/005_project_is_featured.sql` | Add `is_featured` column to projects |

### Modified Files

| File | Changes |
|------|---------|
| `src/app/[lang]/(public)/page.tsx` | Complete rewrite — compose landing sections |
| `src/lib/i18n/messages.ts` | Add landing page section strings (ko/en) |
| `src/lib/types.ts` | Add `is_featured` to `Project` interface |
| `src/app/globals.css` | Add glassmorphism utility classes, glow keyframes |

---

## Chunk 1: Foundation

### Task 1: Install framer-motion

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install framer-motion**

```bash
cd /Users/kim/eunsookim.dev && npm install framer-motion
```

- [ ] **Step 2: Verify installation**

```bash
cd /Users/kim/eunsookim.dev && node -e "require('framer-motion'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
cd /Users/kim/eunsookim.dev
git add package.json package-lock.json
git commit -m "chore: install framer-motion for landing page animations"
```

---

### Task 2: Database migration — add `is_featured` to projects

The spec requires `is_featured = true` to select featured projects, but the column doesn't exist.

**Files:**
- Create: `supabase/migrations/005_project_is_featured.sql`
- Modify: `src/lib/types.ts:31-43`

- [ ] **Step 1: Create migration file**

```sql
-- 005_project_is_featured.sql
-- Add is_featured flag to projects for landing page showcase
ALTER TABLE public.projects ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false;
```

- [ ] **Step 2: Update Project interface in types.ts**

Add `is_featured: boolean;` after `tech_stack` field (line ~39):

```typescript
export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  demo_url: string | null;
  github_url: string | null;
  thumbnail: string | null;
  tech_stack: string[];
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  title_en: string | null;
  description_en: string | null;
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/kim/eunsookim.dev
git add supabase/migrations/005_project_is_featured.sql src/lib/types.ts
git commit -m "feat: add is_featured column to projects table"
```

---

### Task 3: i18n — add landing page strings

**Files:**
- Modify: `src/lib/i18n/messages.ts`

- [ ] **Step 1: Add landing section keys to both `ko` and `en` objects**

Insert a new `landing` key inside each language object, immediately after the `hero` block's closing brace (before `blog`). This must be inside the `as const` assertion scope for type inference.

```typescript
// In ko object, after hero: { ... }, add:
landing: {
  tagline: "풀스택 개발자 & 라이터",
  title: "Solvlog",
  description: "문제를 풀고, 배움을 기록하는 개발 블로그.",
  blogButton: "블로그",
  portfolioButton: "포트폴리오",
  scrollDown: "아래로 스크롤",
  techStack: "사용하는 기술들",
  featuredProjects: "만들어온 것들",
  viewAllProjects: "모든 프로젝트 보기",
  latestPosts: "최근 작성한 글",
  viewAllPosts: "모든 글 보기",
  footerCta: "연락하기",
  footerCtaDesc: "프로젝트 협업이나 기술적인 논의를 환영합니다.",
  email: "이메일",
},

// In en object, after hero: { ... }, add:
landing: {
  tagline: "Full-Stack Developer & Writer",
  title: "Solvlog",
  description: "A dev blog where problems are solved and learnings are logged.",
  blogButton: "Blog",
  portfolioButton: "Portfolio",
  scrollDown: "Scroll down",
  techStack: "Technologies I Work With",
  featuredProjects: "What I've Built",
  viewAllProjects: "View All Projects",
  latestPosts: "Recent Writing",
  viewAllPosts: "View All Posts",
  footerCta: "Let's Connect",
  footerCtaDesc: "Open to project collaborations and technical discussions.",
  email: "Email",
},
```

Exact insertion point: `src/lib/i18n/messages.ts` — ko object line 17 (after `portfolioButton: "Portfolio",` closing brace), en object line 79 (after the matching en hero closing brace). Both within the `} as const` scope.

- [ ] **Step 2: Commit**

```bash
cd /Users/kim/eunsookim.dev
git add src/lib/i18n/messages.ts
git commit -m "feat: add landing page i18n strings for ko/en"
```

---

### Task 4: Global CSS — glassmorphism utilities and glow keyframes

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add CSS at the end of globals.css (after `@layer base`)**

```css
/* Landing page utilities — use @utility for Tailwind v4 variant support */
@utility glass-card {
  background: color-mix(in oklch, var(--foreground) 3%, transparent);
  border: 1px solid color-mix(in oklch, var(--foreground) 8%, transparent);
  backdrop-filter: blur(12px);

  &:is(.dark *) {
    background: color-mix(in oklch, var(--foreground) 5%, transparent);
    border-color: color-mix(in oklch, var(--foreground) 10%, transparent);
  }
}

@utility glow-primary {
  box-shadow: 0 0 20px color-mix(in oklch, var(--primary) 30%, transparent);
}

@utility glow-primary-sm {
  box-shadow: 0 0 10px color-mix(in oklch, var(--primary) 20%, transparent);
}

@keyframes cursor-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@property --gradient-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

@keyframes rotate-gradient {
  to { --gradient-angle: 360deg; }
}
```

**Important:** Using `@utility` (not `@layer utilities`) ensures Tailwind v4 variant prefixes like `hover:glow-primary` work. The dark mode uses `&:is(.dark *)` nesting to match the project's `@custom-variant dark` pattern.

- [ ] **Step 2: Commit**

```bash
cd /Users/kim/eunsookim.dev
git add src/app/globals.css
git commit -m "feat: add glassmorphism utilities and glow keyframes"
```

---

### Task 5: Hook — `useReducedMotion`

**Files:**
- Create: `src/hooks/use-reduced-motion.ts`

- [ ] **Step 1: Create the hook**

```typescript
"use client";

import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);

    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return reduced;
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/kim/eunsookim.dev
git add src/hooks/use-reduced-motion.ts
git commit -m "feat: add useReducedMotion hook"
```

---

### Task 6: Hook — `useMousePosition`

**Files:**
- Create: `src/hooks/use-mouse-position.ts`

- [ ] **Step 1: Create the hook**

Returns normalized mouse position (-1 to 1) relative to window center, useful for parallax and tilt. Throttled to ~60fps via rAF.

```typescript
"use client";

import { useEffect, useState } from "react";

interface MousePosition {
  x: number; // -1 (left) to 1 (right)
  y: number; // -1 (top) to 1 (bottom)
}

export function useMousePosition(): MousePosition {
  const [pos, setPos] = useState<MousePosition>({ x: 0, y: 0 });

  useEffect(() => {
    let rafId: number;
    const handler = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setPos({
          x: (e.clientX / window.innerWidth) * 2 - 1,
          y: (e.clientY / window.innerHeight) * 2 - 1,
        });
      });
    };

    window.addEventListener("mousemove", handler);
    return () => {
      window.removeEventListener("mousemove", handler);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return pos;
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/kim/eunsookim.dev
git add src/hooks/use-mouse-position.ts
git commit -m "feat: add useMousePosition hook for parallax/tilt effects"
```

---

## Chunk 2: Shared Components

### Task 7: GradientDivider

**Files:**
- Create: `src/components/landing/gradient-divider.tsx`

- [ ] **Step 1: Create component**

A thin horizontal gradient line (primary → transparent) used between sections.

```tsx
export function GradientDivider() {
  return (
    <div
      className="mx-auto h-px w-full max-w-md"
      style={{
        background:
          "linear-gradient(to right, transparent, var(--primary), transparent)",
      }}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/kim/eunsookim.dev
git add src/components/landing/gradient-divider.tsx
git commit -m "feat: add GradientDivider component"
```

---

### Task 8: ScrollProgress

**Files:**
- Create: `src/components/landing/scroll-progress.tsx`

- [ ] **Step 1: Create component**

Fixed bar at top of page, width tracks scroll progress. Uses framer-motion `useScroll` + `useSpring`.

```tsx
"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 right-0 left-0 z-[60] h-0.5 origin-left bg-primary"
      style={{ scaleX }}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/kim/eunsookim.dev
git add src/components/landing/scroll-progress.tsx
git commit -m "feat: add ScrollProgress bar component"
```

---

### Task 9: SectionFadeIn

**Files:**
- Create: `src/components/landing/section-fade-in.tsx`

- [ ] **Step 1: Create component**

Scroll-triggered fade-up wrapper using framer-motion `useInView`. Respects reduced motion.

```tsx
"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface SectionFadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function SectionFadeIn({
  children,
  className,
  delay = 0,
}: SectionFadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduced ? false : { opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/kim/eunsookim.dev
git add src/components/landing/section-fade-in.tsx
git commit -m "feat: add SectionFadeIn scroll-triggered animation wrapper"
```

---

### Task 10: TypingAnimation

**Files:**
- Create: `src/components/landing/typing-animation.tsx`

- [ ] **Step 1: Create component**

SSR-safe: renders full text server-side for SEO. Client-side animates a visual typing effect by revealing characters progressively. Respects reduced motion.

```tsx
"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface TypingAnimationProps {
  text: string;
  className?: string;
  speed?: number;       // ms per character
  startDelay?: number;  // ms before typing starts
}

export function TypingAnimation({
  text,
  className,
  speed = 80,
  startDelay = 500,
}: TypingAnimationProps) {
  const reduced = useReducedMotion();
  const [displayCount, setDisplayCount] = useState(text.length); // SSR: full text
  const [started, setStarted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (reduced) return;
    setDisplayCount(0);

    const startTimer = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(startTimer);
  }, [reduced, startDelay]);

  useEffect(() => {
    if (!started || reduced) return;

    if (displayCount < text.length) {
      const timer = setTimeout(
        () => setDisplayCount((c) => c + 1),
        speed,
      );
      return () => clearTimeout(timer);
    }
  }, [started, displayCount, text.length, speed, reduced]);

  const done = displayCount >= text.length;

  return (
    <span className={className}>
      {/* Full text for SSR/SEO — visually clipped on client */}
      <span aria-hidden={mounted && !reduced}>
        {mounted && !reduced ? text.slice(0, displayCount) : text}
      </span>
      {/* Accessible full text hidden visually */}
      {mounted && !reduced && (
        <span className="sr-only">{text}</span>
      )}
      {/* Blinking cursor */}
      {mounted && !reduced && (
        <span
          className="inline-block w-[3px] translate-y-[2px] bg-primary"
          style={{
            height: "1em",
            animation: done ? "cursor-blink 1s step-end infinite" : "none",
            opacity: done ? undefined : 1,
          }}
        />
      )}
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/kim/eunsookim.dev
git add src/components/landing/typing-animation.tsx
git commit -m "feat: add SSR-safe TypingAnimation component"
```

---

### Task 11: GlassmorphismCard

**Files:**
- Create: `src/components/landing/glassmorphism-card.tsx`

- [ ] **Step 1: Create component**

Reusable glass card with hover glow effect. Uses the CSS utility class from globals.css.

```tsx
import { cn } from "@/lib/utils";

interface GlassmorphismCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassmorphismCard({
  children,
  className,
  hover = true,
}: GlassmorphismCardProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-xl p-4 transition-all duration-300",
        hover &&
          "hover:-translate-y-1 hover:glow-primary-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/kim/eunsookim.dev
git add src/components/landing/glassmorphism-card.tsx
git commit -m "feat: add GlassmorphismCard component"
```

---

### Task 12: TiltCard

**Files:**
- Create: `src/components/landing/tilt-card.tsx`

- [ ] **Step 1: Create component**

3D tilt card that rotates based on mouse position within the card (±5deg). Uses framer-motion `useMotionValue` and `useTransform`. Respects reduced motion.

```tsx
"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
}

export function TiltCard({
  children,
  className,
  maxTilt = 5,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springConfig = { stiffness: 300, damping: 20 };
  const rotateX = useSpring(
    useTransform(y, [0, 1], [maxTilt, -maxTilt]),
    springConfig,
  );
  const rotateY = useSpring(
    useTransform(x, [0, 1], [-maxTilt, maxTilt]),
    springConfig,
  );

  const handleMouseMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={
        reduced
          ? undefined
          : { rotateX, rotateY, transformPerspective: 800 }
      }
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/kim/eunsookim.dev
git add src/components/landing/tilt-card.tsx
git commit -m "feat: add TiltCard 3D mouse-tilt component"
```

---

### Task 13: GradientOrb

**Files:**
- Create: `src/components/landing/gradient-orb.tsx`

- [ ] **Step 1: Create component**

Background gradient orb that follows mouse position with parallax. Positioned absolute behind hero content.

```tsx
"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useMousePosition } from "@/hooks/use-mouse-position";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function GradientOrb() {
  const { x, y } = useMousePosition();
  const reduced = useReducedMotion();

  // Use MotionValues for smooth spring animation
  const motionX = useMotionValue(0);
  const motionY = useMotionValue(0);

  const springConfig = { stiffness: 50, damping: 30 };
  const translateX = useSpring(motionX, springConfig);
  const translateY = useSpring(motionY, springConfig);

  // Sync plain state values → MotionValues
  useEffect(() => {
    motionX.set(reduced ? 0 : x * 30);
    motionY.set(reduced ? 0 : y * 20);
  }, [x, y, reduced, motionX, motionY]);

  return (
    <motion.div
      className="pointer-events-none absolute top-[-20%] left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full opacity-40 blur-[120px] dark:opacity-60"
      style={{
        background:
          "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
        x: translateX,
        y: translateY,
      }}
      aria-hidden
    />
  );
}
```

**Note:** `useMousePosition` returns plain `{ x, y }` state values. We must convert to `MotionValue` via `useMotionValue` + `useEffect` sync, then feed into `useSpring` for smooth animation.

- [ ] **Step 2: Commit**

```bash
cd /Users/kim/eunsookim.dev
git add src/components/landing/gradient-orb.tsx
git commit -m "feat: add GradientOrb background with mouse parallax"
```

---

## Chunk 3: Landing Sections

### Task 14: HeroSection

**Files:**
- Create: `src/components/landing/hero-section.tsx`

- [ ] **Step 1: Create component**

Full-viewport hero with gradient orb background, typing title, tagline badge, description, CTA buttons, and scroll indicator.

```tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";

import { GradientOrb } from "./gradient-orb";
import { TypingAnimation } from "./typing-animation";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { Lang } from "@/lib/i18n/utils";

interface HeroSectionProps {
  lang: Lang;
  t: {
    tagline: string;
    title: string;
    description: string;
    blogButton: string;
    portfolioButton: string;
    scrollDown: string;
  };
}

export function HeroSection({ lang, t }: HeroSectionProps) {
  const reduced = useReducedMotion();

  const fade = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: "easeOut" },
        };

  return (
    <section className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 text-center">
      <GradientOrb />

      {/* Tagline pill */}
      <motion.span
        className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
        {...fade(0.2)}
      >
        {t.tagline}
      </motion.span>

      {/* Main title — typing animation */}
      <h1 className="font-mono text-5xl font-bold tracking-tight text-foreground md:text-7xl">
        <TypingAnimation text={t.title} />
      </h1>

      {/* Description */}
      <motion.p
        className="mt-6 max-w-lg text-lg text-muted-foreground"
        {...fade(0.8)}
      >
        {t.description}
      </motion.p>

      {/* CTA buttons */}
      <motion.div
        className="mt-10 flex flex-wrap items-center justify-center gap-4"
        {...fade(1.0)}
      >
        <Link
          href={`/${lang}/blog`}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-shadow hover:glow-primary"
        >
          {t.blogButton}
          <ArrowRight className="size-4" />
        </Link>
        <Link
          href={`/${lang}/portfolio`}
          className="inline-flex h-11 items-center rounded-xl border border-border px-6 text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:glow-primary-sm dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
        >
          {t.portfolioButton}
        </Link>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 flex flex-col items-center gap-1 text-xs text-muted-foreground"
        {...fade(1.4)}
      >
        <span>{t.scrollDown}</span>
        <ChevronDown className="size-4 animate-bounce" />
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/kim/eunsookim.dev
git add src/components/landing/hero-section.tsx
git commit -m "feat: add HeroSection with typing animation and gradient orb"
```

---

### Task 15: TechStackSection

**Files:**
- Create: `src/components/landing/tech-stack-section.tsx`

- [ ] **Step 1: Create component**

Tech stack grid with category labels, glassmorphism icon cards, stagger animation on scroll, and hover tooltips.

The tech stack data is static (no DB), defined inline:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SectionFadeIn } from "./section-fade-in";
import { GlassmorphismCard } from "./glassmorphism-card";

interface TechItem {
  name: string;
  desc: string; // one-line tooltip description
  icon: string; // simple-icons slug
}

interface TechGroup {
  label: string;
  items: TechItem[];
}

const TECH_STACK: TechGroup[] = [
  {
    label: "Frontend",
    items: [
      { name: "Next.js", desc: "React framework for production", icon: "nextdotjs" },
      { name: "React", desc: "UI component library", icon: "react" },
      { name: "Svelte", desc: "Compile-time reactive framework", icon: "svelte" },
      { name: "TypeScript", desc: "Type-safe JavaScript", icon: "typescript" },
      { name: "Tailwind CSS", desc: "Utility-first CSS framework", icon: "tailwindcss" },
    ],
  },
  {
    label: "Backend",
    items: [
      { name: "Supabase", desc: "Open source Firebase alternative", icon: "supabase" },
      { name: "Firebase", desc: "Google app development platform", icon: "firebase" },
      { name: "Node.js", desc: "JavaScript runtime", icon: "nodedotjs" },
      { name: "GraphQL", desc: "API query language", icon: "graphql" },
      { name: "PostgreSQL", desc: "Advanced open source RDBMS", icon: "postgresql" },
      { name: "MariaDB", desc: "Community-driven MySQL fork", icon: "mariadb" },
      { name: "Redis", desc: "In-memory data store", icon: "redis" },
      { name: "Python", desc: "Versatile scripting language", icon: "python" },
      { name: "Go", desc: "Fast compiled systems language", icon: "go" },
    ],
  },
  {
    label: "AI",
    items: [
      { name: "Gemini", desc: "Google multimodal AI model", icon: "googlegemini" },
      { name: "Claude", desc: "Anthropic AI assistant", icon: "anthropic" },
    ],
  },
];

function MagneticTechIcon({
  item,
  mouseX,
  mouseY,
  cardRef,
}: {
  item: TechItem;
  mouseX: number;
  mouseY: number;
  cardRef: React.RefObject<HTMLDivElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 20 });
  const springY = useSpring(y, { stiffness: 200, damping: 20 });

  useEffect(() => {
    if (reduced || !ref.current || !cardRef.current) {
      x.set(0);
      y.set(0);
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    const parentRect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2 - parentRect.left;
    const cy = rect.top + rect.height / 2 - parentRect.top;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 200;
    if (dist < maxDist) {
      const strength = (1 - dist / maxDist) * 6;
      x.set((dx / dist) * strength);
      y.set((dy / dist) * strength);
    } else {
      x.set(0);
      y.set(0);
    }
  }, [mouseX, mouseY, reduced, x, y, cardRef]);

  return (
    <motion.div ref={ref} style={{ x: springX, y: springY }} className="group/tech relative">
      <GlassmorphismCard className="flex flex-col items-center gap-2 p-4">
        <img
          src={`https://cdn.simpleicons.org/${item.icon}`}
          alt={item.name}
          className="size-8 dark:invert dark:brightness-200 dark:hue-rotate-0"
          loading="lazy"
          width={32}
          height={32}
        />
        <span className="text-xs font-medium text-muted-foreground">
          {item.name}
        </span>
      </GlassmorphismCard>
      {/* Hover tooltip */}
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-foreground/90 px-3 py-1.5 text-xs text-background opacity-0 transition-opacity group-hover/tech:opacity-100">
        {item.desc}
      </div>
    </motion.div>
  );
}

function StaggerGrid({ items }: { items: TechItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={ref}
      className="flex flex-wrap justify-center gap-3"
      onMouseMove={handleMouseMove}
    >
      {items.map((item, i) => (
        <motion.div
          key={item.name}
          initial={reduced ? false : { opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 1, scale: 1 } : undefined}
          transition={{ duration: 0.3, delay: reduced ? 0 : i * 0.05 }}
        >
          <MagneticTechIcon
            item={item}
            mouseX={mouse.x}
            mouseY={mouse.y}
            cardRef={ref}
          />
        </motion.div>
      ))}
    </div>
  );
}

interface TechStackSectionProps {
  title: string;
}

export function TechStackSection({ title }: TechStackSectionProps) {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-4">
        <SectionFadeIn>
          <h2 className="mb-16 text-center text-2xl font-bold text-foreground">
            {title}
          </h2>
        </SectionFadeIn>

        <div className="space-y-12">
          {TECH_STACK.map((group) => (
            <div key={group.label}>
              <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {group.label}
              </p>
              <StaggerGrid items={group.items} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/kim/eunsookim.dev
git add src/components/landing/tech-stack-section.tsx
git commit -m "feat: add TechStackSection with stagger animation"
```

---

### Task 16: FeaturedProjectsSection

**Files:**
- Create: `src/components/landing/featured-projects-section.tsx`

- [ ] **Step 1: Create component**

Displays 2-3 featured projects as horizontal cards with 3D tilt effect. Receives data from server component. Left side: thumbnail with perspective tilt. Right side: title, description, tech tags.

```tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { TiltCard } from "./tilt-card";
import { SectionFadeIn } from "./section-fade-in";
import type { Project } from "@/lib/types";
import type { Lang } from "@/lib/i18n/utils";

interface FeaturedProjectsSectionProps {
  lang: Lang;
  projects: Project[];
  t: {
    featuredProjects: string;
    viewAllProjects: string;
  };
}

function ProjectCard({
  project,
  lang,
  index,
}: {
  project: Project;
  lang: Lang;
  index: number;
}) {
  const title =
    lang === "en" ? (project.title_en ?? project.title) : project.title;
  const description =
    lang === "en"
      ? (project.description_en ?? project.description)
      : project.description;

  return (
    <SectionFadeIn delay={index * 0.15}>
      <TiltCard className="group relative overflow-hidden rounded-2xl">
        {/* Animated gradient border — visible on hover */}
        {/* Rotating gradient border — extends 1px beyond card bounds */}
        <div
          className="absolute -inset-px -z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: "conic-gradient(from var(--gradient-angle, 0deg), var(--primary), transparent 40%, var(--primary))",
            animation: "rotate-gradient 3s linear infinite",
          }}
        />
        <div className="glass-card h-full rounded-2xl">
        <Link
          href={project.demo_url ?? `/${lang}/portfolio`}
          target={project.demo_url ? "_blank" : undefined}
          rel={project.demo_url ? "noopener noreferrer" : undefined}
          className="flex flex-col gap-6 p-6 md:flex-row"
        >
          {/* Thumbnail with parallax hover */}
          {project.thumbnail && (
            <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl md:w-64">
              <Image
                src={project.thumbnail}
                alt={title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110 group-hover:-translate-x-1 group-hover:-translate-y-1"
                sizes="(max-width: 768px) 100vw, 256px"
              />
            </div>
          )}

          {/* Info */}
          <div className="flex flex-1 flex-col justify-center">
            <h3 className="text-xl font-bold text-foreground transition-colors group-hover:text-primary">
              {title}
            </h3>
            {description && (
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                {description}
              </p>
            )}
            {project.tech_stack.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {project.tech_stack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Link>
        </div>
      </TiltCard>
    </SectionFadeIn>
  );
}

export function FeaturedProjectsSection({
  lang,
  projects,
  t,
}: FeaturedProjectsSectionProps) {
  if (projects.length === 0) return null;

  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-4">
        <SectionFadeIn>
          <div className="mb-12 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              {t.featuredProjects}
            </h2>
            <Link
              href={`/${lang}/portfolio`}
              className="group flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {t.viewAllProjects}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </SectionFadeIn>

        <div className="space-y-6">
          {projects.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              lang={lang}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/kim/eunsookim.dev
git add src/components/landing/featured-projects-section.tsx
git commit -m "feat: add FeaturedProjectsSection with 3D tilt cards"
```

---

### Task 17: LatestPostsSection

**Files:**
- Create: `src/components/landing/latest-posts-section.tsx`

- [ ] **Step 1: Create component**

3-column grid of post cards with glassmorphism styling, stagger animation, hover glow underline (dark) / shadow lift (light).

```tsx
"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion, useInView } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { SectionFadeIn } from "./section-fade-in";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { PostWithRelations } from "@/lib/types";
import type { Lang } from "@/lib/i18n/utils";

interface LatestPostsSectionProps {
  lang: Lang;
  posts: PostWithRelations[];
  t: {
    latestPosts: string;
    viewAllPosts: string;
  };
}

function PostCard({
  post,
  lang,
  index,
}: {
  post: PostWithRelations;
  lang: Lang;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();

  const title = lang === "en" ? (post.title_en ?? post.title) : post.title;
  const categoryName = post.category
    ? lang === "en"
      ? (post.category.name_en ?? post.category.name)
      : post.category.name
    : null;

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString(
        lang === "en" ? "en-US" : "ko-KR",
        { year: "numeric", month: "short", day: "numeric" },
      )
    : null;

  // Estimate reading time from content length (~200 words/min for ko, ~250 for en)
  const content = lang === "en" ? (post.content_en ?? post.content) : post.content;
  const wordCount = content ? content.split(/\s+/).length : 0;
  const readingMin = Math.max(1, Math.ceil(wordCount / (lang === "en" ? 250 : 200)));
  const readingTime = lang === "en" ? `${readingMin} min read` : `${readingMin}분`;

  return (
    <motion.div
      ref={ref}
      initial={reduced ? false : { opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.4, delay: reduced ? 0 : index * 0.1 }}
    >
      <Link
        href={`/${lang}/blog/${post.slug}`}
        className="group block h-full"
      >
        <div className="glass-card flex h-full flex-col overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1.5 hover:glow-primary-sm">
          {/* Cover image */}
          {post.cover_image && (
            <div className="relative aspect-[2/1] w-full overflow-hidden">
              <Image
                src={post.cover_image}
                alt={title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
          )}

          <div className="flex flex-1 flex-col p-5">
            {/* Category badge */}
            {categoryName && (
              <Badge
                variant="secondary"
                className="mb-3 w-fit text-xs"
                style={
                  post.category?.color
                    ? {
                        backgroundColor: `${post.category.color}20`,
                        color: post.category.color,
                        borderColor: `${post.category.color}40`,
                      }
                    : undefined
                }
              >
                {categoryName}
              </Badge>
            )}

            {/* Title */}
            <h3 className="line-clamp-2 font-bold text-foreground transition-colors group-hover:text-primary">
              {title}
              <ArrowRight className="ml-1 inline-block size-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
            </h3>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Date + reading time */}
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              {formattedDate && (
                <time dateTime={post.published_at!}>
                  {formattedDate}
                </time>
              )}
              {formattedDate && <span>·</span>}
              <span>{readingTime}</span>
            </div>
          </div>

          {/* Dark mode only: glow underline */}
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 transition-opacity duration-300 dark:group-hover:opacity-100" />
        </div>
      </Link>
    </motion.div>
  );
}

export function LatestPostsSection({
  lang,
  posts,
  t,
}: LatestPostsSectionProps) {
  if (posts.length === 0) return null;

  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-4">
        <SectionFadeIn>
          <div className="mb-12 flex items-end justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              {t.latestPosts}
            </h2>
            <Link
              href={`/${lang}/blog`}
              className="group flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {t.viewAllPosts}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </SectionFadeIn>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, i) => (
            <PostCard key={post.id} post={post} lang={lang} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/kim/eunsookim.dev
git add src/components/landing/latest-posts-section.tsx
git commit -m "feat: add LatestPostsSection with stagger and hover glow"
```

---

### Task 18: FooterCtaSection

**Files:**
- Create: `src/components/landing/footer-cta-section.tsx`

- [ ] **Step 1: Create component**

"Let's Connect" section with email and GitHub links, gradient-glow styling.

```tsx
import Link from "next/link";
import { Github, Mail } from "lucide-react";
import { SectionFadeIn } from "./section-fade-in";

interface FooterCtaSectionProps {
  t: {
    footerCta: string;
    footerCtaDesc: string;
    email: string;
  };
}

export function FooterCtaSection({ t }: FooterCtaSectionProps) {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <SectionFadeIn>
          <h2 className="text-3xl font-bold text-foreground">{t.footerCta}</h2>
          <p className="mt-4 text-muted-foreground">{t.footerCtaDesc}</p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="mailto:contact@eunsookim.dev"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-shadow hover:glow-primary"
            >
              <Mail className="size-4" />
              {t.email}
            </Link>
            <Link
              href="https://github.com/eunsookim"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-6 text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:glow-primary-sm dark:border-input dark:bg-input/30"
            >
              <Github className="size-4" />
              GitHub
            </Link>
          </div>
        </SectionFadeIn>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/kim/eunsookim.dev
git add src/components/landing/footer-cta-section.tsx
git commit -m "feat: add FooterCtaSection with email and GitHub links"
```

---

## Chunk 4: Page Assembly & Integration

### Task 19: Rewrite `page.tsx` — compose landing sections

**Files:**
- Modify: `src/app/[lang]/(public)/page.tsx` (full rewrite)

- [ ] **Step 1: Rewrite the page**

Server component that fetches posts + featured projects, then renders all landing sections with gradient dividers.

```tsx
import { createClient } from "@/lib/supabase/server";
import type { PostWithRelations, Project } from "@/lib/types";
import type { Lang } from "@/lib/i18n/utils";
import { getMessages } from "@/lib/i18n/messages";

import { ScrollProgress } from "@/components/landing/scroll-progress";
import { HeroSection } from "@/components/landing/hero-section";
import { GradientDivider } from "@/components/landing/gradient-divider";
import { TechStackSection } from "@/components/landing/tech-stack-section";
import { FeaturedProjectsSection } from "@/components/landing/featured-projects-section";
import { LatestPostsSection } from "@/components/landing/latest-posts-section";
import { FooterCtaSection } from "@/components/landing/footer-cta-section";

async function getLatestPosts(): Promise<PostWithRelations[]> {
  try {
    const supabase = await createClient();
    // Select content/content_en for reading time estimation
    const { data, error } = await supabase
      .from("posts")
      .select("*, category:categories(*)")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(3);

    if (error) {
      console.error("Failed to fetch posts:", error.message);
      return [];
    }

    return (data ?? []).map((post) => ({
      ...post,
      tags: post.tags ?? [],
    })) as PostWithRelations[];
  } catch {
    return [];
  }
}

async function getFeaturedProjects(): Promise<Project[]> {
  try {
    const supabase = await createClient();

    // Try featured first
    const { data: featured } = await supabase
      .from("projects")
      .select("*")
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(3);

    if (featured && featured.length > 0) return featured as Project[];

    // Fallback to latest
    const { data: latest } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(3);

    return (latest ?? []) as Project[];
  } catch {
    return [];
  }
}

interface HomePageProps {
  params: Promise<{ lang: string }>;
}

export default async function Home({ params }: HomePageProps) {
  const { lang } = await params;
  const t = getMessages(lang as Lang);
  const [posts, projects] = await Promise.all([
    getLatestPosts(),
    getFeaturedProjects(),
  ]);

  return (
    <>
      <ScrollProgress />

      <HeroSection lang={lang as Lang} t={t.landing} />

      <GradientDivider />

      <TechStackSection title={t.landing.techStack} />

      <GradientDivider />

      <FeaturedProjectsSection
        lang={lang as Lang}
        projects={projects}
        t={t.landing}
      />

      <GradientDivider />

      <LatestPostsSection
        lang={lang as Lang}
        posts={posts}
        t={t.landing}
      />

      <FooterCtaSection t={t.landing} />
    </>
  );
}
```

- [ ] **Step 2: Run dev server and verify**

```bash
cd /Users/kim/eunsookim.dev && npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/kim/eunsookim.dev
git add src/app/\\[lang\\]/\\(public\\)/page.tsx
git commit -m "feat: rewrite landing page with Gradient Glow sections"
```

---

### Task 20: Visual QA — dev server check

- [ ] **Step 1: Start dev server and verify all sections render**

```bash
cd /Users/kim/eunsookim.dev && npm run dev
```

Open `http://localhost:3000/ko` and `http://localhost:3000/en` in browser.

Verify:
1. Hero: gradient orb visible, typing animation plays, CTAs link correctly
2. Tech Stack: icons load from CDN, stagger animation on scroll
3. Featured Projects: cards render (or section hidden if no projects)
4. Latest Posts: cards render with glassmorphism, hover glow works
5. Footer CTA: links work
6. Scroll progress bar visible at page top
7. Gradient dividers visible between sections
8. Dark/light mode toggle works (all sections adapt)
9. Mobile responsive: check at 375px width

- [ ] **Step 2: Fix any visual issues found during QA**

- [ ] **Step 3: Final commit**

```bash
cd /Users/kim/eunsookim.dev
git add -A
git commit -m "fix: landing page visual QA adjustments"
```
