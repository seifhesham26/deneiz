import { describe, expect, it } from "vitest";
import { isPlausiblePhoneNumber, normalizePhoneNumber } from "./normalize-phone";

/** Every form one Egyptian mobile is realistically typed in. */
const CANONICAL = "+201012345678";

describe("normalizePhoneNumber", () => {
  it("collapses international formatting variants to a single key", () => {
    expect(normalizePhoneNumber("+201012345678")).toBe(CANONICAL);
    expect(normalizePhoneNumber("+20 101 234 5678")).toBe(CANONICAL);
    expect(normalizePhoneNumber("+20-101-234-5678")).toBe(CANONICAL);
    expect(normalizePhoneNumber("00201012345678")).toBe(CANONICAL);
    expect(normalizePhoneNumber("  +201012345678  ")).toBe(CANONICAL);
  });

  it("expands the domestic trunk zero to the country code", () => {
    // The dominant way an Egyptian customer types their own number. Dropping
    // the zero without adding "20" produced +1012345678 — a different person.
    expect(normalizePhoneNumber("01012345678")).toBe(CANONICAL);
    expect(normalizePhoneNumber("010 1234 5678")).toBe(CANONICAL);
    expect(normalizePhoneNumber("010-1234-5678")).toBe(CANONICAL);
  });

  it("treats the domestic and international forms as the same customer", () => {
    expect(normalizePhoneNumber("01012345678")).toBe(normalizePhoneNumber("+201012345678"));
  });

  it("accepts a bare national number with no trunk zero", () => {
    expect(normalizePhoneNumber("1012345678")).toBe(CANONICAL);
  });

  it("recognises a country code typed without a plus", () => {
    expect(normalizePhoneNumber("201012345678")).toBe(CANONICAL);
  });

  it("returns an empty key for input with no digits at all", () => {
    expect(normalizePhoneNumber("+--------")).toBe("");
  });
});

describe("isPlausiblePhoneNumber", () => {
  it("rejects the punctuation-only value the old regex accepted", () => {
    expect(isPlausiblePhoneNumber("+--------")).toBe(false);
  });

  it("accepts every real form and rejects a too-short one", () => {
    expect(isPlausiblePhoneNumber("+20 101 234 5678")).toBe(true);
    expect(isPlausiblePhoneNumber("01012345678")).toBe(true);
    expect(isPlausiblePhoneNumber("+123")).toBe(false);
  });
});
