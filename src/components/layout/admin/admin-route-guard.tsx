"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { Button } from "@/components/ui/button";
import { useGetSessionUser } from "@/hooks/storefront/useGetSessionUser";

const ADMIN_ROLES = ["super_admin", "manager", "staff"];

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

/**
 * Second layer of admin protection after the proxy cookie gate. Signed-in
 * non-admins get an explicit "no access" card — silently bouncing them home
 * made failed admin visits look like a broken link.
 */
export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const { t } = useLang();
  const { user, isLoading } = useGetSessionUser();
  const isAdmin = Boolean(user && ADMIN_ROLES.includes(user.role));

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-10 text-sm text-text-secondary" aria-busy="true">
        {t.common.loading}
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center p-10">
        <div className="flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-border bg-surface-raised p-8 text-center">
          <ShieldAlert aria-hidden className="size-10 text-danger" />
          <p className="text-sm font-medium">{t.admin.login.forbidden}</p>
          {!user ? (
            <p className="text-xs text-text-secondary">{t.admin.login.required}</p>
          ) : null}
          <Link href="/">
            <Button variant="outline" size="sm">
              ← {t.nav.home}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
