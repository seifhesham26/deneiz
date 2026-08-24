"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductDetail } from "@/types/api";

interface ProductImagesProps {
  images: ProductDetail["images"];
  productName: string;
}

export function ProductImages({ images, productName }: ProductImagesProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-surface">
        {activeImage ? (
          <Image
            key={activeImage.id}
            src={activeImage.url}
            alt={activeImage.altText ?? productName}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : null}
      </div>

      {images.length > 1 ? (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(72px, 100%), 1fr))` }}
          role="tablist"
          aria-label="product gallery"
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                index === activeIndex ? "border-accent" : "border-transparent opacity-75 hover:opacity-100"
              }`}
            >
              <Image src={image.url} alt="" fill sizes="72px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
