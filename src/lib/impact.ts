/**
 * Números de impacto ambiental exibidos no app.
 *
 * Havia um `0.5` solto em três telas (`/impacto`, `/coletas`, `/inicio`), sem
 * fonte e sem rótulo, somando um "CO₂ evitado" que a interface apresentava com
 * a mesma autoridade do peso realmente pesado na coleta. Este arquivo separa as
 * duas coisas: o que é medido fica no banco, o que é estimado passa por aqui e
 * chega à tela com aviso.
 *
 * ---------------------------------------------------------------------------
 * O FATOR NÃO É AUDITADO.
 *
 * 0,5 kg de CO₂ por kg coletado é um número redondo escolhido por julgamento,
 * não derivado de metodologia. Duas limitações que ele esconde:
 *
 *   * o mesmo fator vale para orgânico e para seco, que na literatura têm
 *     ordens de grandeza diferentes — compostagem de orgânico evita metano,
 *     reciclagem de seco evita produção de material virgem;
 *   * não há verificação por terceiro, então o número não serve para relatório
 *     de ESG nem para comunicação que afirme compensação.
 *
 * Por isso toda tela que mostra o valor mostra também CO2_ESTIMATE_LABEL. Ao
 * adotar uma metodologia de verdade, troque este arquivo por fatores separados
 * por `waste_type` e atribua a fonte — não retire o rótulo antes disso.
 * ---------------------------------------------------------------------------
 */

/** kg de CO₂ evitado por kg de resíduo desviado do aterro. Provisório. */
export const CO2_KG_PER_KG_COLLECTED = 0.5;

/** Rótulo obrigatório em qualquer tela que exiba o CO₂ estimado. */
export const CO2_ESTIMATE_LABEL = "Estimativa não auditada, com fator único por kg coletado.";

/**
 * CO₂ evitado, estimado a partir do peso realmente confirmado nas coletas.
 *
 * Só o peso é dado medido; o resultado é estimativa e deve ser exibido como
 * tal. Peso ausente ou negativo vira zero — coleta sem pesagem não gera número.
 */
export function estimatedCo2AvoidedKg(collectedKg: number): number {
  if (!Number.isFinite(collectedKg) || collectedKg <= 0) return 0;
  return collectedKg * CO2_KG_PER_KG_COLLECTED;
}
