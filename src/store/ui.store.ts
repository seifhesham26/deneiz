"use client";

import { create } from "zustand";

/**
 * Global UI chrome state. Drawer/modal visibility lives here (not in local
 * component state) so any surface — product cards, navbar, toast — can open
 * the cart drawer after an action.
 */
interface UiState {
  isCartDrawerOpen: boolean;
  isMobileMenuOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  isCartDrawerOpen: false,
  isMobileMenuOpen: false,
  openCartDrawer: () => set({ isCartDrawerOpen: true }),
  closeCartDrawer: () => set({ isCartDrawerOpen: false }),
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
}));
