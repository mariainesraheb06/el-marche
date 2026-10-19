import {
  getProductById,
  listProducts,
  listSellerApprovedProducts,
  listSimilarProducts,
  logSearch,
} from "@/server/repositories/products";
import type { ProductsQuery } from "@/lib/validators/products";

export async function searchProducts(
  query: ProductsQuery,
  userId: string | null,
) {
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

export async function getSimilarProducts(productId: string) {
  return listSimilarProducts(productId);
}

export async function getSellerBoutique(sellerId: string, page = 1, pageSize = 20) {
  return listSellerApprovedProducts(sellerId, page, pageSize);
}