"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pushToast } from "@/components/ui/toast";
import { useLang } from "@/components/providers/lang-provider";
import { authClient } from "@/lib/better-auth-client";
import { useGetSessionUser } from "@/hooks/storefront/useGetSessionUser";
import { useGetMyOrders } from "@/hooks/storefront/useGetMyOrders";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";
import type { Dictionary } from "@/lib/dictionary";

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
  const map = t.statuses.order as Record<string, string>;
  return map[status] ?? status;
}

interface AuthFormValues {
  name?: string;
  email: string;
  password: string;
}

export default function AccountPage() {
  const { locale, t } = useLang();
  const { user, isLoading } = useGetSessionUser();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [form, setForm] = useState<AuthFormValues>({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const myOrders = useGetMyOrders();

  async function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signIn") {
        const result = await authClient.signIn.email({
          email: form.email,
          password: form.password,
        });
        if (result.error) {
          pushToast(result.error.message ?? t.errors.generic, "error");
        }
      } else {
        const result = await authClient.signUp.email({
          name: form.name ?? "",
          email: form.email,
          password: form.password,
        });
        if (result.error) {
          pushToast(result.error.message ?? t.errors.generic, "error");
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    await authClient.signOut();
    pushToast(t.account.signOut, "info");
  }

  if (isLoading) {
    return <div className="content-shell section-shell" aria-busy="true" />;
  }

  if (!user) {
    return (
      <div className="content-shell section-shell flex justify-center">
        <form
          onSubmit={handleAuthSubmit}
          className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-border bg-surface-raised p-6"
        >
          <h1 className="text-2xl font-semibold">{mode === "signIn" ? t.account.signIn : t.account.signUp}</h1>
          <p className="text-sm text-text-secondary">{t.account.guestNote}</p>

          {mode === "signUp" ? (
            <Input
              label={t.account.name}
              value={form.name ?? ""}
              onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))}
              required
              minLength={2}
            />
          ) : null}

          <Input
            label={t.account.email}
            type="email"
            dir="ltr"
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))}
            required
          />

          <Input
            label={t.account.password}
            type="password"
            dir="ltr"
            autoComplete={mode === "signIn" ? "current-password" : "new-password"}
            value={form.password}
            onChange={(event) => setForm((state) => ({ ...state, password: event.target.value }))}
            required
            minLength={8}
          />

          <Button type="submit" isLoading={submitting}>
            {mode === "signIn" ? t.account.signIn : t.account.signUp}
          </Button>

          <button
            type="button"
            onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
            className="text-center text-xs text-text-secondary hover:text-accent"
          >
            {mode === "signIn" ? t.account.createAccountCta : t.account.haveAccountCta}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="content-shell section-shell flex flex-col gap-8">
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

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">{t.account.myOrders}</h2>

        {myOrders.isLoading ? (
          <p className="text-sm text-text-secondary">{t.common.loading}</p>
        ) : myOrders.data && myOrders.data.items.length > 0 ? (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface-raised">
            {myOrders.data.items.map((order) => (
              <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <span className="font-mono font-medium" dir="ltr">
                  {order.orderNumber}
                </span>
                <span className="text-text-secondary">{formatDate(order.createdAt, locale)}</span>
                <Badge tone={orderStatusTone(order.status)}>
                  {translateStatus(order.status, t)}
                </Badge>
                <Badge tone={order.paymentStatus === "collected" ? "success" : "neutral"}>
                  {(t.statuses.payment as Record<string, string>)[order.paymentStatus] ?? order.paymentStatus}
                </Badge>
                <span className="font-semibold">{formatCurrency(order.total, locale)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-secondary">{t.cart.empty}</p>
        )}
      </section>

      {(user.role === "super_admin" || user.role === "manager" || user.role === "staff") && (
        <Link href="/admin" className="self-start text-sm text-accent hover:underline">
          → {t.nav.adminPanel}
        </Link>
      )}
    </div>
  );
}
