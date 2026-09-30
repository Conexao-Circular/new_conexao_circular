/** Structured pickup-address helpers shared by the collection request form and its displays. */

export const TIME_WINDOW_OPTIONS = [
  { value: "manha", label: "Manhã (8h–12h)" },
  { value: "tarde", label: "Tarde (12h–18h)" },
  { value: "noite", label: "Noite (18h–21h)" },
  { value: "qualquer", label: "Qualquer horário" },
] as const;

const TIME_WINDOW_VALUES = new Set(TIME_WINDOW_OPTIONS.map((w) => w.value));

export const DRY_MATERIAL_OPTIONS = ["Papel/papelão", "Plástico", "Vidro", "Metal", "Eletrônico"];

export function timeWindowLabel(value: string | null): string | null {
  if (!value) return null;
  return TIME_WINDOW_OPTIONS.find((w) => w.value === value)?.label ?? value;
}

export function parseTimeWindow(value: FormDataEntryValue | null | undefined): string | null {
  if (typeof value !== "string" || !value.trim()) return "qualquer";
  return TIME_WINDOW_VALUES.has(value as (typeof TIME_WINDOW_OPTIONS)[number]["value"]) ? value : null;
}

export function parseVolumes(value: FormDataEntryValue | null | undefined): number | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}

export type StructuredAddress = {
  zip: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  reference: string | null;
};

/** Composes the legacy single-line `address` column from structured fields, so existing displays keep working. */
export function formatAddress(fields: StructuredAddress): string {
  const parts: string[] = [];

  const streetLine = [fields.street, fields.number].filter(Boolean).join(", ");
  if (streetLine) parts.push(streetLine);
  if (fields.complement) parts.push(fields.complement);
  if (fields.neighborhood) parts.push(fields.neighborhood);

  const cityState = [fields.city, fields.state].filter(Boolean).join(" - ");
  if (cityState) parts.push(cityState);
  if (fields.zip) parts.push(`CEP ${fields.zip}`);

  return parts.join(", ");
}
