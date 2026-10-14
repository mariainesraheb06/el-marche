import { z } from "zod";

export const productEventSchema = z.object({
  productId: z.string().uuid("Identifiant de produit invalide."),
  eventType: z.literal("view"),
});

export type ProductEventInput = z.infer<typeof productEventSchema>;