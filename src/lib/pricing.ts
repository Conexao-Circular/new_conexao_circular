/**
 * Shared money/points parsing helpers.
 *
 * Prices are stored as integer cents everywhere in the app. Never trust a raw
 * `parseFloat` on user input — an empty or malformed value must resolve to a
 * safe `null` (reject) rather than `NaN` (which silently corrupts a price).
 */
export function parsePriceToCents(
  value: FormDataEntryValue | null | undefined,
): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

export function parsePoints(value: FormDataEntryValue | null | undefined): number {
  if (typeof value !== "string" || !value.trim()) return 0;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return Math.trunc(parsed);
}
