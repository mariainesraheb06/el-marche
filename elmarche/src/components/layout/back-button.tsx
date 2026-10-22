"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label="Retour"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallbackHref))}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-secondary"
    >
      <ChevronLeft className="h-6 w-6" aria-hidden />
    </button>
  );
}