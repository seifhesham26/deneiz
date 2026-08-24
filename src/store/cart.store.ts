"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  /** Snapshot for instant display; checkout re-prices from the database */
  unitPrice: number;
  imageUrl: string | null;
  quantity: number;
  /** Present when the product has selectable variants */
  variantId?: string;
  /** Human label like "Size M · Gold" shown in cart lines */
  variantLabel?: string;
}

/** Lines are unique per product+variant combination. */
export function cartLineKey(item: Pick<CartItem, "productId" | "variantId">): string {
  return `${item.productId}::${item.variantId ?? ""}`;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
}

const MAX_QUANTITY_PER_LINE = 99;

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item, quantity) =>
        set((state) => {
          const key = cartLineKey(item);
          const existingIndex = state.items.findIndex((line) => cartLineKey(line) === key);

          if (existingIndex === -1) {
            return { items: [...state.items, { ...item, quantity }] };
          }

          return {
            items: state.items.map((line, index) =>
              index === existingIndex
                ? {
                    ...line,
                    quantity: Math.min(line.quantity + quantity, MAX_QUANTITY_PER_LINE),
                  }
                : line,
            ),
          };
        }),

      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter((line) => cartLineKey(line) !== key),
        })),

      setQuantity: (key, quantity) =>
        set((state) => ({
          items: state.items
            .map((line) =>
              cartLineKey(line) === key
                ? {
                    ...line,
                    // Zero drops the line entirely — matches cart UX expectations
                    quantity: Math.max(0, Math.min(quantity, MAX_QUANTITY_PER_LINE)),
                  }
                : line,
            )
            .filter((line) => line.quantity > 0),
        })),

      clearCart: () => set({ items: [] }),
    }),
    { name: "deneiz-cart" },
  ),
);

export function selectCartItemCount(state: CartState): number {
  return state.items.reduce((sum, line) => sum + line.quantity, 0);
}

export function selectCartSubtotal(state: CartState): number {
  return (
    Math.round(
      state.items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) * 100,
    ) / 100
  );
}
