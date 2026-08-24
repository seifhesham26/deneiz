"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { pushToast } from "@/components/ui/toast";
import { useLang } from "@/components/providers/lang-provider";
import { authClient } from "@/lib/better-auth-client";
import { AuthCard } from "@/components/storefront/account/auth-card";
import { useGetSessionUser } from "@/hooks/storefront/useGetSessionUser";
import { useGetMyOrders } from "@/hooks/storefront/useGetMyOrders";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";
import type { Dictionary } from "@/lib/dictionary";
import { ADMIN_ROLES } from "@/lib/constants";

/** Mirrors myOrdersFiltersSchema's default page size. */
const MY_ORDERS_PAGE_SIZE = 10;

const STATUS_TONES = {
  pending: "warning",
  processing: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "danger",
} as const;

type OrderStatusKey = keyof typeof STATUS_TONES;

function orderStatusTone(status: string) {
  return STATUS_TONES[status as OrderStatusKey] ?? "neutral";
}

function translateStatus(status: string, t: Dictionary): string {
  return t.statuses.order[status as keyof Dictionary["statuses"]["order"]] ?? status;
}

function AccountPageContent() {
  const { locale, t } = useLang();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  // The proxy sends bounced admins here with ?next=/admin — same-origin only
  const rawNext = searchParams.get("next") ?? "/account";
  // Reject "//host" and "/\host" alike — browsers normalise the backslash form
  // into a protocol-relative URL, which would make this an open redirect
  const nextPath = /^\/(?![/\\])/.test(rawNext) ? rawNext : "/account";

  const { user, isLoading } = useGetSessionUser();
  const [ordersPage, setOrdersPage] = useState(1);
  const myOrders = useGetMyOrders(ordersPage, Boolean(user));

  async function handleSignOut() {
    await authClient.signOut();
    // Without this the cached auth.me keeps rendering the user's name, email
    // and order history until something else forces a refetch
    await queryClient.invalidateQueries();
    pushToast(t.account.signOut, "info");
  }

  if (isLoading) {
    return <div aria-busy="true" />;
  }

  if (!user) {
    // Refetching the session swaps the card for the dashboard; admins then
    // continue to the admin route that originally sent them here
    return (
      <AuthCard
        onSuccess={() => {
          void queryClient.invalidateQueries().then(() => router.push(nextPath));
        }}
      />
    );
  }

  return (
    <div className="content-shell section-y">
      <div className="flex flex-col gap-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold">{t.account.welcome(user.name)}</h1>
            <span className="text-sm text-text-secondary" dir="ltr">
              {user.email}
            </span>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            {t.account.signOut}
          </Button>
        </header>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">{t.account.myOrders}</h2>

          {myOrders.isLoading ? (
            <p className="text-sm text-text-secondary">{t.common.loading}</p>
          ) : myOrders.data && myOrders.data.items.length > 0 ? (
            <>
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface-raised">
                {myOrders.data.items.map((order) => (
                  <li
                  key={order.id}
                  className="grid items-center gap-3 p-4 text-sm"
                  style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(140px, 100%), 1fr))" }}
                >
                  <span className="font-mono font-medium" dir="ltr">
                    {order.orderNumber}
                  </span>
                  <span className="text-text-secondary">{formatDate(order.createdAt, locale)}</span>
                  <Badge tone={orderStatusTone(order.status)}>{translateStatus(order.status, t)}</Badge>
                  <Badge tone={order.paymentStatus === "collected" ? "success" : "neutral"}>
                    {t.statuses.payment[order.paymentStatus] ?? order.paymentStatus}
                  </Badge>
                  <span className="font-semibold lg:text-end">
                    {formatCurrency(order.total, locale)}
                  </span>
                </li>
              ))}
              </ul>

              <Pagination
                page={ordersPage}
                pageCount={Math.max(1, Math.ceil((myOrders.data?.total ?? 0) / MY_ORDERS_PAGE_SIZE))}
                onPageChange={setOrdersPage}
                className="mt-2"
              />
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface-raised p-10 text-center">
              <p className="text-sm text-text-secondary">{t.cart.empty}</p>
              <Link href="/products">
                <Button size="sm">{t.cart.continueShopping}</Button>
              </Link>
            </div>
          )}
        </section>

        {ADMIN_ROLES.includes(user.role) && (
          <Link href="/admin" className="self-start text-sm font-medium text-accent hover:underline">
            → {t.nav.adminPanel}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function AccountPage() {
  // Suspense required: the content reads useSearchParams for the next hint
  return (
    <Suspense>
      <AccountPageContent />
    </Suspense>
  );
}
