import { describe, expect, it } from "vitest";
import { slugify } from "./slugify";

describe("slugify", () => {
  it("lowercases and hyphenates latin names", () => {
    expect(slugify("Silver Ring Deluxe")).toBe("silver-ring-deluxe");
  });

  it("strips punctuation and collapses separators", () => {
    expect(slugify("  Gold & Pearl -- Earrings! ")).toBe("gold-pearl-earrings");
    expect(slugify("multi___underscore")).toBe("multi-underscore");
  });

  it("preserves Arabic letters so Arabic names keep readable slugs", () => {
    expect(slugify("خاتم فضة")).toBe("خاتم-فضة");
  });
});
