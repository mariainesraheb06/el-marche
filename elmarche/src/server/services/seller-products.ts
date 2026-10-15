import {
  isValidImagePath,
  type CreateProductInput,
  type UpdateProductInput,
} from "@/lib/validators/seller-products";
import { ServiceError } from "@/server/errors";
import {
  deleteProductRow,
  getOwnProduct,
  getSellerProfile,
  insertProduct,
  insertProductImages,
  listOwnProducts,
  listProductImagePaths,
  removeStorageFiles,
  updateProductRow,
} from "@/server/repositories/seller-products";

async function requireSeller(userId: string) {
  const profile = await getSellerProfile(userId);
  if (!profile || (profile.role !== "seller" && profile.role !== "admin")) {
    throw new ServiceError("forbidden", "Cette action est réservée aux vendeurs.");
  }
  return profile;
}

export async function listSellerProducts(userId: string) {
  await requireSeller(userId);
  return listOwnProducts(userId);
}

export async function getSellerProduct(userId: string, id: string) {
  await requireSeller(userId);
  return getOwnProduct(userId, id);
}

export async function createSellerProduct(userId: string, input: CreateProductInput) {
  const profile = await requireSeller(userId);
  if (!profile.whatsapp_number) {
    throw new ServiceError(
      "forbidden",
      "Ajoutez votre numéro WhatsApp à votre profil avant de publier.",
    );
  }

  const unique = new Set(input.imagePaths);
  if (unique.size !== input.imagePaths.length) {
    throw new ServiceError("validation_error", "Photos en double.");
  }
  if (!input.imagePaths.every((path) => isValidImagePath(path, userId))) {
    throw new ServiceError("validation_error", "Photos invalides.");
  }

  const productId = await insertProduct(userId, input);
  try {
    await insertProductImages(productId, input.imagePaths);
  } catch (error) {
    // Do not leave a listing without photos behind.
    await deleteProductRow(userId, productId).catch(() => undefined);
    throw error;
  }
  return { id: productId };
}

export async function updateSellerProduct(userId: string, id: string, patch: UpdateProductInput) {
  await requireSeller(userId);
  const updated = await updateProductRow(userId, id, patch);
  if (!updated) throw new ServiceError("not_found", "Produit introuvable.");
  return { id };
}

export async function deleteSellerProduct(userId: string, id: string) {
  await requireSeller(userId);
  const paths = await listProductImagePaths(id);

  const deleted = await deleteProductRow(userId, id);
  if (!deleted) throw new ServiceError("not_found", "Produit introuvable.");

  // Removing the files is best effort: the listing is already gone.
  if (paths.length > 0) {
    await removeStorageFiles(paths).catch(() => undefined);
  }
}