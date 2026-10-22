import { createClient } from "@/lib/supabase/server";

export async function listCategories() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name")
    .order("sort_order");

  if (error) throw error;
  return data;
}