import { ServiceError } from "@/server/errors";
import { getProfileById } from "@/server/repositories/profiles";
import {
  listProductsByStatus,
  updateProductStatus,
} from "@/server/repositories/admin-products";
import type { AdminProductsQuery } from "@/lib/validators/admin-products";

async function requireAdmin(userId: string) {
  const profile = await getProfileById(userId);
  if (!profile || profile.role !== "admin") {
    throw new ServiceError("forbidden", "Cette action est réservée aux administrateurs.");
  }
  return profile;
}

export async function listAdminProducts(userId: string, query: AdminProductsQuery) {
  await requireAdmin(userId);
  return listProductsByStatus(query);
}

export async function setAdminProductStatus(
  userId: string,
  id: string,
  status: "approved" | "rejected",
) {
  await requireAdmin(userId);
  try {
    const updated = await updateProductStatus(id, status);
    if (!updated) {
      throw new ServiceError("not_found", "Produit introuvable.");
    }
    return updated;
  } catch (err) {
    console.error("[admin-products] PATCH failed:", err);
    throw err;
  }
}