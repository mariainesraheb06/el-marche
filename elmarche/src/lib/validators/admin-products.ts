import { z } from "zod";

export const adminProductStatusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

export type AdminProductStatusInput = z.infer<typeof adminProductStatusSchema>;

export const adminProductsQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type AdminProductsQuery = z.infer<typeof adminProductsQuerySchema>;