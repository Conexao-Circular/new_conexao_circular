import { describe, it, expect } from "vitest";
import {
  sanitizeZip,
  toMelhorEnvioProducts,
  cheapestFreightCents,
  PACKAGE_MIN,
  type ShippingItem,
} from "@/lib/shipping-utils";

describe("sanitizeZip", () => {
  it("strips non-digits and caps at 8", () => {
    expect(sanitizeZip("60000-000")).toBe("60000000");
    expect(sanitizeZip("6000000012")).toBe("60000000");
    expect(sanitizeZip(null)).toBe("");
  });
});

describe("toMelhorEnvioProducts", () => {
  it("applies minimums when dimensions/weight are missing", () => {
    const items: ShippingItem[] = [
      { weight_grams: null, length_cm: null, width_cm: null, height_cm: null, quantity: 1, unit_price_cents: 2990 },
    ];
    const [p] = toMelhorEnvioProducts(items);
    expect(p.weight).toBe(PACKAGE_MIN.weightKg);
    expect(p.length).toBe(PACKAGE_MIN.lengthCm);
    expect(p.width).toBe(PACKAGE_MIN.widthCm);
    expect(p.height).toBe(PACKAGE_MIN.heightCm);
    expect(p.insurance_value).toBe(29.9);
    expect(p.quantity).toBe(1);
  });

  it("uses provided values when above the minimums (grams → kg)", () => {
    const items: ShippingItem[] = [
      { weight_grams: 1500, length_cm: 30, width_cm: 20, height_cm: 10, quantity: 2, unit_price_cents: 5000 },
    ];
    const [p] = toMelhorEnvioProducts(items);
    expect(p.weight).toBe(1.5);
    expect(p.length).toBe(30);
    expect(p.quantity).toBe(2);
  });
});

describe("cheapestFreightCents", () => {
  it("returns the cheapest quotable price in cents", () => {
    expect(cheapestFreightCents([{ price: "23.45" }, { price: "18.90" }, { price: "31.00" }])).toBe(1890);
  });

  it("ignores services with errors and returns 0 when none quote", () => {
    expect(cheapestFreightCents([{ error: "cep inválido" }, { price: undefined }])).toBe(0);
    expect(cheapestFreightCents([])).toBe(0);
  });
});
