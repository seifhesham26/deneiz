"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WishlistEntry {
  productId: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  imageUrl: string | null;
}

interface WishlistState {
  entries: WishlistEntry[];
  toggleWishlist: (entry: WishlistEntry) => boolean;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      entries: [],

      /** Returns true when the entry ended up in the wishlist. */
      toggleWishlist: (entry) => {
        const exists = useWishlistStore
          .getState()
          .entries.some((candidate) => candidate.productId === entry.productId);

        if (exists) {
          set((state) => ({
            entries: state.entries.filter((candidate) => candidate.productId !== entry.productId),
          }));
          return false;
        }

        set((state) => ({ entries: [...state.entries, entry] }));
        return true;
      },

      removeFromWishlist: (productId) =>
        set((state) => ({
          entries: state.entries.filter((candidate) => candidate.productId !== productId),
        })),

      clearWishlist: () => set({ entries: [] }),
    }),
    { name: "deneiz-wishlist" },
  ),
);
