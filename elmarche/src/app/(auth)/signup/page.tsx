import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup } from "@/server/actions/auth";

export const metadata = { title: "Créer un compte — El Marché" };

const ERRORS: Record<string, string> = {
  invalid_input: "Vérifiez les informations saisies (mot de passe : 8 caractères minimum).",
  signup_failed: "Impossible de créer le compte. Cet e-mail est peut-être déjà utilisé.",
};

export default function SignupPage({ searchParams }: { searchParams: { error?: string } }) {
  const error = searchParams.error ? ERRORS[searchParams.error] : undefined;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <div className="space-y-1 text-center">
        <h1 className="text-3xl font-bold text-primary">Créer un compte</h1>
        <p className="font-script text-2xl text-accent">Tout l&apos;Algérie, en un seul endroit</p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <form action={signup} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom complet</Label>
          <Input id="fullName" name="fullName" autoComplete="name" required minLength={2} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Adresse e-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Je suis</legend>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-card p-3 text-sm has-[:checked]:border-primary">
              <input type="radio" name="role" value="buyer" defaultChecked /> Acheteur
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border bg-card p-3 text-sm has-[:checked]:border-primary">
              <input type="radio" name="role" value="seller" /> Vendeur
            </label>
          </div>
        </fieldset>
        <Button type="submit" className="w-full">
          Créer mon compte
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-primary underline">
          Se connecter
        </Link>
      </p>
    </main>
  );
}