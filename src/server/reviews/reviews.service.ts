import { checkRateLimit } from "@/lib/rate-limit";
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
}): Promise<{ id: string }> {
  const limit = checkRateLimit(`review:${record.clientKey}`, REVIEW_RATE_LIMIT, REVIEW_RATE_WINDOW_MS);
  if (!limit.allowed) {
    throw new Error("Too many reviews submitted — please try again later");
  }

  // Reviews enter moderation as pending; nothing renders until approved
  return insertReview({
    productId: record.productId,
    rating: record.rating,
    authorName: record.authorName,
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
