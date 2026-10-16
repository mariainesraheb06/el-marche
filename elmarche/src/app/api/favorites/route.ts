import { NextResponse } from "next/server";
import { errorResponse } from "@/server/errors";
import { listMyFavorites } from "@/server/services/favorites";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await listMyFavorites();
    return NextResponse.json({ items });
  } catch (error) {
    return errorResponse(error);
  }
}