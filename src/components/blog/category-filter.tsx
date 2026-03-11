"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import type { Category } from "@/lib/types";

interface CategoryFilterProps {
  categories: Category[];
  currentCategory?: string;
}

export function CategoryFilter({
  categories,
  currentCategory,
}: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

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
      router.push(query ? `/blog?${query}` : "/blog");
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => handleCategoryClick()}>
        <Badge variant={!currentCategory ? "default" : "outline"}>전체</Badge>
      </button>
      {categories.map((category) => {
        const isActive = currentCategory === category.slug;
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
              {category.name}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
