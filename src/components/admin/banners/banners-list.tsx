"use client";

import Image from "next/image";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  BannerForm,
  EMPTY_BANNER_FORM,
  type BannerFormValues,
} from "./banner-form";
import { useGetAllBanners } from "@/hooks/admin/useGetAllBanners";
import { useDeleteBanner } from "@/hooks/admin/useDeleteBanner";

export function BannersList() {
  const { confirm, dialog } = useConfirm();
  const { t } = useLang();
  const { data: banners, isLoading } = useGetAllBanners();
  const deleteBanner = useDeleteBanner();
  const [editing, setEditing] = useState<BannerFormValues | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t.admin.banners}</h2>
        <Button size="sm" onClick={() => setEditing({ ...EMPTY_BANNER_FORM })}>
          <Plus aria-hidden className="size-4" />
          {t.admin.addNew}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-secondary">{t.common.loading}</p>
      ) : banners && banners.length > 0 ? (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))" }}
        >
          {banners.map((banner) => (
            <article key={banner.id} className="overflow-hidden rounded-2xl border border-border bg-surface-raised">
              <div className="relative aspect-[21/9] bg-surface">
                <Image
                  src={banner.imageUrlDesktop}
                  alt={banner.title ?? ""}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
                <Badge tone={banner.isActive ? "success" : "neutral"} className="absolute end-2 top-2">
                  {banner.isActive ? t.admin.bannersView.active : "—"}
                </Badge>
              </div>

              <div className="flex items-center justify-between gap-2 p-3 text-sm">
                <span className="truncate">{banner.title ?? banner.placement}</span>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    aria-label={t.common.edit}
                    onClick={() =>
                      setEditing({
                        id: banner.id,
                        title: banner.title ?? "",
                        placement: banner.placement,
                        imageUrlDesktop: banner.imageUrlDesktop,
                        imageUrlMobile: banner.imageUrlMobile ?? "",
                        linkUrl: banner.linkUrl ?? "",
                        isActive: banner.isActive,
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
                        deleteBanner.mutate({ id: banner.id }),
                      );
                    }}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-text-muted hover:text-danger"
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-secondary">{t.common.noResults}</p>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={t.admin.banners}>
        {editing ? <BannerForm initialValues={editing} onDone={() => setEditing(null)} /> : null}
      </Modal>
      {dialog}
    </div>
  );
}
