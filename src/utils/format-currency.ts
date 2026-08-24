import { CURRENCY_CODE } from "@/lib/constants";
import type { Locale } from "@/types/shared";

/**
 * Latin digits are forced for Arabic so prices stay scannable in a
 * right-to-left layout without mixing numeral systems.
 */
const LOCALE_TAGS: Record<Locale, string> = {
  en: "en-US",
  ar: "ar-EG-u-nu-latn",
};

export function formatCurrency(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_TAGS[locale], {
    style: "currency",
    currency: CURRENCY_CODE,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}
