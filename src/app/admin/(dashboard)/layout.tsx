import { Sidebar } from "@/components/layout/admin/sidebar";
import { Topbar } from "@/components/layout/admin/topbar";
import { AdminRouteGuard } from "@/components/layout/admin/admin-route-guard";
import { Toaster } from "@/components/ui/toast";

/**
 * Admin shell. Protection layers: proxy.ts (cookie gate) → this guard
 * (role check) → tRPC procedures (per-query authorization).
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    // The guard wraps the chrome too: a signed-in non-admin previously saw the
    // complete admin navigation framing the "no access" card
    <AdminRouteGuard>
      <div className="flex min-h-dvh bg-surface">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex flex-1 flex-col p-4 lg:p-6">{children}</main>
        </div>
        <Toaster />
      </div>
    </AdminRouteGuard>
  );
}
