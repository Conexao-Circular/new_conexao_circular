"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { startOrderPayment } from "@/lib/payments";

const ORDER_ERROR_MESSAGES: Record<string, string> = {
  no_active_subscription: "Ative um plano para comprar na loja.",
  insufficient_stock: "Produto sem estoque suficiente.",
  product_unavailable: "Produto indisponível.",
};

export async function createOrder(formData: FormData) {
  const productId = formData.get("product_id");
  const quantityRaw = formData.get("quantity");

  if (typeof productId !== "string" || !productId) {
    redirect("/loja");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const quantity = Math.min(Math.max(Math.trunc(Number(quantityRaw) || 1), 1), 99);

  // Transactional: validates subscription + stock, creates the order+item and
  // decrements stock in a single DB call.
  const { data: orderId, error } = await supabase.rpc("create_single_order", {
    p_product_id: productId,
    p_quantity: quantity,
  });

  if (error || !orderId) {
    const message = ORDER_ERROR_MESSAGES[error?.message ?? ""] ?? "Não foi possível criar o pedido. Tente novamente.";
    redirect(`/loja/${productId}?error=` + encodeURIComponent(message));
  }

  let target: string;
  try {
    // Asaas configured → hosted checkout URL (uses the CPF saved on the profile);
    // otherwise the simulated instant payment approves the order right away.
    target = await startOrderPayment(supabase, user.id, orderId, { method: "pix" });
  } catch {
    redirect(`/loja/pedidos/${orderId}?erro_pagamento=1`);
  }

  redirect(target);
}
