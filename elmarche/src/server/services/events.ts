import { createClient } from "@/lib/supabase/server";
import type { ProductEventInput } from "@/lib/validators/events";

export async function logProductEvent(input: ProductEventInput): Promise<void> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const { error } = await supabase.from("product_views").insert({
    user_id: user.id,
    product_id: input.productId,
    event_type: input.eventType,
  });

  if (error) {
    throw new Error(`DB_ERROR: ${error.message}`);
  }
}