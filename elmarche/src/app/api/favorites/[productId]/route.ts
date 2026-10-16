import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/http";
import { productIdSchema } from "@/lib/validators/products";
import { errorResponse } from "@/server/errors";
import { addMyFavorite, removeMyFavorite } from "@/server/services/favorites";

export const dynamic = "force-dynamic";

type Context = { params: { productId: string } };

export async function PUT(_request: Request, { params }: Context) {
  const id = productIdSchema.safeParse(params.productId);
  if (!id.success) {
    return apiError("validation_error", "Identifiant de produit invalide.");
  }

  try {
    await addMyFavorite(id.data);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const id = productIdSchema.safeParse(params.productId);
  if (!id.success) {
    return apiError("validation_error", "Identifiant de produit invalide.");
  }

  try {
    await removeMyFavorite(id.data);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}