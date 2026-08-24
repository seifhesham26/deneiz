"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";

/**
 * Shared pagination control. Lifted out of the storefront product listing so
 * the admin tables — which fetched page one and discarded the server's `total`,
 * making later records unreachable — use the same window, arrows and RTL
 * handling instead of each growing their own.
 */
interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, pageCount, onPageChange, className }: PaginationProps) {
  const { t } = useLang();
  if (pageCount <= 1) return null;

  return (
    <nav
      className={`flex items-center justify-center gap-1.5 ${className ?? ""}`}
      aria-label={t.common.pagination}
    >
      <PaginationArrow
        direction="start"
        label={t.common.previous}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      />
      {buildPageWindow(page, pageCount).map((entry, index) =>
        typeof entry === "number" ? (
          <button
            key={entry}
            type="button"
            onClick={() => onPageChange(entry)}
            aria-current={entry === page ? "page" : undefined}
            aria-label={t.common.pageLabel(entry)}
            className={`flex min-h-11 min-w-11 items-center justify-center rounded-full text-sm transition-colors ${
              entry === page ? "bg-primary font-semibold text-text-inverse" : "hover:bg-surface"
            }`}
          >
            {entry}
          </button>
        ) : (
          <span key={`gap-${index}`} className="px-1.5 text-text-muted" aria-hidden>
            …
          </span>
        ),
      )}
      <PaginationArrow
        direction="end"
        label={t.common.next}
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      />
    </nav>
  );
}

export function buildPageWindow(current: number, total: number): (number | "gap")[] {
  // Short ranges always render every page — an ellipsis would only hide one
  if (total <= 6) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const desired = new Set(
    [1, 2, current - 1, current, current + 1, total - 1, total].filter(
      (page) => page >= 1 && page <= total,
    ),
  );

  if (desired.size >= total) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const sorted = [...desired].sort((a, b) => a - b);
  const pages: (number | "gap")[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (page - previous > 1) pages.push("gap");
    pages.push(page);
    previous = page;
  }
  return pages;
}

function PaginationArrow({
  direction,
  label,
  disabled,
  onClick,
}: {
  direction: "start" | "end";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "start" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-11 min-w-11 items-center justify-center rounded-full transition-colors hover:bg-surface disabled:pointer-events-none disabled:opacity-40"
    >
      {/* Chevrons are direction-biased; mirror them under RTL */}
      <Icon aria-hidden className="size-4.5 rtl:rotate-180" />
    </button>
  );
}
