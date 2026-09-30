import { describe, expect, it } from "vitest";
import { getSafeNextPath, isValidEmail, normalizeEmail } from "./auth-routes";

describe("auth route helpers", () => {
  it("normalizes and validates emails consistently", () => {
    expect(normalizeEmail("  Pessoa@EXEMPLO.COM ")).toBe("pessoa@exemplo.com");
    expect(isValidEmail("pessoa@exemplo.com")).toBe(true);
    expect(isValidEmail("pessoa@exemplo")).toBe(false);
  });

  it("allows local return paths and rejects external redirects", () => {
    expect(getSafeNextPath("/loja?origem=login")).toBe("/loja?origem=login");
    expect(getSafeNextPath("https://example.com")).toBe("/inicio");
    expect(getSafeNextPath("//example.com")).toBe("/inicio");
    expect(getSafeNextPath("/\\example.com")).toBe("/inicio");
  });
});
