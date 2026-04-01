"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import Image from "next/image";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

interface ImageUploadProps {
  folder: string;
  onUpload: (url: string) => void;
  currentImage?: string;
}

export function ImageUpload({ folder, onUpload, currentImage }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage ?? null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = useCallback((file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
      toast.error("지원하지 않는 파일 형식입니다. JPEG, PNG, WebP, GIF만 허용됩니다.");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("파일 크기가 5MB를 초과합니다. 더 작은 파일을 선택해주세요.");
      return false;
    }
    return true;
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!validate(file)) return;

      setUploading(true);

      try {
        const supabase = createClient();
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${folder}/${timestamp}-${safeName}`;

        const { error } = await supabase.storage
          .from("solvlog")
          .upload(path, file);

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from("solvlog").getPublicUrl(path);

        setPreview(publicUrl);
        onUpload(publicUrl);
        toast.success("이미지가 업로드되었습니다.");
      } catch {
        toast.error("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
      } finally {
        setUploading(false);
      }
    },
    [folder, onUpload, validate],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!uploading) setDragOver(true);
    },
    [uploading],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (uploading) return;

      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploading, uploadFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      // Reset so the same file can be re-selected
      e.target.value = "";
    },
    [uploadFile],
  );

  const handleRemove = useCallback(() => {
    setPreview(null);
    onUpload("");
  }, [onUpload]);

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="group relative overflow-hidden rounded-lg border">
          <div className="relative aspect-video w-full">
            <Image
              src={preview}
              alt="Uploaded preview"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              <ImageIcon className="size-3.5" />
              변경
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="size-3.5" />
              삭제
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={uploading}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 font-mono text-sm transition-colors",
            dragOver
              ? "border-primary bg-primary/5 text-primary"
              : "border-muted-foreground/25 text-muted-foreground hover:border-primary/50 hover:text-foreground",
            uploading && "pointer-events-none opacity-50",
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="size-8 animate-spin text-primary" />
              <span>업로드 중...</span>
            </>
          ) : (
            <>
              <Upload className="size-8" />
              <div className="text-center">
                <p>클릭하여 파일을 선택하거나</p>
                <p>이미지를 드래그 앤 드롭하세요</p>
              </div>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, WebP, GIF (최대 5MB)
              </p>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
