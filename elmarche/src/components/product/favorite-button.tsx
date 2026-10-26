"use client";

import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

type Props = {
  productId: string;
  initialFavorited?: boolean;
  variant?: "icon" | "full";
  className?: string;
};

export function FavoriteButton({
  productId,
  initialFavorited = false,
  variant = "icon",
  className,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  const isOnFavoritesPage = pathname === "/favorites";

  async function toggle() {
    const next = !favorited;
    setFavorited(next);

    try {
      const res = await fetch(`/api/favorites/${productId}`, {
        method: next ? "PUT" : "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      if (!isOnFavoritesPage) {
        router.refresh();
      } else {
        sessionStorage.setItem("favoritesDirty", "1");
      }
    } catch (err) {
      setFavorited(!next);
      console.warn("[favorite-button] failed to toggle:", err);
    }
  }

  const onClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    startTransition(() => {
      void toggle();
    });
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={isPending}
        aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
        aria-pressed={favorited}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm transition-colors hover:bg-white",
          favorited && "text-red-500",
          isPending && "opacity-60",
          className,
        )}
      >
        <Heart
          className="h-4 w-4"
          fill={favorited ? "currentColor" : "none"}
          strokeWidth={2}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={favorited}
      className={cn(
        "flex h-14 flex-1 min-w-[200px] items-center justify-center gap-2 whitespace-nowrap rounded-2xl border-2 border-primary bg-transparent px-6 text-base font-semibold text-primary transition-colors hover:bg-primary/5",
        favorited && "border-red-500 bg-red-50 text-red-500 hover:bg-red-100",
        isPending && "opacity-60",
        className,
      )}
    >
      <Heart
        className="h-5 w-5"
        fill={favorited ? "currentColor" : "none"}
        strokeWidth={2}
      />
      {favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
    </button>
  );
}