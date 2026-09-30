"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ReviewPhotoInput } from "@/components/review-photo-input";
import { submitOrderReview } from "@/app/(app)/loja/pedidos/[id]/actions";

function StarPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div role="radiogroup" aria-label="Nota do pedido" className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5"
        >
          <Star
            className={`h-7 w-7 transition-colors ${
              star <= display ? "fill-cc-orange text-cc-orange" : "fill-transparent text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Enviando…
        </>
      ) : (
        "Enviar avaliação"
      )}
    </Button>
  );
}

export function OrderReviewForm({
  orderId,
  userId,
  error,
}: {
  orderId: string;
  userId: string;
  error?: string;
}) {
  const [rating, setRating] = useState(0);

  return (
    <form action={submitOrderReview} className="space-y-4">
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="rating" value={rating} />

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label>Como foi sua experiência com este pedido?</Label>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Comentário (opcional)</Label>
        <Textarea
          id="comment"
          name="comment"
          placeholder="Conte como foi receber e usar os produtos…"
          rows={3}
          maxLength={1000}
        />
      </div>

      <div className="space-y-2">
        <Label>Foto (opcional)</Label>
        <ReviewPhotoInput userId={userId} orderId={orderId} />
      </div>

      <SubmitButton />
    </form>
  );
}
