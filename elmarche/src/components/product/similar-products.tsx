import { ProductGrid } from "@/components/product/product-grid";
import type { ProductSummary } from "@/types/api";

/**
 * "Vous aimerez aussi" section shown on the product detail page.
 *
 * Renders a grid of similar products using the existing ProductGrid component.
 * Returns null when there are no products, so neither the heading nor the
 * section spacing is displayed.
 */
export function SimilarProducts({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="similar-products-title" className="space-y-3">
      <h2 id="similar-products-title" className="text-xl font-bold">
        Vous aimerez aussi
      </h2>
      <ProductGrid products={products} />
    </section>
  );
}
