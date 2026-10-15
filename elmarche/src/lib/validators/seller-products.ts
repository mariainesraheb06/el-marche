import { z } from "zod";
import { isValidWilayaCode } from "@/lib/constants/wilayas";

export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MIN_IMAGES = 3;
export const MAX_IMAGES = 5;

const fields = {
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(4000),
  priceDzd: z.coerce.number().int().positive().max(100_000_000),
  categoryId: z.coerce.number().int().positive(),
  wilayaCode: z.coerce.number().int().refine(isValidWilayaCode, "invalid wilaya"),
  tags: z.array(z.string().trim().min(1).max(30)).max(10),
};

export const createProductSchema = z.object({
  ...fields,
  tags: fields.tags.default([]),
  imagePaths: z.array(z.string()).min(MIN_IMAGES).max(MAX_IMAGES),
});

export const updateProductSchema = z
  .object(fields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, "empty update");

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// Stored images must live in the seller's own folder: {userId}/{uuid}.{jpg|jpeg|png|webp}
export function isValidImagePath(path: string, userId: string): boolean {
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return false;
  const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
  const pattern = new RegExp(`^${userId}/${uuid}\\.(${ALLOWED_IMAGE_EXTENSIONS.join("|")})$`, "i");
  return pattern.test(path);
}