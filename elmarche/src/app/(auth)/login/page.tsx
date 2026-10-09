import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/server/actions/auth";

export const metadata = { title: "Connexion — El Marché" };

const ERRORS: Record<string, string> = {
  invalid_credentials: "E-mail ou mot de passe incorrect.",
  invalid_input: "Vérifiez les informations saisies.",
};
const MESSAGES: Record<string, string> = {
  check_email: "Compte créé ! Confirmez votre adresse e-mail, puis connectez-vous.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string; next?: string };
}) {
  const error = searchParams.error ? ERRORS[searchParams.error] : undefined;
  const message = searchParams.message ? MESSAGES[searchParams.message] : undefined;
  const next = searchParams.next ?? "/";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <div className="space-y-1 text-center">
        <h1 className="text-3xl font-bold text-primary">Connexion</h1>
        <p className="text-muted-foreground">Content de vous revoir sur El Marché.</p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {message && <p className="rounded-lg bg-primary/10 p-3 text-sm text-primary">{message}</p>}

      <form action={login} className="space-y-4">
        <input type="hidden" name="next" value={next} />
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
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" className="w-full">
          Se connecter
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="font-medium text-primary underline">
          Créer un compte
        </Link>
      </p>
    </main>
  );
}