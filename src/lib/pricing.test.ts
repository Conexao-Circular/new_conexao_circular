import { describe, it, expect } from "vitest";
import { parsePriceToCents, parsePoints } from "@/lib/pricing";

describe("parsePriceToCents", () => {
  it("parses decimal strings with dot or comma to integer cents", () => {
    expect(parsePriceToCents("10.50")).toBe(1050);
    expect(parsePriceToCents("10,50")).toBe(1050);
    expect(parsePriceToCents("0")).toBe(0);
  });

  it("rejects empty, malformed, or negative values as null (never NaN)", () => {
    expect(parsePriceToCents("")).toBeNull();
    expect(parsePriceToCents("   ")).toBeNull();
    expect(parsePriceToCents("abc")).toBeNull();
    expect(parsePriceToCents("-5")).toBeNull();
    expect(parsePriceToCents(null)).toBeNull();
    expect(parsePriceToCents(undefined)).toBeNull();
  });

  it("rounds to the nearest cent", () => {
    expect(parsePriceToCents("9.999")).toBe(1000);
    expect(parsePriceToCents("9.994")).toBe(999);
  });
});

describe("parsePoints", () => {
  it("truncates to a non-negative integer, defaulting to 0", () => {
    expect(parsePoints("120")).toBe(120);
    expect(parsePoints("120.9")).toBe(120);
    expect(parsePoints("")).toBe(0);
    expect(parsePoints("-3")).toBe(0);
    expect(parsePoints("abc")).toBe(0);
    expect(parsePoints(null)).toBe(0);
  });
});
