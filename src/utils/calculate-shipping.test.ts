import { describe, expect, it } from "vitest";
import { calculateShipping } from "./calculate-shipping";

const settings = { shippingFee: 25, freeShippingThreshold: 300 };

describe("calculateShipping", () => {
  it("charges the fee below the threshold", () => {
    expect(calculateShipping(299, settings)).toBe(25);
  });

  it("is free at and above the threshold", () => {
    expect(calculateShipping(300, settings)).toBe(0);
    expect(calculateShipping(1000, settings)).toBe(0);
  });

  it("never charges delivery on an empty cart", () => {
    expect(calculateShipping(0, settings)).toBe(0);
  });

  it("treats a zero threshold as free shipping disabled, not always free", () => {
    expect(calculateShipping(50, { shippingFee: 25, freeShippingThreshold: 0 })).toBe(25);
    expect(calculateShipping(100000, { shippingFee: 25, freeShippingThreshold: 0 })).toBe(25);
  });
});
