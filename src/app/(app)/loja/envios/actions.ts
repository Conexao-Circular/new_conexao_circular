"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyProfile } from "@/lib/push";
import { sendOrderCollectedEmail, sendOrderDeliveredEmail, sendOrderShippedEmail } from "@/lib/email";

/** Looks up the buyer for a shipment's order with the service role (order_shipments/orders are scoped by RLS to the producer/buyer, not each other). */
async function getOrderBuyer(orderId: string) {
  const admin = createAdminClient();
  if (!admin) return null;

  const { data: order } = await admin
    .from("orders")
    .select("order_code, buyer_id, profiles(email)")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return null;

  const buyerEmail =
    order.profiles && typeof order.profiles === "object" && "email" in order.profiles
      ? (order.profiles as { email: string }).email
      : null;

  return { buyerId: order.buyer_id, orderCode: order.order_code, buyerEmail };
}

/** Producer confirms the carrier picked up the package. */
export async function markShipmentCollected(formData: FormData) {
  const shipmentId = formData.get("shipment_id");
  if (typeof shipmentId !== "string" || !shipmentId) {
    redirect("/loja/envios");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: updated } = await supabase
    .from("order_shipments")
    .update({ status: "collected", collected_at: new Date().toISOString() })
    .eq("id", shipmentId)
    .eq("partner_id", user.id)
    .eq("status", "preparing")
    .select("order_id")
    .maybeSingle();

  if (updated) {
    const buyer = await getOrderBuyer(updated.order_id);
    if (buyer) {
      await notifyProfile(buyer.buyerId, {
        title: "Pedido coletado 📦",
        body: "Um dos seus produtos foi coletado pela transportadora.",
        url: `/loja/pedidos/${updated.order_id}`,
      });
      if (buyer.buyerEmail) {
        await sendOrderCollectedEmail({
          buyerEmail: buyer.buyerEmail,
          orderCode: buyer.orderCode,
          orderId: updated.order_id,
        });
      }
    }
  }

  revalidatePath("/loja/envios");
  redirect("/loja/envios");
}

/** Producer marks a shipment as shipped (in transit), recording carrier + tracking code. */
export async function markShipmentShipped(formData: FormData) {
  const shipmentId = formData.get("shipment_id");
  const carrier = formData.get("carrier");
  const trackingCode = formData.get("tracking_code");

  if (typeof shipmentId !== "string" || !shipmentId) {
    redirect("/loja/envios");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const carrierValue = typeof carrier === "string" && carrier.trim() ? carrier.trim() : null;
  const trackingValue = typeof trackingCode === "string" && trackingCode.trim() ? trackingCode.trim() : null;

  // RLS (order_shipments_update_own) guarantees the producer only touches their
  // own shipment rows.
  const { data: updated } = await supabase
    .from("order_shipments")
    .update({
      status: "shipped",
      carrier: carrierValue,
      tracking_code: trackingValue,
      shipped_at: new Date().toISOString(),
    })
    .eq("id", shipmentId)
    .eq("partner_id", user.id)
    .eq("status", "collected")
    .select("order_id")
    .maybeSingle();

  if (updated) {
    const buyer = await getOrderBuyer(updated.order_id);
    if (buyer) {
      await notifyProfile(buyer.buyerId, {
        title: "Pedido em transporte 🚚",
        body: "Um dos seus produtos está a caminho. Acompanhe o rastreio no pedido.",
        url: `/loja/pedidos/${updated.order_id}`,
      });
      if (buyer.buyerEmail) {
        await sendOrderShippedEmail({
          buyerEmail: buyer.buyerEmail,
          orderCode: buyer.orderCode,
          orderId: updated.order_id,
          carrier: carrierValue,
          trackingCode: trackingValue,
        });
      }
    }
  }

  revalidatePath("/loja/envios");
  redirect("/loja/envios");
}

/** Producer marks a shipment as delivered. */
export async function markShipmentDelivered(formData: FormData) {
  const shipmentId = formData.get("shipment_id");
  if (typeof shipmentId !== "string" || !shipmentId) {
    redirect("/loja/envios");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: updated } = await supabase
    .from("order_shipments")
    .update({ status: "delivered", delivered_at: new Date().toISOString() })
    .eq("id", shipmentId)
    .eq("partner_id", user.id)
    .eq("status", "shipped")
    .select("order_id")
    .maybeSingle();

  if (updated) {
    const buyer = await getOrderBuyer(updated.order_id);
    if (buyer) {
      await notifyProfile(buyer.buyerId, {
        title: "Pedido entregue ✅",
        body: "Um dos seus produtos foi entregue.",
        url: `/loja/pedidos/${updated.order_id}`,
      });
      if (buyer.buyerEmail) {
        await sendOrderDeliveredEmail({
          buyerEmail: buyer.buyerEmail,
          orderCode: buyer.orderCode,
          orderId: updated.order_id,
        });
      }
    }
  }

  revalidatePath("/loja/envios");
  redirect("/loja/envios");
}
