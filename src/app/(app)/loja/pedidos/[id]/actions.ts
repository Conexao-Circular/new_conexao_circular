"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Buyer submits (or edits) a review for an order. RLS enforces the real
 * gate — the insert policy only allows a row once every shipment for the
 * order is 'delivered' — this is defense in depth for a nicer error message.
 */
export async function submitOrderReview(formData: FormData) {
  const orderId = formData.get("order_id");
  const ratingRaw = formData.get("rating");
  const comment = formData.get("comment");
  const photoPaths = formData
    .getAll("photo_paths")
    .filter((v): v is string => typeof v === "string" && v.length > 0)
    .slice(0, 3);

  if (typeof orderId !== "string" || !orderId) {
    redirect("/loja/pedidos");
  }

  const rating = Number(ratingRaw);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    redirect(`/loja/pedidos/${orderId}?erro_avaliacao=` + encodeURIComponent("Escolha uma nota de 1 a 5 estrelas."));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("order_reviews").upsert(
    {
      order_id: orderId,
      buyer_id: user.id,
      rating,
      comment: typeof comment === "string" && comment.trim() ? comment.trim() : null,
      photo_paths: photoPaths,
    },
    { onConflict: "order_id" },
  );

  if (error) {
    redirect(
      `/loja/pedidos/${orderId}?erro_avaliacao=` +
        encodeURIComponent("Não foi possível enviar sua avaliação. O pedido precisa estar totalmente entregue."),
    );
  }

  revalidatePath(`/loja/pedidos/${orderId}`);
  redirect(`/loja/pedidos/${orderId}?avaliado=1`);
}
