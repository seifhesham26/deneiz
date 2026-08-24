import { productFiltersSchema, type ProductFilters } from "@/server/products/products.validators";

type RawParams = URLSearchParams | Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Normalizes URL state (URLSearchParams on the server, Next's searchParams
 * record on the client) into validated filters. Invalid input falls back to
 * defaults instead of throwing — bad URLs should degrade, not 500.
 */
export function parseProductFilters(params: RawParams): ProductFilters {
  const raw: Record<string, unknown> = {};

  if (params instanceof URLSearchParams) {
    for (const [key, value] of params.entries()) {
      raw[key] = value;
    }
  } else {
    for (const [key, value] of Object.entries(params)) {
      const single = firstValue(value);
      if (single !== undefined) raw[key] = single;
    }
  }

  const result = productFiltersSchema.safeParse(raw);
  return result.success ? result.data : productFiltersSchema.parse({});
}

/** Serializes filters back into a querystring, dropping default values. */
export function serializeProductFilters(filters: ProductFilters): string {
  const defaults = productFiltersSchema.parse({});
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === false) continue;
    if (value === defaults[key as keyof typeof defaults]) continue;
    search.set(key, String(value));
  }
  return search.toString();
}
