import { PHONE_COUNTRY_CODE, PHONE_NATIONAL_LENGTH } from "@/lib/constants";

/**
 * customers.phoneNumber is the unique key that identifies a shopper and backs
 * the checkout ban check, so it must be canonical: "+20 101 234 5678",
 * "+201012345678", "00201012345678" and the domestic "01012345678" are one
 * person, not four.
 *
 * orders.phoneNumber keeps the raw string the customer typed — that column is
 * documented as a contact snapshot and should stay verbatim.
 */
export function normalizePhoneNumber(raw: string): string {
  const trimmed = raw.trim();
  const isInternational = trimmed.startsWith("+") || trimmed.startsWith("00");
  const digits = trimmed.replace(/\D/g, "").replace(/^00/, "");
  if (!digits) return "";

  // An explicit + or 00 means the country code is already present
  if (isInternational) return `+${digits}`;

  // A leading zero is the domestic trunk prefix — it is never part of the
  // number itself, so it comes off before the country code goes on
  const national = digits.replace(/^0+/, "");

  // "201012345678": the country code typed without a plus. Length-checked so a
  // national number that merely starts with 20 is not mistaken for one.
  if (
    national.startsWith(PHONE_COUNTRY_CODE) &&
    national.length === PHONE_COUNTRY_CODE.length + PHONE_NATIONAL_LENGTH
  ) {
    return `+${national}`;
  }

  return `+${PHONE_COUNTRY_CODE}${national}`;
}

/** Digit count that survives normalization — E.164 allows 8–15. */
export function isPlausiblePhoneNumber(raw: string): boolean {
  const digits = normalizePhoneNumber(raw).slice(1);
  return digits.length >= 8 && digits.length <= 15;
}
