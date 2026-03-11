"use client";

import { Link2, Twitter, Facebook } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL이 복사되었습니다.");
    } catch {
      toast.error("복사에 실패했습니다.");
    }
  };

  const handleTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" onClick={handleTwitter} title="Share on Twitter/X">
        <Twitter className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={handleFacebook} title="Share on Facebook">
        <Facebook className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={handleCopyUrl} title="Copy URL">
        <Link2 className="size-4" />
      </Button>
    </div>
  );
}
