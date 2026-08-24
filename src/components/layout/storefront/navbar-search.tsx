"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLang } from "@/components/providers/lang-provider";
import { formatCurrency } from "@/utils/format-currency";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/shared/useDebounce";
import { trpc } from "@/lib/trpc-client";

const MIN_QUERY_LENGTH = 2;
const RESULT_LIMIT = 6;

export function NavbarSearch() {
  const reduceMotion = useReducedMotion();
  const { locale, t } = useLang();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const debouncedQuery = useDebounce(query, 250);

  const { data, isFetching } = trpc.products.getAll.useQuery(
    { search: debouncedQuery, page: 1, pageSize: RESULT_LIMIT },
    {
      enabled: debouncedQuery.trim().length >= MIN_QUERY_LENGTH,
      placeholderData: (previous) => previous,
    },
  );

  // Outside click + Escape close the panel
  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function doSearch(term: string) {
    const trimmed = term.trim();
    if (trimmed.length === 0) return;
    setIsOpen(false);
    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
    inputRef.current?.blur();
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    doSearch(query);
  }

  const hasResults = (data?.items.length ?? 0) > 0;
  const showPanel = isOpen && debouncedQuery.trim().length >= MIN_QUERY_LENGTH;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form onSubmit={submitSearch} role="search">
        <label htmlFor="navbar-search" className="sr-only">
          {t.common.search}
        </label>
        <Search
          aria-hidden
          className="pointer-events-none absolute start-3.5 top-1/2 size-4.5 -translate-y-1/2 text-text-muted"
        />
        <input
          id="navbar-search"
          ref={inputRef}
          type="search"
          value={query}
          placeholder={t.common.searchPlaceholder}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
          className="h-11 w-full rounded-full border border-border bg-surface ps-11 pe-4 text-sm text-text-primary transition-colors placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </form>

      <AnimatePresence>
        {showPanel ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.16 }}
            className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-xl"
          >
            {isFetching && !hasResults ? (
              <div className="flex flex-col gap-3 p-4">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Skeleton className="size-12" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>
            ) : hasResults ? (
              <ul className="max-h-[60dvh] divide-y divide-border overflow-y-auto">
                {data!.items.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/products/${product.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 p-3 transition-colors hover:bg-surface"
                    >
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-surface">
                        {product.coverImageUrl ? (
                          <Image
                            src={product.coverImageUrl}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : null}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">
                          {locale === "ar" ? product.nameAr : product.nameEn}
                        </span>
                        <span className="text-xs text-text-secondary">
                          {formatCurrency(product.price, locale)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    onClick={() => doSearch(debouncedQuery)}
                    className="w-full p-3 text-center text-xs font-medium text-accent hover:bg-surface"
                  >
                    {t.common.search}: “{debouncedQuery.trim()}”
                  </button>
                </li>
              </ul>
            ) : (
              <p className="p-4 text-center text-sm text-text-secondary">{t.common.noResults}</p>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
