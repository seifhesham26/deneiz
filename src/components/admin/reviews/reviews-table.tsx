"use client";

import { useState } from "react";
import { Flag, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { pushToast } from "@/components/ui/toast";
import {
  useDeleteReview,
  useModerateReview,
  useSetReviewFlagged,
} from "@/hooks/admin/useModerateReview";
import { useGetAdminReviews } from "@/hooks/admin/useGetAdminReviews";
import { formatDateTime } from "@/utils/format-date";

export function ReviewsTable() {
  const { locale, t } = useLang();
  const [statusFilter, setStatusFilter] = useState("");
  const moderate = useModerateReview();
  const setFlagged = useSetReviewFlagged();
  const remove = useDeleteReview();

  const { data, isLoading } = useGetAdminReviews({
    status: statusFilter === "" ? undefined : (statusFilter as "pending" | "approved" | "rejected"),
  });

  return (
    <div className="flex flex-col gap-4">
      <Select
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value)}
        className="max-w-44"
      >
        <option value="">{t.admin.ordersView.allStatuses}</option>
        <option value="pending">{t.statuses.reviewStatus.pending}</option>
        <option value="approved">{t.statuses.reviewStatus.approved}</option>
        <option value="rejected">{t.statuses.reviewStatus.rejected}</option>
      </Select>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface-raised">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-text-secondary">
              <th className="p-3 text-start font-medium">{t.admin.productsView.name}</th>
              <th className="p-3 text-start font-medium">{t.reviewForm.rating}</th>
              <th className="p-3 text-start font-medium">{t.reviewForm.body}</th>
              <th className="p-3 text-start font-medium">{t.admin.status}</th>
              <th className="p-3 text-end font-medium">{t.admin.actions}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-secondary">
                  {t.common.loading}
                </td>
              </tr>
            ) : data && data.items.length > 0 ? (
              data.items.map((review) => (
                <tr key={review.id} className="border-t border-border align-top first:border-t-0">
                  <td className="p-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{review.authorName}</span>
                      <span className="text-xs text-text-muted">
                        {(locale === "ar" ? review.productNameAr : review.productNameEn)}
                      </span>
                      <span className="text-xs text-text-muted">{formatDateTime(review.createdAt, locale)}</span>
                    </div>
                  </td>
                  <td className="p-3 font-semibold">{review.rating}/5</td>
                  <td className="max-w-72 p-3">
                    <div className="flex flex-col gap-1">
                      {review.title ? <span className="text-xs font-semibold">{review.title}</span> : null}
                      {review.body ? <span className="line-clamp-2 text-text-secondary">{review.body}</span> : null}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col items-start gap-1">
                      <Badge
                        tone={
                          review.status === "approved"
                            ? "success"
                            : review.status === "rejected"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {(t.statuses.reviewStatus as Record<string, string>)[review.status]}
                      </Badge>
                      {review.isFlagged ? <Badge tone="danger">{t.admin.reviewsView.flag}</Badge> : null}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        type="button"
                        aria-label={t.admin.reviewsView.approve}
                        onClick={() =>
                          moderate.mutate(
                            { id: review.id, status: "approved" },
                            { onSuccess: () => pushToast(t.admin.reviewsView.moderated, "success") },
                          )
                        }
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-surface"
                      >
                        <ThumbsUp aria-hidden className="size-4 text-success" />
                      </button>
                      <button
                        type="button"
                        aria-label={t.admin.reviewsView.reject}
                        onClick={() =>
                          moderate.mutate(
                            { id: review.id, status: "rejected" },
                            { onSuccess: () => pushToast(t.admin.reviewsView.moderated, "success") },
                          )
                        }
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-surface"
                      >
                        <ThumbsDown aria-hidden className="size-4 text-danger" />
                      </button>
                      <button
                        type="button"
                        aria-label={review.isFlagged ? t.admin.reviewsView.unflag : t.admin.reviewsView.flag}
                        onClick={() => setFlagged.mutate({ id: review.id, isFlagged: !review.isFlagged })}
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-full hover:bg-surface"
                      >
                        <Flag aria-hidden className={`size-4 ${review.isFlagged ? "fill-danger text-danger" : "text-text-muted"}`} />
                      </button>
                      <button
                        type="button"
                        aria-label={t.common.delete}
                        onClick={() => {
                          if (!window.confirm(t.admin.confirmDelete)) return;
                          remove.mutate({ id: review.id });
                        }}
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-text-muted hover:text-danger"
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-text-secondary">
                  {t.common.noResults}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
