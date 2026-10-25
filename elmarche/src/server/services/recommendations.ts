import type { ProductSummary } from "@/types/api";
import { createClient } from "@/lib/supabase/server";

const IMAGE_BUCKET = "product-images";
const RECOMMENDER_TIMEOUT_MS = 4000;
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

async function personalizedFallback(userId: string): Promise<ProductSummary[]> {
  try {
    const supabase = createClient();
    const [views, favs] = await Promise.all([
      supabase
        .from("product_views")
        .select("product_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("favorites").select("product_id").eq("user_id", userId).limit(50),
    ]);

    const weight = new Map<string, number>();
    for (const row of views.data ?? []) {
      weight.set(row.product_id, (weight.get(row.product_id) ?? 0) + 1);
    }
    // A favorite counts more than a view.
    for (const row of favs.data ?? []) {
      weight.set(row.product_id, (weight.get(row.product_id) ?? 0) + 3);
    }
    if (weight.size === 0) return popularityFallback();

    const { data: seen } = await supabase
      .from("products")
      .select("id, category_id")
      .in("id", Array.from(weight.keys()));

    const byCategory = new Map<number, number>();
    for (const row of seen ?? []) {
      byCategory.set(
        row.category_id,
        (byCategory.get(row.category_id) ?? 0) + (weight.get(row.id) ?? 0),
      );
    }
    const top = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1])[0];
    if (!top) return popularityFallback();

    const { data, error } = await supabase
      .from("products")
      .select(
        "id, title, price_dzd, wilaya_code, created_at, categories!inner(slug), product_images(id, storage_path, position), profiles!seller_id(shop_name, full_name)",
      )
      .eq("status", "approved")
      .eq("category_id", top[0])
      .order("view_count", { ascending: false })
      .limit(DEFAULT_LIMIT);

    if (error || !data || data.length === 0) return popularityFallback();
    console.warn("[recommendations] using personalized category fallback");
    return (data as unknown as ProductRow[]).map((row) => rowToSummary(supabase, row));
  } catch (err) {
    console.warn("[recommendations] personalized fallback failed:", err);
    return popularityFallback();
  }
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
    return personalizedFallback(userId);
  }

  const products = await fetchProductSummaries(recommender.productIds);

  // If the recommender gave IDs but none are available anymore (e.g. unapproved),
  // fall back so the homepage never shows an empty section.
  if (products.length === 0) {
    return personalizedFallback(userId);
  }

  return products;
}