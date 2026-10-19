import { redirect } from "next/navigation";
import { BackButton } from "@/components/layout/back-button";
import { RetryButton } from "@/components/layout/retry-button";
import { FavoritesList } from "@/components/product/favorites-list";
import { getCurrentUserId } from "@/server/auth";
import { listMyFavorites } from "@/server/services/favorites";
import type { ProductSummary } from "@/types/api";

export const metadata = { title: "Mes favoris — El Marché" };
export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login?next=/favorites");

  let items: ProductSummary[] = [];
  let failed = false;
  try {
    items = await listMyFavorites();
  } catch (error) {
    // The API answers with a generic message for unexpected errors (server/errors.ts),
    // so this screen only has to offer a way out. RetryButton re-runs this component.
    failed = true;
    console.warn("[favorites] could not load the wishlist:", error);
  }

  return (
    <div className="space-y-4 px-4 pb-8 pt-4 md:px-6 md:pt-6">
      <div className="flex items-center gap-2">
        <BackButton fallbackHref="/" />
        <h1 className="text-2xl font-bold">Mes favoris</h1>
      </div>

      {failed ? (
        <div className="space-y-4 rounded-2xl border bg-card p-8 text-center">
          <p className="font-semibold">Vos favoris n&apos;ont pas pu être chargés.</p>
          <p className="text-sm text-muted-foreground">
            Vérifiez votre connexion, puis réessayez.
          </p>
          <RetryButton />
        </div>
      ) : (
        <FavoritesList products={items} />
      )}
    </div>
  );
}