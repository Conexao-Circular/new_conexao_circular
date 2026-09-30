"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAsaasConfigured, sanitizeDigits } from "@/lib/asaas";
import { benefitsForPoints } from "@/lib/gamification";
import { computeOrderFreightCents } from "@/lib/shipping";
import { startOrderPayment } from "@/lib/payments";

const ORDER_ERROR_MESSAGES: Record<string, string> = {
  no_active_subscription: "Ative um plano para comprar na loja.",
  insufficient_stock: "Um dos produtos ficou sem estoque suficiente.",
  product_unavailable: "Um dos produtos não está mais disponível.",
  empty_cart: "Seu carrinho está vazio.",
};

export async function createOrderFromCart(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const cep = (formData.get("cep") as string | null)?.replace(/\D/g, "") ?? "";
  const street = (formData.get("street") as string | null) ?? "";
  const number = (formData.get("number") as string | null) ?? "";
  const city = (formData.get("city") as string | null) ?? "";
  const state = (formData.get("state") as string | null) ?? "";

  if (!cep || !street || !number || !city || !state) {
    redirect("/loja/checkout?error=" + encodeURIComponent("Preencha o endereço completo."));
  }

  const deliveryAddress = {
    cep,
    street,
    number,
    complement: (formData.get("complement") as string | null) || null,
    neighborhood: (formData.get("neighborhood") as string | null) ?? "",
    city,
    state,
  };

  const paymentMethodRaw = (formData.get("payment_method") as string | null) ?? "pix";
  const paymentMethod = (["pix", "credit_card", "boleto"] as const).includes(
    paymentMethodRaw as "pix" | "credit_card" | "boleto",
  )
    ? paymentMethodRaw
    : "pix";

  const useCashback = formData.get("use_cashback") === "1";
  const cpf = sanitizeDigits(formData.get("cpf") as string | null);

  // A real gateway charge needs the buyer's CPF; validate before reserving stock.
  if (isAsaasConfigured() && cpf.length < 11) {
    redirect("/loja/checkout?error=" + encodeURIComponent("Informe um CPF válido para o pagamento."));
  }

  // Transactional: validates subscription + stock, applies cashback, creates
  // order+items, decrements stock and clears the cart in a single DB call.
  const { data: orderId, error } = await supabase.rpc("create_order_from_cart", {
    p_delivery: deliveryAddress,
    p_payment: paymentMethod,
    p_use_cashback: useCashback,
  });

  if (error || !orderId) {
    const message = ORDER_ERROR_MESSAGES[error?.message ?? ""] ?? "Não foi possível criar o pedido. Tente novamente.";
    redirect("/loja/carrinho?error=" + encodeURIComponent(message));
  }

  // Frete grátis é benefício de nível (Árvore para cima). O nível vem do banco,
  // não do formulário — o resumo do checkout só mostra o que já foi decidido
  // aqui. Sem cotação nem soma ao total: a plataforma paga.
  const { data: buyer } = await supabase
    .from("profiles")
    .select("lifetime_points")
    .eq("id", user.id)
    .single();
  const freeShipping = benefitsForPoints(buyer?.lifetime_points ?? 0).freeShipping;

  // Quote freight (Melhor Envio) per producer origin and add it to the order
  // total before charging. No-op (0) when shipping is unconfigured.
  const freightCents = freeShipping ? 0 : await computeOrderFreightCents(supabase, orderId, cep);
  if (freightCents > 0) {
    const { data: current } = await supabase.from("orders").select("total_cents").eq("id", orderId).single();
    if (current) {
      await supabase
        .from("orders")
        .update({ freight_cents: freightCents, total_cents: current.total_cents + freightCents })
        .eq("id", orderId);
    }
  }

  let target: string;
  try {
    // Asaas configured → hosted checkout URL; otherwise only an explicitly
    // enabled disposable demo may use simulated instant payment.
    target = await startOrderPayment(supabase, user.id, orderId, { method: paymentMethod, cpf });
  } catch {
    // Order stays pending (stock reserved); buyer can retry payment from it.
    redirect(`/loja/pedidos/${orderId}?erro_pagamento=1`);
  }

  redirect(target);
}
