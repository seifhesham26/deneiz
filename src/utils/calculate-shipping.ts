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

  // A threshold of zero reads as "free shipping is switched off", which is how
  // an admin clearing the field means it. Comparing subtotal >= 0 instead made
  // every order ship free — the exact opposite of the intent.
  if (settings.freeShippingThreshold <= 0) return settings.shippingFee;

  return subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
}
