import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/http";
import { productIdSchema } from "@/lib/validators/products";
import { getProduct } from "@/server/services/products";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const parsedId = productIdSchema.safeParse(params.id);
  if (!parsedId.success) {
    return apiError("validation_error", "Identifiant de produit invalide.");
  }

  try {
    const product = await getProduct(parsedId.data);
    if (!product) return apiError("not_found", "Produit introuvable.");
    return NextResponse.json(product);
  } catch {
    return apiError("internal_error", "Une erreur est survenue. Réessayez plus tard.");
  }
}