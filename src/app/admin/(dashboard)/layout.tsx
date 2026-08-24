import { Sidebar } from "@/components/layout/admin/sidebar";
import { Topbar } from "@/components/layout/admin/topbar";
import { Breadcrumb } from "@/components/layout/admin/breadcrumb";
import { Toaster } from "@/components/ui/toast";

/**
 * Admin shell. Route protection happens in proxy.ts (cookie gate) and again
 * at the tRPC procedure level (role check) — this layout only renders chrome.
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
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
