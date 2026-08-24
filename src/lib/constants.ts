/** Named constants shared across the app — no magic numbers in logic. */

export const LOCALE_COOKIE = "deneiz-locale";

export const DEFAULT_LOCALE = "ar" as const;

export const DEFAULT_PAGE_SIZE = 12;

export const MAX_PAGE_SIZE = 48;

export const LOW_STOCK_DEFAULT_THRESHOLD = 5;

export const FREE_SHIPPING_THRESHOLD = 300;

export const DEFAULT_SHIPPING_FEE = 25;

export const CURRENCY_CODE = "EGP";

/** Better Auth session cookie — checked by the proxy before hitting /admin. */
export const SESSION_COOKIE_NAME = "better-auth.session_token";

export const ORDER_NUMBER_PREFIX = "DNZ";
