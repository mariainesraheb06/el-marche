import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminProductsQuery } from "@/lib/validators/admin-products";

const IMAGE_BUCKET = "product-images";

type AdminProductRow = {
  id: string;
  title: string;
  price_dzd: number;
  wilaya_code: number;
  status: string;
  view_count: number;
  created_at: string;
  categories: { slug: string };
  product_images: { storage_path: string; position: number }[];
  profiles: {
    shop_name: string | null;
    full_name: string | null;
    whatsapp_number: string | null;
  } | null;
};

export async function listProductsByStatus(query: AdminProductsQuery) {
  const supabase = createClient();
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;

  let builder = supabase
    .from("products")
    .select(
      "id, title, price_dzd, wilaya_code, status, view_count, created_at, categories!inner(slug), product_images(storage_path, position), profiles!seller_id(shop_name, full_name, whatsapp_number)",
      { count: "exact" },
    );

  if (query.status) builder = builder.eq("status", query.status);

  builder = builder.order("created_at", { ascending: false }).order("id");

  const { data, error, count } = await builder.range(from, to);
  if (error) throw error;

  const rows = (data ?? []) as unknown as AdminProductRow[];
  const items = rows.map((row) => {
    const first = [...row.product_images].sort(
      (a, b) => a.position - b.position,
    )[0];
    return {
      id: row.id,
      title: row.title,
      priceDzd: row.price_dzd,
      wilayaCode: row.wilaya_code,
      status: row.status,
      viewCount: row.view_count,
      createdAt: row.created_at,
      categorySlug: row.categories.slug,
      imageUrl: first
        ? supabase.storage
            .from(IMAGE_BUCKET)
            .getPublicUrl(first.storage_path).data.publicUrl
        : null,
      shopName: row.profiles?.shop_name ?? row.profiles?.full_name ?? null,
      sellerWhatsapp: row.profiles?.whatsapp_number ?? null,
    };
  });

  return { items, total: count ?? items.length };
}

export async function updateProductStatus(
  id: string,
  status: "approved" | "rejected",
) {
  // Admin moderation: use the service role client to bypass RLS and
  // column grants (status is server-controlled per the schema).
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .update({ status })
    .eq("id", id)
    .select("id, title, status")
    .maybeSingle();

  if (error) throw error;
  return data;
}