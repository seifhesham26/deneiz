import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/root-router";
import { createTRPCContext } from "@/server/trpc";

function handleTrpcRequest(request: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: () => createTRPCContext(request),
  });
}

export { handleTrpcRequest as GET, handleTrpcRequest as POST };
