/**
 * Clube de Benefícios — níveis derivados de `profiles.lifetime_points`.
 *
 * `lifetime_points` é acumulado e nunca estornado (ver migration
 * 20260904120100): é métrica de nível, não saldo gastável. Quem chega a um
 * nível não cai dele porque resgatou pontos.
 *
 * VALORES PROVISÓRIOS, pelo mesmo motivo de `src/lib/points.ts`: os limiares e
 * os benefícios foram escolhidos por julgamento, sem margem observada para
 * calibrar contra. Cada benefício aqui é passivo real da plataforma — desconto
 * e frete saem do caixa. Refaça junto com POINT_VALUES na calibração.
 *
 * A duplicata em SQL vive em `public.level_index()`,
 * `public.level_discount_percent()` e `public.level_has_early_access()`
 * (migration 20260908120000). As duas cópias mudam juntas: o desconto é
 * aplicado dentro das RPCs de pedido e o acesso antecipado dentro da RLS, e a
 * UI lê daqui para exibir o que cada nível dá.
 */

export type LevelBenefits = {
  /** Desconto automático sobre o subtotal dos produtos, em pontos percentuais. */
  discountPercent: number;
  /** Frete por conta da plataforma. */
  freeShipping: boolean;
  /** Enxerga parceiros novos durante a janela de exclusividade deles. */
  earlyAccess: boolean;
};

/** Levels derived from lifetime points earned. */
export type Level = {
  index: number;
  name: string;
  min: number;
  benefits: LevelBenefits;
};

export const LEVELS: Level[] = [
  { index: 0, name: "Semente", min: 0, benefits: { discountPercent: 0, freeShipping: false, earlyAccess: false } },
  { index: 1, name: "Broto", min: 300, benefits: { discountPercent: 3, freeShipping: false, earlyAccess: false } },
  { index: 2, name: "Muda", min: 1000, benefits: { discountPercent: 5, freeShipping: false, earlyAccess: false } },
  { index: 3, name: "Árvore", min: 3000, benefits: { discountPercent: 7, freeShipping: true, earlyAccess: true } },
  { index: 4, name: "Floresta", min: 8000, benefits: { discountPercent: 10, freeShipping: true, earlyAccess: true } },
  {
    index: 5,
    name: "Guardião Circular",
    min: 20000,
    benefits: { discountPercent: 12, freeShipping: true, earlyAccess: true },
  },
];

/**
 * Primeiro nível com acesso antecipado. É o default de
 * `partners.early_access_min_level`, e o número precisa bater com o da coluna.
 */
export const EARLY_ACCESS_MIN_LEVEL = LEVELS.find((level) => level.benefits.earlyAccess)!.index;

export type LevelProgress = {
  current: Level;
  next: Level | null;
  /** 0..1 progress within the current level toward the next. */
  progress: number;
  pointsIntoLevel: number;
  pointsForNext: number | null;
};

export function computeLevel(lifetimePoints: number): LevelProgress {
  const points = Math.max(0, lifetimePoints);
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (points >= level.min) current = level;
  }
  const next = LEVELS[current.index + 1] ?? null;

  if (!next) {
    return { current, next: null, progress: 1, pointsIntoLevel: points - current.min, pointsForNext: null };
  }

  const span = next.min - current.min;
  const into = points - current.min;
  return {
    current,
    next,
    progress: Math.min(1, into / span),
    pointsIntoLevel: into,
    pointsForNext: next.min - points,
  };
}

/** Benefícios já desbloqueados por quem tem esse acumulado. */
export function benefitsForPoints(lifetimePoints: number): LevelBenefits {
  return computeLevel(lifetimePoints).current.benefits;
}

/**
 * Desconto de nível sobre o subtotal dos produtos, em centavos.
 *
 * Arredonda para baixo — o mesmo `floor` de `public.level_discount_cents()`,
 * para o valor exibido no checkout bater com o cobrado. O frete fica de fora:
 * ele tem benefício próprio e é repassado à transportadora.
 */
export function levelDiscountCents(subtotalCents: number, lifetimePoints: number): number {
  if (subtotalCents <= 0) return 0;
  const percent = benefitsForPoints(lifetimePoints).discountPercent;
  return Math.floor((subtotalCents * percent) / 100);
}

/** Benefícios de um nível em texto, para listar na UI. Vazio no nível de entrada. */
export function describeBenefits(benefits: LevelBenefits): string[] {
  const lines: string[] = [];
  if (benefits.discountPercent > 0) lines.push(`${benefits.discountPercent}% de desconto em todo pedido`);
  if (benefits.freeShipping) lines.push("Frete grátis na loja");
  if (benefits.earlyAccess) lines.push("Acesso antecipado a novos parceiros");
  return lines;
}
