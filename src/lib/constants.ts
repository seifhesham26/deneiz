/** Named constants shared across the app — no magic numbers in logic. */

import type { UserRole } from "@/types/shared";

export const LOCALE_COOKIE = "deneiz-locale";

export const DEFAULT_LOCALE = "ar" as const;

export const DEFAULT_PAGE_SIZE = 12;

export const MAX_PAGE_SIZE = 48;

export const LOW_STOCK_DEFAULT_THRESHOLD = 5;

export const CURRENCY_CODE = "EGP";

/**
 * The store operates from a single region, so calendar days ("orders today",
 * revenue buckets, the order-number date) are cut here rather than in UTC.
 * ponytail: one constant is the ceiling — move to settings.timezone only if
 * the business ever runs in more than one region.
 */
export const STORE_TIMEZONE = "Africa/Cairo";

export const ORDER_NUMBER_PREFIX = "DNZ";

/** Roles that may open the admin panel at all. */
export const ADMIN_ROLES: readonly UserRole[] = ["super_admin", "manager", "staff"];

/** Roles that may destroy catalogue data or ban customers. Staff may not. */
export const DESTRUCTIVE_ROLES: readonly UserRole[] = ["super_admin", "manager"];

/** Rows per page in every admin table. */
export const ADMIN_PAGE_SIZE = 20;
