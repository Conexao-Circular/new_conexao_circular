/**
 * Ponto único de verdade dos valores de pontuação.
 *
 * VALORES PROVISÓRIOS. Foram escolhidos por julgamento, não calibrados: o banco
 * não guarda custo nem margem de produto hoje, então não há dado real para
 * calibrar contra. Antes de abrir o resgate de verdade (hoje `partner_items`
 * está vazio, então nada é resgatável), esses números precisam ser refeitos
 * contra margem observada — é a razão de estarem todos aqui, num lugar só.
 *
 * A duplicata em SQL vive em `public.point_value()` (migration
 * 20260904120100). As duas precisam mudar juntas: a concessão acontece em
 * trigger no banco, e a UI lê daqui para exibir quanto vale cada ação.
 */

/** Ações que concedem pontos além da compra em si e da coleta, que já existiam. */
export const POINT_VALUES = {
  /** Preencher telefone e CEP, que são opcionais no cadastro. Uma vez por conta. */
  signup_complete: 50,
  /** Bônus na primeira compra aprovada, somado aos pontos dos produtos. Uma vez por conta. */
  first_purchase: 100,
  /** Avaliar um pedido entregue. Uma vez por pedido. */
  order_review: 25,
} as const;

export type PointAction = keyof typeof POINT_VALUES;

/**
 * Teto de pontos que um produto pode conceder, em pontos por real.
 *
 * O produtor define `points_value` livremente no cadastro do produto, e quem
 * paga o resgate é a plataforma — sem teto, o parceiro decide sozinho o passivo.
 * 1 pt/R$ é conservador e nenhum dos produtos atuais chega perto (a maior razão
 * hoje é 0,71 pt/R$). Reveja junto com POINT_VALUES na calibração.
 */
export const MAX_POINTS_PER_BRL = 1;

/** Máximo de pontos que um produto desse preço pode conceder por unidade. */
export function maxPointsForPrice(priceCents: number): number {
  return Math.floor((priceCents / 100) * MAX_POINTS_PER_BRL);
}
