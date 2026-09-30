import Image from "next/image";
import { Package, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UNIT_OPTIONS } from "@/lib/catalog";

export type ProductPreviewData = {
  name: string;
  category: string;
  description: string;
  materials: string[];
  productionTechnique: string;
  tags: string[];
  priceLabel: string;
  pointsValue: string;
  stock: string;
  unit: string;
  coverUrl: string | null;
};

function formatPricePreview(raw: string) {
  const value = Number(raw.replace(",", "."));
  if (!raw.trim() || Number.isNaN(value)) return "R$ --";
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

function stringsFrom(formData: FormData, key: string): string[] {
  return formData.getAll(key).filter((v): v is string => typeof v === "string" && v.trim().length > 0);
}

/** Builds a preview snapshot from the wizard's live FormData — mirrors the parsing rules in src/lib/catalog.ts without needing to hit the server. */
export function readProductPreview(formData: FormData): ProductPreviewData {
  const category = String(formData.get("category") ?? "");
  const categoryOther = String(formData.get("category_other") ?? "").trim();
  const materialOtherRaw = String(formData.get("material_origin_other") ?? "").trim();

  return {
    name: String(formData.get("name") ?? "").trim(),
    category: category === "Outros" && categoryOther ? categoryOther : category,
    description: String(formData.get("description") ?? "").trim(),
    materials: [...stringsFrom(formData, "material_origin"), ...(materialOtherRaw ? [materialOtherRaw] : [])],
    productionTechnique: String(formData.get("production_technique") ?? "").trim(),
    tags: String(formData.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    priceLabel: formatPricePreview(String(formData.get("price") ?? "")),
    pointsValue: String(formData.get("points_value") ?? ""),
    stock: String(formData.get("stock") ?? ""),
    unit: String(formData.get("unit") ?? "un"),
    coverUrl: stringsFrom(formData, "photo_urls")[0] ?? null,
  };
}

export const EMPTY_PRODUCT_PREVIEW: ProductPreviewData = {
  name: "",
  category: "",
  description: "",
  materials: [],
  productionTechnique: "",
  tags: [],
  priceLabel: "R$ --",
  pointsValue: "",
  stock: "",
  unit: "un",
  coverUrl: null,
};

export function ProductPreviewCard({ data }: { data: ProductPreviewData }) {
  const unitLabel = UNIT_OPTIONS.find((u) => u.value === data.unit)?.label ?? data.unit;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        É assim que seu anúncio vai aparecer para os consumidores depois de aprovado.
      </p>

      <Card className="overflow-hidden">
        <div className="relative flex h-32 w-full items-center justify-center overflow-hidden bg-cc-cream/50">
          {data.coverUrl ? (
            <Image
              src={data.coverUrl}
              alt={data.name || "Produto"}
              fill
              className="object-cover"
              sizes="400px"
              unoptimized
            />
          ) : (
            <Package className="h-10 w-10 text-cc-sand" />
          )}
        </div>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>{data.name || "Nome do produto"}</CardTitle>
            {data.category ? <Badge variant="secondary">{data.category}</Badge> : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {data.description ? <p className="line-clamp-2 text-foreground/80">{data.description}</p> : null}
          <div className="flex items-center justify-between pt-1">
            <span className="font-semibold text-cc-green">
              {data.priceLabel}
              <span className="ml-1 text-xs font-normal text-muted-foreground">/ {unitLabel.toLowerCase()}</span>
            </span>
            {Number(data.pointsValue) > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-cc-orange">
                <Sparkles className="h-3.5 w-3.5" />+{data.pointsValue} pts
              </span>
            ) : null}
          </div>
          {data.stock ? (
            <p className="text-xs text-muted-foreground">
              Estoque inicial: {data.stock} {unitLabel.toLowerCase()}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {data.materials.length > 0 || data.productionTechnique || data.tags.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">De onde vem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.materials.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {data.materials.map((material) => (
                  <Badge key={material} variant="outline">
                    {material}
                  </Badge>
                ))}
              </div>
            ) : null}
            {data.productionTechnique ? <p className="text-foreground/80">{data.productionTechnique}</p> : null}
            {data.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {data.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    #{tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
