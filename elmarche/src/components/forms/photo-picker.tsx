"use client";

import { useRef } from "react";
import { Camera, X } from "lucide-react";

export type Photo = { id: string; file: File; preview: string };

type PhotoPickerProps = {
  photos: Photo[];
  max: number;
  disabled?: boolean;
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
};

export function PhotoPicker({ photos, max, disabled, onAdd, onRemove }: PhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const full = photos.length >= max;

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        tabIndex={-1}
        className="sr-only"
        onChange={(event) => {
          onAdd(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      <button
        type="button"
        disabled={disabled || full}
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-card px-4 py-8 text-center disabled:opacity-60"
      >
        <Camera className="h-7 w-7 text-primary" aria-hidden />
        <span className="font-semibold text-primary">+ Ajouter des photos (3-5)</span>
        <span className="text-xs text-muted-foreground">
          PNG, JPG ou WebP, jusqu&apos;à 5 Mo par photo
        </span>
      </button>

      {photos.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              className="relative aspect-square overflow-hidden rounded-xl border bg-secondary"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.preview} alt="" className="h-full w-full object-cover" />
              {index === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  Principale
                </span>
              )}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onRemove(photo.id)}
                aria-label="Retirer cette photo"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        {photos.length}/{max} photos (3 minimum). La première est la photo principale.
      </p>
    </div>
  );
}