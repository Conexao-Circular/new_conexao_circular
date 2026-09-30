import "server-only";
import { centsToReais, sanitizeDigits, toBillingType } from "@/lib/asaas-utils";

/**
 * Asaas (https://asaas.com) payment gateway client. Server-only network calls;
 * the pure helpers live in asaas-utils.ts and are re-exported here so callers
 * can keep importing everything from "@/lib/asaas".
 *
 * Env-driven and no-ops gracefully when unconfigured: the checkout falls back
 * to the simulated instant payment (see payments.ts). Configure with:
 *   ASAAS_API_KEY        – API key (sandbox or production)
 *   ASAAS_API_URL        – base URL (defaults to the sandbox)
 *   ASAAS_WEBHOOK_TOKEN   – token echoed by Asaas in the `asaas-access-token`
 *                           header, used to authenticate incoming webhooks.
 */

export {
  isAsaasConfigured,
  centsToReais,
  sanitizeDigits,
  toBillingType,
  verifyWebhookToken,
  ASAAS_PAID_EVENTS,
} from "@/lib/asaas-utils";

const DEFAULT_API_URL = "https://api-sandbox.asaas.com/v3";

function apiUrl(): string {
  return process.env.ASAAS_API_URL || DEFAULT_API_URL;
}

async function asaasFetch<T>(path: string, init: RequestInit): Promise<T> {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error("asaas_not_configured");

  const response = await fetch(`${apiUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: key,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const description =
      (data as { errors?: { description?: string }[] } | null)?.errors?.[0]?.description ??
      `asaas_error_${response.status}`;
    throw new Error(description);
  }
  return data as T;
}

export type AsaasCustomerInput = {
  name: string;
  cpfCnpj: string;
  email?: string | null;
  phone?: string | null;
};

/** Creates an Asaas customer and returns its id. */
export async function createAsaasCustomer(input: AsaasCustomerInput): Promise<string> {
  const data = await asaasFetch<{ id: string }>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      cpfCnpj: sanitizeDigits(input.cpfCnpj),
      email: input.email || undefined,
      mobilePhone: sanitizeDigits(input.phone) || undefined,
    }),
  });
  return data.id;
}

export type CreateChargeInput = {
  customerId: string;
  method: string;
  valueCents: number;
  orderId: string;
  description: string;
  successUrl: string;
};

/** Creates a charge (hosted checkout). Returns the Asaas payment id + invoice URL. */
export async function createAsaasCharge(input: CreateChargeInput): Promise<{ id: string; invoiceUrl: string }> {
  const due = new Date();
  due.setDate(due.getDate() + 3);

  const data = await asaasFetch<{ id: string; invoiceUrl: string }>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: input.customerId,
      billingType: toBillingType(input.method),
      value: centsToReais(input.valueCents),
      dueDate: due.toISOString().slice(0, 10),
      externalReference: input.orderId,
      description: input.description,
      callback: { successUrl: input.successUrl, autoRedirect: true },
    }),
  });

  return { id: data.id, invoiceUrl: data.invoiceUrl };
}
