"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { ChevronDown, Code, Coffee, Briefcase, BookOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Category, Series } from "@/lib/types";
import type { Lang } from "@/lib/i18n/utils";
import { getMessages } from "@/lib/i18n/messages";

interface CategorySidebarProps {
  categories: Category[];
  seriesList?: Series[];
  currentCategory?: string;
  lang: Lang;
  postCounts: Record<string, number>;
  totalPostCount: number;
}

function buildCategoryHref(
  lang: Lang,
  searchParams: URLSearchParams,
  slug?: string,
): string {
  const params = new URLSearchParams(searchParams.toString());
  if (slug) {
    params.set("category", slug);
  } else {
    params.delete("category");
  }
  params.delete("page");
  const query = params.toString();
  return query ? `/${lang}/blog?${query}` : `/${lang}/blog`;
}

export function CategorySidebar({
  categories,
  seriesList = [],
  currentCategory,
  lang,
  postCounts,
  totalPostCount,
}: CategorySidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = getMessages(lang);

  const handleCategoryClick = useCallback(
    (e: React.MouseEvent, slug?: string) => {
      e.preventDefault();
      router.push(buildCategoryHref(lang, searchParams, slug));
    },
    [router, searchParams, lang],
  );

  // Group series by category_id
  const seriesByCategory: Record<string, Series[]> = {};
  for (const s of seriesList) {
    (seriesByCategory[s.category_id] ??= []).push(s);
  }

  const devCategories = categories.filter(
    (c) => !c.category_group || c.category_group === "dev" || c.category_group === "blog",
  );
  const talkCategories = categories.filter((c) => c.category_group === "talk");
  const portfolioCategories = categories.filter((c) => c.category_group === "portfolio");

  return (
    <nav className="space-y-5">
      {/* All */}
      <Link
        href={buildCategoryHref(lang, searchParams)}
        onClick={(e) => handleCategoryClick(e)}
        className={cn(
          "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
          !currentCategory
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <span>{t.blog.allCategories}</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {totalPostCount}
        </span>
      </Link>

      {/* Dev group */}
      {devCategories.length > 0 && (
        <CategoryGroup
          label={t.blog.categoryGroupDev}
          icon={<Code className="size-3.5" />}
          categories={devCategories}
          seriesByCategory={seriesByCategory}
          currentCategory={currentCategory}
          lang={lang}
          postCounts={postCounts}
          searchParams={searchParams}
          onCategoryClick={handleCategoryClick}
        />
      )}

      {/* Talk group */}
      {talkCategories.length > 0 && (
        <CategoryGroup
          label={t.blog.categoryGroupTalk}
          icon={<Coffee className="size-3.5" />}
          categories={talkCategories}
          seriesByCategory={seriesByCategory}
          currentCategory={currentCategory}
          lang={lang}
          postCounts={postCounts}
          searchParams={searchParams}
          onCategoryClick={handleCategoryClick}
        />
      )}

      {/* Portfolio group */}
      {portfolioCategories.length > 0 && (
        <CategoryGroup
          label={t.blog.categoryGroupPortfolio}
          icon={<Briefcase className="size-3.5" />}
          categories={portfolioCategories}
          seriesByCategory={seriesByCategory}
          currentCategory={currentCategory}
          lang={lang}
          postCounts={postCounts}
          searchParams={searchParams}
          onCategoryClick={handleCategoryClick}
        />
      )}
    </nav>
  );
}

function CategoryGroup({
  label,
  icon,
  categories,
  seriesByCategory,
  currentCategory,
  lang,
  postCounts,
  searchParams,
  onCategoryClick,
}: {
  label: string;
  icon: React.ReactNode;
  categories: Category[];
  seriesByCategory: Record<string, Series[]>;
  currentCategory?: string;
  lang: Lang;
  postCounts: Record<string, number>;
  searchParams: URLSearchParams;
  onCategoryClick: (e: React.MouseEvent, slug?: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
      >
        {icon}
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          className={cn(
            "size-3 transition-transform",
            open ? "rotate-0" : "-rotate-90",
          )}
        />
      </button>

      {open && (
        <ul className="mt-1 space-y-0.5">
          {categories.map((category) => {
            const isActive = currentCategory === category.slug;
            const name =
              lang === "en"
                ? (category.name_en ?? category.name)
                : category.name;
            const count = postCounts[category.id] ?? 0;
            const categorySeries = seriesByCategory[category.id] ?? [];

            return (
              <li key={category.id}>
                <Link
                  href={buildCategoryHref(lang, searchParams, category.slug)}
                  onClick={(e) => onCategoryClick(e, category.slug)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span className="flex items-center gap-2">
                    {category.color && (
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                    {name}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {count}
                  </span>
                </Link>

                {/* Series under this category */}
                {categorySeries.length > 0 && (
                  <ul className="ml-5 mt-0.5 space-y-0.5 border-l border-border pl-2">
                    {categorySeries.map((s) => {
                      const seriesTitle =
                        lang === "en"
                          ? (s.title_en ?? s.title)
                          : s.title;
                      return (
                        <li key={s.id}>
                          <Link
                            href={`/${lang}/blog/series/${s.slug}`}
                            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <BookOpen className="size-3 shrink-0" />
                            <span className="truncate">{seriesTitle}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Mobile: collapsible category menu */
export function CategorySidebarMobile(props: CategorySidebarProps) {
  const [open, setOpen] = useState(false);
  const t = getMessages(props.lang);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <span>{t.blog.categories}</span>
        <ChevronDown
          className={cn(
            "size-4 transition-transform",
            open ? "rotate-180" : "rotate-0",
          )}
        />
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-border bg-card p-3">
          <CategorySidebar {...props} />
        </div>
      )}
    </div>
  );
}
