import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/http";
import { productEventSchema } from "@/lib/validators/events";
import { logProductEvent } from "@/server/services/events";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("validation_error", "Corps de requête invalide.");
  }

  const parsed = productEventSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("validation_error", "Données invalides.");
  }

  try {
    await logProductEvent(parsed.data);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      return apiError("unauthorized", "Vous devez être connecté.");
    }
    return apiError("internal_error", "Une erreur est survenue. Réessayez plus tard.");
  }
}