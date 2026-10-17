import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/http";
import { errorResponse } from "@/server/errors";
import { getCurrentUserId } from "@/server/auth";
import { productIdSchema } from "@/lib/validators/products";
import { adminProductStatusSchema } from "@/lib/validators/admin-products";
import { setAdminProductStatus } from "@/server/services/admin-products";

export const dynamic = "force-dynamic";

type Context = { params: { id: string } };

export async function PATCH(request: Request, { params }: Context) {
  const userId = await getCurrentUserId();
  if (!userId) return apiError("unauthorized", "Connexion requise.");

  const id = productIdSchema.safeParse(params.id);
  if (!id.success) {
    return apiError("validation_error", "Identifiant de produit invalide.");
  }

  const body = await request.json().catch(() => null);
  const parsed = adminProductStatusSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("validation_error", "Statut invalide.");
  }

  try {
    const result = await setAdminProductStatus(userId, id.data, parsed.data.status);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}