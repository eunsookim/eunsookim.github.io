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
          initial: { opacity: 0, y: 20 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { duration: 0.6, delay, ease: "easeOut" as const },
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
