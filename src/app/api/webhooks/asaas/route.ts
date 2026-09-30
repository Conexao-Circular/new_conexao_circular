import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyProfile } from "@/lib/push";
import { sendOrderConfirmedEmail } from "@/lib/email";
import { verifyWebhookToken, ASAAS_PAID_EVENTS } from "@/lib/asaas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Asaas payment webhook. Asaas echoes the token configured in its dashboard via
 * the `asaas-access-token` header — we verify it against ASAAS_WEBHOOK_TOKEN so
 * nobody can forge a "paid" event (which would credit points + cashback for
 * free). Approval is idempotent: it only transitions an order pending →
 * approved when the payment id matches, so retried/duplicate webhooks are safe.
 */
export async function POST(request: NextRequest) {
  if (!verifyWebhookToken(request.headers.get("asaas-access-token"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { event?: string; payment?: { id?: string; externalReference?: string } }
    | null;

  const event = body?.event;
  const payment = body?.payment;
  if (!event || !payment?.id || !payment.externalReference) {
    return NextResponse.json({ ok: true });
  }

  // Ignore lifecycle events that aren't "money is in".
  if (!ASAAS_PAID_EVENTS.has(event)) {
    return NextResponse.json({ ok: true });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  // Idempotent approval: matches this exact charge and only advances a pending
  // order. The orders UPDATE trigger (handle_order_change) credits points +
  // cashback exactly once.
  const { data: updated } = await admin
    .from("orders")
    .update({ status: "approved", payment_status: "paid" })
    .eq("id", payment.externalReference)
    .eq("payment_intent_id", payment.id)
    .eq("status", "pending")
    .select("id, buyer_id, order_code")
    .maybeSingle();

  if (updated) {
    await notifyProfile(updated.buyer_id, {
      title: "Pagamento confirmado 🎉",
      body: "Seu pedido foi aprovado e seus pontos já foram creditados.",
      url: `/loja/pedidos/${updated.id}`,
    });

    const { data: buyer } = await admin.from("profiles").select("email").eq("id", updated.buyer_id).maybeSingle();
    if (buyer?.email) {
      await sendOrderConfirmedEmail({ buyerEmail: buyer.email, orderCode: updated.order_code, orderId: updated.id });
    }
  }

  return NextResponse.json({ ok: true });
}
