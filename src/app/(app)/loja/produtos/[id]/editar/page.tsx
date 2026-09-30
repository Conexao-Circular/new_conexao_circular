import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FormError, FormNotice } from "@/components/auth-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductPhotoInput } from "@/components/product-photo-input";
import { ExistingProductPhotos } from "@/components/existing-product-photos";
import { MaterialOriginFields } from "@/components/material-origin-fields";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/server";
import { UNIT_OPTIONS } from "@/lib/catalog";
import { MAX_POINTS_PER_BRL, maxPointsForPrice } from "@/lib/points";
import { updateProduct } from "../../actions";
import { PRODUCT_CATEGORY_SUGGESTIONS } from "../../category-suggestions";
import { listingStatus } from "../../status";

const MAX_PHOTOS = 5;

export default async function EditarAnuncioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (!profile || profile.role !== "produtor") {
    redirect("/inicio");
  }

  const { data: product } = await supabase
    .from("products")
    .select(
      "id, name, description, category, price_cents, points_value, status, approved, partner_id, stock, unit, material_origin, production_technique, sustainability_note, tags, weight_grams, length_cm, width_cm, height_cm",
    )
    .eq("id", id)
    .maybeSingle();

  if (!product || product.partner_id !== user.id) {
    notFound();
  }

  const { data: images } = await supabase
    .from("product_images")
    .select("id, url")
    .eq("product_id", id)
    .order("sort_order", { ascending: true });

  const existingPhotos = images ?? [];
  const isKnownCategory = PRODUCT_CATEGORY_SUGGESTIONS.includes(product.category ?? "");

  const status = listingStatus(product);
  const wasRejected = !product.approved && product.status === "inactive";

  return (
    <div className="internal-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div>
        <Link href="/loja/produtos" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar para meus anúncios
        </Link>
      </div>

      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-cc-green">Editar anúncio</h1>
          <p className="text-sm text-muted-foreground">Atualize os dados do produto.</p>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </header>

      {wasRejected ? (
        <FormNotice message="Este anúncio foi recusado. Salvar as alterações já reenvia o anúncio para análise." />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Dados do produto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormError message={error} />

          <form action={updateProduct} className="space-y-5">
            <input type="hidden" name="id" value={product.id} />

            <div className="space-y-2">
              <Label htmlFor="name">Nome do produto</Label>
              <Input id="name" name="name" required defaultValue={product.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select name="category" defaultValue={isKnownCategory ? (product.category ?? undefined) : "Outros"}>
                <SelectTrigger id="category" className="w-full">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORY_SUGGESTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isKnownCategory ? (
                <Input name="category_other" placeholder="Qual categoria?" defaultValue={product.category ?? ""} required />
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" name="description" rows={4} defaultValue={product.description ?? ""} />
            </div>

            <MaterialOriginFields selected={product.material_origin} />

            <div className="space-y-2">
              <Label htmlFor="production_technique">Técnica ou processo de produção</Label>
              <Textarea
                id="production_technique"
                name="production_technique"
                rows={3}
                defaultValue={product.production_technique ?? ""}
                placeholder="Ex: Costurado à mão a partir de sobras de tecido de confecção."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sustainability_note">Por que esse produto é sustentável?</Label>
              <Textarea
                id="sustainability_note"
                name="sustainability_note"
                rows={3}
                defaultValue={product.sustainability_note ?? ""}
                placeholder="Específico, não genérico. Ex: cada bolsa reaproveita ~1,2kg de retalho que iria pro lixo têxtil."
              />
              <p className="text-xs text-muted-foreground">Aparece pro comprador na página do produto.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input id="tags" name="tags" defaultValue={product.tags.join(", ")} placeholder="Ex: reciclado, feito à mão" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={(product.price_cents / 100).toFixed(2)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="points_value">Pontos por unidade</Label>
                <Input
                  id="points_value"
                  name="points_value"
                  type="number"
                  step="1"
                  min="0"
                  max={maxPointsForPrice(product.price_cents)}
                  defaultValue={product.points_value}
                />
                <p className="text-xs text-cc-green/60">
                  Até {maxPointsForPrice(product.price_cents)} para este preço (limite de{" "}
                  {MAX_POINTS_PER_BRL} ponto por real).
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="stock">Estoque disponível</Label>
                <Input id="stock" name="stock" type="number" step="1" min="0" required defaultValue={product.stock} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade de medida</Label>
                <Select name="unit" defaultValue={product.unit}>
                  <SelectTrigger id="unit" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-sm font-medium text-cc-green">Dados para envio (frete)</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="weight_grams">Peso (g)</Label>
                  <Input
                    id="weight_grams"
                    name="weight_grams"
                    type="number"
                    step="1"
                    min="0"
                    defaultValue={product.weight_grams ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="length_cm">Comprimento (cm)</Label>
                  <Input
                    id="length_cm"
                    name="length_cm"
                    type="number"
                    step="0.1"
                    min="0"
                    defaultValue={product.length_cm ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="width_cm">Largura (cm)</Label>
                  <Input id="width_cm" name="width_cm" type="number" step="0.1" min="0" defaultValue={product.width_cm ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height_cm">Altura (cm)</Label>
                  <Input
                    id="height_cm"
                    name="height_cm"
                    type="number"
                    step="0.1"
                    min="0"
                    defaultValue={product.height_cm ?? ""}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Adicionar fotos (opcional)</Label>
              <ProductPhotoInput userId={user.id} maxFiles={Math.max(MAX_PHOTOS - existingPhotos.length, 0)} />
            </div>

            <SubmitButton className="w-full">Salvar alterações</SubmitButton>
          </form>

          {existingPhotos.length > 0 ? (
            <div className="space-y-2 border-t border-border pt-5">
              <Label>Fotos salvas</Label>
              <ExistingProductPhotos productId={product.id} photos={existingPhotos} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
