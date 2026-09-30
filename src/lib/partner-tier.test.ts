import { describe, expect, it } from "vitest";
import {
  TIER_ACTIVATION,
  TIER_CRITERIA,
  describeCriteria,
  evaluatePartnerTier,
  isTierActive,
  missingCriteria,
  networkGap,
  type NetworkSample,
  type PartnerTierMetrics,
} from "./partner-tier";

/** Parceiro que cumpre folgadamente todos os requisitos individuais. */
const exemplar: PartnerTierMetrics = {
  deliveredOrders: TIER_CRITERIA.minDeliveredOrders + 5,
  gmvCents: TIER_CRITERIA.minGmvCents + 100_000,
  reviewsCount: TIER_CRITERIA.minReviews + 3,
  averageRating: 4.9,
  activeDays: TIER_CRITERIA.minActiveDays + 30,
};

/** Rede grande o bastante para o critério valer. */
const redeMadura: NetworkSample = {
  verifiedPartners: TIER_ACTIVATION.minVerifiedPartners,
  deliveredOrders: TIER_ACTIVATION.minNetworkDeliveredOrders,
};

/** A rede real em 2026-09-08, quando o critério foi escrito. */
const redeHoje: NetworkSample = { verifiedPartners: 0, deliveredOrders: 1 };

describe("isTierActive", () => {
  it("exige os dois eixos, não um dos dois", () => {
    expect(isTierActive(redeMadura)).toBe(true);
    expect(isTierActive({ ...redeMadura, verifiedPartners: 0 })).toBe(false);
    expect(isTierActive({ ...redeMadura, deliveredOrders: 0 })).toBe(false);
  });

  it("está desligado para a rede de hoje", () => {
    expect(isTierActive(redeHoje)).toBe(false);
  });
});

describe("networkGap", () => {
  it("diz quanto falta em cada eixo", () => {
    expect(networkGap({ verifiedPartners: 5, deliveredOrders: 50 })).toEqual({
      verifiedPartners: TIER_ACTIVATION.minVerifiedPartners - 5,
      deliveredOrders: TIER_ACTIVATION.minNetworkDeliveredOrders - 50,
    });
  });

  it("nunca devolve falta negativa depois que a rede passa do mínimo", () => {
    expect(networkGap({ verifiedPartners: 999, deliveredOrders: 9999 })).toEqual({
      verifiedPartners: 0,
      deliveredOrders: 0,
    });
  });
});

describe("missingCriteria", () => {
  it("não aponta nada para quem cumpre tudo", () => {
    expect(missingCriteria(exemplar)).toEqual([]);
  });

  it("trata ausência de nota como requisito não cumprido, não como nota zero", () => {
    const missing = missingCriteria({ ...exemplar, reviewsCount: 0, averageRating: null });
    expect(missing.some((line) => line.includes("sem nota"))).toBe(true);
  });

  it("cobra o requisito exatamente no limiar", () => {
    const noLimiar: PartnerTierMetrics = {
      deliveredOrders: TIER_CRITERIA.minDeliveredOrders,
      gmvCents: TIER_CRITERIA.minGmvCents,
      reviewsCount: TIER_CRITERIA.minReviews,
      averageRating: TIER_CRITERIA.minAverageRating,
      activeDays: TIER_CRITERIA.minActiveDays,
    };
    expect(missingCriteria(noLimiar)).toEqual([]);
    expect(missingCriteria({ ...noLimiar, deliveredOrders: noLimiar.deliveredOrders - 1 })).toHaveLength(1);
  });

  it("lista um item por requisito faltante", () => {
    const zerado: PartnerTierMetrics = {
      deliveredOrders: 0,
      gmvCents: 0,
      reviewsCount: 0,
      averageRating: null,
      activeDays: 0,
    };
    expect(missingCriteria(zerado)).toHaveLength(5);
  });
});

describe("evaluatePartnerTier", () => {
  it("concede o tier a quem cumpre tudo, com a rede madura", () => {
    const result = evaluatePartnerTier(exemplar, redeMadura);
    expect(result.awarded).toBe(true);
    expect(result.tier).toBe("destaque");
    expect(result.blockedByNetwork).toBe(false);
  });

  it("não concede nada na rede de hoje, mesmo cumprindo todos os requisitos", () => {
    const result = evaluatePartnerTier(exemplar, redeHoje);
    expect(result.awarded).toBe(false);
    expect(result.tier).toBe("verificado");
    expect(result.blockedByNetwork).toBe(true);
    // O admin precisa enxergar que o bloqueio é da rede, não do parceiro.
    expect(result.missing).toEqual([]);
  });

  it("segue avaliando os requisitos individuais com a rede travada", () => {
    const result = evaluatePartnerTier({ ...exemplar, averageRating: 3 }, redeHoje);
    expect(result.missing).toHaveLength(1);
    expect(result.blockedByNetwork).toBe(true);
  });

  it("mantém em Verificado quem falha num requisito só", () => {
    const result = evaluatePartnerTier({ ...exemplar, activeDays: 10 }, redeMadura);
    expect(result.awarded).toBe(false);
    expect(result.tier).toBe("verificado");
  });
});

describe("TIER_CRITERIA", () => {
  it("mantém a nota mínima dentro da escala de 1 a 5 das avaliações", () => {
    expect(TIER_CRITERIA.minAverageRating).toBeGreaterThan(1);
    expect(TIER_CRITERIA.minAverageRating).toBeLessThanOrEqual(5);
  });

  it("exige avaliações suficientes para a média significar algo", () => {
    expect(TIER_CRITERIA.minReviews).toBeGreaterThanOrEqual(5);
  });

  it("descreve todos os eixos do critério", () => {
    expect(describeCriteria()).toHaveLength(4);
  });
});
