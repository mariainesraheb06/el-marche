"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/components/product/favorite-provider";
import { cn } from "@/lib/utils";

type FavoriteButtonProps = {
  productId: string;
  /** Icon-only overlay, used on top of a product card image. */
  compact?: boolean;
  className?: string;
};

/**
 * Adds or removes a product from the wishlist.
 *
 * The heart reads its state from the shared provider, so it stays correct on the
 * product card, on the product page and on the wishlist without any local copy.
 * `busy` blocks a second tap while the first request is in flight.
 */
export function FavoriteButton({
  productId,
  compact = false,
  className,
}: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorites();
  const [busy, setBusy] = useState(false);
  const favorited = isFavorite(productId);
  const label = favorited ? "Retirer des favoris" : "Ajouter aux favoris";

  async function onClick() {
    if (busy) return;

    setBusy(true);
    try {
      await toggle(productId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant={compact ? "ghost" : "outline"}
      onClick={onClick}
      disabled={busy}
      aria-pressed={favorited}
      aria-label={label}
      title={compact ? label : undefined}
      className={cn(
        compact
          ? "h-9 w-9 shrink-0 rounded-full bg-card/90 text-primary shadow-sm hover:bg-card"
          : "h-14 shrink-0 rounded-2xl border-primary px-6 text-primary",
        className,
      )}
    >
      <Heart className={cn(favorited && "fill-current")} aria-hidden />
      {compact ? null : label}
    </Button>
  );
}