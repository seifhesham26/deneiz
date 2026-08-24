"use client";

import { useState } from "react";
import { useLang } from "@/components/providers/lang-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { pushToast } from "@/components/ui/toast";
import { translateError } from "@/lib/translate-error";
import { useAdjustStock } from "@/hooks/admin/useAdjustStock";

interface StockAdjustmentFormProps {
  productId: string;
  onDone: () => void;
}

export function StockAdjustmentForm({ productId, onDone }: StockAdjustmentFormProps) {
  const { t } = useLang();
  const adjustStock = useAdjustStock();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("restock");
  const [note, setNote] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const changeAmount = Number(amount);
    if (!Number.isInteger(changeAmount) || changeAmount === 0) return;

    adjustStock.mutate(
      {
        productId,
        changeAmount,
        reason: reason as "restock" | "sale" | "return" | "adjustment" | "damage" | "other",
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          pushToast(t.admin.inventoryView.adjusted, "success");
          onDone();
        },
        onError: (error) => pushToast(translateError(error, t), "error"),
      },
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Input
        label={t.admin.inventoryView.changeAmount}
        type="number"
        step="1"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        required
      />

      <Select label={t.admin.inventoryView.reason} value={reason} onChange={(event) => setReason(event.target.value)}>
        {Object.entries(t.admin.inventoryView.reasons).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>

      <Input
        label={`${t.admin.inventoryView.note} (${t.common.optional})`}
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />

      <Button type="submit" isLoading={adjustStock.isPending}>
        {t.admin.inventoryView.adjust}
      </Button>
    </form>
  );
}
