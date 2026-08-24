import { router } from "./trpc";
import { analyticsRouter } from "./analytics/analytics.router";
import { authRouter } from "./auth/auth.router";
import { bannersRouter } from "./banners/banners.router";
import { categoriesRouter } from "./categories/categories.router";
import { customersRouter } from "./customers/customers.router";
import { inventoryRouter } from "./inventory/inventory.router";
import { ordersRouter } from "./orders/orders.router";
import { productsRouter } from "./products/products.router";
import { reviewsRouter } from "./reviews/reviews.router";
import { settingsRouter } from "./settings/settings.router";
import { warehouseRouter } from "./warehouse/warehouse.router";

/**
 * Root router lives apart from trpc.ts so domain routers can import the
 * procedure builders without creating an initialization cycle.
 */
export const appRouter = router({
  products: productsRouter,
  categories: categoriesRouter,
  banners: bannersRouter,
  orders: ordersRouter,
  inventory: inventoryRouter,
  warehouse: warehouseRouter,
  reviews: reviewsRouter,
  customers: customersRouter,
  analytics: analyticsRouter,
  auth: authRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
