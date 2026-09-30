import { describe, it, expect, afterEach } from "vitest";
import { centsToReais, sanitizeDigits, toBillingType, verifyWebhookToken, ASAAS_PAID_EVENTS } from "@/lib/asaas-utils";

describe("centsToReais", () => {
  it("converts integer cents to a 2-decimal reais number", () => {
    expect(centsToReais(12990)).toBe(129.9);
    expect(centsToReais(100)).toBe(1);
    expect(centsToReais(0)).toBe(0);
    expect(centsToReais(1)).toBe(0.01);
  });
});

describe("sanitizeDigits", () => {
  it("strips non-digits and handles null/undefined", () => {
    expect(sanitizeDigits("123.456.789-00")).toBe("12345678900");
    expect(sanitizeDigits("(00) 00000-0000")).toBe("00000000000");
    expect(sanitizeDigits(null)).toBe("");
    expect(sanitizeDigits(undefined)).toBe("");
  });
});

describe("toBillingType", () => {
  it("maps known methods and falls back to UNDEFINED", () => {
    expect(toBillingType("pix")).toBe("PIX");
    expect(toBillingType("boleto")).toBe("BOLETO");
    expect(toBillingType("credit_card")).toBe("CREDIT_CARD");
    expect(toBillingType("outro")).toBe("UNDEFINED");
    expect(toBillingType(null)).toBe("UNDEFINED");
  });
});

describe("verifyWebhookToken", () => {
  afterEach(() => {
    delete process.env.ASAAS_WEBHOOK_TOKEN;
  });

  it("returns false when no secret is configured", () => {
    expect(verifyWebhookToken("anything")).toBe(false);
  });

  it("matches only the exact token", () => {
    process.env.ASAAS_WEBHOOK_TOKEN = "s3cr3t-token";
    expect(verifyWebhookToken("s3cr3t-token")).toBe(true);
    expect(verifyWebhookToken("wrong")).toBe(false);
    expect(verifyWebhookToken("s3cr3t-toke")).toBe(false);
    expect(verifyWebhookToken(null)).toBe(false);
    expect(verifyWebhookToken(undefined)).toBe(false);
  });
});

describe("ASAAS_PAID_EVENTS", () => {
  it("includes the money-in events and excludes others", () => {
    expect(ASAAS_PAID_EVENTS.has("PAYMENT_RECEIVED")).toBe(true);
    expect(ASAAS_PAID_EVENTS.has("PAYMENT_CONFIRMED")).toBe(true);
    expect(ASAAS_PAID_EVENTS.has("PAYMENT_CREATED")).toBe(false);
    expect(ASAAS_PAID_EVENTS.has("PAYMENT_OVERDUE")).toBe(false);
  });
});
