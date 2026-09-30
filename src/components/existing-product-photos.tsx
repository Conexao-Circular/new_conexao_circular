"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProductImage, reorderProductImages } from "@/app/(app)/loja/produtos/actions";

type ExistingPhoto = { id: string; url: string };

/**
 * Manages photos already saved to product_images (reorder, remove, cover).
 * Deliberately rendered OUTSIDE the main product form: each action here is
 * its own <form>, and forms can't nest inside the edit page's main form.
 */
export function ExistingProductPhotos({ productId, photos }: { productId: string; photos: ExistingPhoto[] }) {
  const [order, setOrder] = useState(photos);

  if (order.length === 0) return null;

  function move(index: number, direction: -1 | 1) {
    setOrder((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  const orderChanged = order.some((photo, index) => photo.id !== photos[index]?.id);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {order.map((photo, index) => (
          <div key={photo.id} className="relative h-20 w-20 overflow-hidden rounded-lg border border-cc-green/15">
            <Image src={photo.url} alt={`Foto ${index + 1}`} fill sizes="80px" className="object-cover" unoptimized />

            {index === 0 ? (
              <span className="absolute inset-x-0 bottom-0 bg-cc-green/80 py-0.5 text-center text-[10px] font-medium text-cc-paper">
                Capa
              </span>
            ) : null}

            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-0.5 py-0.5">
              <div className="flex gap-0.5">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Mover para cima"
                  className="rounded-full bg-black/50 p-0.5 text-white disabled:opacity-30"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === order.length - 1}
                  aria-label="Mover para baixo"
                  className="rounded-full bg-black/50 p-0.5 text-white disabled:opacity-30"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
              <form
                action={deleteProductImage}
                onSubmit={(event) => {
                  if (!confirm("Remover esta foto?")) event.preventDefault();
                }}
              >
                <input type="hidden" name="image_id" value={photo.id} />
                <input type="hidden" name="product_id" value={productId} />
                <button type="submit" aria-label="Remover foto" className="rounded-full bg-black/50 p-0.5 text-white">
                  <X className="h-3 w-3" />
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      {orderChanged ? (
        <form action={reorderProductImages} className="flex items-center gap-2">
          <input type="hidden" name="product_id" value={productId} />
          {order.map((photo) => (
            <input key={photo.id} type="hidden" name="ordered_ids" value={photo.id} />
          ))}
          <Button type="submit" size="sm" variant="outline">
            Salvar nova ordem
          </Button>
        </form>
      ) : null}
    </div>
  );
}
