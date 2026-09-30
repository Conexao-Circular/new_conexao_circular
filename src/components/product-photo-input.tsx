"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB per file
const DEFAULT_MAX_FILES = 5;

type Photo = { url: string; uploading: boolean };

/**
 * Uploads photos DIRECTLY from the browser to Supabase Storage (bypassing the
 * Server Action body-size limit, which silently dropped large phone photos),
 * then submits the resulting public URLs via hidden inputs named `photo_urls`.
 *
 * `maxFiles` should account for photos already saved elsewhere (e.g. when
 * editing, pass MAX - existingPhotos.length) so the gallery never exceeds the
 * cap once both sets are combined.
 */
export function ProductPhotoInput({ userId, maxFiles = DEFAULT_MAX_FILES }: { userId: string; maxFiles?: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    if (photos.length + files.length > maxFiles) {
      setError(`Envie no máximo ${maxFiles} foto${maxFiles === 1 ? "" : "s"}.`);
      return;
    }
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError("Todos os arquivos devem ser imagens.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError(`"${file.name}" passa de 10MB.`);
        return;
      }
    }

    const supabase = createClient();

    await Promise.all(
      files.map(async (file) => {
        const placeholder: Photo = { url: URL.createObjectURL(file), uploading: true };
        setPhotos((prev) => [...prev, placeholder]);

        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${userId}/uploads/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("marketplace")
          .upload(path, file, { contentType: file.type || undefined, upsert: false });

        if (uploadError) {
          setError("Não foi possível enviar uma das fotos. Tente novamente.");
          setPhotos((prev) => prev.filter((p) => p !== placeholder));
          URL.revokeObjectURL(placeholder.url);
          return;
        }

        const { data } = supabase.storage.from("marketplace").getPublicUrl(path);
        setPhotos((prev) =>
          prev.map((p) => (p === placeholder ? { url: data.publicUrl, uploading: false } : p)),
        );
        URL.revokeObjectURL(placeholder.url);
      }),
    );
  }

  function remove(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {photos
        .filter((p) => !p.uploading)
        .map((p) => (
          <input key={p.url} type="hidden" name="photo_urls" value={p.url} />
        ))}

      {photos.length < maxFiles ? (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-cc-green/30 bg-cc-green/5 px-4 py-6 text-sm font-medium text-cc-green transition hover:bg-cc-green/10"
          >
            <ImagePlus className="h-5 w-5" />
            {photos.length > 0 ? "Adicionar mais fotos" : `Adicionar fotos (até ${maxFiles})`}
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleChange}
            className="sr-only"
          />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Limite de {maxFiles} fotos atingido.</p>
      )}

      {error && <p className="text-sm text-[var(--critico,#ef4444)]">{error}</p>}

      {photos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {photos.map((photo, index) => (
            <div
              key={photo.url}
              className="relative h-20 w-20 overflow-hidden rounded-lg border border-cc-green/15"
            >
              <Image
                src={photo.url}
                alt={`Foto ${index + 1}`}
                fill
                sizes="80px"
                className="object-cover"
                unoptimized
              />
              {photo.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
              )}
              {index === 0 && !photo.uploading && (
                <span className="absolute inset-x-0 bottom-0 bg-cc-green/80 py-0.5 text-center text-[10px] font-medium text-cc-paper">
                  Capa
                </span>
              )}
              {!photo.uploading && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label="Remover foto"
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/50 p-0.5 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
