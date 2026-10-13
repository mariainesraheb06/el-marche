import type { ProductSummary } from "@/types/api";

// Owner: Ilyes (AI/Data A).
// TODO: call GET {RECOMMENDER_URL}/recommend/{userId}?limit=10 with the X-Internal-Key header
// (3 second timeout), load the matching products, and fall back to a SQL popularity query
// when the service is unreachable. Until then the homepage simply hides this section.
export async function getRecommendedProducts(userId: string | null): Promise<ProductSummary[]> {
  void userId;
  return [];
}