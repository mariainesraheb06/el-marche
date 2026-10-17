import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/http";
import { errorResponse } from "@/server/errors";
import { getCurrentUserId } from "@/server/auth";
import { adminProductsQuerySchema } from "@/lib/validators/admin-products";
import { listAdminProducts } from "@/server/services/admin-products";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return apiError("unauthorized", "Connexion requise.");

  const url = new URL(request.url);
  const parsed = adminProductsQuerySchema.safeParse({
    status: url.searchParams.get("status") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  });

  if (!parsed.success) {
    return apiError("validation_error", "Paramètres invalides.");
  }

  try {
    const result = await listAdminProducts(userId, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}