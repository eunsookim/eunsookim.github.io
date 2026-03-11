"use client";

import { useEffect, useRef } from "react";
import { Eye } from "lucide-react";

interface ViewCounterProps {
  postId: string;
  initialCount: number;
}

export function ViewCounter({ postId, initialCount }: ViewCounterProps) {
  const counted = useRef(false);

  useEffect(() => {
    if (counted.current) return;
    counted.current = true;

    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId }),
    }).catch(() => {
      // Silently fail — view count is non-critical
    });
  }, [postId]);

  return (
    <span className="flex items-center gap-1">
      <Eye className="size-3.5" />
      {initialCount.toLocaleString()}
    </span>
  );
}
