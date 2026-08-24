/**
 * customers.phoneNumber is the unique key that identifies a shopper and backs
 * the checkout ban check, so it must be canonical: "+20 123 456 7890",
 * "+201234567890" and "00201234567890" are one person, not three.
 *
 * orders.phoneNumber keeps the raw string the customer typed — that column is
 * documented as a contact snapshot and should stay verbatim.
 */
export function normalizePhoneNumber(raw: string): string {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+") || trimmed.startsWith("00");
  const digits = trimmed.replace(/\D/g, "").replace(/^00/, "");
  if (!digits) return "";
  // A leading zero is a domestic trunk prefix, dropped once a country code is implied
  return hasPlus ? `+${digits}` : `+${digits.replace(/^0+/, "")}`;
}

/** Digit count that survives normalization — E.164 allows 8–15. */
export function isPlausiblePhoneNumber(raw: string): boolean {
  const digits = normalizePhoneNumber(raw).slice(1);
  return digits.length >= 8 && digits.length <= 15;
}
