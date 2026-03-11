"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import GiscusComponent from "@giscus/react";

export function GiscusComments() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const repo = process.env.NEXT_PUBLIC_GISCUS_REPO as `${string}/${string}`;
  const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID ?? "";
  const categoryId = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID ?? "";

  if (!repo || !repoId || !categoryId) return null;

  return (
    <GiscusComponent
      repo={repo}
      repoId={repoId}
      category="Comments"
      categoryId={categoryId}
      mapping="pathname"
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="bottom"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      lang="ko"
    />
  );
}
