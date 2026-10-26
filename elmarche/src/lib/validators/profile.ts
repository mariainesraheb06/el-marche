import { z } from "zod";
import { isValidWilayaCode } from "@/lib/constants/wilayas";
import { normalizePhone } from "@/lib/phone";

const whatsappSchema = z
  .string()
  .refine((value) => normalizePhone(value) !== null, {
    message: "Numéro WhatsApp invalide.",
  })
  .transform((value) => normalizePhone(value) as string);

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2).max(80).optional(),
    whatsappNumber: whatsappSchema.optional(),
    shopName: z.string().trim().min(2).max(80).optional(),
    wilayaCode: z.coerce.number().int().refine(isValidWilayaCode).optional(),
    avatarUrl: z
      .string()
      .url()
      .max(500)
      .refine((value) => value.includes("/storage/v1/object/public/avatars/"))
      .optional(),
  })
  .refine(
    (data) =>
      data.fullName !== undefined ||
      data.whatsappNumber !== undefined ||
      data.shopName !== undefined ||
      data.wilayaCode !== undefined ||
      data.avatarUrl !== undefined,
    { message: "Aucun champ à mettre à jour." },
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;