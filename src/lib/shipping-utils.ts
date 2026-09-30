/**
 * Pure freight helpers (no network, no `server-only`) so they can be unit
 * tested. The Melhor Envio network calls live in shipping.ts, which re-exports
 * everything here.
 */

export function isShippingConfigured(): boolean {
  return Boolean(process.env.MELHOR_ENVIO_TOKEN);
}

export function sanitizeZip(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "").slice(0, 8);
}

/** Correios/transportadora minimums so a package with missing data still quotes. */
export const PACKAGE_MIN = {
  weightKg: 0.3,
  lengthCm: 16,
  widthCm: 11,
  heightCm: 2,
};

export type ShippingItem = {
  weight_grams: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  quantity: number;
  unit_price_cents: number;
};

export type MelhorEnvioProduct = {
  id: string;
  width: number;
  height: number;
  length: number;
  weight: number;
  insurance_value: number;
  quantity: number;
};

/** Maps our order items to Melhor Envio "products", applying safe minimums. */
export function toMelhorEnvioProducts(items: ShippingItem[]): MelhorEnvioProduct[] {
  return items.map((item, index) => ({
    id: String(index + 1),
    width: Math.max(Number(item.width_cm) || 0, PACKAGE_MIN.widthCm),
    height: Math.max(Number(item.height_cm) || 0, PACKAGE_MIN.heightCm),
    length: Math.max(Number(item.length_cm) || 0, PACKAGE_MIN.lengthCm),
    weight: Math.max((Number(item.weight_grams) || 0) / 1000, PACKAGE_MIN.weightKg),
    insurance_value: Number((item.unit_price_cents / 100).toFixed(2)),
    quantity: Math.max(item.quantity, 1),
  }));
}

export type MelhorEnvioService = { price?: string | number; error?: string | null };

/** Picks the cheapest quotable service and returns its price in integer cents (0 if none). */
export function cheapestFreightCents(services: MelhorEnvioService[]): number {
  const prices = services
    .filter((s) => !s.error && s.price != null)
    .map((s) => Math.round(Number(s.price) * 100))
    .filter((cents) => Number.isFinite(cents) && cents > 0);
  if (prices.length === 0) return 0;
  return Math.min(...prices);
}
