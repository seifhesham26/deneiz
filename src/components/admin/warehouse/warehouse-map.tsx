"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { pushToast } from "@/components/ui/toast";
import { translateError } from "@/lib/translate-error";
import { StorageLocationForm } from "./storage-location-form";
import { useGetWarehouseLocations, useGetWarehouseAssignments } from "@/hooks/admin/useGetWarehouseLocations";
import { useAssignProductToLocation } from "@/hooks/admin/useAssignProductToLocation";
import { useGetAdminProducts } from "@/hooks/admin/useGetAdminProducts";

function AssignProductForm() {
  const { locale, t } = useLang();
  const assignProduct = useAssignProductToLocation();
  const locationsQuery = useGetWarehouseLocations();
  const assignmentsQuery = useGetWarehouseAssignments();
  const productsQuery = useGetAdminProducts({});

  const [productId, setProductId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState("0");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!productId || !locationId) return;
    assignProduct.mutate(
      { productId, locationId, quantity: Number(quantity) },
      {
        onSuccess: () => pushToast(t.admin.warehouseView.assignmentSaved, "success"),
        onError: (error) => pushToast(translateError(error, t), "error"),
      },
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface-raised p-5">
      <h2 className="font-medium">{t.admin.warehouseView.assignProduct}</h2>

      <form
        onSubmit={submit}
        className="grid items-end gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))" }}
      >
        <Select
          label={t.admin.warehouseView.selectProduct}
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
          required
        >
          <option value="">—</option>
          {(productsQuery.data?.items ?? []).map((product) => (
            <option key={product.id} value={product.id}>
              {locale === "ar" ? product.nameAr : product.nameEn}
            </option>
          ))}
        </Select>

        <Select
          label={t.admin.warehouseView.selectLocation}
          value={locationId}
          onChange={(event) => setLocationId(event.target.value)}
          required
        >
          <option value="">—</option>
          {(locationsQuery.data ?? []).map((location) => (
            <option key={location.id} value={location.id}>
              {`${location.zone}/${location.shelf}/${location.bin}`}
            </option>
          ))}
        </Select>

        <Input
          label={t.admin.warehouseView.storedQuantity}
          type="number"
          min={0}
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />

        <Button type="submit" isLoading={assignProduct.isPending}>
          {t.common.save}
        </Button>
      </form>

      {assignmentsQuery.data && assignmentsQuery.data.length > 0 ? (
        <ul className="flex flex-col divide-y divide-border text-sm">
          {assignmentsQuery.data.map((assignment) => (
            <li key={assignment.id} className="flex items-center justify-between gap-3 py-2">
              <span className="truncate">
                {locale === "ar" ? assignment.productNameAr : assignment.productNameEn}
              </span>
              <span className="font-mono text-xs text-text-secondary" dir="ltr">
                {assignment.zone}/{assignment.shelf}/{assignment.bin}
              </span>
              <Badge>{assignment.quantity}</Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function WarehouseMap() {
  const { t } = useLang();
  const { data: locations, isLoading } = useGetWarehouseLocations();
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t.admin.warehouseView.locations}</h2>
        <Button size="sm" onClick={() => setShowCreateForm(true)}>
          <Plus aria-hidden className="size-4" />
          {t.admin.addNew}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-text-secondary">{t.common.loading}</p>
      ) : locations && locations.length > 0 ? (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))" }}
        >
          {locations.map((location) => {
            const utilization =
              location.capacity > 0
                ? Math.min(100, Math.round((location.storedUnits / location.capacity) * 100))
                : 0;
            return (
              <div key={location.id} className="flex flex-col gap-2 rounded-2xl border border-border bg-surface-raised p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold" dir="ltr">
                    {location.zone}/{location.shelf}/{location.bin}
                  </span>
                  <Badge tone={utilization >= 90 ? "danger" : utilization >= 70 ? "warning" : "success"}>
                    {utilization}%
                  </Badge>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
                  <div
                    className={`h-full rounded-full ${utilization >= 90 ? "bg-danger" : utilization >= 70 ? "bg-warning" : "bg-success"}`}
                    style={{ width: `${utilization}%` }}
                  />
                </div>

                <span className="text-xs text-text-secondary">
                  {t.admin.warehouseView.storedUnits}: {location.storedUnits} / {location.capacity}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-text-secondary">{t.common.noResults}</p>
      )}

      <AssignProductForm />

      <Modal open={showCreateForm} onClose={() => setShowCreateForm(false)} title={t.admin.addNew}>
        <StorageLocationForm onDone={() => setShowCreateForm(false)} />
      </Modal>
    </div>
  );
}
