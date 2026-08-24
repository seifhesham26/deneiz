/** Percentage-off helpers shared by product cards and the cart summary. */

export function calculateDiscountPercent(
  price: number,
  compareAtPrice?: number | null,
): number | null {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  const percent = Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
  return percent > 0 ? percent : null;
}

export function calculateDiscountedPrice(price: number, percentOff: number): number {
  if (percentOff <= 0) return price;
  if (percentOff >= 100) return 0;
  return Math.round(price * (1 - percentOff / 100) * 100) / 100;
}
