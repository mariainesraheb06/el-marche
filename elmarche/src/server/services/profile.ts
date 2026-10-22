import { ServiceError } from "@/server/errors";
import { getCurrentUserId } from "@/server/auth";
import {
  getProfileById,
  updateProfileById,
  type Profile,
} from "@/server/repositories/profiles";
import type { UpdateProfileInput } from "@/lib/validators/profile";

export async function getMyProfile(): Promise<Profile> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new ServiceError("unauthorized", "Vous devez être connecté.");
  }

  const profile = await getProfileById(userId);
  if (!profile) {
    throw new ServiceError("not_found", "Profil introuvable.");
  }
  return profile;
}

export async function updateMyProfile(
  input: UpdateProfileInput,
): Promise<Profile> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new ServiceError("unauthorized", "Vous devez être connecté.");
  }

  const updates: Record<string, string | number> = {};
  if (input.fullName !== undefined) updates.full_name = input.fullName;
  if (input.whatsappNumber !== undefined)
    updates.whatsapp_number = input.whatsappNumber;
  if (input.shopName !== undefined) updates.shop_name = input.shopName;
  if (input.wilayaCode !== undefined) updates.wilaya_code = input.wilayaCode;

  const updated = await updateProfileById(userId, updates);
  if (!updated) {
    throw new ServiceError("not_found", "Profil introuvable.");
  }
  return updated;
}