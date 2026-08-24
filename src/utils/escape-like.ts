/**
 * `%` and `_` are LIKE/ILIKE wildcards. Search boxes feed user text straight
 * into a `%...%` pattern, so without escaping a search for "%" matches every
 * row and "_" matches any single character.
 *
 * The backslash escape works because Postgres LIKE uses `\` by default.
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

/** Convenience for the near-universal "contains" case. */
export function containsPattern(value: string): string {
  return `%${escapeLike(value)}%`;
}
