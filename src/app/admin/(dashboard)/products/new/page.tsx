"use client";

import { useRouter } from "next/navigation";
import { useLang } from "@/components/providers/lang-provider";
import { ProductForm } from "@/components/admin/products/product-form";
import { pushToast } from "@/components/ui/toast";
import { useCreateProduct } from "@/hooks/admin/useCreateProduct";
import type { ProductFormOutput } from "@/components/admin/products/product-form";

export default function AdminNewProductPage() {
  const { t } = useLang();
  const router = useRouter();
  const createProduct = useCreateProduct();

  function handleSubmit(values: ProductFormOutput) {
    createProduct.mutate(
      { ...values, slug: values.slug || undefined },
      {
        onSuccess: () => {
          pushToast(t.admin.productsView.productCreated, "success");
          router.push("/admin/products");
        },
        onError: (error) => pushToast(error.message || t.errors.generic, "error"),
      },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{t.admin.newProduct}</h1>
      <ProductForm
        isEdit={false}
        isSubmitting={createProduct.isPending}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
