import type { Metadata } from "next";
import { Mail, Github, Linkedin } from "lucide-react";

import type { Lang } from "@/lib/i18n/utils";
import { getMessages } from "@/lib/i18n/messages";

interface AboutPageProps {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { lang } = await params;
  const t = getMessages(lang as Lang);
  return {
    title: t.about.title,
    description: t.about.description,
    openGraph: {
      title: `${t.about.title} | eunsookim.dev`,
      description: t.about.description,
    },
  };
}

/* ──────────────────────────────────────────────
 * CUSTOMIZE: Replace placeholder values below
 * with your real information.
 * ────────────────────────────────────────────── */

const SKILLS = {
  Languages: ["TypeScript", "JavaScript", "Python", "Go"],
  Frontend: ["React", "Next.js", "Tailwind CSS", "HTML/CSS"],
  Backend: ["Node.js", "Express", "NestJS", "GraphQL"],
  Database: ["PostgreSQL", "Redis", "MongoDB", "Supabase"],
  DevOps: ["Docker", "AWS", "GitHub Actions", "Vercel"],
  Tools: ["Git", "VS Code", "Figma", "Linear"],
} as const;

const CONTACTS = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@eunsookim.dev",
    href: "mailto:hello@eunsookim.dev",
  },
  {
    icon: Github,
    label: "GitHub",
    value: "github.com/eunsookim",
    href: "https://github.com/eunsookim",
  },
  {
    icon: Linkedin,
    label: "LinkedIn",
    value: "linkedin.com/in/eunsookim",
    href: "https://linkedin.com/in/eunsookim",
  },
] as const;

export default async function AboutPage({ params }: AboutPageProps) {
  const { lang } = await params;
  const t = getMessages(lang as Lang);

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      {/* Page heading */}
      <div className="mb-10">
        <h1 className="font-mono text-3xl font-bold text-primary">
          <span className="text-muted-foreground">$</span> cat ./about.md
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {lang === "en" ? "Developer introduction page" : "개발자 소개 페이지"}
        </p>
      </div>

      {/* ── Introduction ── */}
      <div className="mb-12 rounded-lg border border-border bg-card p-6">
        <h2 className="mb-4 font-mono text-lg font-semibold text-primary">
          <span className="text-muted-foreground">#</span> whoami
        </h2>
        {/* CUSTOMIZE: Replace this placeholder introduction */}
        <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
          {lang === "en" ? (
            <>
              <p>
                Hello, I&apos;m{" "}
                <span className="font-semibold text-primary">Eunsoo Kim</span>, a software engineer.
              </p>
              <p>
                I&apos;m passionate about improving user experience and writing clean code.
                I enjoy learning new technologies and applying them to real-world projects.
              </p>
              <p>
                On this blog, I share things I&apos;ve learned while developing, technical
                challenges and solutions, and useful tips.
              </p>
            </>
          ) : (
            <>
              <p>
                안녕하세요, 소프트웨어 엔지니어{" "}
                <span className="font-semibold text-primary">김은수</span>입니다.
              </p>
              <p>
                사용자 경험을 개선하고 깔끔한 코드를 작성하는 데 관심이 많습니다.
                새로운 기술을 배우고 이를 실제 프로젝트에 적용하는 과정을 즐깁니다.
              </p>
              <p>
                이 블로그에서는 개발하며 배운 것들, 기술적인 고민과 해결 과정,
                그리고 유용한 팁들을 공유합니다.
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Skills / Tech Stack ── */}
      <div className="mb-12">
        <h2 className="mb-6 font-mono text-lg font-semibold text-primary">
          <span className="text-muted-foreground">#</span> ls ./skills
        </h2>
        {/* CUSTOMIZE: Update skill categories and items */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(SKILLS).map(([category, items]) => (
            <div
              key={category}
              className="rounded-lg border border-border bg-card p-4"
            >
              <h3 className="mb-3 font-mono text-sm font-semibold text-primary">
                {category}/
              </h3>
              <ul className="space-y-1.5">
                {items.map((skill) => (
                  <li
                    key={skill}
                    className="font-mono text-xs text-muted-foreground"
                  >
                    <span className="mr-2 text-primary/60">-</span>
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Contact ── */}
      <div className="mb-12">
        <h2 className="mb-6 font-mono text-lg font-semibold text-primary">
          <span className="text-muted-foreground">#</span> cat ./contact.json
        </h2>
        {/* CUSTOMIZE: Update contact links */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="space-y-4">
            {CONTACTS.map((contact) => {
              const Icon = contact.icon;
              return (
                <a
                  key={contact.label}
                  href={contact.href}
                  target={contact.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel={
                    contact.href.startsWith("mailto:")
                      ? undefined
                      : "noopener noreferrer"
                  }
                  className="flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="font-mono text-xs text-foreground/50">
                    {contact.label}:
                  </span>
                  <span className="font-mono text-xs">{contact.value}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Terminal-style footer ── */}
      <div className="border-t border-border pt-6 text-center">
        <p className="font-mono text-xs text-muted-foreground">
          <span className="text-primary">$</span> echo &quot;{lang === "en" ? "Thank you for reading!" : "읽어주셔서 감사합니다!"}&quot;
        </p>
      </div>
    </section>
  );
}
