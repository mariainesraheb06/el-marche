import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/http";
import { createProductSchema } from "@/lib/validators/seller-products";
import { getCurrentUserId } from "@/server/auth";
import { errorResponse } from "@/server/errors";
import { createSellerProduct, listSellerProducts } from "@/server/services/seller-products";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return apiError("unauthorized", "Connexion requise.");

  try {
    const items = await listSellerProducts(userId);
    return NextResponse.json({ items });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return apiError("unauthorized", "Connexion requise.");

  const body = await request.json().catch(() => null);
  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("validation_error", "Vérifiez les informations du produit.");
  }

  try {
    const result = await createSellerProduct(userId, parsed.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}