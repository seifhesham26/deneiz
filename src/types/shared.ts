/** Cross-cutting primitives shared by every domain. */

export type Locale = "ar" | "en";

export type TextDirection = "ltr" | "rtl";

/** Mirrors the user_role database enum; lives here so client-safe modules
 *  (constants, route guards) can reference it without importing server code. */
export type UserRole = "super_admin" | "manager" | "staff" | "customer";

export const SUPPORTED_LOCALES: readonly Locale[] = ["ar", "en"];
