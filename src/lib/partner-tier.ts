/**
 * Critério do tier acima de "Parceiro Verificado".
 *
 * "Verificado" é curadoria humana: o admin aprovou a `producer_applications`
 * depois de ler documentos e descrição. Não diz nada sobre como o parceiro se
 * comporta depois de entrar. O tier acima é o oposto — não tem opinião, só
 * histórico: quanto vendeu de verdade, como foi avaliado e há quanto tempo está
 * ativo. Os três sinais existem no banco e são medidos por
 * `get_partner_tier_metrics()`.
 *
 * ---------------------------------------------------------------------------
 * NADA É CONCEDIDO AINDA, DE PROPÓSITO.
 *
 * Em 2026-09-08 a rede tinha 3 produtores, 1 pedido aprovado e 1 avaliação. Um
 * ranking sobre isso não separa bom de ruim — separa quem teve o único pedido.
 * Pior: vira um selo público que o comprador leria como garantia, apoiado em
 * uma amostra de tamanho 1.
 *
 * Por isso o critério vem com trava de ativação (TIER_ACTIVATION): enquanto a
 * rede não tiver parceiros e pedidos suficientes, `evaluatePartnerTier` devolve
 * `awarded: false` para todo mundo, com `blockedByNetwork: true`. O painel do
 * admin mostra o quanto falta. Quando a rede passar da trava, o selo começa a
 * aparecer sozinho — e aí é hora de revisar os números abaixo contra a
 * distribuição real, que hoje não existe para calibrar.
 * ---------------------------------------------------------------------------
 *
 * VALORES PROVISÓRIOS, como os de `src/lib/points.ts` e
 * `src/lib/gamification.ts`. Aqui o custo de errar é reputacional, não de
 * caixa: um selo fácil demais não significa nada, um difícil demais nunca sai.
 */

/** Nome público do tier. Só aparece depois da trava de ativação. */
export const TIER_NAME = "Parceiro Destaque";

/**
 * O que um parceiro precisa cumprir. Todos os requisitos valem juntos — o
 * critério é "e", não "ou": vender muito não compensa nota baixa.
 */
export const TIER_CRITERIA = {
  /** Pedidos com entrega confirmada (order_shipments.status = 'delivered'). */
  minDeliveredOrders: 20,
  /** Receita própria acumulada, em centavos. Filtra volume feito de venda mínima. */
  minGmvCents: 500_000,
  /** Avaliações recebidas. Separado da nota: média de 5,0 com 1 avaliação não é média. */
  minReviews: 10,
  /** Nota média mínima, de 1 a 5. */
  minAverageRating: 4.5,
  /** Dias desde a aprovação da curadoria. Tempo ativo é o terceiro sinal do sprint. */
  minActiveDays: 180,
} as const;

/**
 * Tamanho mínimo da rede para o critério significar alguma coisa.
 *
 * Não é sobre o parceiro: é sobre haver com quem comparar. Abaixo disto o selo
 * não é concedido a ninguém, por melhor que sejam os números individuais.
 */
export const TIER_ACTIVATION = {
  minVerifiedPartners: 15,
  minNetworkDeliveredOrders: 200,
} as const;

/** Números de um parceiro, como vêm de `get_partner_tier_metrics()`. */
export type PartnerTierMetrics = {
  deliveredOrders: number;
  gmvCents: number;
  reviewsCount: number;
  /** Null quando ainda não há avaliação — distinto de nota zero. */
  averageRating: number | null;
  activeDays: number;
};

/** Tamanho atual da rede, para a trava de ativação. */
export type NetworkSample = {
  verifiedPartners: number;
  deliveredOrders: number;
};

export type TierEvaluation = {
  /** O que o parceiro exibe hoje. */
  tier: "verificado" | "destaque";
  awarded: boolean;
  /** Requisitos individuais ainda não cumpridos, em texto. Vazio quando cumpre todos. */
  missing: string[];
  /** True quando a rede inteira ainda é pequena demais para o critério valer. */
  blockedByNetwork: boolean;
};

/** A rede já tem amostra para o tier fazer sentido? */
export function isTierActive(sample: NetworkSample): boolean {
  return (
    sample.verifiedPartners >= TIER_ACTIVATION.minVerifiedPartners &&
    sample.deliveredOrders >= TIER_ACTIVATION.minNetworkDeliveredOrders
  );
}

/** Quanto falta para a rede destravar o tier. Zero em cada eixo já atingido. */
export function networkGap(sample: NetworkSample): NetworkSample {
  return {
    verifiedPartners: Math.max(0, TIER_ACTIVATION.minVerifiedPartners - sample.verifiedPartners),
    deliveredOrders: Math.max(0, TIER_ACTIVATION.minNetworkDeliveredOrders - sample.deliveredOrders),
  };
}

function formatBrl(cents: number): string {
  return `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

/**
 * Requisitos que o parceiro ainda não cumpre. Avaliado sempre, mesmo com a rede
 * travada — é o que deixa o admin acompanhar quem está chegando perto.
 */
export function missingCriteria(metrics: PartnerTierMetrics): string[] {
  const missing: string[] = [];

  if (metrics.deliveredOrders < TIER_CRITERIA.minDeliveredOrders) {
    missing.push(`${metrics.deliveredOrders}/${TIER_CRITERIA.minDeliveredOrders} pedidos entregues`);
  }
  if (metrics.gmvCents < TIER_CRITERIA.minGmvCents) {
    missing.push(`${formatBrl(metrics.gmvCents)} de ${formatBrl(TIER_CRITERIA.minGmvCents)} vendidos`);
  }
  if (metrics.reviewsCount < TIER_CRITERIA.minReviews) {
    missing.push(`${metrics.reviewsCount}/${TIER_CRITERIA.minReviews} avaliações`);
  }
  if (metrics.averageRating === null || metrics.averageRating < TIER_CRITERIA.minAverageRating) {
    const current = metrics.averageRating === null ? "sem nota" : metrics.averageRating.toFixed(1);
    missing.push(`nota ${current} (mínimo ${TIER_CRITERIA.minAverageRating.toFixed(1)})`);
  }
  if (metrics.activeDays < TIER_CRITERIA.minActiveDays) {
    missing.push(`${metrics.activeDays}/${TIER_CRITERIA.minActiveDays} dias ativo`);
  }

  return missing;
}

/**
 * Decide o tier de um parceiro já verificado.
 *
 * A trava da rede vem antes de tudo: com amostra insuficiente ninguém recebe o
 * selo, mesmo cumprindo todos os requisitos individuais.
 */
export function evaluatePartnerTier(
  metrics: PartnerTierMetrics,
  sample: NetworkSample,
): TierEvaluation {
  const missing = missingCriteria(metrics);
  const blockedByNetwork = !isTierActive(sample);

  return {
    tier: !blockedByNetwork && missing.length === 0 ? "destaque" : "verificado",
    awarded: !blockedByNetwork && missing.length === 0,
    missing,
    blockedByNetwork,
  };
}

/** O critério em texto, para exibir sem repetir os números na UI. */
export function describeCriteria(): string[] {
  return [
    `${TIER_CRITERIA.minDeliveredOrders} pedidos entregues`,
    `${formatBrl(TIER_CRITERIA.minGmvCents)} em vendas`,
    `${TIER_CRITERIA.minReviews} avaliações com nota média ${TIER_CRITERIA.minAverageRating.toFixed(1)} ou mais`,
    `${TIER_CRITERIA.minActiveDays} dias desde a verificação`,
  ];
}
