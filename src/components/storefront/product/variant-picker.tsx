"use client";

import { useMemo, useState } from "react";
import { useLang } from "@/components/providers/lang-provider";
import { cn } from "@/lib/cn";
import type { ProductDetail } from "@/types/api";

type Variant = ProductDetail["variants"][number];
type VariantDimensions = Partial<Record<"size" | "color" | "material", string>>;

interface VariantPickerProps {
  variants: Variant[];
  selected: Variant | null;
  onSelect: (variant: Variant) => void;
}

const DIMENSION_LABEL_KEYS = {
  size: "size",
  color: "color",
  material: "material",
} as const;

/**
 * Groups variant rows into selectable dimensions (size/color/material).
 * A selection always resolves to exactly one variant row so price and stock
 * stay authoritative — the picker never invents combinations.
 */
export function VariantPicker({ variants, selected, onSelect }: VariantPickerProps) {
  const { t } = useLang();

  const dimensions = useMemo(() => {
    const result: { key: keyof typeof DIMENSION_LABEL_KEYS; values: string[] }[] = [];
    for (const key of Object.keys(DIMENSION_LABEL_KEYS) as (keyof typeof DIMENSION_LABEL_KEYS)[]) {
      const values = Array.from(
        new Set(variants.map((variant) => variant[key]).filter((value): value is string => Boolean(value))),
      );
      if (values.length > 0) result.push({ key, values });
    }
    return result;
  }, [variants]);

  const [pending, setPending] = useState<VariantDimensions>(() => ({
    size: selected?.size ?? undefined,
    color: selected?.color ?? undefined,
    material: selected?.material ?? undefined,
  }));

  function resolveMatch(candidate: VariantDimensions): Variant | null {
    return (
      variants.find((variant) => {
        return (Object.keys(candidate) as (keyof VariantDimensions)[]).every((key) => {
          const wanted = candidate[key];
          return !wanted || variant[key] === wanted;
        });
      }) ?? null
    );
  }

  function choose(key: keyof typeof DIMENSION_LABEL_KEYS, value: string) {
    const next: VariantDimensions =
      pending[key] === value
        ? // Tapping the active pill deselects that dimension
          { ...pending, [key]: undefined }
        : { ...pending, [key]: value };

    setPending(next);
    const match = resolveMatch(next);
    if (match) onSelect(match);
  }

  if (dimensions.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {dimensions.map(({ key, values }) => {
        const labels = t.admin.productsView.variantLabels as Record<string, string>;
        return (
          <div key={key} className="flex flex-col gap-2">
            <span className="text-xs font-medium text-text-secondary">
              {labels[DIMENSION_LABEL_KEYS[key]]}
              {pending[key] ? <span className="text-text-primary">: {pending[key]}</span> : null}
            </span>
            <div className="flex flex-wrap gap-2">
              {values.map((value) => {
                const isActive = pending[key] === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => choose(key, value)}
                    className={cn(
                      "min-h-11 rounded-full border px-5 text-sm transition-all",
                      isActive
                        ? "border-accent bg-accent/10 font-medium text-text-primary"
                        : "border-border text-text-secondary hover:border-text-muted hover:text-text-primary",
                    )}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
