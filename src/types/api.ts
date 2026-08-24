import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/root-router";

/** Shared inferred output types — single source of truth stays on the routers. */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export type ProductListOutput = RouterOutputs["products"]["getAll"];

export type ProductListRow = ProductListOutput["items"][number];

export type CategoryRecord = RouterOutputs["categories"]["getActive"][number];

export type BannerRecord = RouterOutputs["banners"]["getActive"][number];

export type ProductDetail = NonNullable<RouterOutputs["products"]["getBySlug"]>;

export type ReviewListItem = RouterOutputs["reviews"]["getProductReviews"]["items"][number];

export type MyOrderRow = RouterOutputs["orders"]["getMine"]["items"][number];

export type SessionUserSnapshot = NonNullable<RouterOutputs["auth"]["me"]>;
