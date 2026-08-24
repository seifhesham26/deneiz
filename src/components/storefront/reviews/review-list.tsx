"use client";

import { useState } from "react";
import { useLang } from "@/components/providers/lang-provider";
import { Button } from "@/components/ui/button";
import { ReviewCard } from "./review-card";
import { ReviewForm } from "./review-form";
import { useGetProductReviews } from "@/hooks/storefront/useGetProductReviews";

interface ReviewListProps {
  productId: string;
}

export function ReviewList({ productId }: ReviewListProps) {
  const { locale, t } = useLang();
  const [page, setPage] = useState(1);
  const [isWriting, setIsWriting] = useState(false);
  const { data, isLoading, refetch } = useGetProductReviews(productId, page);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / 10)) : 1;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{t.product.reviewsTitle}</h2>
        <Button variant="outline" size="sm" onClick={() => setIsWriting((value) => !value)}>
          {t.product.writeReview}
        </Button>
      </header>

      {isWriting ? (
        <ReviewForm
          productId={productId}
          onSubmitted={() => {
            setIsWriting(false);
            void refetch();
          }}
        />
      ) : null}

      {isLoading ? (
        <p className="text-sm text-text-secondary">{t.common.loading}</p>
      ) : data && data.items.length > 0 ? (
        <>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))" }}>
            {data.items.map((review) => (
              <ReviewCard key={review.id} review={review} locale={locale} />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="flex justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNumber = index + 1;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    aria-current={pageNumber === page ? "page" : undefined}
                    className={`flex min-h-11 min-w-11 items-center justify-center rounded-full text-sm ${
                      pageNumber === page ? "bg-primary font-semibold text-text-inverse" : "hover:bg-surface"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
          ) : null}
        </>
      ) : (
        <p className="text-sm text-text-secondary">{t.product.reviewsCount(0)}</p>
      )}
    </section>
  );
}
