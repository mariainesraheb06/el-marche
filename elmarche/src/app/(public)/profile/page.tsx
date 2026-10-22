import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/server/actions/auth";

export const metadata = { title: "Profil — El Marché" };
export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  buyer: "Acheteur",
  seller: "Vendeur",
  admin: "Administrateur",
};

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <section className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-bold">Profil</h1>

      <div className="space-y-1 rounded-2xl border bg-card p-4">
        <p className="font-semibold">{profile?.full_name ?? "Utilisateur"}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <p className="text-sm text-primary">{ROLE_LABELS[profile?.role ?? "buyer"]}</p>
      </div>

      {(profile?.role === "seller" || profile?.role === "admin") && (
        <Button asChild className="w-full">
          <Link href="/dashboard">Mon tableau de bord</Link>
        </Button>
      )}

      <form action={logout}>
        <Button type="submit" variant="outline" className="w-full">
          Se déconnecter
        </Button>
      </form>
    </section>
  );
}
