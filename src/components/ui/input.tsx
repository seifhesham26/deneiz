"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Element rendered inside the field's end edge (e.g. password toggle) */
  trailing?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, trailing, className, id, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex w-full flex-col gap-1">
      {label ? (
        <label htmlFor={inputId} className="text-xs font-medium text-text-secondary">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "min-h-11 w-full rounded-lg border border-border bg-surface-raised px-3 text-sm text-text-primary",
            "placeholder:text-text-muted focus:border-accent",
            error && "border-danger",
            trailing && "pe-12",
            className,
          )}
          {...rest}
        />
        {trailing ? (
          <span className="absolute inset-y-0 end-1.5 flex items-center">{trailing}</span>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
});
