import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/lib/api/http";
import { productsQuerySchema } from "@/lib/validators/products";
import { getCurrentUserId } from "@/server/auth";
import { searchProducts } from "@/server/services/products";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const params: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    if (value !== "") params[key] = value;
  });

  const parsed = productsQuerySchema.safeParse(params);
  if (!parsed.success) {
    return apiError("validation_error", "Paramètres de recherche invalides.");
  }

  try {
    const userId = await getCurrentUserId();
    const result = await searchProducts(parsed.data, userId);
    return NextResponse.json(result);
  } catch {
    return apiError("internal_error", "Une erreur est survenue. Réessayez plus tard.");
  }
}