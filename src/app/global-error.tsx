"use client";

import { useEffect } from "react";
import { captureException } from "@/lib/sentry";

/** Last-resort boundary: catches throws in the root layout itself, so it must
 *  render its own <html>/<body>. */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ display: "grid", placeItems: "center", minHeight: "100dvh", margin: 0 }}>
        <p style={{ fontFamily: "system-ui, sans-serif" }}>
          Something went wrong — حدث خطأ ما
        </p>
      </body>
    </html>
  );
}
