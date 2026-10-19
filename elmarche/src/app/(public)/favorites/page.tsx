import { redirect } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { createClient } from "@/lib/supabase/server";
import { listFavoriteProducts } from "@/server/repositories/favorites";

export const metadata = { title: "Mes favoris — El Marché" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FavoritesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/favorites");
  }

  const items = await listFavoriteProducts(user.id);

  if (items.length === 0) {
    return (
      <section className="space-y-2 p-6 text-center">
        <h1 className="text-2xl font-bold">Mes Favoris</h1>
        <p className="text-muted-foreground">
          Vous n&apos;avez pas encore de produits favoris.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Mes Favoris</h1>
        <p className="text-sm text-muted-foreground">
          {items.length} produit{items.length > 1 ? "s" : ""} enregistré
          {items.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} isFavorited={true} />
        ))}
      </div>
    </section>
  );
}