import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ProfileForm } from "@/components/forms/profile-form";
import { createClient } from "@/lib/supabase/server";
import { getProfileById } from "@/server/repositories/profiles";
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

  const profile = await getProfileById(user.id);
  const role = profile?.role ?? "buyer";

  return (
    <section className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-bold">Profil</h1>

      <div className="space-y-1 rounded-2xl border bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <p className="text-sm font-semibold text-primary">{ROLE_LABELS[role]}</p>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <ProfileForm
          userId={user.id}
          role={role}
          fullName={profile?.fullName ?? ""}
          whatsappNumber={profile?.whatsappNumber ?? ""}
          shopName={profile?.shopName ?? ""}
          wilayaCode={profile?.wilayaCode ?? null}
          avatarUrl={profile?.avatarUrl ?? null}
        />
      </div>

      {(role === "seller" || role === "admin") && (
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