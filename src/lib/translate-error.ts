import type { Dictionary, ErrorParams } from "@/lib/dictionary";

/**
 * Renders a failure in the caller's locale. Two wire formats feed this:
 *
 *   - procedures  → structured `data.appError` ({ key, params })
 *   - validators  → the Zod message string, shaped "key" or "key:value"
 *
 * Anything unrecognised falls back to the generic message rather than
 * leaking a raw English sentence into an Arabic page.
 */

type ErrorDictionary = Dictionary["errors"];

/** Shape of a TRPCClientError, narrowed to the parts we read. */
interface TranslatableError {
  data?: { appError?: { key: string; params: ErrorParams } | null } | null;
}

function render(key: string, params: ErrorParams, t: Dictionary): string {
  const entry = t.errors[key as keyof ErrorDictionary];
  if (entry === undefined) return t.errors.generic;
  return typeof entry === "function" ? entry(params) : entry;
}

/** For mutation/query failures — `onError: (error) => translateError(error, t)`. */
export function translateError(error: TranslatableError | null | undefined, t: Dictionary): string {
  const appError = error?.data?.appError;
  if (!appError) return t.errors.generic;
  return render(appError.key, appError.params, t);
}

/**
 * For per-field validator messages. The single positional value is exposed
 * under every name a dictionary entry might use, so "tooShort:2" resolves
 * whether the entry reads `p.min` or `p.max`.
 */
export function translateFieldMessage(
  message: string | undefined,
  t: Dictionary,
): string | undefined {
  // No message means the field is valid — must stay undefined so inputs do
  // not render an error state for every clean field
  if (!message) return undefined;
  const separator = message.indexOf(":");
  const key = separator === -1 ? message : message.slice(0, separator);
  const value = separator === -1 ? "" : message.slice(separator + 1);
  return render(key, { value, min: value, max: value, count: value }, t);
}
