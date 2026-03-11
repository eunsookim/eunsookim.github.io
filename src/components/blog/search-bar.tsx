"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, type FormEvent } from "react";

import { Input } from "@/components/ui/input";
import type { Lang } from "@/lib/i18n/utils";
import { getMessages } from "@/lib/i18n/messages";

interface SearchBarProps {
  lang: Lang;
}

export function SearchBar({ lang }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = getMessages(lang);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const q = (formData.get("q") as string)?.trim();

      const params = new URLSearchParams(searchParams.toString());

      if (q) {
        params.set("q", q);
      } else {
        params.delete("q");
      }

      // Reset page when searching
      params.delete("page");

      const query = params.toString();
      router.push(query ? `/${lang}/blog?${query}` : `/${lang}/blog`);
    },
    [router, searchParams, lang],
  );

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-sm">
      <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        name="q"
        type="search"
        placeholder={t.blog.search}
        defaultValue={searchParams.get("q") ?? ""}
        className="pl-8"
      />
    </form>
  );
}
