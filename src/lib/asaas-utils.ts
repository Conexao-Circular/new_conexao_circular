/**
 * Pure Asaas helpers (no network, no `server-only`) so they can be unit-tested
 * and reused from both server code and the webhook route. The network calls
 * live in asaas.ts, which re-exports everything here.
 */

export function isAsaasConfigured(): boolean {
  return Boolean(process.env.ASAAS_API_KEY);
}

/** Asaas expects monetary values in reais (decimal), not cents. */
export function centsToReais(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

export function sanitizeDigits(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

const BILLING_TYPE: Record<string, "PIX" | "BOLETO" | "CREDIT_CARD"> = {
  pix: "PIX",
  boleto: "BOLETO",
  credit_card: "CREDIT_CARD",
};

/** Maps our internal payment_method to an Asaas billingType. */
export function toBillingType(method: string | null | undefined): "PIX" | "BOLETO" | "CREDIT_CARD" | "UNDEFINED" {
  return (method && BILLING_TYPE[method]) || "UNDEFINED";
}

/** Constant-time comparison of the webhook token against the configured secret. */
export function verifyWebhookToken(received: string | null | undefined): boolean {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected || !received || received.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= received.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

/** Asaas events that mean the money is actually in (Pix/boleto/card cleared). */
export const ASAAS_PAID_EVENTS = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);
