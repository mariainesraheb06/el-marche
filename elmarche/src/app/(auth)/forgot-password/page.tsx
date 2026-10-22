import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/server/actions/password";

export const metadata = { title: "Mot de passe oublié — El Marché" };

const ERRORS: Record<string, string> = {
  invalid_email: "Adresse e-mail invalide.",
  rate_limited: "Trop de demandes. Réessayez dans quelques minutes.",
  expired: "Ce lien a expiré ou est invalide. Demandez-en un nouveau.",
};

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string; sent?: string };
}) {
  const error = searchParams.error ? ERRORS[searchParams.error] : undefined;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <div className="space-y-1 text-center">
        <h1 className="text-3xl font-bold text-primary">Mot de passe oublié</h1>
        <p className="text-muted-foreground">
          Entrez votre e-mail, nous vous enverrons un lien pour le réinitialiser.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {searchParams.sent && (
        <p className="rounded-lg bg-primary/10 p-3 text-sm text-primary">
          Si un compte existe pour cette adresse, un e-mail vient d&apos;être envoyé. Pensez à
          vérifier vos spams.
        </p>
      )}

      <form action={requestPasswordReset} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Adresse e-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <Button type="submit" className="w-full">
          Envoyer le lien
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary underline">
          Retour à la connexion
        </Link>
      </p>
    </main>
  );
}