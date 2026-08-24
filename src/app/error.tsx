"use client";

import { useEffect } from "react";
import { captureException } from "@/lib/sentry";

/**
 * Route-level boundary. Without one, a render throw shows Next's default
 * screen and nothing is reported.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error);
  }, [error]);

  return (
    <div className="content-shell flex min-h-[60dvh] flex-col items-center justify-center gap-5 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong — حدث خطأ ما</h1>
      <button
        type="button"
        onClick={reset}
        className="mt-2 min-h-11 rounded-full bg-primary px-6 py-3 text-sm font-medium text-text-inverse transition-colors hover:bg-primary-hover"
      >
        Try again — حاول مجددًا
      </button>
    </div>
  );
}
