import { checkRateLimit } from "@/lib/rate-limit";
import { appError } from "../app-error";
import { insertReview, listApprovedReviewsForProduct, getRatingSummary } from "./reviews.db";

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
    status: "pending",
  });
}

export async function getStorefrontReviews(productId: string, page: number, pageSize: number) {
  return listApprovedReviewsForProduct(productId, page, pageSize);
}

export async function getProductRatingSummary(productId: string) {
  return getRatingSummary(productId);
}
