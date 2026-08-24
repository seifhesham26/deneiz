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
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const MAX_QUANTITY_PER_LINE = 99;

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item, quantity) =>
        set((state) => {
          const existing = state.items.find((line) => line.productId === item.productId);
          if (!existing) {
            return { items: [...state.items, { ...item, quantity }] };
          }
          return {
            items: state.items.map((line) =>
              line.productId === item.productId
                ? {
                    ...line,
                    quantity: Math.min(line.quantity + quantity, MAX_QUANTITY_PER_LINE),
                  }
                : line,
            ),
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((line) => line.productId !== productId),
        })),

      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((line) =>
              line.productId === productId
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
