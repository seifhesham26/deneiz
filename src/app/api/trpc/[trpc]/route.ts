import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/root-router";
import { createTRPCContext } from "@/server/trpc";
import { captureException } from "@/lib/sentry";

function handleTrpcRequest(request: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: () => createTRPCContext(request),
    // Business failures carry an appError key and are expected; only genuine
    // faults are worth reporting
    onError({ error, path }) {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        captureException(
          new Error(`tRPC ${path ?? "<no-path>"}: ${error.message}`, { cause: error }),
        );
      }
    },
  });
}

export { handleTrpcRequest as GET, handleTrpcRequest as POST };
