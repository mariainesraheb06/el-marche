"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.string().trim().email().max(200);
const passwordSchema = z
  .object({
    password: z.string().min(8).max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm);

export async function requestPasswordReset(formData: FormData) {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) redirect("/forgot-password?error=invalid_email");

  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${proto}://${host}/auth/callback?next=/reset-password`,
  });
  if (error?.status === 429) redirect("/forgot-password?error=rate_limited");

  // Same answer whether or not the account exists.
  redirect("/forgot-password?sent=1");
}

export async function updatePassword(formData: FormData) {
  const parsed = passwordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) redirect("/reset-password?error=invalid_password");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/forgot-password?error=expired");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) redirect("/reset-password?error=update_failed");

  await supabase.auth.signOut();
  redirect("/login?message=password_updated");
}