import { slugify } from "@/utils/slugify";
import {
  countProductsInCategory,
  deleteCategory,
  findCategorySlugMatches,
  getCategoryById,
  insertCategory,
  updateCategory,
} from "./categories.db";
import { CATEGORY_MAX_DEPTH } from "./categories.validators";

export async function resolveUniqueCategorySlug(
  requested: string | undefined,
  nameEn: string,
): Promise<string> {
  const base = slugify(requested ?? nameEn) || `category-${Date.now()}`;
  const taken = new Set(await findCategorySlugMatches(base));
  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

/**
 * Depth guard keeps the tree renderable as two levels (parent → child).
 * A child category can never become a parent itself.
 */
export async function assertParentDepthAllowed(parentId: string | null | undefined): Promise<void> {
  if (!parentId) return;

  const parent = await getCategoryById(parentId);
  if (!parent) throw new Error("Parent category not found");
  if (parent.parentId !== null) {
    throw new Error(`Categories support a maximum depth of ${CATEGORY_MAX_DEPTH}`);
  }
}

export async function createCategory(command: {
  nameEn: string;
  nameAr: string;
  slug?: string;
  parentId?: string | null;
  descriptionEn?: string;
  descriptionAr?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
}) {
  await assertParentDepthAllowed(command.parentId);
  const slug = await resolveUniqueCategorySlug(command.slug, command.nameEn);
  return insertCategory({ ...command, slug, parentId: command.parentId ?? null });
}

export async function editCategory(
  id: string,
  command: Partial<{
    nameEn: string;
    nameAr: string;
    slug?: string;
    parentId?: string | null;
    descriptionEn?: string;
    descriptionAr?: string;
    imageUrl?: string;
    displayOrder: number;
    isActive: boolean;
  }>,
) {
  if ("parentId" in command) {
    if (command.parentId === id) throw new Error("A category cannot be its own parent");
    await assertParentDepthAllowed(command.parentId);
  }
  await updateCategory(id, command);
}

export async function removeCategory(id: string): Promise<void> {
  // Blocking deletion while products reference the category avoids orphaned
  // product cards in the storefront navigation
  const productCount = await countProductsInCategory(id);
  if (productCount > 0) {
    throw new Error(`Reassign ${productCount} product(s) before deleting this category`);
  }
  await deleteCategory(id);
}
