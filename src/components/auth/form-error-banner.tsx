"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

interface FormErrorBannerProps {
  message: string | null;
  className?: string;
}

/** Inline error surface for auth forms — announced to screen readers. */
export function FormErrorBanner({ message, className }: FormErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 p-3.5 text-sm text-danger",
        className,
      )}
    >
      <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
