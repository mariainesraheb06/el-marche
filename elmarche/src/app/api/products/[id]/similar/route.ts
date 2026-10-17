import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/http";
import { productIdSchema } from "@/lib/validators/products";
import { getSimilarProducts } from "@/server/services/products";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const parsedId = productIdSchema.safeParse(params.id);
  if (!parsedId.success) {
    return apiError("validation_error", "Identifiant de produit invalide.");
  }

  try {
    const items = await getSimilarProducts(parsedId.data);
    return NextResponse.json({ items });
  } catch {
    return apiError("internal_error", "Une erreur est survenue. Réessayez plus tard.");
  }
}