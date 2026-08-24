import { Sidebar } from "@/components/layout/admin/sidebar";
import { Topbar } from "@/components/layout/admin/topbar";
import { Breadcrumb } from "@/components/layout/admin/breadcrumb";
import { AdminRouteGuard } from "@/components/layout/admin/admin-route-guard";
import { Toaster } from "@/components/ui/toast";

/**
 * Admin shell. Protection layers: proxy.ts (cookie gate) → this guard
 * (role check) → tRPC procedures (per-query authorization).
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-dvh bg-surface">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <div className="border-b border-border bg-surface-raised px-4 py-3">
          <Breadcrumb />
        </div>
        <main className="flex flex-1 flex-col p-4 lg:p-6">
          <AdminRouteGuard>{children}</AdminRouteGuard>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
