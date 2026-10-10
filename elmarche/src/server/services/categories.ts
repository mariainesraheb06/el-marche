import { listCategories } from "@/server/repositories/categories";

export async function getCategories() {
  return listCategories();
}