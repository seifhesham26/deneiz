import { describe, expect, it } from "vitest";
import { formatCurrency } from "./format-currency";
import { formatDate } from "./format-date";

describe("formatCurrency", () => {
  it("formats whole amounts without decimals in English", () => {
    // Intl inserts a non-breaking space between code and amount
    expect(formatCurrency(250, "en").replace(/\u00A0/g, " ")).toBe("SAR 250");
  });

  it("keeps latin digits for Arabic", () => {
    const formatted = formatCurrency(99.5, "ar");
    expect(formatted).toMatch(/99\.5/);
    expect(formatted).not.toMatch(/[٠-٩]/);
  });
});

describe("formatDate", () => {
  const date = new Date("2026-03-09T12:00:00Z");

  it("produces an english short date", () => {
    expect(formatDate(date, "en")).toMatch(/Mar|9|2026/);
  });

  it("never emits arabic-indic digits", () => {
    expect(formatDate(date, "ar")).not.toMatch(/[٠-٩]/);
  });
});
