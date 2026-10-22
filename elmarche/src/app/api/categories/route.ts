import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/http";
import { getCategories } from "@/server/services/categories";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await getCategories();
    return NextResponse.json({ items });
  } catch {
    return apiError("internal_error", "Une erreur est survenue. Réessayez plus tard.");
  }
}