"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteProductButton({ productId, title }: { productId: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!window.confirm(`Supprimer « ${title} » ? Cette action est définitive.`)) return;

    setBusy(true);
    try {
      const response = await fetch(`/api/seller/products/${productId}`, { method: "DELETE" });
      if (!response.ok && response.status !== 404) throw new Error("delete failed");
      router.refresh();
    } catch {
      window.alert("Impossible de supprimer le produit. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={busy}
      aria-label={`Supprimer ${title}`}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive disabled:opacity-60"
    >
      <Trash2 className="h-4 w-4" aria-hidden />
    </button>
  );
}