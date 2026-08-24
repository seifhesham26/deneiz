import type { Locale } from "@/types/shared";

const DATE_FORMATS: Record<Locale, Intl.DateTimeFormatOptions> = {
  en: { year: "numeric", month: "short", day: "numeric" },
  ar: { year: "numeric", month: "long", day: "numeric" },
};

const LOCALE_TAGS: Record<Locale, string> = {
  en: "en-US",
  ar: "ar-SA-u-nu-latn",
};

export function formatDate(
  date: Date | string | number,
  locale: Locale,
): string {
  const value = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], DATE_FORMATS[locale]).format(value);
}

export function formatDateTime(date: Date | string | number, locale: Locale): string {
  const value = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    ...DATE_FORMATS[locale],
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}
