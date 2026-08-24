import { checkRateLimit } from "@/lib/rate-limit";
import { appError } from "../app-error";
import {
  getRatingSummary,
  hasPurchasedProduct,
  hasReviewedProduct,
  insertReview,
  listApprovedReviewsForProduct,
} from "./reviews.db";

const REVIEW_RATE_LIMIT = 5;
const REVIEW_RATE_WINDOW_MS = 60 * 60 * 1000;

export async function submitReview(record: {
  productId: string;
  rating: number;
  authorName: string;
  title?: string;
  body?: string;
  clientKey: string;
  /** Set when the reviewer is signed in — reviews.userId exists and was never written */
  userId: string | null;
  accountName: string | null;
}): Promise<{ id: string }> {
  const limit = checkRateLimit(`review:${record.clientKey}`, REVIEW_RATE_LIMIT, REVIEW_RATE_WINDOW_MS);
  if (!limit.allowed) {
    throw appError("TOO_MANY_REQUESTS", "reviewRateLimited");
  }

  // Only a signed-in reviewer can be checked against order history at all; a
  // guest has no identity to match, so their review is never marked verified
  let isVerifiedPurchase = false;
  if (record.userId) {
    const [alreadyReviewed, purchased] = await Promise.all([
      hasReviewedProduct(record.userId, record.productId),
      hasPurchasedProduct(record.userId, record.productId),
    ]);
    if (alreadyReviewed) throw appError("CONFLICT", "duplicateReview");
    isVerifiedPurchase = purchased;
  }

  // Reviews enter moderation as pending; nothing renders until approved
  return insertReview({
    productId: record.productId,
    rating: record.rating,
    userId: record.userId,
    // A signed-in reviewer posts under their account name; free text would let
    // anyone post as anyone
    authorName: record.accountName ?? record.authorName,
    title: record.title ?? null,
    body: record.body ?? null,
    // Stored, not derived, so the badge cannot change if the order is later
    // cancelled or the account is deleted
    isVerifiedPurchase,
    status: "pending",
  });
}

export async function getStorefrontReviews(productId: string, page: number, pageSize: number) {
  return listApprovedReviewsForProduct(productId, page, pageSize);
}

export async function getProductRatingSummary(productId: string) {
  return getRatingSummary(productId);
}
