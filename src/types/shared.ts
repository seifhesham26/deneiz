/** Cross-cutting primitives shared by every domain. */

export type Locale = "ar" | "en";

export type TextDirection = "ltr" | "rtl";

export interface LocalizedText {
  en: string;
  ar: string;
}

export function localized(text: LocalizedText, locale: Locale): string {
  return text[locale];
}

export const SUPPORTED_LOCALES: readonly Locale[] = ["ar", "en"];
