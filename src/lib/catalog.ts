/**
 * Parsing helpers for the richer product catalog fields (stock, unit,
 * material/origin, tags, category). Same philosophy as pricing.ts: no
 * zod/react-hook-form in this project, so every field gets an explicit
 * parser that fails safe (null/empty) instead of silently corrupting data.
 */

export const UNIT_OPTIONS = [
  { value: "un", label: "Unidade" },
  { value: "kg", label: "Quilograma (kg)" },
  { value: "g", label: "Grama (g)" },
  { value: "l", label: "Litro (l)" },
  { value: "ml", label: "Mililitro (ml)" },
  { value: "m", label: "Metro (m)" },
  { value: "cm", label: "Centímetro (cm)" },
  { value: "par", label: "Par" },
  { value: "dz", label: "Dúzia" },
  { value: "pacote", label: "Pacote" },
] as const;

const UNIT_VALUES = new Set(UNIT_OPTIONS.map((u) => u.value));

export const MATERIAL_ORIGIN_OPTIONS = [
  "Material reciclado",
  "Matéria-prima orgânica/natural",
  "Reaproveitamento de resíduo de coleta",
  "Madeira certificada/reflorestamento",
  "Tecido reaproveitado",
];

const MAX_TAGS = 8;
const MAX_TAG_LENGTH = 24;
const MAX_MATERIAL_ORIGIN = 6;
const MAX_MATERIAL_ORIGIN_LENGTH = 60;

/** Required, non-negative integer. Returns null (reject) on any bad input. */
export function parseStock(value: FormDataEntryValue | null | undefined): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}

/** Optional unit, defaults to "un" for empty input; null means invalid value was submitted. */
export function parseUnit(value: FormDataEntryValue | null | undefined): string | null {
  if (typeof value !== "string" || !value.trim()) return "un";
  return UNIT_VALUES.has(value as (typeof UNIT_OPTIONS)[number]["value"]) ? value : null;
}

/** Optional non-negative integer (weight in grams). Empty → null; invalid → undefined (reject). */
export function parseWeightGrams(value: FormDataEntryValue | null | undefined): number | null | undefined {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.round(parsed);
}

/** Optional non-negative dimension in cm. Empty → null; invalid → undefined (reject). */
export function parseDimension(value: FormDataEntryValue | null | undefined): number | null | undefined {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

/** Comma-separated free text -> normalized, deduped, capped tag list. */
export function parseTags(value: FormDataEntryValue | null | undefined): string[] {
  if (typeof value !== "string" || !value.trim()) return [];
  const seen = new Set<string>();
  for (const raw of value.split(",")) {
    const tag = raw.trim().toLowerCase().slice(0, MAX_TAG_LENGTH);
    if (tag) seen.add(tag);
    if (seen.size >= MAX_TAGS) break;
  }
  return Array.from(seen);
}

/** Checkbox values (known options) + one optional free-text "other" entry. */
export function parseMaterialOrigin(formData: FormData): string[] {
  const checked = formData
    .getAll("material_origin")
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0);

  const other = formData.get("material_origin_other");
  const values = [...checked];
  if (typeof other === "string" && other.trim()) {
    values.push(other.trim());
  }

  const seen = new Set<string>();
  for (const value of values) {
    const clean = value.trim().slice(0, MAX_MATERIAL_ORIGIN_LENGTH);
    if (clean) seen.add(clean);
    if (seen.size >= MAX_MATERIAL_ORIGIN) break;
  }
  return Array.from(seen);
}

/**
 * Category is a closed list in the UI (<Select>) with an "Outros" option that
 * reveals a free-text companion field. Resolves to the free text when
 * "Outros" is chosen, otherwise the selected value. Null means required
 * category is missing.
 */
export function resolveCategory(
  formData: FormData,
  options: readonly string[],
): string | null {
  const category = formData.get("category");
  if (typeof category !== "string" || !category.trim()) return null;

  if (category === "Outros") {
    const other = formData.get("category_other");
    if (typeof other !== "string" || !other.trim()) return null;
    return other.trim().slice(0, 60);
  }

  return options.includes(category) ? category : null;
}
