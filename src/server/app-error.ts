import { TRPCError } from "@trpc/server";
import type { Dictionary } from "@/lib/dictionary";

/**
 * Business failures travel as a dictionary key plus params, never as a
 * prose sentence: tRPC replaces the `message` of unrecognised throws with
 * "Internal server error" in production, and a hardcoded English string
 * would be wrong for the Arabic storefront anyway.
 *
 * The key rides in `cause` so `errorFormatter` (src/server/trpc.ts) can
 * publish it as structured `data.appError` for the client to render.
 */
export type AppErrorParams = Record<string, string | number>;

/**
 * Only keys that actually exist in the dictionary may be thrown. Type-only
 * import, so no dictionary data reaches the server bundle.
 *
 * DeepDictionary already guarantees the two locales agree with each other; it
 * cannot tell whether a thrown key exists at all, and an unknown key degrades
 * silently to errors.generic. This turns that into a compile error.
 */
export type AppErrorKey = keyof Dictionary["errors"];

export class AppErrorCause extends Error {
  constructor(
    readonly key: AppErrorKey,
    readonly params: AppErrorParams,
  ) {
    super(key);
    this.name = "AppErrorCause";
  }
}

/** Codes deliberately limited to the ones this application actually raises. */
type AppErrorCode =
  | "BAD_REQUEST"
  | "CONFLICT"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_SERVER_ERROR";

export function appError(
  code: AppErrorCode,
  key: AppErrorKey,
  params: AppErrorParams = {},
): TRPCError {
  return new TRPCError({
    code,
    // message doubles as the server-log line; the client reads data.appError
    message: key,
    cause: new AppErrorCause(key, params),
  });
}
