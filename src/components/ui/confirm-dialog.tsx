"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useLang } from "@/components/providers/lang-provider";

/**
 * Replaces window.confirm for destructive admin actions. The native dialog is
 * unstyled, blocks the event loop, and — the reason it had to go — cannot be
 * translated, so Arabic operators saw an English browser chrome prompt.
 */
interface ConfirmState {
  message: string;
  onConfirm: () => void;
}

export function useConfirm() {
  const [pending, setPending] = useState<ConfirmState | null>(null);

  // Stable identity: Modal's focus effect depends on onClose, and a fresh
  // closure each render would steal focus on every parent re-render
  const close = useCallback(() => setPending(null), []);

  const confirm = useCallback((message: string, onConfirm: () => void) => {
    setPending({ message, onConfirm });
  }, []);

  const dialog = <ConfirmDialog pending={pending} onClose={close} />;

  return { confirm, dialog };
}

function ConfirmDialog({
  pending,
  onClose,
}: {
  pending: ConfirmState | null;
  onClose: () => void;
}) {
  const { t } = useLang();

  return (
    <Modal open={pending !== null} onClose={onClose} title={t.common.confirm}>
      <div className="flex flex-col gap-5">
        <p className="text-sm text-text-secondary">{pending?.message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              pending?.onConfirm();
              onClose();
            }}
          >
            {t.common.confirm}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
