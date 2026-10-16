import { NextResponse } from "next/server";
import { errorResponse } from "@/server/errors";
import { createClient } from "@/lib/supabase/server";
import { getRecommendedProducts } from "@/server/services/recommendations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const items = await getRecommendedProducts(user?.id ?? null);

    return NextResponse.json({ items });
  } catch (error) {
    return errorResponse(error);
  }
}