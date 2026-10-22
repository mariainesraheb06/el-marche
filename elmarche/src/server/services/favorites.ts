import { ServiceError } from "@/server/errors";
import { getCurrentUserId } from "@/server/auth";
import {
  deleteFavorite,
  insertFavorite,
  insertFavoriteEvent,
  listFavoriteProducts,
  productExists,
} from "@/server/repositories/favorites";
import type { ProductSummary } from "@/types/api";

export async function listMyFavorites(): Promise<ProductSummary[]> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new ServiceError("unauthorized", "Connexion requise.");
  }
  return listFavoriteProducts(userId);
}

export async function addMyFavorite(productId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new ServiceError("unauthorized", "Connexion requise.");
  }

  const exists = await productExists(productId);
  if (!exists) {
    throw new ServiceError("not_found", "Produit introuvable.");
  }

  await insertFavorite(userId, productId);

  // Best effort: log the favorite event for the recommender. Never fail the request.
  try {
    await insertFavoriteEvent(userId, productId);
  } catch (err) {
    console.warn("[favorites] failed to log favorite event:", err);
  }
}

export async function removeMyFavorite(productId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new ServiceError("unauthorized", "Connexion requise.");
  }
  await deleteFavorite(userId, productId);
}