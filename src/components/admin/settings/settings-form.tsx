"use client";

import { useState } from "react";
import { useLang } from "@/components/providers/lang-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { pushToast } from "@/components/ui/toast";
import { trpc } from "@/lib/trpc-client";
import { useGetStoreSettings } from "@/hooks/admin/useGetStoreSettings";
import { useUpdateStoreSettings } from "@/hooks/admin/useUpdateStoreSettings";
import { useUpdateUserRole } from "@/hooks/admin/useUpdateUserRole";

/**
 * Form values are derived from the server snapshot overlaid with local
 * overrides — no hydration effect needed and unsaved edits survive refetches.
 */
interface SettingsOverrides {
  storeNameEn?: string;
  storeNameAr?: string;
  supportEmail?: string;
  supportPhone?: string;
  shippingFee?: string;
  freeShippingThreshold?: string;
  lowStockThreshold?: string;
}

export function SettingsForm() {
  const { t } = useLang();
  const settingsQuery = useGetStoreSettings();
  const updateSettings = useUpdateStoreSettings();
  const usersQuery = trpc.settings.getUsers.useQuery();
  const updateRole = useUpdateUserRole();
  const [overrides, setOverrides] = useState<SettingsOverrides>({});

  const data = settingsQuery.data;
  if (settingsQuery.isLoading || !data) {
    return <p className="text-sm text-text-secondary">{t.common.loading}</p>;
  }

  const values = {
    storeNameEn: overrides.storeNameEn ?? data.storeNameEn,
    storeNameAr: overrides.storeNameAr ?? data.storeNameAr,
    supportEmail: overrides.supportEmail ?? data.supportEmail ?? "",
    supportPhone: overrides.supportPhone ?? data.supportPhone ?? "",
    shippingFee: overrides.shippingFee ?? String(data.shippingFee),
    freeShippingThreshold: overrides.freeShippingThreshold ?? String(data.freeShippingThreshold),
    lowStockThreshold: overrides.lowStockThreshold ?? String(data.lowStockThreshold),
  };

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateSettings.mutate(
      {
        storeNameEn: values.storeNameEn.trim(),
        storeNameAr: values.storeNameAr.trim(),
        supportEmail: values.supportEmail.trim() || undefined,
        supportPhone: values.supportPhone.trim() || undefined,
        shippingFee: Number(values.shippingFee) || 0,
        freeShippingThreshold: Number(values.freeShippingThreshold) || 0,
        lowStockThreshold: Number(values.lowStockThreshold) || 0,
      },
      {
        onSuccess: () => pushToast(t.common.saved, "success"),
        onError: (error) => pushToast(error.message || t.errors.generic, "error"),
      },
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-raised p-5">
        <h2 className="font-medium">{t.admin.settingsView.storeProfile}</h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))" }}>
          <Input label={t.admin.settingsView.storeNameEn} value={values.storeNameEn} onChange={(e) => setOverrides({ ...overrides, storeNameEn: e.target.value })} />
          <Input label={t.admin.settingsView.storeNameAr} value={values.storeNameAr} onChange={(e) => setOverrides({ ...overrides, storeNameAr: e.target.value })} />
          <Input label={t.admin.settingsView.supportEmail} type="email" dir="ltr" value={values.supportEmail} onChange={(e) => setOverrides({ ...overrides, supportEmail: e.target.value })} />
          <Input label={t.admin.settingsView.supportPhone} dir="ltr" value={values.supportPhone} onChange={(e) => setOverrides({ ...overrides, supportPhone: e.target.value })} />
        </div>

        <h2 className="mt-2 font-medium">{t.admin.settingsView.defaults}</h2>
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))" }}>
          <Input label={t.admin.settingsView.shippingFee} type="number" step="0.01" min={0} value={values.shippingFee} onChange={(e) => setOverrides({ ...overrides, shippingFee: e.target.value })} />
          <Input label={t.admin.settingsView.freeShippingThreshold} type="number" min={0} value={values.freeShippingThreshold} onChange={(e) => setOverrides({ ...overrides, freeShippingThreshold: e.target.value })} />
          <Input label={t.admin.inventoryView.threshold} type="number" min={0} value={values.lowStockThreshold} onChange={(e) => setOverrides({ ...overrides, lowStockThreshold: e.target.value })} />
        </div>

        <Button type="submit" isLoading={updateSettings.isPending} className="self-start">
          {t.common.save}
        </Button>
      </form>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-5">
        <h2 className="font-medium">{t.admin.settingsView.team}</h2>
        <ul className="flex flex-col divide-y divide-border">
          {(usersQuery.data ?? []).map((user) => (
            <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div className="flex flex-col">
                <span className="font-medium">{user.name}</span>
                <span className="text-xs text-text-muted" dir="ltr">
                  {user.email}
                </span>
              </div>
              <Badge tone={user.role === "super_admin" ? "accent" : "neutral"}>
                {(t.admin.settingsView.roles as Record<string, string>)[user.role] ?? user.role}
              </Badge>
              <Select
                aria-label={t.admin.settingsView.role}
                value={user.role}
                className="max-w-40"
                onChange={(event) =>
                  updateRole.mutate(
                    { userId: user.id, role: event.target.value as "super_admin" | "manager" | "staff" | "customer" },
                    { onSuccess: () => pushToast(t.admin.settingsView.roleUpdated, "success") },
                  )
                }
              >
                <option value="super_admin">{t.admin.settingsView.roles.super_admin}</option>
                <option value="manager">{t.admin.settingsView.roles.manager}</option>
                <option value="staff">{t.admin.settingsView.roles.staff}</option>
                <option value="customer">{t.admin.settingsView.roles.customer}</option>
              </Select>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
