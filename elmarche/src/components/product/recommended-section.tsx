import { Sparkles } from "lucide-react";
import { ProductGrid } from "@/components/product/product-grid";
import type { ProductSummary } from "@/types/api";

// Presentational only. The data comes from server/services/recommendations.ts (owner: Ilyes).
export function RecommendedSection({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="recommended-title" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 md:flex-nowrap md:gap-3">
        <h2 id="recommended-title" className="text-lg font-bold md:text-xl">
          Recommandé pour vous
        </h2>
        <span className="flex items-center gap-1 rounded-md bg-primary text-[9px] px-2 py-1 font-bold uppercase tracking-wide text-primary-foreground md:text-[10px] md:px-2 md:py-1">
          <Sparkles className="h-3 w-3" aria-hidden />
          AI suggestion
        </span>
      </div>
      <ProductGrid products={products} />
    </section>
  );
}