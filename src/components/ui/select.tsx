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
  const errorId = `${selectId}-error`;

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
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "min-h-11 w-full rounded-lg border border-border bg-surface-raised px-3 text-sm text-text-primary",
          "focus:border-accent",
          error && "border-danger",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      {error ? (
        <p id={errorId} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});
