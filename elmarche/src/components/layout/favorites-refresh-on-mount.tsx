"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function FavoritesRefreshOnMount() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/favorites" && sessionStorage.getItem("favoritesDirty") === "1") {
      sessionStorage.removeItem("favoritesDirty");
      window.location.reload();
    }
  }, [pathname]);

  return null;
}