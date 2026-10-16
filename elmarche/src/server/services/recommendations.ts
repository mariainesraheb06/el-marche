import type { ProductSummary } from "@/types/api";
import { createClient } from "@/lib/supabase/server";

const IMAGE_BUCKET = "product-images";
const RECOMMENDER_TIMEOUT_MS = 3000;
const DEFAULT_LIMIT = 10;

type RecommenderResponse = {
  productIds: string[];
  strategy: "content" | "fallback";
};

type ProductRow = {
  id: string;
  title: string;
  price_dzd: number;
  wilaya_code: number;
  created_at: string;
  categories: { slug: string };
  product_images: { id: string; storage_path: string; position: number }[];
  profiles: { shop_name: string | null; full_name: string | null } | null;
};

function imageUrl(
  supabase: ReturnType<typeof createClient>,
  path: string,
): string {
  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

function rowToSummary(
  supabase: ReturnType<typeof createClient>,
  row: ProductRow,
): ProductSummary {
  const first = [...row.product_images].sort(
    (a, b) => a.position - b.position,
  )[0];
  return {
    id: row.id,
    title: row.title,
    priceDzd: row.price_dzd,
    wilayaCode: row.wilaya_code,
    categorySlug: row.categories.slug,
    imageUrl: first ? imageUrl(supabase, first.storage_path) : null,
    shopName: row.profiles?.shop_name ?? row.profiles?.full_name ?? null,
    createdAt: row.created_at,
  };
}

async function fetchProductSummaries(
  ids: string[],
): Promise<ProductSummary[]> {
  if (ids.length === 0) return [];
  const supabase = createClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title, price_dzd, wilaya_code, created_at, categories!inner(slug), product_images(id, storage_path, position), profiles!seller_id(shop_name, full_name)",
    )
    .in("id", ids)
    .eq("status", "approved");

  if (error) {
    console.warn("[recommendations] product fetch failed:", error.message);
    return [];
  }

  const rows = (data ?? []) as unknown as ProductRow[];
  const byId = new Map(rows.map((row) => [row.id, row]));

  // Preserve the order returned by the recommender (or fallback).
  return ids
    .map((id) => byId.get(id))
    .filter((row): row is ProductRow => row !== undefined)
    .map((row) => rowToSummary(supabase, row));
}

async function callRecommender(
  userId: string,
): Promise<RecommenderResponse | null> {
  const url = process.env.RECOMMENDER_URL;
  const key = process.env.RECOMMENDER_API_KEY;
  if (!url || !key) {
    console.warn("[recommendations] recommender env vars missing");
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RECOMMENDER_TIMEOUT_MS);

  try {
    const res = await fetch(
      `${url}/recommend/${userId}?limit=${DEFAULT_LIMIT}`,
      {
        headers: { "X-Internal-Key": key },
        signal: controller.signal,
        cache: "no-store",
      },
    );
    if (!res.ok) {
      console.warn(`[recommendations] recommender returned ${res.status}`);
      return null;
    }
    return (await res.json()) as RecommenderResponse;
  } catch (err) {
    console.warn("[recommendations] recommender unreachable:", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function popularityFallback(): Promise<ProductSummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title, price_dzd, wilaya_code, created_at, categories!inner(slug), product_images(id, storage_path, position), profiles!seller_id(shop_name, full_name)",
    )
    .eq("status", "approved")
    .order("view_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(DEFAULT_LIMIT);

  if (error) {
    console.warn("[recommendations] popularity fallback failed:", error.message);
    return [];
  }
  const rows = (data ?? []) as unknown as ProductRow[];
  return rows.map((row) => rowToSummary(supabase, row));
}

export async function getRecommendedProducts(
  userId: string | null,
): Promise<ProductSummary[]> {
  // Anonymous users → popularity fallback immediately.
  if (!userId) {
    return popularityFallback();
  }

  const recommender = await callRecommender(userId);

  // If the recommender failed, or returned zero products, fall back.
  if (!recommender || recommender.productIds.length === 0) {
    return popularityFallback();
  }

  const products = await fetchProductSummaries(recommender.productIds);

  // If the recommender gave IDs but none are available anymore (e.g. unapproved),
  // fall back so the homepage never shows an empty section.
  if (products.length === 0) {
    return popularityFallback();
  }

  return products;
}