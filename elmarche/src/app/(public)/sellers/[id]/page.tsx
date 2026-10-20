import { notFound } from "next/navigation";
import { BackButton } from "@/components/layout/back-button";
import { ProductGrid } from "@/components/product/product-grid";
import { createClient } from "@/lib/supabase/server";
import { productIdSchema } from "@/lib/validators/products";
import { listFavoriteIds } from "@/server/repositories/favorites";
import { listSellerApprovedProducts } from "@/server/repositories/products";

export const dynamic = "force-dynamic";

export default async function SellerPage({ params }: { params: { id: string } }) {
  if (!productIdSchema.safeParse(params.id).success) notFound();

  const supabase = createClient();
  const [profileRes, listing, userRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, shop_name").eq("id", params.id).maybeSingle(),
    listSellerApprovedProducts(params.id).catch(() => null),
    supabase.auth.getUser(),
  ]);

  const profile = profileRes.data;
  if (!profile && (!listing || listing.items.length === 0)) notFound();

  const shopName =
    profile?.shop_name ?? profile?.full_name ?? listing?.items[0]?.shopName ?? "Boutique";
  const user = userRes.data.user;
  const favoriteIds = user ? await listFavoriteIds(user.id) : new Set<string>();

  return (
    <div className="space-y-4 px-4 pb-8 pt-4 md:px-6 md:pt-6">
      <div className="flex items-center gap-2">
        <BackButton fallbackHref="/" />
        <h1 className="text-2xl font-bold">{shopName}</h1>
      </div>

      <h2 className="text-xl font-bold">
        Produits de {shopName}
        {listing ? ` (${listing.total})` : ""}
      </h2>

      {!listing ? (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <p className="font-semibold">Les produits n&apos;ont pas pu être chargés.</p>
          <p className="text-sm text-muted-foreground">Rechargez la page pour réessayer.</p>
        </div>
      ) : listing.items.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-center">
          <p className="font-semibold">Aucun produit pour le moment</p>
        </div>
      ) : (
        <ProductGrid products={listing.items} favoriteIds={favoriteIds} />
      )}
    </div>
  );
}
