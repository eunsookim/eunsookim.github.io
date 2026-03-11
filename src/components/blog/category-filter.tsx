"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import type { Category } from "@/lib/types";
import type { Lang } from "@/lib/i18n/utils";
import { getMessages } from "@/lib/i18n/messages";

interface CategoryFilterProps {
  categories: Category[];
  currentCategory?: string;
  lang: Lang;
}

export function CategoryFilter({
  categories,
  currentCategory,
  lang,
}: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = getMessages(lang);

  const handleCategoryClick = useCallback(
    (slug?: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (slug) {
        params.set("category", slug);
      } else {
        params.delete("category");
      }

      // Reset page when changing category
      params.delete("page");

      const query = params.toString();
      router.push(query ? `/${lang}/blog?${query}` : `/${lang}/blog`);
    },
    [router, searchParams, lang],
  );

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => handleCategoryClick()}>
        <Badge variant={!currentCategory ? "default" : "outline"}>
          {t.blog.allCategories}
        </Badge>
      </button>
      {categories.map((category) => {
        const isActive = currentCategory === category.slug;
        const name =
          lang === "en" ? (category.name_en ?? category.name) : category.name;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => handleCategoryClick(category.slug)}
          >
            <Badge
              variant={isActive ? "default" : "outline"}
              style={
                category.color && isActive
                  ? {
                      backgroundColor: category.color,
                      color: "#fff",
                      borderColor: category.color,
                    }
                  : category.color && !isActive
                    ? {
                        color: category.color,
                        borderColor: `${category.color}60`,
                      }
                    : undefined
              }
            >
              {name}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
