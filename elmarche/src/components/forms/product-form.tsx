"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PhotoPicker, type Photo } from "@/components/forms/photo-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WILAYAS } from "@/lib/constants/wilayas";
import { createClient } from "@/lib/supabase/client";
import { MAX_IMAGE_BYTES, MAX_IMAGES, MIN_IMAGES } from "@/lib/validators/seller-products";

const BUCKET = "product-images";
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const selectClass =
  "h-12 w-full rounded-xl border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring";
const inputClass = "h-12 rounded-xl bg-card";

type Initial = {
  title: string;
  description: string;
  priceDzd: number;
  categoryId: number;
  wilayaCode: number;
  tags: string[];
};

type ProductFormProps = {
  mode: "create" | "edit";
  userId: string;
  productId?: string;
  categories: { id: number; name: string }[];
  defaultWilaya: number;
  initial?: Initial;
};

export function ProductForm({
  mode,
  userId,
  productId,
  categories,
  defaultWilaya,
  initial,
}: ProductFormProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const photosRef = useRef<Photo[]>([]);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(
    () => () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.preview));
    },
    [],
  );

  function addFiles(files: File[]) {
    setError(null);
    const accepted: Photo[] = [];
    let rejected = false;

    for (const file of files) {
      if (photos.length + accepted.length >= MAX_IMAGES) {
        rejected = true;
        break;
      }
      if (!EXTENSIONS[file.type] || file.size > MAX_IMAGE_BYTES) {
        rejected = true;
        continue;
      }
      accepted.push({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) });
    }

    if (rejected) {
      setError(
        "Certaines photos ont été ignorées : formats JPG, PNG ou WebP, 5 Mo maximum, 5 photos au total.",
      );
    }
    if (accepted.length > 0) setPhotos((current) => [...current, ...accepted]);
  }

  function removePhoto(id: string) {
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return current.filter((photo) => photo.id !== id);
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (mode === "create" && photos.length < MIN_IMAGES) {
      setError("Ajoutez au moins 3 photos.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const fields = {
      title: String(form.get("title") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
      priceDzd: Number(form.get("price")),
      categoryId: Number(form.get("category")),
      wilayaCode: Number(form.get("wilaya")),
      tags: String(form.get("tags") ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    setSubmitting(true);
    const supabase = createClient();
    const uploaded: string[] = [];

    try {
      let response: Response;

      if (mode === "create") {
        for (const photo of photos) {
          const path = `${userId}/${crypto.randomUUID()}.${EXTENSIONS[photo.file.type]}`;
          const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(path, photo.file, { contentType: photo.file.type });
          if (uploadError) throw new Error("Impossible d'envoyer les photos. Réessayez.");
          uploaded.push(path);
        }
        response = await fetch("/api/seller/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...fields, imagePaths: uploaded }),
        });
      } else {
        response = await fetch(`/api/seller/products/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        });
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Impossible d'enregistrer le produit.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (caught) {
      if (uploaded.length > 0) {
        // Do not leave orphan photos behind when the listing was not created.
        await supabase.storage
          .from(BUCKET)
          .remove(uploaded)
          .catch(() => undefined);
      }
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "create" && (
        <PhotoPicker
          photos={photos}
          max={MAX_IMAGES}
          disabled={submitting}
          onAdd={addFiles}
          onRemove={removePhoto}
        />
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Titre du produit *</Label>
        <Input
          id="title"
          name="title"
          defaultValue={initial?.title}
          placeholder="Ex : Tapis berbère tissé main"
          required
          minLength={3}
          maxLength={120}
          className={inputClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description du produit *</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initial?.description}
          placeholder="Décrivez l'histoire, les matériaux et les dimensions de votre produit…"
          rows={5}
          required
          minLength={10}
          maxLength={4000}
          className="rounded-xl bg-card"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="price">Prix (DZD) *</Label>
          <Input
            id="price"
            name="price"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            defaultValue={initial?.priceDzd}
            required
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Catégorie *</Label>
          <select
            id="category"
            name="category"
            defaultValue={initial?.categoryId ?? ""}
            required
            className={selectClass}
          >
            <option value="" disabled>
              Choisir
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="wilaya">Wilaya de provenance *</Label>
        <select
          id="wilaya"
          name="wilaya"
          defaultValue={initial?.wilayaCode ?? defaultWilaya}
          required
          className={selectClass}
        >
          {WILAYAS.map((wilaya) => (
            <option key={wilaya.code} value={wilaya.code}>
              {wilaya.name} ({wilaya.code})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Mots-clés (facultatif)</Label>
        <Input
          id="tags"
          name="tags"
          defaultValue={initial?.tags.join(", ")}
          placeholder="Ex : jogger, baggy, streetwear"
          className={inputClass}
        />
        <p className="text-xs text-muted-foreground">
          Séparés par des virgules. Ils aident les acheteurs à vous trouver.
        </p>
      </div>

      <Button type="submit" size="lg" disabled={submitting} className="w-full rounded-xl">
        {submitting ? "Enregistrement…" : mode === "create" ? "Publier le produit" : "Enregistrer"}
      </Button>
    </form>
  );
}