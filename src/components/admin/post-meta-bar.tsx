"use client";

import { useCallback, useMemo, useState } from "react";
import { X } from "lucide-react";

import type { Category, Series } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/admin/image-upload";

// Sentinel value for "none" since base-ui Select doesn't accept null as a value
const NONE_VALUE = "__none__";

interface PostMetaBarProps {
  categories: Category[];
  seriesList: Series[];
  selectedCategoryId: string | null;
  selectedSeriesId: string | null;
  seriesOrder: number | null;
  tags: string[];
  coverImage: string | null;
  imageFolder: string;
  onCategoryChange: (id: string | null) => void;
  onSeriesChange: (id: string | null) => void;
  onSeriesOrderChange: (order: number | null) => void;
  onTagsChange: (tags: string[]) => void;
  onCoverImageChange: (url: string | null) => void;
}

export function PostMetaBar({
  categories,
  seriesList,
  selectedCategoryId,
  selectedSeriesId,
  seriesOrder,
  tags,
  coverImage,
  imageFolder,
  onCategoryChange,
  onSeriesChange,
  onSeriesOrderChange,
  onTagsChange,
  onCoverImageChange,
}: PostMetaBarProps) {
  const [tagInput, setTagInput] = useState("");

  // Filter series by selected category
  const filteredSeries = useMemo(
    () =>
      selectedCategoryId
        ? seriesList.filter((s) => s.category_id === selectedCategoryId)
        : seriesList,
    [seriesList, selectedCategoryId],
  );

  // When series is selected, auto-set category
  const handleSeriesChange = useCallback(
    (id: string | null) => {
      onSeriesChange(id);
      if (id) {
        const series = seriesList.find((s) => s.id === id);
        if (series) {
          onCategoryChange(series.category_id);
        }
      }
    },
    [seriesList, onSeriesChange, onCategoryChange],
  );

  // When category changes, clear series if it doesn't belong to the new category
  const handleCategoryChange = useCallback(
    (id: string | null) => {
      onCategoryChange(id);
      if (selectedSeriesId) {
        const series = seriesList.find((s) => s.id === selectedSeriesId);
        if (series && id && series.category_id !== id) {
          onSeriesChange(null);
          onSeriesOrderChange(null);
        }
      }
    },
    [selectedSeriesId, seriesList, onCategoryChange, onSeriesChange, onSeriesOrderChange],
  );

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const value = tagInput.trim();
        if (value && !tags.includes(value)) {
          onTagsChange([...tags, value]);
        }
        setTagInput("");
      }
    },
    [tagInput, tags, onTagsChange],
  );

  const handleRemoveTag = useCallback(
    (tag: string) => {
      onTagsChange(tags.filter((t) => t !== tag));
    },
    [tags, onTagsChange],
  );

  const isLockedBySeriesCategory = !!selectedSeriesId;

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <h3 className="font-mono text-sm font-medium text-muted-foreground">
        메타 정보
      </h3>

      {/* Category Select */}
      <div className="space-y-1.5">
        <Label htmlFor="category-select">카테고리 *</Label>
        <Select
          value={selectedCategoryId ?? NONE_VALUE}
          onValueChange={(val) =>
            handleCategoryChange(val === NONE_VALUE ? null : val)
          }
          disabled={isLockedBySeriesCategory}
        >
          <SelectTrigger className="w-full" id="category-select">
            <SelectValue placeholder="카테고리 선택">
              {(value: string) => {
                if (value === NONE_VALUE || !value) return "없음";
                const cat = categories.find((c) => c.id === value);
                return cat
                  ? `${cat.name}${cat.name_en ? ` (${cat.name_en})` : ""}`
                  : value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>없음</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}{cat.name_en ? ` (${cat.name_en})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isLockedBySeriesCategory && (
          <p className="text-xs text-muted-foreground">
            시리즈의 카테고리가 자동 적용됩니다
          </p>
        )}
      </div>

      {/* Series Select */}
      <div className="space-y-1.5">
        <Label htmlFor="series-select">시리즈</Label>
        <Select
          value={selectedSeriesId ?? NONE_VALUE}
          onValueChange={(val) =>
            handleSeriesChange(val === NONE_VALUE ? null : val)
          }
        >
          <SelectTrigger className="w-full" id="series-select">
            <SelectValue placeholder="시리즈 선택">
              {(value: string) => {
                if (value === NONE_VALUE || !value) return "없음";
                const s = seriesList.find((s) => s.id === value);
                return s
                  ? `${s.title}${s.title_en ? ` (${s.title_en})` : ""}`
                  : value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>없음</SelectItem>
            {filteredSeries.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.title}{s.title_en ? ` (${s.title_en})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Series order — only visible when a series is selected */}
        {selectedSeriesId && (
          <div className="mt-2 space-y-1.5">
            <Label htmlFor="series-order">시리즈 순서</Label>
            <Input
              id="series-order"
              type="number"
              min={1}
              placeholder="순서 (예: 1)"
              value={seriesOrder ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                onSeriesOrderChange(v === "" ? null : Number(v));
              }}
            />
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <Label htmlFor="tag-input">태그</Label>
        <Input
          id="tag-input"
          placeholder="태그 입력 후 Enter"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  aria-label={`${tag} 태그 삭제`}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Cover Image */}
      <div className="space-y-1.5">
        <Label>커버 이미지</Label>
        <ImageUpload
          folder={imageFolder}
          onUpload={(url) => onCoverImageChange(url || null)}
          currentImage={coverImage ?? undefined}
        />
      </div>
    </div>
  );
}
