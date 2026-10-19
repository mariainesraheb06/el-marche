"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DEFAULT_ERROR,
  applyFavoriteResult,
  runFavoriteToggle,
  toggleFavoriteId,
} from "@/lib/favorites";

type FavoriteContextValue = {
  /** True when the product is in the wishlist, right now, for every heart on screen. */
  isFavorite: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  isLoggedIn: boolean;
};

const FavoriteContext = createContext<FavoriteContextValue | null>(null);

type FavoriteProviderProps = {
  children: ReactNode;
  /**
   * Wishlist ids rendered by the server in (public)/layout.tsx.
   * Client Components are server-rendered in the App Router, so the first paint
   * already shows the right hearts.
   */
  initialFavoriteIds: string[];
  isLoggedIn: boolean;
};

/**
 * Owns the wishlist for every public screen: product cards, the product page and
 * the wishlist itself all read the same set, so a heart toggled anywhere is
 * correct everywhere without any manual state copy.
 */
export function FavoriteProvider({
  children,
  initialFavoriteIds,
  isLoggedIn,
}: FavoriteProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [favoriteIds, setFavoriteIds] = useState<ReadonlySet<string>>(
    () => new Set(initialFavoriteIds),
  );

  const isFavorite = useCallback((productId: string) => favoriteIds.has(productId), [favoriteIds]);

  const toggle = useCallback(
    async (productId: string) => {
      const wasFavorite = favoriteIds.has(productId);

      if (!isLoggedIn) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      // Optimistic update: flip before any await.
      setFavoriteIds((current) => toggleFavoriteId(current, productId));

      try {
        const result = await runFavoriteToggle({ productId, isFavorite: wasFavorite, isLoggedIn });

        // Keeps the optimistic value on success, puts it back on failure.
        setFavoriteIds((current) => applyFavoriteResult(current, productId, result));

        if (result.outcome === "redirect-login") {
          router.push(`/login?next=${encodeURIComponent(pathname)}`);
        } else if (result.message) {
          toast.error(result.message);
        }
      } catch {
        // runFavoriteToggle handles its own failures, but if it ever rejects for an
        // unforeseen reason the optimistic value must still be undone and the visitor
        // told, instead of leaving the heart lit with no feedback.
        setFavoriteIds((current) =>
          applyFavoriteResult(current, productId, { isFavorite: wasFavorite }),
        );
        toast.error(DEFAULT_ERROR);
      }
    },
    [favoriteIds, isLoggedIn, pathname, router],
  );

  const value = useMemo(
    () => ({ isFavorite, toggle, isLoggedIn }),
    [isFavorite, toggle, isLoggedIn],
  );

  return <FavoriteContext.Provider value={value}>{children}</FavoriteContext.Provider>;
}

/** Reads the shared wishlist. Throws a French message when used outside the provider. */
export function useFavorites(): FavoriteContextValue {
  const context = useContext(FavoriteContext);
  if (!context) {
    throw new Error("useFavorites doit être utilisé à l'intérieur d'un FavoriteProvider.");
  }
  return context;
}