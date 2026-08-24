"use client";

import { Star } from "lucide-react";
import { formatDate } from "@/utils/format-date";
import type { Locale } from "@/types/shared";
import type { ReviewListItem } from "@/types/api";
import { cn } from "@/lib/cn";

interface ReviewCardProps {
  review: ReviewListItem;
  locale: Locale;
}

export function ReviewCard({ review, locale }: ReviewCardProps) {
  return (
    <article className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface-raised p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{review.authorName}</span>
        <span className="text-xs text-text-muted">{formatDate(review.createdAt, locale)}</span>
      </div>

      <div className="flex items-center gap-0.5" aria-label={`${review.rating}/5`}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Star
            key={value}
            aria-hidden
            className={cn(
              "size-4",
              value <= review.rating ? "fill-accent text-accent" : "text-text-muted",
            )}
          />
        ))}
      </div>

      {review.title ? <h3 className="text-sm font-semibold">{review.title}</h3> : null}
      {review.body ? <p className="text-sm text-text-secondary">{review.body}</p> : null}
    </article>
  );
}
