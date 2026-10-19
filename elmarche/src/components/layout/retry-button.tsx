"use client";

import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Re-runs the server component of the current route.
 *
 * A plain <Link href="/favorites"> cannot be used for this: navigating to the URL
 * you are already on is a no-op for the client router, so the server component
 * would not run again and the error screen would stay visible.
 */
export function RetryButton() {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => router.refresh()}
      aria-label="Réessayer le chargement"
      className="h-12 w-full rounded-2xl border-primary text-primary"
    >
      <RotateCcw className="h-4 w-4" aria-hidden />
      Réessayer
    </Button>
  );
}