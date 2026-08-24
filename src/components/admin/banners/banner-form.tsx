"use client";

import { useState } from "react";
import { useLang } from "@/components/providers/lang-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { pushToast } from "@/components/ui/toast";
import { translateError } from "@/lib/translate-error";
import { useCreateBanner } from "@/hooks/admin/useCreateBanner";
import { useUpdateBanner } from "@/hooks/admin/useUpdateBanner";

export interface BannerFormValues {
  id?: string;
  title: string;
  placement: "hero" | "promo";
  imageUrlDesktop: string;
  imageUrlMobile: string;
  linkUrl: string;
  isActive: boolean;
}

export const EMPTY_BANNER_FORM: BannerFormValues = {
  title: "",
  placement: "hero",
  imageUrlDesktop: "",
  imageUrlMobile: "",
  linkUrl: "",
  isActive: true,
};

interface BannerFormProps {
  initialValues: BannerFormValues;
  onDone: () => void;
}

export function BannerForm({ initialValues, onDone }: BannerFormProps) {
  const { t } = useLang();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const [values, setValues] = useState<BannerFormValues>(initialValues);
  const isEdit = Boolean(initialValues.id);

  function set<K extends keyof BannerFormValues>(key: K, value: BannerFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const shared = {
      title: values.title.trim() || undefined,
      placement: values.placement,
      imageUrlDesktop: values.imageUrlDesktop.trim(),
      imageUrlMobile: values.imageUrlMobile.trim() || undefined,
      linkUrl: values.linkUrl.trim() || undefined,
      isActive: values.isActive,
    };

    if (isEdit && values.id) {
      updateBanner.mutate(
        { id: values.id, data: shared },
        {
          onSuccess: () => {
            pushToast(t.admin.bannersView.updated, "success");
            onDone();
          },
          onError: (error) => pushToast(translateError(error, t), "error"),
        },
      );
      return;
    }

    createBanner.mutate(
      shared,
      {
        onSuccess: () => {
          pushToast(t.admin.bannersView.created, "success");
          onDone();
        },
        onError: (error) => pushToast(translateError(error, t), "error"),
      },
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input
        label={`${t.admin.productsView.name} (${t.common.optional})`}
        value={values.title}
        onChange={(event) => set("title", event.target.value)}
      />

      <Select
        label={t.admin.bannersView.placement}
        value={values.placement}
        onChange={(event) => set("placement", event.target.value as "hero" | "promo")}
      >
        <option value="hero">{t.admin.bannersView.hero}</option>
        <option value="promo">{t.admin.bannersView.promo}</option>
      </Select>

      <Input
        label={t.admin.bannersView.desktopImage}
        dir="ltr"
        value={values.imageUrlDesktop}
        onChange={(event) => set("imageUrlDesktop", event.target.value)}
        required
      />

      <Input
        label={`${t.admin.bannersView.mobileImage} (${t.common.optional})`}
        dir="ltr"
        value={values.imageUrlMobile}
        onChange={(event) => set("imageUrlMobile", event.target.value)}
      />

      <Input
        label={`${t.admin.bannersView.linkUrl} (${t.common.optional})`}
        dir="ltr"
        value={values.linkUrl}
        onChange={(event) => set("linkUrl", event.target.value)}
      />

      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(event) => set("isActive", event.target.checked)}
        />
        {t.admin.bannersView.active}
      </label>

      <Button type="submit" isLoading={createBanner.isPending || updateBanner.isPending}>
        {t.common.save}
      </Button>
    </form>
  );
}
