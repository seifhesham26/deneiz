import { describe, expect, it } from "vitest";
import { translateError, translateFieldMessage } from "./translate-error";
import { getDictionary } from "./dictionary";

const t = getDictionary("en");

describe("translateError", () => {
  it("renders a static key from the dictionary", () => {
    expect(translateError({ data: { appError: { key: "customerBanned", params: {} } } }, t)).toBe(
      t.errors.customerBanned,
    );
  });

  it("passes params to a dynamic key", () => {
    const message = translateError(
      { data: { appError: { key: "stockOnly", params: { count: 2, name: "Ring" } } } },
      t,
    );
    expect(message).toBe('Only 2 left of "Ring"');
  });

  it("falls back to generic rather than leaking an unknown key", () => {
    expect(translateError({ data: { appError: { key: "nope", params: {} } } }, t)).toBe(
      t.errors.generic,
    );
    expect(translateError(null, t)).toBe(t.errors.generic);
  });
});

describe("translateFieldMessage", () => {
  it("returns undefined for a valid field so inputs render no error state", () => {
    expect(translateFieldMessage(undefined, t)).toBeUndefined();
  });

  it("parses the key:value wire format", () => {
    expect(translateFieldMessage("tooShort:2", t)).toBe("Must be at least 2 characters");
  });

  it("renders a bare key", () => {
    expect(translateFieldMessage("required", t)).toBe(t.errors.required);
  });

  it("falls back to generic for raw Zod prose", () => {
    expect(translateFieldMessage("Too small: expected string", t)).toBe(t.errors.generic);
  });
});
