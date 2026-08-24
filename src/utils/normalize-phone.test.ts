import { describe, expect, it } from "vitest";
import { isPlausiblePhoneNumber, normalizePhoneNumber } from "./normalize-phone";

describe("normalizePhoneNumber", () => {
  it("collapses formatting variants of one number to a single key", () => {
    const canonical = "+201234567890";
    expect(normalizePhoneNumber("+201234567890")).toBe(canonical);
    expect(normalizePhoneNumber("+20 123 456 7890")).toBe(canonical);
    expect(normalizePhoneNumber("+20-123-456-7890")).toBe(canonical);
    expect(normalizePhoneNumber("00201234567890")).toBe(canonical);
  });

  it("drops a domestic trunk zero when no country code is given", () => {
    expect(normalizePhoneNumber("01234567890")).toBe("+1234567890");
  });
});

describe("isPlausiblePhoneNumber", () => {
  it("rejects the punctuation-only value the old regex accepted", () => {
    expect(isPlausiblePhoneNumber("+--------")).toBe(false);
  });

  it("accepts a real number and rejects a too-short one", () => {
    expect(isPlausiblePhoneNumber("+20 123 456 7890")).toBe(true);
    expect(isPlausiblePhoneNumber("+123")).toBe(false);
  });
});
