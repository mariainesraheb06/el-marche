import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/server/actions/auth";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-4xl font-bold text-primary">El Marché</h1>
      <p className="font-script text-2xl text-accent">Tout l&apos;Algérie, en un seul endroit</p>

      {user ? (
        <form action={logout} className="flex flex-col items-center gap-2">
          <p className="text-sm text-muted-foreground">Connecté : {user.email}</p>
          <Button type="submit" variant="outline">
            Se déconnecter
          </Button>
        </form>
      ) : (
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/login">Se connecter</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/signup">Créer un compte</Link>
          </Button>
        </div>
      )}
    </main>
  );
}