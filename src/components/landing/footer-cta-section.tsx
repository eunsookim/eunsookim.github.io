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
