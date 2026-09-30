import { describe, expect, it } from "vitest";
import { CO2_ESTIMATE_LABEL, CO2_KG_PER_KG_COLLECTED, estimatedCo2AvoidedKg } from "./impact";

describe("estimatedCo2AvoidedKg", () => {
  it("aplica o fator sobre o peso confirmado", () => {
    expect(estimatedCo2AvoidedKg(100)).toBe(100 * CO2_KG_PER_KG_COLLECTED);
  });

  it("acompanha o fator em vez de assumir 0,5", () => {
    expect(estimatedCo2AvoidedKg(1)).toBe(CO2_KG_PER_KG_COLLECTED);
  });

  it("não inventa impacto onde não houve pesagem", () => {
    expect(estimatedCo2AvoidedKg(0)).toBe(0);
    expect(estimatedCo2AvoidedKg(-10)).toBe(0);
    expect(estimatedCo2AvoidedKg(Number.NaN)).toBe(0);
    expect(estimatedCo2AvoidedKg(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("CO2_ESTIMATE_LABEL", () => {
  it("diz que o número não é auditado — a tela nunca deve exibir o CO2 sem isso", () => {
    expect(CO2_ESTIMATE_LABEL.toLowerCase()).toContain("estimativa");
    expect(CO2_ESTIMATE_LABEL.toLowerCase()).toContain("não auditada");
  });
});
