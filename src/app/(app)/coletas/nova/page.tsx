import Link from "next/link";
import { redirect } from "next/navigation";
import { FormError } from "@/components/auth-shell";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CepAddressFields } from "@/components/cep-address-fields";
import { CollectionPhotoInput } from "@/components/collection-photo-input";
import { WasteTypeFields } from "@/components/waste-type-fields";
import { createClient } from "@/lib/supabase/server";
import { TIME_WINDOW_OPTIONS } from "@/lib/address";
import { createCollectionRequest } from "./actions";

export default async function NovaColetaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name, phone")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "consumidor" && profile.role !== "produtor")) {
    redirect("/coletas");
  }

  const { data: cooperatives } = await supabase
    .from("cooperatives")
    .select("id, name, type")
    .eq("status", "active")
    .order("name");

  return (
    <div className="internal-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="font-heading text-2xl font-semibold text-cc-green">Solicitar coleta</h1>
        <p className="text-sm text-muted-foreground">
          Quanto mais completo, mais fácil para o parceiro coletor encontrar e executar a coleta sem imprevistos.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Dados da coleta</CardTitle>
        </CardHeader>
        <CardContent>
          <FormError message={error} />

          <form action={createCollectionRequest} className="space-y-6">
            <WasteTypeFields />

            <div className="space-y-4 border-t border-border pt-5">
              <h3 className="text-sm font-medium text-cc-green">Endereço de coleta</h3>
              <CepAddressFields />
            </div>

            <div className="space-y-4 border-t border-border pt-5">
              <h3 className="text-sm font-medium text-cc-green">Quantidade estimada</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="estimated_weight_kg">Peso estimado (kg)</Label>
                  <Input
                    id="estimated_weight_kg"
                    name="estimated_weight_kg"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Ex: 5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated_volumes">Nº de sacos/volumes</Label>
                  <Input id="estimated_volumes" name="estimated_volumes" type="number" step="1" min="0" placeholder="Ex: 3" />
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-border pt-5">
              <h3 className="text-sm font-medium text-cc-green">Quando</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="preferred_date">Data preferencial</Label>
                  <Input id="preferred_date" name="preferred_date" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferred_time_window">Janela de horário</Label>
                  <Select name="preferred_time_window" defaultValue="qualquer">
                    <SelectTrigger id="preferred_time_window" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_WINDOW_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-border pt-5">
              <h3 className="text-sm font-medium text-cc-green">Contato no local</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Quem vai receber</Label>
                  <Input id="contact_name" name="contact_name" defaultValue={profile.name ?? ""} placeholder="Nome" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Telefone de contato</Label>
                  <Input
                    id="contact_phone"
                    name="contact_phone"
                    type="tel"
                    defaultValue={profile.phone ?? ""}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="access_instructions">Instruções de acesso (opcional)</Label>
                <Textarea
                  id="access_instructions"
                  name="access_instructions"
                  rows={2}
                  placeholder="Ex: portão azul, interfone 12, deixar na portaria"
                />
              </div>
            </div>

            <div className="space-y-4 border-t border-border pt-5">
              <h3 className="text-sm font-medium text-cc-green">Cooperativa</h3>
              <div className="space-y-2">
                <Label htmlFor="cooperative_id">Cooperativa parceira</Label>
                <select
                  id="cooperative_id"
                  name="cooperative_id"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="">Selecionar automaticamente</option>
                  {(cooperatives ?? []).map((cooperative) => (
                    <option key={cooperative.id} value={cooperative.id}>
                      {cooperative.name}
                    </option>
                  ))}
                </select>
                {cooperatives && cooperatives.length > 0 ? (
                  <p className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    Conheça:
                    {cooperatives.map((cooperative, index) => (
                      <span key={cooperative.id}>
                        <Link
                          href={`/loja/cooperativas/${cooperative.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-cc-orange underline underline-offset-2"
                        >
                          {cooperative.name}
                        </Link>
                        {index < cooperatives.length - 1 ? "," : ""}
                      </span>
                    ))}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" name="notes" placeholder="Detalhes adicionais sobre a coleta" rows={3} />
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-5">
              <Label>Fotos do material (opcional)</Label>
              <CollectionPhotoInput userId={user.id} />
            </div>

            <SubmitButton className="w-full">Solicitar coleta</SubmitButton>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
