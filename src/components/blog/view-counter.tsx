"use client";

import { useEffect, useRef, useState } from "react";
import { Eye } from "lucide-react";

interface ViewCounterProps {
  postId: string;
  initialCount: number;
}

export function ViewCounter({ postId, initialCount }: ViewCounterProps) {
  const counted = useRef(false);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    if (counted.current) return;
    counted.current = true;

    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_id: postId }),
    })
      .then((res) => {
        if (!res.ok) {
          console.error("[ViewCounter] API error:", res.status, res.statusText);
        }
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          console.error("[ViewCounter] RPC error:", data.error);
        }
        if (data.message === "counted") {
          setCount((prev) => prev + 1);
        }
      })
      .catch((err) => {
        console.error("[ViewCounter] fetch failed:", err);
      });
  }, [postId]);

  return (
    <span className="flex items-center gap-1">
      <Eye className="size-3.5" />
      {count.toLocaleString()}
    </span>
  );
}
