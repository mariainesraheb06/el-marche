import { notFound } from "next/navigation";
import { BackButton } from "@/components/layout/back-button";
import { RetryButton } from "@/components/layout/retry-button";
import { ProductGrid } from "@/components/product/product-grid";
import type { ProductSummary } from "@/types/api";
import { wilayaName } from "@/lib/constants/wilayas";
import { productIdSchema } from "@/lib/validators/products";
import { getProfileById } from "@/server/repositories/profiles";
import { getSellerBoutique } from "@/server/services/products";

export const dynamic = "force-dynamic";

export default async function SellerPage({ params }: { params: { id: string } }) {
  if (!productIdSchema.safeParse(params.id).success) notFound();

  const seller = await getProfileById(params.id);
  if (!seller || seller.role !== "seller") notFound();

  let items: ProductSummary[] = [];
  let total = 0;
  let failed = false;
  try {
    const result = await getSellerBoutique(params.id);
    items = result.items;
    total = result.total;
  } catch {
    failed = true;
    console.warn("[seller boutique] could not load products:", params.id);
  }

  const wilaya = seller.wilayaCode ? wilayaName(seller.wilayaCode) : undefined;
  const shopName = seller.shopName || seller.fullName || "Boutique sans nom";

  return (
    <div className="space-y-4 px-4 pb-8 pt-4 md:px-6 md:pt-6">
      <div className="flex items-center gap-2">
        <BackButton fallbackHref="/" />
        <h1 className="text-2xl font-bold">{shopName}</h1>
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="font-semibold">{seller.fullName ?? "Vendeur"}</p>
            <p className="text-sm text-muted-foreground">
              Boutique {seller.shopName ?? ""}
            </p>
          </div>
          {wilaya && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>Wilaya {wilaya}</span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-bold">
          Produits de {shopName} ({total})
        </h2>

        {failed ? (
          <div className="space-y-4 rounded-2xl border bg-card p-8 text-center">
            <p className="font-semibold">Les produits n’ont pas pu être chargés.</p>
            <p className="text-sm text-muted-foreground">
              Vérifiez votre connexion, puis réessayez.
            </p>
            <RetryButton />
          </div>
        ) : items.length > 0 ? (
          <ProductGrid
            products={items}
            emptyMessage="Cette boutique ne propose aucun produit pour le moment."
          />
        ) : (
          <div className="space-y-4 rounded-2xl border bg-card p-8 text-center">
            <p className="font-semibold">Aucun produit pour le moment</p>
            <p className="text-sm text-muted-foreground">
              Cette boutique n’a pas encore publié de produit approuvé.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
