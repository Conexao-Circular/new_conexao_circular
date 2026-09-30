import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type PublicBusiness = {
  id: string;
  name: string;
  type: string;
  neighborhood: string;
  city: string;
  icon: string;
  practice: string;
  address: string;
  href: string;
  lat: number | null;
  lng: number | null;
  isApprovedProfile: boolean;
  kind: "producer" | "service_provider" | "partner";
  kindLabel: string;
  searchTerms: string;
};

const CATEGORY_RULES = [
  { label: "Alimentação", terms: ["alimento", "bebida", "culinaria", "restaurante", "padaria", "bistro", "geleia"] },
  { label: "Moda, arte e artesanato", terms: ["moda", "acessorio", "arte", "design", "decoracao", "artesan", "atelie"] },
  { label: "Saúde e bem-estar", terms: ["saude", "bem-estar", "beleza", "estetica", "yoga", "massagem", "terapia"] },
  { label: "Cultura e eventos", terms: ["cultura", "educacao", "evento", "entretenimento", "festival"] },
  { label: "Turismo e hospedagem", terms: ["turismo", "hospedagem", "hotel", "pousada"] },
  { label: "Reciclagem e sustentabilidade", terms: ["recicla", "compost", "residuo", "sustent", "socioambiental", "agroecologia", "coleta"] },
  { label: "Serviços profissionais", terms: ["consultoria", "servico", "engenharia", "imobiliaria", "transporte"] },
] as const;

function normalizeForSearch(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function mapCategory(rawCategory: string, description: string, isServiceProvider: boolean) {
  const primaryCategory = normalizeForSearch(rawCategory.split(/[|,]/)[0]);
  const normalizedRawCategory = normalizeForSearch(rawCategory);
  const normalizedDescription = normalizeForSearch(description);
  const findMatchingCategory = (value: string) =>
    CATEGORY_RULES.find((rule) => rule.terms.some((term) => value.includes(term)))?.label;

  return (
    findMatchingCategory(primaryCategory) ??
    findMatchingCategory(normalizedRawCategory) ??
    findMatchingCategory(normalizedDescription) ??
    (isServiceProvider ? "Serviços profissionais" : "Produtos locais")
  );
}

function summarizePractice(value: string | null) {
  const firstAnswer = String(value ?? "Iniciativa ativa na rede Conexão Circular.")
    .split(/\s+—\s+/)[0]
    .replace(/\s+/g, " ")
    .trim();
  if (firstAnswer.length <= 220) return firstAnswer;
  const excerpt = firstAnswer.slice(0, 217);
  const lastSpace = excerpt.lastIndexOf(" ");
  return `${excerpt.slice(0, lastSpace > 160 ? lastSpace : 217)}…`;
}

async function geocode(address: string) {
  if (!address.trim()) return { lat: null, lng: null };
  try {
    const params = new URLSearchParams({
      q: `${address}, Niterói, RJ, Brasil`,
      format: "jsonv2",
      limit: "1",
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { "user-agent": "ConexaoCircular/1.0 (mapa publico)" },
      next: { revalidate: 86400 },
    });
    if (!response.ok) return { lat: null, lng: null };
    const [result] = (await response.json()) as Array<{ lat?: string; lon?: string }>;
    const lat = Number(result?.lat);
    const lng = Number(result?.lon);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : { lat: null, lng: null };
  } catch {
    return { lat: null, lng: null };
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data: partners } = await supabase
    .from("partners")
    .select(
      "id, name, category, participant_kind, imported_category, address, city, state, description, seal, latitude, longitude, map_opt_in",
    )
    .eq("status", "active")
    .eq("map_opt_in", true)
    .order("name");

  const businesses: PublicBusiness[] = [];
  for (const partner of partners ?? []) {
    const latitude = partner.latitude == null ? Number.NaN : Number(partner.latitude);
    const longitude = partner.longitude == null ? Number.NaN : Number(partner.longitude);
    const hasStoredCoordinates =
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      Math.abs(latitude) <= 90 &&
      Math.abs(longitude) <= 180 &&
      !(latitude === 0 && longitude === 0);
    const geolocation = hasStoredCoordinates
      ? { lat: latitude, lng: longitude }
      : await geocode(partner.address);
    if (!Number.isFinite(geolocation.lat) || !Number.isFinite(geolocation.lng)) continue;

    const isServiceProvider = partner.participant_kind === "service_provider";
    const kind: PublicBusiness["kind"] =
      partner.participant_kind === "producer"
        ? "producer"
        : partner.participant_kind === "service_provider"
          ? "service_provider"
          : "partner";
    const kindLabel =
      kind === "producer"
        ? "Produtor"
        : kind === "service_provider"
          ? "Prestador de serviço"
          : "Parceiro circular";
    const rawCategory = partner.imported_category || partner.category || "";
    businesses.push({
      id: `partner-${partner.id}`,
      name: partner.name,
      type: mapCategory(rawCategory, partner.description ?? "", isServiceProvider),
      neighborhood: partner.city || partner.state || "Localização no mapa",
      city: partner.city || partner.state || "Território conectado",
      icon: partner.seal ? "♻️" : isServiceProvider ? "🛠️" : "🌿",
      practice: summarizePractice(partner.description),
      address: partner.address,
      href: `/loja/parceiros/${partner.id}`,
      ...geolocation,
      isApprovedProfile: true,
      kind,
      kindLabel,
      searchTerms: `${rawCategory} ${partner.address} ${partner.city ?? ""} ${partner.state ?? ""}`,
    });
  }

  return NextResponse.json({
    businesses,
    source: "supabase",
    generatedAt: new Date().toISOString(),
  });
}
