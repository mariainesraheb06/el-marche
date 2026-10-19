import { createClient } from "@/lib/supabase/server";
import { toTsQuery } from "@/lib/search";
import type { ProductsQuery } from "@/lib/validators/products";
import type { ProductSummary } from "@/types/api";

const IMAGE_BUCKET = "product-images";

type ImageRow = { id: string; storage_path: string; position: number };

type SummaryRow = {
  id: string;
  title: string;
  price_dzd: number;
  wilaya_code: number;
  created_at: string;
  categories: { slug: string };
  product_images: ImageRow[];
  profiles: { id: string; shop_name: string | null; full_name: string | null } | null;
};

type DetailRow = {
  id: string;
  title: string;
  description: string;
  price_dzd: number;
  wilaya_code: number;
  tags: string[];
  view_count: number;
  created_at: string;
  categories: { id: number; slug: string; name: string };
  product_images: ImageRow[];
  profiles: {
    id: string;
    full_name: string | null;
    shop_name: string | null;
    whatsapp_number: string | null;
  } | null;
};

type Client = ReturnType<typeof createClient>;

function imageUrl(supabase: Client, path: string): string {
  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

function sortedImages(images: ImageRow[]): ImageRow[] {
  return [...images].sort((a, b) => a.position - b.position);
}

export async function listProducts(query: ProductsQuery) {
  const supabase = createClient();
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;

  let builder = supabase
    .from("products")
    .select(
      "id, title, price_dzd, wilaya_code, created_at, categories!inner(slug), product_images(id, storage_path, position), profiles!seller_id(id, shop_name, full_name)",
      { count: "exact" },
    )
    .eq("status", "approved");

  if (query.category) builder = builder.eq("categories.slug", query.category);
  if (query.minPrice !== undefined) builder = builder.gte("price_dzd", query.minPrice);
  if (query.maxPrice !== undefined) builder = builder.lte("price_dzd", query.maxPrice);
  if (query.wilaya !== undefined) builder = builder.eq("wilaya_code", query.wilaya);

  const tsQuery = query.q ? toTsQuery(query.q) : null;
  if (tsQuery) builder = builder.textSearch("search_tsv", tsQuery, { config: "simple" });

  switch (query.sort) {
    case "price_asc":
      builder = builder.order("price_dzd", { ascending: true });
      break;
    case "price_desc":
      builder = builder.order("price_dzd", { ascending: false });
      break;
    case "popular":
      builder = builder.order("view_count", { ascending: false });
      builder = builder.order("created_at", { ascending: false });
      break;
    default:
      builder = builder.order("created_at", { ascending: false });
  }
  builder = builder.order("id");

  const { data, error, count } = await builder.range(from, to);
  if (error) {
    // A page number beyond the last page is not an error for the caller.
    if (error.code === "PGRST103") return { items: [], total: count ?? 0 };
    throw error;
  }

  const rows = (data ?? []) as unknown as SummaryRow[];
  const items = rows.map((row) => {
    const first = sortedImages(row.product_images)[0];
    return {
      id: row.id,
      title: row.title,
      priceDzd: row.price_dzd,
      wilayaCode: row.wilaya_code,
      categorySlug: row.categories.slug,
      imageUrl: first ? imageUrl(supabase, first.storage_path) : null,
      shopName: row.profiles?.shop_name ?? row.profiles?.full_name ?? null,
      sellerId: row.profiles?.id ?? null,
      createdAt: row.created_at,
    };
  });

  return { items, total: count ?? items.length };
}

export async function getProductById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title, description, price_dzd, wilaya_code, tags, view_count, created_at, categories!inner(id, slug, name), product_images(id, storage_path, position), profiles!seller_id(id, full_name, shop_name, whatsapp_number)",
    )
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as DetailRow;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priceDzd: row.price_dzd,
    wilayaCode: row.wilaya_code,
    category: row.categories,
    tags: row.tags,
    images: sortedImages(row.product_images).map((image) => ({
      id: image.id,
      url: imageUrl(supabase, image.storage_path),
      position: image.position,
    })),
    seller: row.profiles
      ? {
          id: row.profiles.id,
          fullName: row.profiles.full_name,
          shopName: row.profiles.shop_name,
          whatsappNumber: row.profiles.whatsapp_number,
        }
      : null,
    viewCount: row.view_count,
    createdAt: row.created_at,
  };
}

export async function logSearch(userId: string, query: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("searches")
    .insert({ user_id: userId, query: query.slice(0, 200) });
  if (error) throw error;
}

export async function listSimilarProducts(
  productId: string,
  limit = 8,
): Promise<ProductSummary[]> {
  const supabase = createClient();

  // 1. Get the source product's category + price
  const { data: source, error: sourceError } = await supabase
    .from("products")
    .select("category_id, price_dzd")
    .eq("id", productId)
    .eq("status", "approved")
    .maybeSingle();

  if (sourceError) throw sourceError;
  if (!source) return [];

  // 2. Fetch other approved products in the same category, ordered by popularity
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title, price_dzd, wilaya_code, created_at, categories!inner(slug), product_images(id, storage_path, position), profiles!seller_id(id, shop_name, full_name)",
    )
    .eq("status", "approved")
    .eq("category_id", source.category_id)
    .neq("id", productId)
    .order("view_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const rows = (data ?? []) as unknown as SummaryRow[];
  return rows.map((row) => {
    const first = sortedImages(row.product_images)[0];
    return {
      id: row.id,
      title: row.title,
      priceDzd: row.price_dzd,
      wilayaCode: row.wilaya_code,
      categorySlug: row.categories.slug,
      imageUrl: first
        ? imageUrl(supabase, first.storage_path)
        : null,
      shopName: row.profiles?.shop_name ?? row.profiles?.full_name ?? null,
      sellerId: row.profiles?.id ?? null,
      createdAt: row.created_at,
    };
  });
}

export async function listSellerApprovedProducts(
  sellerId: string,
  page = 1,
  pageSize = 20,
): Promise<{ items: ProductSummary[]; total: number }> {
  const supabase = createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("products")
    .select(
      "id, title, price_dzd, wilaya_code, created_at, categories!inner(slug), product_images(id, storage_path, position), profiles!seller_id(id, shop_name, full_name)",
      { count: "exact" },
    )
    .eq("seller_id", sellerId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .order("id")
    .range(from, to);

  if (error) throw error;

  const rows = (data ?? []) as unknown as SummaryRow[];
  const items = rows.map((row) => {
    const first = sortedImages(row.product_images)[0];
    return {
      id: row.id,
      title: row.title,
      priceDzd: row.price_dzd,
      wilayaCode: row.wilaya_code,
      categorySlug: row.categories.slug,
      imageUrl: first ? imageUrl(supabase, first.storage_path) : null,
      shopName: row.profiles?.shop_name ?? row.profiles?.full_name ?? null,
      sellerId: row.profiles?.id ?? null,
      createdAt: row.created_at,
    };
  });

  return { items, total: count ?? items.length };
}