import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";
import { updatePassword } from "@/server/actions/password";

export const metadata = { title: "Nouveau mot de passe — El Marché" };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  invalid_password:
    "Le mot de passe doit contenir au moins 8 caractères et les deux champs doivent être identiques.",
  update_failed: "Impossible de modifier le mot de passe. Essayez-en un autre.",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/forgot-password?error=expired");

  const error = searchParams.error ? ERRORS[searchParams.error] : undefined;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <div className="space-y-1 text-center">
        <h1 className="text-3xl font-bold text-primary">Nouveau mot de passe</h1>
        <p className="text-muted-foreground">Choisissez un mot de passe d&apos;au moins 8 caractères.</p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <form action={updatePassword} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmer le mot de passe</Label>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        </div>
        <Button type="submit" className="w-full">
          Enregistrer
        </Button>
      </form>
    </main>
  );
}