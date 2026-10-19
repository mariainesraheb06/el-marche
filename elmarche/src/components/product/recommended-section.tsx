import { Sparkles } from "lucide-react";
import { ProductGrid } from "@/components/product/product-grid";
import type { ProductSummary } from "@/types/api";

type Props = {
  products: ProductSummary[];
  favoriteIds?: Set<string>;
};

export function RecommendedSection({ products, favoriteIds }: Props) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="recommended-title" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="recommended-title" className="text-xl font-bold">
          Recommandé pour vous
        </h2>
        <span className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
          <Sparkles className="h-3 w-3" aria-hidden />
          AI suggestion
        </span>
      </div>
      <ProductGrid products={products} favoriteIds={favoriteIds} />
    </section>
  );
}