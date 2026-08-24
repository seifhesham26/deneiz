"use client";

import { useRef, useState } from "react";
import { GripVertical, Upload, X } from "lucide-react";
import Image from "next/image";
import { useLang } from "@/components/providers/lang-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pushToast } from "@/components/ui/toast";

export interface UploadedImage {
  url: string;
  altText?: string;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
}

/**
 * PROTOTYPE: uploads POST multipart to /api/uploads which stores files on
 * local disk. Swap for object storage (S3/R2) before production.
 */
/** Matches productCreateSchema.images.max(10). */
const MAX_IMAGES = 10;

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const { t } = useLang();
  const [urlDraft, setUrlDraft] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragIndex = useRef<number | null>(null);

  async function handleFileUpload(files: FileList | null) {
    if (!files?.length) return;

    // Accumulate locally: `images` is the render-time prop, so calling
    // onChange([...images, one]) per iteration kept only the last upload
    const uploaded: UploadedImage[] = [];
    for (const file of Array.from(files).slice(0, MAX_IMAGES - images.length)) {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body });
      if (!response.ok) {
        pushToast(t.errors.generic, "error");
        continue;
      }
      const { url } = (await response.json()) as { url: string };
      uploaded.push({ url });
    }
    if (uploaded.length) onChange([...images, ...uploaded]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function moveImage(from: number, to: number) {
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    // Order matters: index zero becomes the cover image
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-text-secondary">{t.admin.productsView.imagesHint}</p>

      <div className="flex flex-wrap gap-2">
        {images.map((image, index) => (
          <div
            key={`${image.url}-${index}`}
            draggable
            onDragStart={() => {
              dragIndex.current = index;
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (dragIndex.current !== null && dragIndex.current !== index) {
                moveImage(dragIndex.current, index);
              }
              dragIndex.current = null;
            }}
            className="group relative size-20 overflow-hidden rounded-lg border border-border bg-surface"
          >
            <Image src={image.url} alt={image.altText ?? ""} fill sizes="80px" className="object-cover" />
            <span className="absolute start-1 top-1 cursor-grab rounded bg-scrim/50 p-0.5 text-on-media">
              <GripVertical aria-hidden className="size-3" />
            </span>
            {index === 0 ? (
              <span className="absolute bottom-1 start-1 rounded bg-accent px-1 text-[0.6rem] font-semibold text-on-media">
                1
              </span>
            ) : null}
            <button
              type="button"
              aria-label={t.common.remove}
              onClick={() => onChange(images.filter((_, position) => position !== index))}
              className="absolute end-1 top-1 flex min-h-6 min-w-6 items-center justify-center rounded-full bg-scrim/50 text-on-media"
            >
              <X aria-hidden className="size-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <Input
          placeholder="https://… or /uploads/…"
          value={urlDraft}
          onChange={(event) => setUrlDraft(event.target.value)}
          className="max-w-xs"
          dir="ltr"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            if (urlDraft.trim()) {
              onChange([...images, { url: urlDraft.trim() }]);
              setUrlDraft("");
            }
          }}
        >
          {t.common.save}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()}>
          <Upload aria-hidden className="size-4" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => void handleFileUpload(event.target.files)}
        />
      </div>
    </div>
  );
}
