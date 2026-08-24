"use client";

import { Sparkles } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { cn } from "@/lib/cn";

interface SplitAuthShellProps {
  title: string;
  subtitle?: string;
  /** dark = admin panel styling; light = storefront */
  tone?: "light" | "dark";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Shared two-panel auth layout: brand panel on the side (desktop only),
 * centered form column on the other. Both auth surfaces stay visually
 * consistent while keeping their own tone.
 */
export function SplitAuthShell({
  title,
  subtitle,
  tone = "light",
  children,
  footer,
}: SplitAuthShellProps) {
  const { t } = useLang();
  const isAdmin = tone === "dark";

  return (
    <div
      className={cn(
        "grid min-h-dvh lg:grid-cols-[1.1fr_1fr]",
        isAdmin ? "bg-surface" : "bg-background",
      )}
    >
      {/* Brand panel */}
      <aside
        className={cn(
          "relative hidden flex-col justify-between overflow-hidden p-12 text-text-inverse lg:flex",
          isAdmin ? "bg-admin-sidebar" : "bg-primary",
        )}
        aria-hidden
      >
        <span className="text-2xl font-semibold tracking-wide">{t.common.storeName}</span>

        <div className="flex flex-col gap-4">
          <Sparkles aria-hidden className="size-8 text-accent" />
          <p
            className="max-w-md font-semibold leading-snug"
            style={{ fontSize: "var(--text-3xl)" }}
          >
            {t.common.tagline}
          </p>
        </div>

        <p className="text-sm text-on-media/50">
          © {new Date().getFullYear()} {t.common.storeName}
        </p>

        {/* Soft radial glow for depth without a background image dependency */}
        <div className="pointer-events-none absolute -end-32 -top-32 size-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -start-24 size-96 rounded-full bg-on-media/5 blur-3xl" />
      </aside>

      {/* Form column — div, not main, because pages embed this inside their layout's main */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="flex w-full max-w-md flex-col gap-7">
          <div className="lg:hidden">
            <span className="text-xl font-semibold tracking-wide">{t.common.storeName}</span>
          </div>

          <header className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
            {subtitle ? (
              <p className="text-sm leading-relaxed text-text-secondary">{subtitle}</p>
            ) : null}
          </header>

          {children}

          {footer ? <div className="text-sm text-text-secondary">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
