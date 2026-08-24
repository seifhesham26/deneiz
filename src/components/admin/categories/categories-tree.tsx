"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { translateFieldMessage } from "@/lib/translate-error";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { pushToast } from "@/components/ui/toast";
import { translateError } from "@/lib/translate-error";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  useCreateCategory,
} from "@/hooks/admin/useCreateCategory";
import { useUpdateCategory } from "@/hooks/admin/useUpdateCategory";
import { useDeleteCategory } from "@/hooks/admin/useDeleteCategory";
import { useGetAdminCategories } from "@/hooks/admin/useGetAdminCategories";

interface CategoryFormValues {
  id?: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  parentId: string;
  imageUrl: string;
  displayOrder: string;
  isActive: boolean;
}

/** Mirrors categoryCreateSchema for the fields this form owns. */
const categoryFormSchema = z.object({
  id: z.string().optional(),
  nameEn: z.string().trim().min(2, { message: "tooShort:2" }),
  nameAr: z.string().trim().min(2, { message: "tooShort:2" }),
  slug: z.string(),
  parentId: z.string(),
  imageUrl: z.string(),
  displayOrder: z.string(),
  isActive: z.boolean(),
});

const EMPTY_FORM: CategoryFormValues = {
  nameEn: "",
  nameAr: "",
  slug: "",
  parentId: "",
  imageUrl: "",
  displayOrder: "0",
  isActive: true,
};

function CategoryForm({
  initialValues,
  categories,
  onDone,
}: {
  initialValues: CategoryFormValues;
  categories: { id: string; nameEn: string; nameAr: string; parentId: string | null }[];
  onDone: () => void;
}) {
  const { locale, t } = useLang();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: initialValues,
  });

  const isEdit = Boolean(initialValues.id);

  function submit(formValues: CategoryFormValues) {
    const shared = {
      nameEn: formValues.nameEn.trim(),
      nameAr: formValues.nameAr.trim(),
      slug: formValues.slug.trim() || undefined,
      parentId: formValues.parentId === "" ? null : formValues.parentId,
      imageUrl: formValues.imageUrl.trim() || undefined,
      displayOrder: Number(formValues.displayOrder) || 0,
      isActive: formValues.isActive,
    };

    if (isEdit && initialValues.id) {
      updateCategory.mutate(
        { id: initialValues.id, data: shared },
        {
          onSuccess: () => {
            pushToast(t.admin.categoriesView.updated, "success");
            onDone();
          },
          onError: (error) => pushToast(translateError(error, t), "error"),
        },
      );
    } else {
      createCategory.mutate(
        shared,
        {
          onSuccess: () => {
            pushToast(t.admin.categoriesView.created, "success");
            onDone();
          },
          onError: (error) => pushToast(translateError(error, t), "error"),
        },
      );
    }
  }

  // Only top-level categories can parent others — keeps the tree at depth 2
  const parentOptions = categories.filter((category) => category.parentId === null);

  return (
    <form onSubmit={(event) => void handleSubmit(submit)(event)} className="flex flex-col gap-4">
      <Input
        label={t.admin.productsView.nameEn}
        error={translateFieldMessage(errors.nameEn?.message, t)}
        {...register("nameEn")}
      />
      <Input
        label={t.admin.productsView.nameAr}
        error={translateFieldMessage(errors.nameAr?.message, t)}
        {...register("nameAr")}
      />
      <Input
        label={`${t.admin.productsView.slug} (${t.common.optional})`}
        dir="ltr"
        error={translateFieldMessage(errors.slug?.message, t)}
        {...register("slug")}
      />

      <Select
        label={t.admin.categoriesView.parent}
        error={translateFieldMessage(errors.parentId?.message, t)}
        {...register("parentId")}
      >
        <option value="">{t.admin.categoriesView.none}</option>
        {parentOptions
          .filter((category) => category.id !== initialValues.id)
          .map((category) => (
            <option key={category.id} value={category.id}>
              {locale === "ar" ? category.nameAr : category.nameEn}
            </option>
          ))}
      </Select>

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))" }}
      >
        <Input
          label={`${t.admin.categoriesView.imageUrl} (${t.common.optional})`}
          dir="ltr"
          error={translateFieldMessage(errors.imageUrl?.message, t)}
          {...register("imageUrl")}
        />
        <Input
          label={t.admin.categoriesView.displayOrder}
          type="number"
          min={0}
          error={translateFieldMessage(errors.displayOrder?.message, t)}
          {...register("displayOrder")}
        />
      </div>

      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          {...register("isActive")}
        />
        {t.admin.categoriesView.active}
      </label>

      <Button type="submit" isLoading={createCategory.isPending || updateCategory.isPending}>
        {t.common.save}
      </Button>
    </form>
  );
}

export function CategoriesTree() {
  const { confirm, dialog } = useConfirm();
  const { locale, t } = useLang();
  const deleteCategory = useDeleteCategory();
  const { data: categories, isLoading } = useGetAdminCategories();
  const allCategories = categories ?? [];
  const [editing, setEditing] = useState<CategoryFormValues | null>(null);

  const topLevel = allCategories.filter((category) => category.parentId === null);
  const childrenOf = (parentId: string) =>
    allCategories.filter((category) => category.parentId === parentId);

  function renderRow(category: (typeof allCategories)[number], isChild: boolean) {
    return (
      <div key={category.id}>
        <div className={`flex items-center justify-between gap-3 border-t border-border py-3 ${isChild ? "ps-8" : ""}`}>
          <div className="flex items-center gap-2">
            <span className="font-medium">{locale === "ar" ? category.nameAr : category.nameEn}</span>
          </div>
          <div className="flex items-center">
            <button
              type="button"
              aria-label={t.common.edit}
              onClick={() =>
                setEditing({
                  id: category.id,
                  nameEn: category.nameEn,
                  nameAr: category.nameAr,
                  slug: category.slug,
                  parentId: category.parentId ?? "",
                  imageUrl: category.imageUrl ?? "",
                  displayOrder: String(category.displayOrder),
                  isActive: category.isActive,
                })
              }
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-surface"
            >
              <Pencil aria-hidden className="size-4" />
            </button>
            <button
              type="button"
              aria-label={t.common.delete}
              onClick={() => {
                confirm(t.admin.confirmDelete, () =>
                  deleteCategory.mutate(
                    { id: category.id },
                    { onError: (error) => pushToast(translateError(error, t), "error") },
                  ),
                );
              }}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-text-muted hover:text-danger"
            >
              <Trash2 aria-hidden className="size-4" />
            </button>
          </div>
        </div>
        {childrenOf(category.id).map((child) => renderRow(child, true))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t.admin.categories}</h2>
        <Button size="sm" onClick={() => setEditing({ ...EMPTY_FORM })}>
          <Plus aria-hidden className="size-4" />
          {t.admin.addNew}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-secondary">{t.common.loading}</p>
      ) : topLevel.length === 0 ? (
        <p className="text-sm text-text-secondary">{t.common.noResults}</p>
      ) : (
        <div className="rounded-2xl border border-border bg-surface-raised px-5 pb-1">{topLevel.map((category) => renderRow(category, false))}</div>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={t.admin.categories}>
        {editing ? (
          <CategoryForm
            initialValues={editing}
            categories={categories ?? []}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Modal>
      {dialog}
    </div>
  );
}

