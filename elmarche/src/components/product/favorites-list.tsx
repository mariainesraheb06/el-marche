"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "@/components/product/favorite-provider";
import { ProductGrid } from "@/components/product/product-grid";
import { Button } from "@/components/ui/button";
import type { ProductSummary } from "@/types/api";

/**
 * The wishlist grid.
 *
 * The server already sent the right products; this filters them against the shared
 * state so a card removed here disappears immediately, with no extra round trip.
 */
export function FavoritesList({ products }: { products: ProductSummary[] }) {
  const { isFavorite } = useFavorites();
  const items = products.filter((product) => isFavorite(product.id));

  if (items.length === 0) {
    return (
      <div className="space-y-4 rounded-2xl border bg-card p-8 text-center">
        <Heart className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
        <p className="font-semibold">Aucun favori pour le moment</p>
        <p className="text-sm text-muted-foreground">
          Touchez le cœur sur un produit pour le retrouver ici.
        </p>
        <Button
          asChild
          variant="outline"
          className="h-12 w-full rounded-2xl border-primary text-primary"
        >
          <Link href="/search">Découvrir les produits</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-muted-foreground">
        {items.length} favori{items.length > 1 ? "s" : ""}
      </p>
      <ProductGrid products={items} />
    </>
  );
}