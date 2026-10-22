import { z } from "zod";
import { isValidWilayaCode } from "@/lib/constants/wilayas";

export const productsQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  wilaya: z.coerce.number().int().refine(isValidWilayaCode, "invalid wilaya").optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "popular"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type ProductsQuery = z.infer<typeof productsQuerySchema>;

export const productIdSchema = z.string().uuid();