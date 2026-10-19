import { createClient } from "@/lib/supabase/server";
import type { ProductSummary } from "@/types/api";

const IMAGE_BUCKET = "product-images";

type FavoriteRow = {
  products: {
    id: string;
    title: string;
    price_dzd: number;
    wilaya_code: number;
    created_at: string;
    categories: { slug: string };
    product_images: { storage_path: string; position: number }[];
    profiles: { id: string; shop_name: string | null; full_name: string | null } | null;
  } | null;
};

function toSummary(
  supabase: ReturnType<typeof createClient>,
  row: NonNullable<FavoriteRow["products"]>,
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
    imageUrl: first
      ? supabase.storage.from(IMAGE_BUCKET).getPublicUrl(first.storage_path).data
          .publicUrl
      : null,
    shopName: row.profiles?.shop_name ?? row.profiles?.full_name ?? null,
    sellerId: row.profiles?.id ?? null,
    createdAt: row.created_at,
  };
}

export async function listFavoriteProducts(
  userId: string,
): Promise<ProductSummary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select(
      "products!inner(id, title, price_dzd, wilaya_code, created_at, status, categories!inner(slug), product_images(storage_path, position), profiles!seller_id(id, shop_name, full_name))",
    )
    .eq("user_id", userId)
    .eq("products.status", "approved")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as FavoriteRow[];
  return rows
    .map((row) => row.products)
    .filter((p): p is NonNullable<FavoriteRow["products"]> => p !== null)
    .map((p) => toSummary(supabase, p));
}

export async function insertFavorite(
  userId: string,
  productId: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("favorites")
    .upsert(
      { user_id: userId, product_id: productId },
      { onConflict: "user_id,product_id", ignoreDuplicates: true },
    );
  if (error) throw error;
}

export async function deleteFavorite(
  userId: string,
  productId: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);
  if (error) throw error;
}

export async function insertFavoriteEvent(
  userId: string,
  productId: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("product_views").insert({
    user_id: userId,
    product_id: productId,
    event_type: "favorite",
  });
  if (error) throw error;
}

export async function productExists(productId: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("status", "approved")
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}