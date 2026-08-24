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

/**
 * Egypt. Domestic numbers are typed as 01X XXXX XXXX and must canonicalise to
 * +20 1X XXXX XXXX, or one customer becomes two rows and the ban check misses.
 * ponytail: a single calling code is the ceiling — swap in libphonenumber only
 * if the store ever ships outside one country.
 */
export const PHONE_COUNTRY_CODE = "20";

/** Digits in an Egyptian national significant number (mobile: 1XXXXXXXXX). */
export const PHONE_NATIONAL_LENGTH = 10;

/** Roles that may open the admin panel at all. */
export const ADMIN_ROLES: readonly UserRole[] = ["super_admin", "manager", "staff"];

/** Roles that may destroy catalogue data or ban customers. Staff may not. */
export const DESTRUCTIVE_ROLES: readonly UserRole[] = ["super_admin", "manager"];

/** Rows per page in every admin table. */
export const ADMIN_PAGE_SIZE = 20;
