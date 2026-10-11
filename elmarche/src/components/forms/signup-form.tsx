"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WILAYAS } from "@/lib/constants/wilayas";
import { cn } from "@/lib/utils";
import { signup } from "@/server/actions/auth";

type Role = "buyer" | "seller";

const ROLES: { value: Role; label: string }[] = [
  { value: "buyer", label: "Acheteur" },
  { value: "seller", label: "Vendeur" },
];

const fieldClass = "h-12 rounded-xl bg-card";

export function SignupForm({ error }: { error?: string }) {
  const [role, setRole] = useState<Role>("buyer");

  return (
    <form action={signup} className="space-y-4">
      <input type="hidden" name="role" value={role} />

      <div
        role="group"
        aria-label="Type de compte"
        className="grid grid-cols-2 gap-1 rounded-xl border bg-card p-1"
      >
        {ROLES.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={role === item.value}
            onClick={() => setRole(item.value)}
            className={cn(
              "h-10 rounded-lg text-sm font-semibold transition-colors",
              role === item.value ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName">Nom complet</Label>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          placeholder="Ex : Mohamed Benali"
          required
          minLength={2}
          className={fieldClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Ex : mohamed@gmail.com"
          required
          className={fieldClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="8 caractères minimum"
          required
          minLength={8}
          className={fieldClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="wilaya">Wilaya de résidence</Label>
        <select
          id="wilaya"
          name="wilaya"
          defaultValue="16"
          required
          className="h-12 w-full rounded-xl border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          {WILAYAS.map((wilaya) => (
            <option key={wilaya.code} value={wilaya.code}>
              {wilaya.code} - {wilaya.name}
            </option>
          ))}
        </select>
      </div>

      {role === "seller" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="shopName">Nom de la boutique</Label>
            <Input
              id="shopName"
              name="shopName"
              placeholder="Ex : Alger Streetwear"
              required
              minLength={2}
              maxLength={80}
              className={fieldClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">Numéro WhatsApp</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Ex : 0551 23 45 67"
              required
              className={fieldClass}
            />
            <p className="text-xs text-muted-foreground">
              Les acheteurs vous contacteront sur ce numéro.
            </p>
          </div>
        </>
      )}

      <Button type="submit" size="lg" className="w-full rounded-xl">
        S&apos;inscrire
      </Button>
    </form>
  );
}