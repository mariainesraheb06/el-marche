"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Check, X } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import Cropper from "react-easy-crop";

type Props = {
  userId: string;
  name: string;
  initialUrl: string | null;
  onUploaded: (url: string) => void;
};

async function getCroppedImg(
  imageSrc: string, 
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas is empty"))), "image/jpeg", 0.85);
  });
}

export function AvatarUploader({ userId, name, initialUrl, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Format accepté : JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image trop lourde (10 Mo maximum).");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => setImageToCrop(reader.result?.toString() || null));
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleSaveCrop() {
    if (!imageToCrop || !croppedAreaPixels) return;
    setBusy(true);
    setError(null);

    try {
      const blob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const path = `${userId}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const publicUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: publicUrl }),
      });
      
      if (!res.ok) throw new Error("save");

      setUrl(publicUrl);
      onUploaded(publicUrl);
      setImageToCrop(null);
    } catch {
      setError("Impossible d'envoyer la photo. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label="Changer la photo de profil"
        className="group relative h-24 w-24 overflow-hidden rounded-full border-2 border-primary/20 bg-secondary"
      >
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-heading text-3xl font-bold text-primary">
            {name.charAt(0).toUpperCase() || "?"}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
          {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={handleFileSelect}
      />
      <p className="text-xs text-muted-foreground">Touchez la photo pour la changer</p>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}

      {imageToCrop && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/80 p-4">
          <div className="relative flex-1">
            <Cropper
              image={imageToCrop}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, croppedArea) => setCroppedAreaPixels(croppedArea)}
            />
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setImageToCrop(null)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white"
            >
              <X className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={handleSaveCrop}
              disabled={busy}
              className="flex h-12 flex-1 max-w-[200px] items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}