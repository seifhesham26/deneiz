"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import type { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { translateFieldMessage } from "@/lib/translate-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader, type UploadedImage } from "./image-uploader";
import { productCreateSchema } from "@/server/products/products.validators";
import { useGetAdminCategories } from "@/hooks/admin/useGetAdminCategories";

/** Raw form shape — numeric inputs stay strings until Zod coerces them. */
export interface ProductFormRawValues {
  nameEn: string;
  nameAr: string;
  slug: string;
  descriptionEn: string;
  descriptionAr: string;
  metaTitle: string;
  metaDescription: string;
  categoryId: string;
  price: string;
  compareAtPrice: string;
  stockQuantity: string;
  status: "draft" | "published" | "archived";
  isFeatured: boolean;
}

export type ProductFormOutput = z.output<typeof productCreateSchema>;

export interface VariantFormValue {
  /** Server id when editing — lets the server diff variants instead of
   *  deleting and re-inserting them, which would orphan persisted cart lines. */
  id?: string;
  /** Client-only React key for rows that do not exist server-side yet. */
  key?: string;
  sku: string;
  size: string;
  color: string;
  material: string;
  priceDelta: number;
  stockQuantity: number;
}

interface ProductFormProps {
  defaultValues?: Partial<ProductFormRawValues>;
  images?: UploadedImage[];
  variants?: VariantFormValue[];
  isEdit: boolean;
  onSubmit: (data: ProductFormOutput) => void;
  isSubmitting: boolean;
}

function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/** Shapes the raw string form values into the schema's input shape. */
function toSchemaInput(values: ProductFormRawValues, images: UploadedImage[], variants: VariantFormValue[]) {
  return {
    nameEn: values.nameEn,
    nameAr: values.nameAr,
    slug: emptyToUndefined(values.slug),
    descriptionEn: emptyToUndefined(values.descriptionEn),
    descriptionAr: emptyToUndefined(values.descriptionAr),
    metaTitle: emptyToUndefined(values.metaTitle),
    metaDescription: emptyToUndefined(values.metaDescription),
    categoryId: values.categoryId === "" ? null : values.categoryId,
    price: values.price,
    compareAtPrice:
      values.compareAtPrice.trim() === "" ? null : Number(values.compareAtPrice),
    status: values.status,
    isFeatured: values.isFeatured,
    stockQuantity: values.stockQuantity === "" ? 0 : Number(values.stockQuantity),
    images,
    variants,
  };
}

/** RHF resolver over the same schema the server enforces. */
const productFormResolver: Resolver<ProductFormRawValues> = async (values, context) => {
  const { images, variants } = context as { images: UploadedImage[]; variants: VariantFormValue[] };
  const result = productCreateSchema.safeParse(toSchemaInput(values, images, variants));
  if (result.success) return { values, errors: {} };

  // Map issues onto their fields so each Input renders its own message rather
  // than one alert() carrying a raw English Zod string
  const errors: Record<string, { type: string; message: string }> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? "root");
    errors[field] ??= { type: issue.code, message: issue.message };
  }
  return { values: {}, errors };
};

function CategoryOptions() {
  const { locale, t } = useLang();
  const { data: categories } = useGetAdminCategories();

  return (
    <>
      <option value="">—</option>
      {categories?.map((category) => (
        <option key={category.id} value={category.id}>
          {locale === "ar" ? category.nameAr : category.nameEn}
        </option>
      ))}
      <option hidden>{t.admin.productsView.category}</option>
    </>
  );
}

