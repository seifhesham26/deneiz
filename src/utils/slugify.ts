/**
 * Unicode-aware slugify: keeps Arabic letters intact (\p{L}) so Arabic
 * product names produce readable slugs instead of empty strings.
 */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}
