import { describe, expect, it } from "vitest";
import {
  EARLY_ACCESS_MIN_LEVEL,
  LEVELS,
  benefitsForPoints,
  computeLevel,
  describeBenefits,
  levelDiscountCents,
} from "./gamification";

describe("LEVELS", () => {
  it("mantém index igual à posição no array — computeLevel usa isso para achar o próximo", () => {
    LEVELS.forEach((level, position) => {
      expect(level.index).toBe(position);
    });
  });

  it("sobe os limiares sem empate", () => {
    for (let i = 1; i < LEVELS.length; i += 1) {
      expect(LEVELS[i].min).toBeGreaterThan(LEVELS[i - 1].min);
    }
  });

  it("nunca tira um benefício de quem sobe de nível", () => {
    for (let i = 1; i < LEVELS.length; i += 1) {
      const before = LEVELS[i - 1].benefits;
      const after = LEVELS[i].benefits;
      expect(after.discountPercent).toBeGreaterThanOrEqual(before.discountPercent);
      expect(after.freeShipping || !before.freeShipping).toBe(true);
      expect(after.earlyAccess || !before.earlyAccess).toBe(true);
    }
  });

  it("começa sem benefício nenhum, para o clube ter o que destravar", () => {
    expect(describeBenefits(LEVELS[0].benefits)).toEqual([]);
  });
});

describe("computeLevel", () => {
  it("coloca quem não tem ponto no primeiro nível", () => {
    const level = computeLevel(0);
    expect(level.current.name).toBe("Semente");
    expect(level.next?.name).toBe("Broto");
    expect(level.progress).toBe(0);
  });

  it("sobe de nível exatamente no limiar", () => {
    expect(computeLevel(299).current.name).toBe("Semente");
    expect(computeLevel(300).current.name).toBe("Broto");
  });

  it("trata pontos negativos como zero", () => {
    expect(computeLevel(-100).current.index).toBe(0);
    expect(computeLevel(-100).pointsIntoLevel).toBe(0);
  });

  it("encerra o progresso no último nível", () => {
    const top = LEVELS[LEVELS.length - 1];
    const level = computeLevel(top.min + 5000);
    expect(level.current.index).toBe(top.index);
    expect(level.next).toBeNull();
    expect(level.progress).toBe(1);
    expect(level.pointsForNext).toBeNull();
  });

  it("informa quanto falta para o próximo nível", () => {
    const level = computeLevel(500);
    expect(level.current.name).toBe("Broto");
    expect(level.pointsForNext).toBe(500);
    expect(level.pointsIntoLevel).toBe(200);
  });
});

describe("levelDiscountCents", () => {
  it("não desconta nada no nível de entrada", () => {
    expect(levelDiscountCents(10000, 0)).toBe(0);
  });

  it("aplica o percentual do nível sobre o subtotal", () => {
    expect(levelDiscountCents(10000, 300)).toBe(300); // Broto, 3%
    expect(levelDiscountCents(10000, 3000)).toBe(700); // Árvore, 7%
    expect(levelDiscountCents(10000, 20000)).toBe(1200); // Guardião Circular, 12%
  });

  it("arredonda para baixo, para bater com o floor do banco", () => {
    expect(levelDiscountCents(333, 300)).toBe(9); // 9,99 centavos
  });

  it("nunca devolve desconto negativo", () => {
    expect(levelDiscountCents(0, 20000)).toBe(0);
    expect(levelDiscountCents(-500, 20000)).toBe(0);
  });

  it("nunca desconta mais que o subtotal", () => {
    for (const level of LEVELS) {
      expect(levelDiscountCents(10000, level.min)).toBeLessThan(10000);
    }
  });
});

describe("benefitsForPoints", () => {
  it("libera frete grátis e acesso antecipado no mesmo nível", () => {
    const entry = LEVELS[EARLY_ACCESS_MIN_LEVEL];
    expect(benefitsForPoints(entry.min).freeShipping).toBe(true);
    expect(benefitsForPoints(entry.min).earlyAccess).toBe(true);
    expect(benefitsForPoints(entry.min - 1).earlyAccess).toBe(false);
  });

  it("EARLY_ACCESS_MIN_LEVEL acompanha o default de partners.early_access_min_level", () => {
    expect(EARLY_ACCESS_MIN_LEVEL).toBe(3);
  });
});

describe("describeBenefits", () => {
  it("lista um item por benefício ativo", () => {
    expect(describeBenefits({ discountPercent: 7, freeShipping: true, earlyAccess: true })).toHaveLength(3);
    expect(describeBenefits({ discountPercent: 3, freeShipping: false, earlyAccess: false })).toEqual([
      "3% de desconto em todo pedido",
    ]);
  });
});