export function ProductForm({
  defaultValues,
  images: initialImages,
  variants: initialVariants,
  onSubmit,
  isSubmitting,
}: ProductFormProps) {
  const { t } = useLang();
  const [images, setImages] = useState<UploadedImage[]>(initialImages ?? []);
  const [variants, setVariants] = useState<VariantFormValue[]>(initialVariants ?? []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormRawValues>({
    resolver: productFormResolver,
    context: { images, variants },
    defaultValues: {
      status: "draft",
      price: "",
      compareAtPrice: "",
      stockQuantity: "0",
      categoryId: "",
      slug: "",
      descriptionEn: "",
      descriptionAr: "",
      metaTitle: "",
      metaDescription: "",
      nameEn: "",
      nameAr: "",
      isFeatured: false,
      ...defaultValues,
    },
  });

  function submitHandler(values: ProductFormRawValues) {
    // The resolver already validated against productCreateSchema; parse again
    // only to get the coerced output shape
    onSubmit(productCreateSchema.parse(toSchemaInput(values, images, variants)));
  }

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="flex max-w-3xl flex-col gap-8">
      <section className="grid gap-4 rounded-2xl border border-border bg-surface-raised p-5">
        <h2 className="font-medium">{t.admin.productsView.name}</h2>
        <Input label={t.admin.productsView.nameEn} error={translateFieldMessage(errors.nameEn?.message, t)} {...register("nameEn")} />
        <Input label={t.admin.productsView.nameAr} error={translateFieldMessage(errors.nameAr?.message, t)} {...register("nameAr")} />
        <Input
          label={`${t.admin.productsView.slug} (${t.common.optional})`}
          hint={t.admin.productsView.slugHint}
          dir="ltr"
          {...register("slug")}
        />
        <Textarea label={t.admin.productsView.descriptionEn} {...register("descriptionEn")} />
        <Textarea label={t.admin.productsView.descriptionAr} {...register("descriptionAr")} />
      </section>

      <section className="grid gap-4 rounded-2xl border border-border bg-surface-raised p-5">
        <h2 className="font-medium">{t.checkout.orderSummary}</h2>
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))" }}
        >
          <Input
            label={t.admin.productsView.price}
            type="number"
            step="0.01"
            min={0}
            {...register("price")}
          />
          <Input
            label={`${t.admin.productsView.compareAtPrice} (${t.common.optional})`}
            type="number"
            step="0.01"
            min={0}
            {...register("compareAtPrice")}
          />
          <Input
            label={t.admin.productsView.stock}
            type="number"
            min={0}
            {...register("stockQuantity")}
          />
          <Select label={t.admin.status} {...register("status")}>
            <option value="draft">{t.statuses.productStatus.draft}</option>
            <option value="published">{t.statuses.productStatus.published}</option>
            <option value="archived">{t.statuses.productStatus.archived}</option>
          </Select>
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" {...register("isFeatured")} />
          {t.admin.productsView.featured}
        </label>
        <Select label={t.admin.productsView.category} {...register("categoryId")}>
          <CategoryOptions />
        </Select>
      </section>

      <section className="rounded-2xl border border-border bg-surface-raised p-5">
        <ImageUploader images={images} onChange={setImages} />
      </section>

      <VariantFields variants={variants} onVariantsChange={setVariants} />

      <Button type="submit" size="lg" isLoading={isSubmitting} className="self-start">
        {t.common.save}
      </Button>
    </form>
  );
}

function VariantFields({
  variants,
  onVariantsChange,
}: {
  variants: VariantFormValue[];
  onVariantsChange: (variants: VariantFormValue[]) => void;
}) {
  const { t } = useLang();

  function update(index: number, patch: Partial<VariantFormValue>) {
    onVariantsChange(variants.map((variant, position) => (position === index ? { ...variant, ...patch } : variant)));
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{t.admin.productsView.variants}</h2>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            onVariantsChange([
              ...variants,
              {
                key: crypto.randomUUID(),
                sku: "",
                size: "",
                color: "",
                material: "",
                priceDelta: 0,
                stockQuantity: 0,
              },
            ])
          }
        >
          <Plus aria-hidden className="size-4" />
          {t.admin.productsView.addVariant}
        </Button>
      </div>
      <p className="text-xs text-text-secondary">{t.admin.productsView.variantsHint}</p>

      {variants.map((variant, index) => (
        <div
          // Stable per-row key: with key={index}, removing a middle variant
          // leaves the surviving inputs holding the previous row's values
          key={variant.key ?? variant.id ?? index}
          className="grid items-end gap-2 rounded-xl border border-border p-3"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(130px, 100%), 1fr))" }}
        >
          <Input
            label={t.admin.productsView.variantLabels.sku}
            value={variant.sku}
            onChange={(event) => update(index, { sku: event.target.value })}
          />
          <Input
            label={t.admin.productsView.variantLabels.size}
            value={variant.size}
            onChange={(event) => update(index, { size: event.target.value })}
          />
          <Input
            label={t.admin.productsView.variantLabels.color}
            value={variant.color}
            onChange={(event) => update(index, { color: event.target.value })}
          />
          <Input
            label={t.admin.productsView.variantLabels.material}
            value={variant.material}
            onChange={(event) => update(index, { material: event.target.value })}
          />
          <Input
            label={t.admin.productsView.variantLabels.priceDelta}
            type="number"
            step="0.01"
            min={0}
            value={String(variant.priceDelta)}
            onChange={(event) => update(index, { priceDelta: Number(event.target.value) })}
          />
          <Input
            label={t.admin.productsView.stock}
            type="number"
            min={0}
            value={String(variant.stockQuantity)}
            onChange={(event) => update(index, { stockQuantity: Number(event.target.value) })}
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onVariantsChange(variants.filter((_, position) => position !== index))}
          >
            <Trash2 aria-hidden className="size-4" />
            {t.common.remove}
          </Button>
        </div>
      ))}
    </section>
  );
}
