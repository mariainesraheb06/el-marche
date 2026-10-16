import { NextResponse } from "next/server";
import { apiError } from "@/lib/api/http";
import { errorResponse } from "@/server/errors";
import { updateProfileSchema } from "@/lib/validators/profile";
import { getMyProfile, updateMyProfile } from "@/server/services/profile";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profile = await getMyProfile();
    return NextResponse.json(profile);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("validation_error", "Corps de requête invalide.");
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("validation_error", "Données invalides.");
  }

  try {
    const profile = await updateMyProfile(parsed.data);
    return NextResponse.json(profile);
  } catch (error) {
    return errorResponse(error);
  }
}