import { slugify } from "@/utils/slugify";
import {
  deleteProductById,
  findSlugsTaken,
  getProductById,
  insertFullProduct,
  listAllProductsForAdmin,
  updateFullProduct,
  type FullProductRecord,
} from "./products.db";
import type { ProductStatusValue } from "./products.validators";

/**
 * Generates a unique slug from the English name. Collisions get a numeric
 * suffix (-2, -3…) rather than failing the whole save.
 */
export async function resolveUniqueProductSlug(
  requestedSlug: string | undefined,
  nameEn: string,
  excludeProductId?: string,
): Promise<string> {
  const base = slugify(requestedSlug ?? nameEn) || `product-${Date.now()}`;
  const taken = new Set(await findSlugsTaken(base, excludeProductId));
  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export interface SaveProductCommand {
  nameEn: string;
  nameAr: string;
  slug?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  metaTitle?: string;
  metaDescription?: string;
  categoryId?: string | null;
  price: number;
  compareAtPrice?: number | null;
  status: ProductStatusValue;
  isFeatured: boolean;
  stockQuantity: number;
  images: { url: string; altText?: string }[];
  variants: {
    /** Present when editing an existing variant — enables diffing over replace. */
    id?: string;
    sku?: string;
    size?: string;
    color?: string;
    material?: string;
    priceDelta: number;
    stockQuantity: number;
  }[];
}

export async function createProduct(command: SaveProductCommand): Promise<string> {
  const slug = await resolveUniqueProductSlug(command.slug, command.nameEn);
  return insertFullProduct({
    product: {
      ...command,
      slug,
      compareAtPrice: command.compareAtPrice ?? null,
      categoryId: command.categoryId ?? null,
    },
    images: command.images,
    variants: command.variants,
  });
}

export async function updateProduct(
  id: string,
  command: Partial<SaveProductCommand>,
): Promise<void> {
  // Relations are replaced wholesale only when the payload includes them —
  // partial patches (e.g. price-only edits) leave images/variants untouched
  const productPatch = { ...command };
  delete productPatch.images;
  delete productPatch.variants;

  // Create resolves collisions; update passed the caller's slug straight to the
  // unique index, surfacing a raw database error instead of a suffixed slug
  if (productPatch.slug !== undefined) {
    productPatch.slug = await resolveUniqueProductSlug(productPatch.slug, productPatch.nameEn ?? "", id);
  }

  const replaceRelations =
    Array.isArray(command.images) || Array.isArray(command.variants);

  await updateFullProduct(id, {
    product: productPatch,
    images: command.images ?? [],
    variants: command.variants ?? [],
    replaceRelations,
  });
}

export async function getProductForAdmin(id: string): Promise<FullProductRecord | null> {
  return getProductById(id);
}

export async function listProductsForAdmin(filters: {
  search?: string;
  status?: ProductStatusValue;
  page: number;
  pageSize: number;
}) {
  return listAllProductsForAdmin(filters);
}

/**
 * Archive rather than delete: a hard delete cascades away the product's stock
 * ledger — the table documented as append-only and auditable — along with its
 * reviews. `archived` is the lifecycle state that exists for exactly this.
 */
export async function archiveProduct(id: string): Promise<void> {
  await updateFullProduct(id, {
    product: { status: "archived" },
    images: [],
    variants: [],
    replaceRelations: false,
  });
}

/** Irreversible, and reserved for super admins at the router. */
export async function destroyProduct(id: string): Promise<void> {
  await deleteProductById(id);
}
