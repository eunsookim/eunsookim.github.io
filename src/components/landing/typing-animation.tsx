"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface TypingAnimationProps {
  text: string;
  className?: string;
  speed?: number;
  startDelay?: number;
}

export function TypingAnimation({
  text,
  className,
  speed = 80,
  startDelay = 500,
}: TypingAnimationProps) {
  const reduced = useReducedMotion();
  const [displayCount, setDisplayCount] = useState(text.length);
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
      <span aria-hidden={mounted && !reduced}>
        {mounted && !reduced ? text.slice(0, displayCount) : text}
      </span>
      {mounted && !reduced && (
        <span className="sr-only">{text}</span>
      )}
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
