import { BottomNav, DesktopNav } from "@/components/layout/main-nav";
import { FavoriteProvider } from "@/components/product/favorite-provider";
import { getCurrentUserId } from "@/server/auth";
import { listMyFavorites } from "@/server/services/favorites";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const userId = await getCurrentUserId();

  // One wishlist read for the whole group: the product cards, the product page and
  // /favorites all share this state. Read through the service layer (AGENTS.md:28),
  // and only for a known user, because listMyFavorites() throws when signed out.
  const favorites = userId ? await listMyFavorites() : [];

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <FavoriteProvider
        initialFavoriteIds={favorites.map((favorite) => favorite.id)}
        isLoggedIn={Boolean(userId)}
      >
        <DesktopNav />
        <div className="mx-auto w-full max-w-6xl">{children}</div>
        <BottomNav />
      </FavoriteProvider>
    </div>
  );
}