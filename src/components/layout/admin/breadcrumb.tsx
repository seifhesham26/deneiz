"use client";

import Link from "next/link";
import { Fragment } from "react";
import { usePathname } from "next/navigation";
import { useLang } from "@/components/providers/lang-provider";

/** Derives breadcrumb segments from the URL — labels fall back to the segment. */
export function Breadcrumb() {
  const pathname = usePathname();
  const { t } = useLang();

  const labelMap: Record<string, string> = {
    admin: t.admin.panelName,
    products: t.admin.products,
    categories: t.admin.categories,
    banners: t.admin.banners,
    orders: t.admin.orders,
    inventory: t.admin.inventory,
    warehouse: t.admin.warehouse,
    reviews: t.admin.reviews,
    customers: t.admin.customers,
    analytics: t.admin.analytics,
    settings: t.admin.settings,
    new: t.admin.addNew,
  };

  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1.5 text-xs text-text-secondary">
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        const label = labelMap[segment] ?? segment;

        return (
          <Fragment key={href}>
            {index > 0 ? <span aria-hidden>/</span> : null}
            {isLast ? (
              <span aria-current="page" className="font-medium text-text-primary">
                {label}
              </span>
            ) : (
              <Link href={href} className="hover:text-text-primary">
                {label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
