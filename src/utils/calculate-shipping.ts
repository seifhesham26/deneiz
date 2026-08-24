/**
 * Single owner of the shipping rule. The server charges what this returns and
 * the cart/checkout display what this returns, so an admin editing the fee can
 * never produce a shown total that differs from the charged total.
 */
export interface ShippingSettings {
  shippingFee: number;
  freeShippingThreshold: number;
}

export function calculateShipping(subtotal: number, settings: ShippingSettings): number {
  // An empty cart is never charged delivery, whatever the threshold says
  if (subtotal <= 0) return 0;
  return subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
}
