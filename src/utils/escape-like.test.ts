import { describe, expect, it } from "vitest";
import { containsPattern, escapeLike } from "./escape-like";

describe("escapeLike", () => {
  it("escapes the wildcards that would otherwise match everything", () => {
    expect(escapeLike("%")).toBe("\\%");
    expect(escapeLike("_")).toBe("\\_");
    expect(escapeLike("50% off")).toBe("50\\% off");
  });

  it("escapes the escape character itself", () => {
    expect(escapeLike("a\\b")).toBe("a\\\\b");
  });

  it("leaves ordinary search text untouched", () => {
    expect(escapeLike("silver ring")).toBe("silver ring");
  });

  it("wraps a contains pattern around the escaped value", () => {
    expect(containsPattern("100%")).toBe("%100\\%%");
  });
});
