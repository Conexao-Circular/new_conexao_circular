import { describe, expect, it } from "vitest";
import { MAX_POINTS_PER_BRL, POINT_VALUES, maxPointsForPrice } from "./points";

describe("maxPointsForPrice", () => {
  it("permite 1 ponto por real do preço", () => {
    expect(maxPointsForPrice(10000)).toBe(100);
    expect(maxPointsForPrice(2990)).toBe(29);
  });

  it("arredonda para baixo, para o teto nunca ser ultrapassado por centavos", () => {
    expect(maxPointsForPrice(2999)).toBe(29);
    expect(maxPointsForPrice(199)).toBe(1);
  });

  it("não permite ponto nenhum em produto abaixo de um real", () => {
    expect(maxPointsForPrice(99)).toBe(0);
    expect(maxPointsForPrice(0)).toBe(0);
  });

  it("acompanha MAX_POINTS_PER_BRL em vez de assumir 1", () => {
    expect(maxPointsForPrice(10000)).toBe(100 * MAX_POINTS_PER_BRL);
  });

  it("aceita o maior produto real de hoje (R$ 189,00 com 18 pontos)", () => {
    expect(maxPointsForPrice(18900)).toBeGreaterThanOrEqual(18);
  });
});

describe("POINT_VALUES", () => {
  it("cobre exatamente as três ações do sprint", () => {
    expect(Object.keys(POINT_VALUES).sort()).toEqual([
      "first_purchase",
      "order_review",
      "signup_complete",
    ]);
  });

  it("concede valores positivos", () => {
    for (const [action, value] of Object.entries(POINT_VALUES)) {
      expect(value, action).toBeGreaterThan(0);
    }
  });
});
