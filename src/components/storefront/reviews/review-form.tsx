"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useLang } from "@/components/providers/lang-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { pushToast } from "@/components/ui/toast";
import { useCreateReview } from "@/hooks/storefront/useCreateReview";
import { translateError, translateFieldMessage } from "@/lib/translate-error";

interface ReviewFormProps {
  productId: string;
  onSubmitted: () => void;
}

type ReviewFormErrors = Partial<Record<"authorName" | "rating" | "title" | "body", string>>;

export function ReviewForm({ productId, onSubmitted }: ReviewFormProps) {
  const { t } = useLang();
  const createReview = useCreateReview();
  const [rating, setRating] = useState(5);
  const [errors, setErrors] = useState<ReviewFormErrors>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setErrors({});

    createReview.mutate(
      {
        productId,
        rating,
        authorName: String(formData.get("authorName") ?? "").trim(),
        title: String(formData.get("title") ?? "").trim() || undefined,
        body: String(formData.get("body") ?? "").trim() || undefined,
      },
      {
        onSuccess: () => {
          pushToast(t.reviewForm.submitted, "success");
          onSubmitted();
        },
        onError: (error) => {
          // tRPC attaches the flattened Zod error for BAD_REQUEST failures
          const fieldErrors = error.data?.zodError?.fieldErrors as
            | Record<string, string[] | undefined>
            | undefined;

          if (fieldErrors) {
            setErrors({
              authorName: fieldErrors.authorName?.[0]
                ? translateFieldMessage(fieldErrors.authorName[0], t)
                : undefined,
              title: fieldErrors.title?.[0]
                ? translateFieldMessage(fieldErrors.title[0], t)
                : undefined,
              body: fieldErrors.body?.[0]
                ? translateFieldMessage(fieldErrors.body[0], t)
                : undefined,
            });
            return;
          }
          pushToast(translateError(error, t), "error");
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-text-secondary">{t.reviewForm.rating}</span>
        <div className="flex gap-1" role="radiogroup" aria-label={t.reviewForm.rating}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              onClick={() => setRating(value)}
              className="flex min-h-11 min-w-11 items-center justify-center"
            >
              <Star
                aria-hidden
                className={`size-6 ${value <= rating ? "fill-accent text-accent" : "text-text-muted"}`}
              />
            </button>
          ))}
        </div>
      </div>

      <Input
        name="authorName"
        label={t.reviewForm.name}
        error={errors.authorName}
        minLength={2}
        required
      />

      <Input name="title" label={`${t.reviewForm.title} (${t.common.optional})`} error={errors.title} />

      <Textarea
        name="body"
        label={`${t.reviewForm.body} (${t.common.optional})`}
        placeholder={t.reviewForm.bodyPlaceholder}
        error={errors.body}
      />

      <Button type="submit" isLoading={createReview.isPending} className="self-start">
        {t.reviewForm.submit}
      </Button>
    </form>
  );
}
