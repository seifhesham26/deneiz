"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { pushToast } from "@/components/ui/toast";
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
  const [values, setValues] = useState(initialValues);
  const isEdit = Boolean(values.id);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const shared = {
      nameEn: values.nameEn.trim(),
      nameAr: values.nameAr.trim(),
      slug: values.slug.trim() || undefined,
      parentId: values.parentId === "" ? null : values.parentId,
      imageUrl: values.imageUrl.trim() || undefined,
      displayOrder: Number(values.displayOrder) || 0,
      isActive: values.isActive,
    };

    if (isEdit && values.id) {
      updateCategory.mutate(
        { id: values.id, data: shared },
        {
          onSuccess: () => {
            pushToast(t.admin.categoriesView.updated, "success");
            onDone();
          },
          onError: (error) => pushToast(error.message || t.errors.generic, "error"),
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
          onError: (error) => pushToast(error.message || t.errors.generic, "error"),
        },
      );
    }
  }

  // Only top-level categories can parent others — keeps the tree at depth 2
  const parentOptions = categories.filter((category) => category.parentId === null);

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input label={t.admin.productsView.nameEn} value={values.nameEn} onChange={(e) => setValues({ ...values, nameEn: e.target.value })} required minLength={2} />
      <Input label={t.admin.productsView.nameAr} value={values.nameAr} onChange={(e) => setValues({ ...values, nameAr: e.target.value })} required minLength={2} />
      <Input label={`${t.admin.productsView.slug} (${t.common.optional})`} dir="ltr" value={values.slug} onChange={(e) => setValues({ ...values, slug: e.target.value })} />

      <Select
        label={t.admin.categoriesView.parent}
        value={values.parentId}
        onChange={(e) => setValues({ ...values, parentId: e.target.value })}
      >
        <option value="">{t.admin.categoriesView.none}</option>
        {parentOptions
          .filter((category) => category.id !== values.id)
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
          value={values.imageUrl}
          onChange={(e) => setValues({ ...values, imageUrl: e.target.value })}
        />
        <Input
          label={t.admin.categoriesView.displayOrder}
          type="number"
          min={0}
          value={values.displayOrder}
          onChange={(e) => setValues({ ...values, displayOrder: e.target.value })}
        />
      </div>

      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(event) => setValues({ ...values, isActive: event.target.checked })}
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
                if (!window.confirm(t.admin.confirmDelete)) return;
                deleteCategory.mutate(
                  { id: category.id },
                  { onError: (error) => pushToast(error.message || t.errors.generic, "error") },
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
    </div>
  );
}

