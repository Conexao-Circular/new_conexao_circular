import { describe, it, expect } from "vitest";
import {
  parseStock,
  parseUnit,
  parseTags,
  parseMaterialOrigin,
  resolveCategory,
} from "@/lib/catalog";

describe("parseStock", () => {
  it("accepts non-negative integers", () => {
    expect(parseStock("0")).toBe(0);
    expect(parseStock("42")).toBe(42);
  });

  it("rejects empty, decimal, negative or malformed values as null", () => {
    expect(parseStock("")).toBeNull();
    expect(parseStock("   ")).toBeNull();
    expect(parseStock("-1")).toBeNull();
    expect(parseStock("3.5")).toBeNull();
    expect(parseStock("abc")).toBeNull();
    expect(parseStock(null)).toBeNull();
    expect(parseStock(undefined)).toBeNull();
  });
});

describe("parseUnit", () => {
  it("defaults to 'un' when empty", () => {
    expect(parseUnit("")).toBe("un");
    expect(parseUnit(null)).toBe("un");
  });

  it("accepts a known unit", () => {
    expect(parseUnit("kg")).toBe("kg");
  });

  it("rejects an unknown unit as null", () => {
    expect(parseUnit("toneladas")).toBeNull();
  });
});

describe("parseTags", () => {
  it("splits, trims, lowercases and dedupes", () => {
    expect(parseTags("Reciclado, Artesanal , reciclado")).toEqual(["reciclado", "artesanal"]);
  });

  it("returns empty array for empty input", () => {
    expect(parseTags("")).toEqual([]);
    expect(parseTags(null)).toEqual([]);
  });

  it("caps at 8 tags", () => {
    const many = Array.from({ length: 12 }, (_, i) => `tag${i}`).join(",");
    expect(parseTags(many)).toHaveLength(8);
  });
});

describe("parseMaterialOrigin", () => {
  it("combines checked options with a free-text 'other' entry, deduped", () => {
    const fd = new FormData();
    fd.append("material_origin", "Material reciclado");
    fd.append("material_origin", "Tecido reaproveitado");
    fd.append("material_origin_other", "Casca de coco");
    expect(parseMaterialOrigin(fd)).toEqual([
      "Material reciclado",
      "Tecido reaproveitado",
      "Casca de coco",
    ]);
  });

  it("returns empty array when nothing is set", () => {
    expect(parseMaterialOrigin(new FormData())).toEqual([]);
  });
});

describe("resolveCategory", () => {
  const options = ["Alimentos", "Artesanato", "Outros"];

  it("accepts a listed category", () => {
    const fd = new FormData();
    fd.append("category", "Artesanato");
    expect(resolveCategory(fd, options)).toBe("Artesanato");
  });

  it("resolves 'Outros' to the free-text companion field", () => {
    const fd = new FormData();
    fd.append("category", "Outros");
    fd.append("category_other", "Velas aromáticas");
    expect(resolveCategory(fd, options)).toBe("Velas aromáticas");
  });

  it("rejects 'Outros' without the companion text, and unknown categories", () => {
    const fdMissing = new FormData();
    fdMissing.append("category", "Outros");
    expect(resolveCategory(fdMissing, options)).toBeNull();

    const fdUnknown = new FormData();
    fdUnknown.append("category", "Eletrônicos");
    expect(resolveCategory(fdUnknown, options)).toBeNull();
  });
});
