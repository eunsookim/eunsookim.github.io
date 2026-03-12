"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useMousePosition } from "@/hooks/use-mouse-position";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function GradientOrb() {
  const { x, y } = useMousePosition();
  const reduced = useReducedMotion();

  const motionX = useMotionValue(0);
  const motionY = useMotionValue(0);

  const springConfig = { stiffness: 50, damping: 30 };
  const translateX = useSpring(motionX, springConfig);
  const translateY = useSpring(motionY, springConfig);

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
