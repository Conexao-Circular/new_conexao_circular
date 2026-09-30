import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import {
  sanitizeZip,
  toMelhorEnvioProducts,
  cheapestFreightCents,
  type ShippingItem,
} from "@/lib/shipping-utils";

/**
 * Melhor Envio (https://melhorenvio.com.br) freight quoting. Server-only
 * network calls; pure helpers live in shipping-utils.ts and are re-exported.
 *
 * Env-driven and no-ops gracefully when unconfigured: without
 * MELHOR_ENVIO_TOKEN, freight resolves to 0 ("grátis") and checkout keeps
 * working. Configure with:
 *   MELHOR_ENVIO_TOKEN – bearer token (sandbox or production)
 *   MELHOR_ENVIO_URL   – base URL (defaults to the sandbox)
 */

export { isShippingConfigured, sanitizeZip } from "@/lib/shipping-utils";

const DEFAULT_URL = "https://sandbox.melhorenvio.com.br";

function baseUrl(): string {
  return process.env.MELHOR_ENVIO_URL || DEFAULT_URL;
}

/** Quotes the cheapest freight (in cents) between two CEPs for a set of items. */
export async function quoteFreightCents(
  originZip: string,
  destZip: string,
  items: ShippingItem[],
): Promise<number> {
  const token = process.env.MELHOR_ENVIO_TOKEN;
  const from = sanitizeZip(originZip);
  const to = sanitizeZip(destZip);
  if (!token || from.length !== 8 || to.length !== 8 || items.length === 0) return 0;

  try {
    const response = await fetch(`${baseUrl()}/api/v2/me/shipment/calculate`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "Conexao Circular (contato@conexaocircular.com.br)",
      },
      body: JSON.stringify({
        from: { postal_code: from },
        to: { postal_code: to },
        products: toMelhorEnvioProducts(items),
      }),
      cache: "no-store",
    });

    if (!response.ok) return 0;
    const services = (await response.json().catch(() => null)) as
      | { price?: string | number; error?: string | null }[]
      | null;
    if (!Array.isArray(services)) return 0;
    return cheapestFreightCents(services);
  } catch {
    return 0;
  }
}

/**
 * Total freight for an order: groups the order's items by producer origin CEP
 * (each producer ships separately) and sums the cheapest quote per group.
 * Returns 0 when shipping is unconfigured or no origin CEPs are set.
 */
export async function computeOrderFreightCents(
  supabase: SupabaseClient<Database>,
  orderId: string,
  destZip: string,
): Promise<number> {
  if (!process.env.MELHOR_ENVIO_TOKEN) return 0;

  const { data: rows } = await supabase.rpc("get_order_shipping_items", { p_order_id: orderId });
  if (!rows || rows.length === 0) return 0;

  const groups = new Map<string, ShippingItem[]>();
  for (const row of rows) {
    const origin = sanitizeZip(row.origin_zip);
    if (origin.length !== 8) continue; // producer without origin CEP → no freight for their items
    const list = groups.get(origin) ?? [];
    list.push({
      weight_grams: row.weight_grams,
      length_cm: row.length_cm,
      width_cm: row.width_cm,
      height_cm: row.height_cm,
      quantity: row.quantity,
      unit_price_cents: row.unit_price_cents,
    });
    groups.set(origin, list);
  }

  let total = 0;
  for (const [origin, items] of groups) {
    total += await quoteFreightCents(origin, destZip, items);
  }
  return total;
}
