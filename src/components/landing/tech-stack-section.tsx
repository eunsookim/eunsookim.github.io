"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { SectionFadeIn } from "./section-fade-in";
import { GlassmorphismCard } from "./glassmorphism-card";

interface TechItem {
  name: string;
  desc: string;
  icon: string;
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
  containerRef,
}: {
  item: TechItem;
  mouseX: number;
  mouseY: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 20 });
  const springY = useSpring(y, { stiffness: 200, damping: 20 });

  useEffect(() => {
    if (reduced || !ref.current || !containerRef.current) {
      x.set(0);
      y.set(0);
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    const parentRect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2 - parentRect.left;
    const cy = rect.top + rect.height / 2 - parentRect.top;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 0.001);
    const maxDist = 200;
    if (dist < maxDist) {
      const strength = (1 - dist / maxDist) * 6;
      x.set((dx / dist) * strength);
      y.set((dy / dist) * strength);
    } else {
      x.set(0);
      y.set(0);
    }
  }, [mouseX, mouseY, reduced, x, y, containerRef]);

  return (
    <motion.div ref={ref} style={{ x: springX, y: springY }} className="group/tech relative">
      <GlassmorphismCard className="flex flex-col items-center gap-2 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element -- external SVG icons from CDN, no benefit from next/image optimization */}
        <img
          src={`https://cdn.simpleicons.org/${item.icon}`}
          alt={item.name}
          className="size-8 dark:invert dark:brightness-200"
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
            containerRef={ref}
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
