import { describe, expect, it } from "vitest";
import { parseProductFilters, serializeProductFilters } from "./parse-filters";

describe("parseProductFilters", () => {
  it("parses a full URLSearchParams payload", () => {
    const params = new URLSearchParams({
      search: "ring",
      categorySlug: "rings",
      minPrice: "50",
      maxPrice: "200",
      sort: "price_asc",
      page: "2",
    });

    const filters = parseProductFilters(params);
    expect(filters.search).toBe("ring");
    expect(filters.categorySlug).toBe("rings");
    expect(filters.minPrice).toBe(50);
    expect(filters.maxPrice).toBe(200);
    expect(filters.sort).toBe("price_asc");
    expect(filters.page).toBe(2);
    expect(filters.pageSize).toBe(12);
  });

  it("falls back to defaults for invalid input instead of throwing", () => {
    const params = new URLSearchParams({ minPrice: "not-a-number", page: "-4" });
    const filters = parseProductFilters(params);

    expect(filters.minPrice).toBeUndefined();
    expect(filters.page).toBe(1);
  });

  it("reads only the first value from Next-style arrays", () => {
    const filters = parseProductFilters({ search: ["first", "second"] });
    expect(filters.search).toBe("first");
  });
});

describe("serializeProductFilters", () => {
  it("omits default values and disabled flags", () => {
    const query = serializeProductFilters(parseProductFilters(new URLSearchParams()));
    expect(query).toBe("");
  });

  it("keeps meaningful values", () => {
    const query = serializeProductFilters(
      parseProductFilters(new URLSearchParams({ sort: "top_rated", category: "" })),
    );
    expect(query).toContain("sort=top_rated");
  });
});
