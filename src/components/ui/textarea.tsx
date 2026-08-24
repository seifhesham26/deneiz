"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className, id, rows = 4, ...rest },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <div className="flex w-full flex-col gap-1">
      {label ? (
        <label htmlFor={textareaId} className="text-xs font-medium text-text-secondary">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        aria-invalid={Boolean(error)}
        className={cn(
          "w-full rounded-lg border border-border bg-surface-raised p-3 text-sm text-text-primary",
          "placeholder:text-text-muted focus:border-accent focus:outline-none",
          error && "border-danger",
          className,
        )}
        {...rest}
      />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
});
