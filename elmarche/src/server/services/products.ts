import { getProductById, listProducts, logSearch } from "@/server/repositories/products";
import type { ProductsQuery } from "@/lib/validators/products";

export async function searchProducts(query: ProductsQuery, userId: string | null) {
  const { items, total } = await listProducts(query);

  // Log the search for analytics and recommendations (first page only, never block the response).
  if (userId && query.q && query.page === 1) {
    try {
      await logSearch(userId, query.q);
    } catch {
      // Logging must never break search.
    }
  }

  return { items, page: query.page, pageSize: query.pageSize, total };
}

export async function getProduct(id: string) {
  return getProductById(id);
}