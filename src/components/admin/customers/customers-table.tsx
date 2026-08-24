"use client";

import { useState } from "react";
import { useLang } from "@/components/providers/lang-provider";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { ADMIN_PAGE_SIZE } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pushToast } from "@/components/ui/toast";
import { translateError } from "@/lib/translate-error";
import { useDebounce } from "@/hooks/shared/useDebounce";
import { useGetCustomers } from "@/hooks/admin/useGetCustomers";
import { useSetCustomerBan } from "@/hooks/admin/useSetCustomerBan";
import { formatCurrency } from "@/utils/format-currency";
import { formatDate } from "@/utils/format-date";

export function CustomersTable() {
  const { locale, t } = useLang();
  const setBan = useSetCustomerBan();
  const [searchDraft, setSearchDraft] = useState("");
  const [page, setPage] = useState(1);
  const search = useDebounce(searchDraft, 300);

  const { data, isLoading } = useGetCustomers({ search, page });

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder={t.admin.customersView.searchPlaceholder}
        value={searchDraft}
        onChange={(event) => setSearchDraft(event.target.value)}
        className="max-w-xs"
      />

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface-raised">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-secondary">
              <th className="p-3 text-start font-medium">{t.admin.customer}</th>
              <th className="p-3 text-start font-medium">{t.admin.customersView.joined}</th>
              <th className="p-3 text-start font-medium">{t.admin.customersView.ordersCount}</th>
              <th className="p-3 text-start font-medium">{t.admin.customersView.totalSpent}</th>
              <th className="p-3 text-start font-medium">{t.admin.status}</th>
              <th className="p-3 text-end font-medium">{t.admin.actions}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-text-secondary">
                  {t.common.loading}
                </td>
              </tr>
            ) : data && data.items.length > 0 ? (
              data.items.map((customer) => (
                <tr key={customer.id} className="border-t border-border first:border-t-0">
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{customer.fullName}</span>
                      <span className="text-xs text-text-muted" dir="ltr">
                        {customer.phoneNumber}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap">{formatDate(customer.createdAt, locale)}</td>
                  <td className="p-3">{customer.ordersCount}</td>
                  <td className="p-3 font-semibold">{formatCurrency(customer.totalSpent, locale)}</td>
                  <td className="p-3">
                    <Badge tone={customer.isBanned ? "danger" : "success"}>
                      {customer.isBanned ? t.admin.customersView.banned : t.admin.customersView.active}
                    </Badge>
                  </td>
                  <td className="p-3 text-end">
                    <Button
                      size="sm"
                      variant={customer.isBanned ? "outline" : "ghost"}
                      disabled={setBan.isPending}
                      onClick={() =>
                        setBan.mutate(
                          { id: customer.id, isBanned: !customer.isBanned },
                          {
                            onSuccess: () => pushToast(t.admin.customersView.updated, "success"),
                            onError: (error) => pushToast(translateError(error, t), "error"),
                          },
                        )
                      }
                    >
                      {customer.isBanned ? t.admin.customersView.unban : t.admin.customersView.ban}
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-text-secondary">
                  {t.common.noResults}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageCount={Math.max(1, Math.ceil((data?.total ?? 0) / ADMIN_PAGE_SIZE))}
        onPageChange={setPage}
        className="mt-6"
      />
    </div>
  );
}
