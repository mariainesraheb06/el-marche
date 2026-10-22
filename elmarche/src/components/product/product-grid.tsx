import { ProductCard } from "@/components/product/product-card";
import type { ProductSummary } from "@/types/api";

type ProductGridProps = {
  products: ProductSummary[];
  favoriteIds?: Set<string>;
  emptyMessage?: string;
};

export function ProductGrid({
  products,
  favoriteIds,
  emptyMessage = "Aucun produit ne correspond à votre recherche.",
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <p className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isFavorited={favoriteIds?.has(product.id) ?? false}
        />
      ))}
    </div>
  );
}