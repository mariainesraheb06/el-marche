import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: "buyer" | "seller" | "admin";
  whatsapp_number: string | null;
  shop_name: string | null;
  wilaya_code: number | null;
};

export type Profile = {
  id: string;
  fullName: string | null;
  role: "buyer" | "seller" | "admin";
  whatsappNumber: string | null;
  shopName: string | null;
  wilayaCode: number | null;
};

function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    role: row.role,
    whatsappNumber: row.whatsapp_number,
    shopName: row.shop_name,
    wilayaCode: row.wilaya_code,
  };
}

const SELECT_FIELDS =
  "id, full_name, role, whatsapp_number, shop_name, wilaya_code";

export async function getProfileById(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(SELECT_FIELDS)
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToProfile(data as unknown as ProfileRow);
}

export async function updateProfileById(
  userId: string,
  updates: {
    full_name?: string;
    whatsapp_number?: string;
    shop_name?: string;
    wilaya_code?: number;
  },
): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select(SELECT_FIELDS)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToProfile(data as unknown as ProfileRow);
}