"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarUploader } from "@/components/forms/avatar-uploader";
import { wilayaName } from "@/lib/constants/wilayas";

type Props = {
  userId: string;
  role: "buyer" | "seller" | "admin";
  fullName: string;
  whatsappNumber: string;
  shopName: string;
  wilayaCode: number | null;
  avatarUrl: string | null;
};

const WILAYAS = Array.from({ length: 58 }, (_, i) => i + 1)
  .map((code) => ({ code, name: wilayaName(code) }))
  .filter((w): w is { code: number; name: string } => Boolean(w.name));

export function ProfileForm(props: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState(props.fullName);
  const [whatsapp, setWhatsapp] = useState(props.whatsappNumber);
  const [shopName, setShopName] = useState(props.shopName);
  const [wilaya, setWilaya] = useState(props.wilayaCode ? String(props.wilayaCode) : "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const isSeller = props.role === "seller" || props.role === "admin";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    // Only send filled fields: the API rejects empty values.
    const body: Record<string, string | number> = {};
    if (fullName.trim()) body.fullName = fullName.trim();
    if (whatsapp.trim()) body.whatsappNumber = whatsapp.trim();
    if (isSeller && shopName.trim()) body.shopName = shopName.trim();
    if (wilaya) body.wilayaCode = Number(wilaya);

    if (Object.keys(body).length === 0) {
      setMessage({ type: "error", text: "Rien à enregistrer." });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setMessage({
          type: "error",
          text: "Vérifiez les champs (nom d'au moins 2 caractères, numéro WhatsApp valide).",
        });
        return;
      }
      setMessage({ type: "ok", text: "Profil mis à jour." });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Connexion impossible. Réessayez." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <AvatarUploader
        userId={props.userId}
        name={fullName || "?"}
        initialUrl={props.avatarUrl}
        onUploaded={() => router.refresh()}
      />

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nom complet</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={80}
            autoComplete="name"
          />
        </div>

        {isSeller && (
          <div className="space-y-2">
            <Label htmlFor="shopName">Nom de la boutique</Label>
            <Input
              id="shopName"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              maxLength={80}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="whatsapp">Numéro WhatsApp</Label>
          <Input
            id="whatsapp"
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="0555 12 34 56"
            autoComplete="tel"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="wilaya">Wilaya</Label>
          <select
            id="wilaya"
            value={wilaya}
            onChange={(e) => setWilaya(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Choisir une wilaya</option>
            {WILAYAS.map((w) => (
              <option key={w.code} value={w.code}>
                {w.code} · {w.name}
              </option>
            ))}
          </select>
        </div>

        {message && (
          <p
            role={message.type === "error" ? "alert" : "status"}
            className={
              message.type === "ok"
                ? "rounded-lg bg-primary/10 p-3 text-sm text-primary"
                : "rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
            }
          >
            {message.text}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </form>
    </div>
  );
}