"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, className, id, children, ...rest },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="flex w-full flex-col gap-1">
      {label ? (
        <label htmlFor={selectId} className="text-xs font-medium text-text-secondary">
          {label}
        </label>
      ) : null}
      <select
        ref={ref}
        id={selectId}
        aria-invalid={Boolean(error)}
        className={cn(
          "min-h-11 w-full rounded-lg border border-border bg-surface-raised px-3 text-sm text-text-primary",
          "focus:border-accent focus:outline-none",
          error && "border-danger",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
});
