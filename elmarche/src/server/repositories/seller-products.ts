import { createClient } from "@/lib/supabase/server";
import type { CreateProductInput, UpdateProductInput } from "@/lib/validators/seller-products";

const IMAGE_BUCKET = "product-images";

type ListRow = {
  id: string;
  title: string;
  price_dzd: number;
  wilaya_code: number;
  status: string;
  view_count: number;
  created_at: string;
  categories: { slug: string };
  product_images: { storage_path: string; position: number }[];
  profiles: { shop_name: string | null; full_name: string | null } | null;
};

export async function getSellerProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("role, whatsapp_number, shop_name, full_name, wilaya_code")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listOwnProducts(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, title, price_dzd, wilaya_code, status, view_count, created_at, categories!inner(slug), product_images(storage_path, position), profiles!seller_id(shop_name, full_name)",
    )
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as unknown as ListRow[];
  return rows.map((row) => {
    const first = [...row.product_images].sort((a, b) => a.position - b.position)[0];
    return {
      id: row.id,
      title: row.title,
      priceDzd: row.price_dzd,
      wilayaCode: row.wilaya_code,
      categorySlug: row.categories.slug,
      imageUrl: first
        ? supabase.storage.from(IMAGE_BUCKET).getPublicUrl(first.storage_path).data.publicUrl
        : null,
      shopName: row.profiles?.shop_name ?? row.profiles?.full_name ?? null,
      createdAt: row.created_at,
      status: row.status,
      viewCount: row.view_count,
    };
  });
}

export async function getOwnProduct(userId: string, id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("id, title, description, price_dzd, wilaya_code, tags, category_id, status")
    .eq("id", id)
    .eq("seller_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    priceDzd: data.price_dzd,
    wilayaCode: data.wilaya_code,
    tags: data.tags,
    categoryId: data.category_id,
    status: data.status,
  };
}

export async function insertProduct(userId: string, input: CreateProductInput): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      seller_id: userId,
      category_id: input.categoryId,
      title: input.title,
      description: input.description,
      price_dzd: input.priceDzd,
      wilaya_code: input.wilayaCode,
      tags: input.tags,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function insertProductImages(productId: string, paths: string[]) {
  const supabase = createClient();
  const { error } = await supabase.from("product_images").insert(
    paths.map((path, index) => ({
      product_id: productId,
      storage_path: path,
      position: index + 1,
    })),
  );
  if (error) throw error;
}

export async function updateProductRow(
  userId: string,
  id: string,
  patch: UpdateProductInput,
): Promise<boolean> {
  const columns = {
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.priceDzd !== undefined ? { price_dzd: patch.priceDzd } : {}),
    ...(patch.categoryId !== undefined ? { category_id: patch.categoryId } : {}),
    ...(patch.wilayaCode !== undefined ? { wilaya_code: patch.wilayaCode } : {}),
    ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
  };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .update(columns)
    .eq("id", id)
    .eq("seller_id", userId)
    .select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function deleteProductRow(userId: string, id: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("seller_id", userId)
    .select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function listProductImagePaths(productId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("product_images")
    .select("storage_path")
    .eq("product_id", productId);
  if (error) throw error;
  return (data ?? []).map((row) => row.storage_path);
}

export async function removeStorageFiles(paths: string[]) {
  const supabase = createClient();
  const { error } = await supabase.storage.from(IMAGE_BUCKET).remove(paths);
  if (error) throw error;
}