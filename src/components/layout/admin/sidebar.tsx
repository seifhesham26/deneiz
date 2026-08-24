"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  Image as ImageIcon,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  Star,
  Users,
  Warehouse,
} from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { cn } from "@/lib/cn";

export function Sidebar() {
  const { t } = useLang();
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: t.admin.dashboard, icon: LayoutDashboard },
    { href: "/admin/products", label: t.admin.products, icon: Package },
    { href: "/admin/categories", label: t.admin.categories, icon: ClipboardList },
    { href: "/admin/banners", label: t.admin.banners, icon: ImageIcon },
    { href: "/admin/orders", label: t.admin.orders, icon: Boxes },
    { href: "/admin/inventory", label: t.admin.inventory, icon: Package },
    { href: "/admin/warehouse", label: t.admin.warehouse, icon: Warehouse },
    { href: "/admin/reviews", label: t.admin.reviews, icon: MessageSquare },
    { href: "/admin/customers", label: t.admin.customers, icon: Users },
    { href: "/admin/analytics", label: t.admin.analytics, icon: BarChart3 },
    { href: "/admin/settings", label: t.admin.settings, icon: Settings },
  ];

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 overflow-y-auto bg-admin-sidebar p-4 text-admin-text lg:flex">
      <span className="mb-6 px-2 text-lg font-semibold tracking-wide">{t.admin.panelName}</span>

      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
              isActive ? "bg-white/10 font-medium" : "text-admin-text/70 hover:bg-white/5 hover:text-admin-text",
            )}
          >
            <item.icon aria-hidden className="size-4.5" />
            {item.label}
          </Link>
        );
      })}

      <div className="mt-auto px-2 pt-6">
        <Link href="/" className="flex min-h-11 items-center gap-2 text-xs text-admin-text/60 hover:text-admin-text">
          <Star aria-hidden className="size-3.5 rotate-180" />
          {t.nav.home}
        </Link>
      </div>
    </aside>
  );
}
