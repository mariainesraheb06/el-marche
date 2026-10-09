import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-4xl font-bold text-primary">El Marché</h1>
      <p className="font-script text-2xl text-accent">Tout l&apos;Algérie, en un seul endroit</p>
      <Button>Découvrir le marché</Button>
    </main>
  );
}