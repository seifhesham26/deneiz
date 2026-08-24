"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { trpc } from "@/lib/trpc-client";
import { LangProvider } from "./lang-provider";
import type { Locale } from "@/types/shared";

interface AppProvidersProps {
  initialLocale: Locale;
  children: React.ReactNode;
}

export function AppProviders({ initialLocale, children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      // v11 moved the transformer into each link
      links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <LangProvider initialLocale={initialLocale}>{children}</LangProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
