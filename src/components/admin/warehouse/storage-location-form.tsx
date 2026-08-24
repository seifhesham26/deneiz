"use client";

import { useState } from "react";
import { useLang } from "@/components/providers/lang-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateWarehouseLocation } from "@/hooks/admin/useCreateWarehouseLocation";

interface StorageLocationFormProps {
  onDone: () => void;
}

export function StorageLocationForm({ onDone }: StorageLocationFormProps) {
  const { t } = useLang();
  const createLocation = useCreateWarehouseLocation();
  const [form, setForm] = useState({ zone: "", shelf: "", bin: "", capacity: "100", note: "" });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createLocation.mutate(
      {
        zone: form.zone,
        shelf: form.shelf,
        bin: form.bin,
        capacity: Number(form.capacity) || 100,
        note: form.note.trim() || undefined,
      },
      {
        onSuccess: () => {
          onDone();
        },
      },
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(120px, 100%), 1fr))" }}
      >
        <Input label={t.admin.warehouseView.zone} value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} required />
        <Input label={t.admin.warehouseView.shelf} value={form.shelf} onChange={(e) => setForm({ ...form, shelf: e.target.value })} required />
        <Input label={t.admin.warehouseView.bin} value={form.bin} onChange={(e) => setForm({ ...form, bin: e.target.value })} required />
        <Input
          label={t.admin.warehouseView.capacity}
          type="number"
          min={1}
          value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: e.target.value })}
        />
      </div>
      <Button type="submit" isLoading={createLocation.isPending}>
        {t.common.save}
      </Button>
    </form>
  );
}
