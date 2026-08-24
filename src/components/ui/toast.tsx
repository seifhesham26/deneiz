"use client";

import { AnimatePresence, motion } from "framer-motion";
import { create } from "zustand";
import { useIsHydrated } from "@/hooks/shared/useIsHydrated";

export type ToastTone = "success" | "error" | "info";

interface ToastEntry {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastState {
  toasts: ToastEntry[];
  pushToast: (message: string, tone?: ToastTone) => void;
  dismissToast: (id: number) => void;
}

let nextToastId = 1;

/** Tiny module-level store — any component can fire toasts without providers. */
const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  pushToast: (message, tone = "info") => {
    const id = nextToastId++;
    set((state) => ({ toasts: [...state.toasts.slice(-3), { id, message, tone }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
    }, 3500);
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

export function pushToast(message: string, tone?: ToastTone): void {
  useToastStore.getState().pushToast(message, tone);
}

const TONE_CLASSES = {
  success: "bg-success text-text-inverse",
  error: "bg-danger text-text-inverse",
  info: "bg-primary text-text-inverse",
} as const;

export function Toaster() {
  const isHydrated = useIsHydrated();
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  if (!isHydrated) return null;

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:end-6">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.button
            key={toast.id}
            type="button"
            onClick={() => dismissToast(toast.id)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={`pointer-events-auto max-w-md rounded-full px-4 py-2.5 text-sm shadow-lg ${TONE_CLASSES[toast.tone]}`}
          >
            {toast.message}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
