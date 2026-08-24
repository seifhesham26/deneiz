"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/providers/lang-provider";
import { ProductForm, type ProductFormOutput } from "@/components/admin/products/product-form";
import { pushToast } from "@/components/ui/toast";
import { translateError } from "@/lib/translate-error";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc-client";
import { useUpdateProduct } from "@/hooks/admin/useUpdateProduct";

export default function AdminEditProductPage({
  params,
}: PageProps<"/admin/products/[id]">) {
  const { id } = use(params);
  const { t } = useLang();
  const router = useRouter();
  const updateProduct = useUpdateProduct();
  const { data: record, isLoading } = trpc.products.getById.useQuery({ id });

  function handleSubmit(values: ProductFormOutput) {
    updateProduct.mutate(
      {
        id,
        data: {
          ...values,
          slug: values.slug || undefined,
          // Partial schema — empty optionals mean "leave unchanged"
          descriptionEn: values.descriptionEn ?? undefined,
          descriptionAr: values.descriptionAr ?? undefined,
          metaTitle: values.metaTitle ?? undefined,
          metaDescription: values.metaDescription ?? undefined,
          compareAtPrice: values.compareAtPrice ?? null,
        },
      },
      {
        onSuccess: () => {
          pushToast(t.admin.productsView.productUpdated, "success");
          router.push("/admin/products");
        },
        onError: (error) => pushToast(translateError(error, t), "error"),
      },
    );
  }

  if (isLoading || !record) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full max-w-3xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{record.product.nameEn}</h1>
      <ProductForm
        isEdit
        isSubmitting={updateProduct.isPending}
        onSubmit={handleSubmit}
        defaultValues={{
          ...record.product,
          price: String(record.product.price),
          compareAtPrice: record.product.compareAtPrice == null ? "" : String(record.product.compareAtPrice),
          stockQuantity: String(record.product.stockQuantity),
          categoryId: record.product.categoryId ?? "",
          descriptionEn: record.product.descriptionEn ?? "",
          descriptionAr: record.product.descriptionAr ?? "",
          metaTitle: record.product.metaTitle ?? "",
          metaDescription: record.product.metaDescription ?? "",
          slug: record.product.slug,
        }}
        images={record.images.map((image) => ({ url: image.url, altText: image.altText ?? "" }))}
        variants={record.variants.map((variant) => ({
          sku: variant.sku ?? "",
          size: variant.size ?? "",
          color: variant.color ?? "",
          material: variant.material ?? "",
          priceDelta: variant.priceDelta,
          stockQuantity: variant.stockQuantity,
        }))}
      />
    </div>
  );
}
