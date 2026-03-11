"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LikeButtonProps {
  postId: string;
  initialCount: number;
}

export function LikeButton({ postId, initialCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  // Check if user already liked on mount
  useEffect(() => {
    fetch(`/api/likes?post_id=${postId}`)
      .then((res) => res.json())
      .then((data) => {
        setLiked(data.liked);
        setCount(data.count);
      })
      .catch(() => {});
  }, [postId]);

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);

    // Optimistic update
    const prevLiked = liked;
    const prevCount = count;
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId }),
      });
      const data = await res.json();
      setLiked(data.liked);
      setCount(data.count);
    } catch {
      // Revert optimistic update
      setLiked(prevLiked);
      setCount(prevCount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className="gap-1.5"
    >
      <Heart
        className={`size-4 transition-colors ${liked ? "fill-red-500 text-red-500" : ""}`}
      />
      <span className="text-sm">{count}</span>
    </Button>
  );
}
