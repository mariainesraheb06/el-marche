import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { SignupForm } from "@/components/forms/signup-form";

export const metadata = { title: "Créer un compte — El Marché" };

const FIELD_ERRORS: Record<string, string> = {
  fullName: "Entrez votre nom complet.",
  email: "Adresse e-mail invalide.",
  password: "Mot de passe : 8 caractères minimum.",
  wilaya: "Choisissez votre wilaya.",
  shopName: "Entrez le nom de votre boutique.",
  whatsapp: "Numéro WhatsApp invalide. Exemple : 0551 23 45 67 ou +213 551 23 45 67.",
};

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string; field?: string };
}) {
  let error: string | undefined;
  if (searchParams.error === "signup_failed") {
    error = "Impossible de créer le compte. Cet e-mail est peut-être déjà utilisé.";
  } else if (searchParams.error === "invalid_input") {
    error = FIELD_ERRORS[searchParams.field ?? ""] ?? "Vérifiez les informations saisies.";
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 p-6">
      <Logo />
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Créer un compte</h1>
        <p className="text-muted-foreground">
          Rejoignez la communauté d&apos;achat local en Algérie
        </p>
      </div>

      <SignupForm error={error} />

      <p className="pb-6 text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-semibold text-primary underline">
          Se connecter
        </Link>
      </p>
    </main>
  );
}