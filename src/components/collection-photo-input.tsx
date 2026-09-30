"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 3;

type Photo = { path: string; previewUrl: string; uploading: boolean };

/**
 * Uploads request photos directly from the browser to the private
 * `collection-proofs` bucket, under `{userId}/pending/...` (the request
 * doesn't have an id yet at this point). The server action moves them to
 * `{userId}/{requestId}/...` after creating the row — see
 * coletas/nova/actions.ts. Since the bucket is private there's no public
 * URL to preview; the local blob URL is kept for that instead, and only
 * the storage path is submitted (via hidden `photo_paths` inputs).
 */
export function CollectionPhotoInput({ userId }: { userId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    if (photos.length + files.length > MAX_FILES) {
      setError(`Envie no máximo ${MAX_FILES} fotos.`);
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
        const previewUrl = URL.createObjectURL(file);
        const placeholder: Photo = { path: "", previewUrl, uploading: true };
        setPhotos((prev) => [...prev, placeholder]);

        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${userId}/pending/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("collection-proofs")
          .upload(path, file, { contentType: file.type || undefined, upsert: false });

        if (uploadError) {
          setError("Não foi possível enviar uma das fotos. Tente novamente.");
          setPhotos((prev) => prev.filter((p) => p !== placeholder));
          return;
        }

        setPhotos((prev) => prev.map((p) => (p === placeholder ? { ...p, path, uploading: false } : p)));
      }),
    );
  }

  function remove(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  return (
    <div className="space-y-2">
      {photos
        .filter((p) => !p.uploading)
        .map((p) => (
          <input key={p.path} type="hidden" name="photo_paths" value={p.path} />
        ))}

      {photos.length < MAX_FILES ? (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-cc-green/30 bg-cc-green/5 px-4 py-6 text-sm font-medium text-cc-green transition hover:bg-cc-green/10"
          >
            <ImagePlus className="h-5 w-5" />
            {photos.length > 0 ? "Adicionar mais fotos" : `Adicionar fotos (até ${MAX_FILES})`}
          </button>
          <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleChange} className="sr-only" />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Limite de {MAX_FILES} fotos atingido.</p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {photos.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {photos.map((photo, index) => (
            <div key={photo.previewUrl} className="relative h-20 w-20 overflow-hidden rounded-lg border border-cc-green/15">
              <Image src={photo.previewUrl} alt={`Foto ${index + 1}`} fill sizes="80px" className="object-cover" unoptimized />
              {photo.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                </div>
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
      ) : null}
    </div>
  );
}
