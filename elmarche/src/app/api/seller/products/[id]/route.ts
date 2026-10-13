import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/http";
import { updateProductSchema } from "@/lib/validators/seller-products";
import { productIdSchema } from "@/lib/validators/products";
import { getCurrentUserId } from "@/server/auth";
import { errorResponse } from "@/server/errors";
import { deleteSellerProduct, updateSellerProduct } from "@/server/services/seller-products";

export const dynamic = "force-dynamic";

type Context = { params: { id: string } };

export async function PATCH(request: Request, { params }: Context) {
  const userId = await getCurrentUserId();
  if (!userId) return apiError("unauthorized", "Connexion requise.");

  const id = productIdSchema.safeParse(params.id);
  if (!id.success) return apiError("validation_error", "Identifiant de produit invalide.");

  const body = await request.json().catch(() => null);
  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("validation_error", "Vérifiez les informations du produit.");
  }

  try {
    const result = await updateSellerProduct(userId, id.data, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const userId = await getCurrentUserId();
  if (!userId) return apiError("unauthorized", "Connexion requise.");

  const id = productIdSchema.safeParse(params.id);
  if (!id.success) return apiError("validation_error", "Identifiant de produit invalide.");

  try {
    await deleteSellerProduct(userId, id.data);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}