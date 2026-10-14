import Image from "next/image";
import Link from "next/link";
import { MapPin, ShoppingBag } from "lucide-react";
import { categoryName } from "@/lib/constants/categories";
import { wilayaName } from "@/lib/constants/wilayas";
import { formatPrice } from "@/lib/format";
import type { ProductSummary } from "@/types/api";

export function ProductCard({ product }: { product: ProductSummary }) {
  const badge = categoryName(product.categorySlug);
  const wilaya = wilayaName(product.wilayaCode);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] bg-secondary">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ShoppingBag className="h-8 w-8" aria-hidden />
            <span className="sr-only">Pas d&apos;image</span>
          </div>
        )}
        {badge && (
          <span className="absolute left-2 top-2 rounded-md bg-accent px-2 py-1 text-[11px] font-semibold text-accent-foreground">
            {badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        {product.shopName && (
          <p className="truncate text-xs text-muted-foreground">{product.shopName}</p>
        )}
        <h3 className="line-clamp-2 font-sans text-sm font-semibold leading-snug">
          {product.title}
        </h3>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <p className="font-heading text-lg font-bold text-primary">
            {formatPrice(product.priceDzd)}
          </p>
          {wilaya && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {wilaya}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}