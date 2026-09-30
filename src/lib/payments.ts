import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyProfile } from "@/lib/push";
import { sendOrderConfirmedEmail } from "@/lib/email";
import {
  isAsaasConfigured,
  createAsaasCustomer,
  createAsaasCharge,
  sanitizeDigits,
} from "@/lib/asaas";

type Client = SupabaseClient<Database>;

/**
 * Announces an order approved without going through the gateway: push + email,
 * then the URL to send the buyer to. `approve` is what actually flips the
 * order, and it differs per caller — see the two call sites.
 */
async function announceApprovedOrder(
  supabase: Client,
  userId: string,
  orderId: string,
  approve: () => Promise<void>,
): Promise<string> {
  await approve();
  await notifyProfile(userId, {
    title: "Pedido confirmado 🎉",
    body: "Seu pedido foi aprovado e seus pontos já foram creditados.",
    url: `/loja/pedidos/${orderId}`,
  });
  const { data: confirmedOrder } = await supabase
    .from("orders")
    .select("order_code, profiles(email)")
    .eq("id", orderId)
    .single();
  const buyerEmail =
    confirmedOrder?.profiles && typeof confirmedOrder.profiles === "object" && "email" in confirmedOrder.profiles
      ? (confirmedOrder.profiles as { email: string }).email
      : null;
  if (confirmedOrder?.order_code && buyerEmail) {
    await sendOrderConfirmedEmail({ buyerEmail, orderCode: confirmedOrder.order_code, orderId });
  }
  return `/loja/pedidos/${orderId}?confirmado=1`;
}

/**
 * Starts payment for an order that was just created (status `pending`, stock
 * already reserved by the creation RPC).
 *
 * - Asaas configured: ensures the buyer has an Asaas customer, creates a
 *   hosted charge and returns its invoice URL to redirect the buyer to. The
 *   order is only approved later, by the webhook (see app/api/webhooks/asaas).
 * - Asaas NOT configured: the order stays pending unless DEMO_MODE=true in a
 *   disposable environment. The simulated path runs through the service-role
 *   client and needs SUPABASE_SERVICE_ROLE_KEY.
 *
 * Returns the URL to redirect the buyer to. Throws on gateway/API errors so the
 * caller can leave the order pending and surface a retry.
 */
export async function startOrderPayment(
  supabase: Client,
  userId: string,
  orderId: string,
  opts: { method: string; cpf?: string | null },
): Promise<string> {
  if (!isAsaasConfigured()) {
    if (process.env.DEMO_MODE !== "true") {
      throw new Error("payment_not_configured");
    }

    // Approving an order with no charge must never come from the buyer, so
    // simulate_order_payment is service-role only (migration 20260908140000).
    // What makes a payment simulated is this server reading ASAAS_API_KEY — not
    // a database grant that would hold in every environment.
    const admin = createAdminClient();
    if (!admin) {
      throw new Error("missing_service_role_key");
    }
    return announceApprovedOrder(supabase, userId, orderId, async () => {
      const { error } = await admin.rpc("simulate_order_payment", { p_order_id: orderId });
      if (error) throw new Error(error.message);
    });
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, total_cents, payment_method")
    .eq("id", orderId)
    .single();

  if (!order) {
    return `/loja/pedidos/${orderId}`;
  }

  // The level discount plus cashback can take the total to zero. The gateway
  // rejects a zero charge, and without this the order would stay pending
  // forever with the cashback already taken off the balance.
  if (order.total_cents <= 0) {
    // Still the buyer's own action: the function only approves an order of
    // theirs whose total is zero, so there is nothing to abuse.
    return announceApprovedOrder(supabase, userId, orderId, async () => {
      const { error } = await supabase.rpc("settle_fully_discounted_order", { p_order_id: orderId });
      if (error) throw new Error(error.message);
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email, document, phone, asaas_customer_id")
    .eq("id", userId)
    .single();

  const cpf = sanitizeDigits(opts.cpf) || sanitizeDigits(profile?.document);
  if (cpf.length < 11) {
    throw new Error("missing_cpf");
  }

  let customerId = profile?.asaas_customer_id ?? null;
  if (!customerId) {
    customerId = await createAsaasCustomer({
      name: profile?.name || "Cliente Conexão Circular",
      cpfCnpj: cpf,
      email: profile?.email,
      phone: profile?.phone,
    });
    await supabase
      .from("profiles")
      .update({
        asaas_customer_id: customerId,
        ...(profile?.document ? {} : { document: cpf }),
      })
      .eq("id", userId);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const charge = await createAsaasCharge({
    customerId,
    method: order.payment_method ?? opts.method,
    valueCents: order.total_cents,
    orderId,
    description: "Pedido Conexão Circular",
    successUrl: `${siteUrl}/loja/pedidos/${orderId}?confirmado=1`,
  });

  await supabase
    .from("orders")
    .update({
      payment_status: "awaiting_payment",
      payment_intent_id: charge.id,
      payment_url: charge.invoiceUrl,
    })
    .eq("id", orderId);

  return charge.invoiceUrl;
}
