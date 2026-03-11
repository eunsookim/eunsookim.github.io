"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import type { Lang } from "@/lib/i18n/utils";
import { getMessages } from "@/lib/i18n/messages";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  lang: Lang;
}

export function Pagination({ currentPage, totalPages, lang }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = getMessages(lang);

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());

      if (page > 1) {
        params.set("page", String(page));
      } else {
        params.delete("page");
      }

      const query = params.toString();
      router.push(query ? `/${lang}/blog?${query}` : `/${lang}/blog`);
    },
    [router, searchParams, lang],
  );

  if (totalPages <= 1) return null;

  // Build visible page numbers: show at most 5 around currentPage
  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <nav aria-label="페이지 네비게이션" className="flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={currentPage <= 1}
        onClick={() => handlePageChange(currentPage - 1)}
        aria-label={t.blog.prev}
      >
        <ChevronLeft className="size-4" />
      </Button>

      {start > 1 && (
        <>
          <Button
            variant={currentPage === 1 ? "default" : "ghost"}
            size="sm"
            onClick={() => handlePageChange(1)}
          >
            1
          </Button>
          {start > 2 && (
            <span className="px-1 text-sm text-muted-foreground">...</span>
          )}
        </>
      )}

      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "ghost"}
          size="sm"
          onClick={() => handlePageChange(page)}
          aria-current={page === currentPage ? "page" : undefined}
        >
          {page}
        </Button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span className="px-1 text-sm text-muted-foreground">...</span>
          )}
          <Button
            variant={currentPage === totalPages ? "default" : "ghost"}
            size="sm"
            onClick={() => handlePageChange(totalPages)}
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="ghost"
        size="icon-sm"
        disabled={currentPage >= totalPages}
        onClick={() => handlePageChange(currentPage + 1)}
        aria-label={t.blog.next}
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}
