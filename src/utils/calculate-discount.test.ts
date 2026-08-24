import { describe, expect, it } from "vitest";
import { calculateDiscountPercent, calculateDiscountedPrice } from "./calculate-discount";

describe("calculateDiscountPercent", () => {
  it("returns null when there is no compare-at price", () => {
    expect(calculateDiscountPercent(100, null)).toBeNull();
    expect(calculateDiscountPercent(100)).toBeNull();
  });

  it("returns null when compare-at price is not higher than price", () => {
    expect(calculateDiscountPercent(100, 100)).toBeNull();
    expect(calculateDiscountPercent(120, 100)).toBeNull();
  });

  it("computes the rounded percentage off", () => {
    expect(calculateDiscountPercent(75, 100)).toBe(25);
    expect(calculateDiscountPercent(59.5, 85)).toBe(30);
  });
});

describe("calculateDiscountedPrice", () => {
  it("returns the original price when percent is zero or negative", () => {
    expect(calculateDiscountedPrice(200, 0)).toBe(200);
    expect(calculateDiscountedPrice(200, -10)).toBe(200);
  });

  it("returns zero at a full discount", () => {
    expect(calculateDiscountedPrice(200, 100)).toBe(0);
  });

  it("rounds to two decimals", () => {
    expect(calculateDiscountedPrice(33.33, 50)).toBe(16.67);
  });
});
