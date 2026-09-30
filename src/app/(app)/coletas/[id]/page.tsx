import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MapPin, Navigation, Phone } from "lucide-react";
import { FormError } from "@/components/auth-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import { timeWindowLabel } from "@/lib/address";
import { cancelCollection, confirmCollection } from "./actions";

const STATUS_LABELS: Record<string, string> = {
  requested: "Solicitada",
  confirmed: "Confirmada",
  canceled: "Cancelada",
};

const WASTE_LABELS: Record<string, string> = {
  organic: "Orgânico",
  solid: "Seco",
  both: "Orgânico + Seco",
};

function statusVariant(status: string): "default" | "secondary" | "destructive" {
  if (status === "confirmed") return "default";
  if (status === "canceled") return "destructive";
  return "secondary";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export default async function ColetaDetailPage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const { data: request } = await supabase
    .from("collection_requests")
    .select(
      "id, requester_id, cooperative_id, waste_type, status, address, address_number, address_complement, address_neighborhood, address_reference, estimated_weight_kg, confirmed_weight_kg, estimated_volumes, preferred_date, preferred_time_window, contact_name, contact_phone, access_instructions, dry_materials, notes, execution_notes, proof_image_url, requested_at, confirmed_at, canceled_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!request) {
    notFound();
  }

  let cooperativeProfileId: string | null = null;
  let cooperativeName: string | null = null;
  let cooperativePhone: string | null = null;

  if (request.cooperative_id) {
    const { data: cooperative } = await supabase
      .from("cooperatives")
      .select("name, profile_id, contact_phone")
      .eq("id", request.cooperative_id)
      .maybeSingle();

    cooperativeName = cooperative?.name ?? null;
    cooperativeProfileId = cooperative?.profile_id ?? null;
    cooperativePhone = cooperative?.contact_phone ?? null;
  }

  const isRequester = request.requester_id === user.id;
  const isAssignedCooperative = profile.role === "cooperativa" && cooperativeProfileId === user.id;
  const isAdmin = profile.role === "admin";

  if (!isRequester && !isAssignedCooperative && !isAdmin) {
    notFound();
  }

  let requesterName: string | null = null;
  let requesterPhone: string | null = null;

  if (!isRequester) {
    const { data: requesterData } = await supabase.rpc("get_profile_basic", { p_id: request.requester_id });
    if (requesterData && requesterData.length > 0) {
      requesterName = requesterData[0].name;
      requesterPhone = requesterData[0].phone;
    }
  }

  let proofUrl: string | null = null;

  if (request.proof_image_url) {
    const { data: signed } = await supabase.storage
      .from("collection-proofs")
      .createSignedUrl(request.proof_image_url, 60 * 60);
    proofUrl = signed?.signedUrl ?? null;
  }

  const { data: requestPhotoRows } = await supabase
    .from("collection_request_photos")
    .select("id, url")
    .eq("request_id", id)
    .order("sort_order", { ascending: true });

  const requestPhotos: { id: string; signedUrl: string }[] = [];
  for (const photo of requestPhotoRows ?? []) {
    const { data: signed } = await supabase.storage.from("collection-proofs").createSignedUrl(photo.url, 60 * 60);
    if (signed?.signedUrl) requestPhotos.push({ id: photo.id, signedUrl: signed.signedUrl });
  }

  const contactPhone = request.contact_phone;
  const displayPhone = contactPhone ?? requesterPhone;
  const mapsQuery = encodeURIComponent(request.address);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  return (
    <div className="internal-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div>
        <Link href="/coletas" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar para coletas
        </Link>
      </div>

      <FormError message={error} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Coleta de {WASTE_LABELS[request.waste_type]}</CardTitle>
          <Badge variant={statusVariant(request.status)}>{STATUS_LABELS[request.status]}</Badge>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {requesterName ? (
            <div>
              <p className="text-muted-foreground">Quem vai receber</p>
              <p className="font-medium text-cc-green">{request.contact_name ?? requesterName}</p>
              {request.contact_name && request.contact_name !== requesterName ? (
                <p className="text-xs text-muted-foreground">Solicitante: {requesterName}</p>
              ) : null}
            </div>
          ) : null}

          {(displayPhone || cooperativeName) && !isRequester ? (
            <div className="flex flex-wrap items-center gap-2">
              {displayPhone ? (
                <Button asChild size="sm" variant="outline">
                  <a href={`tel:${digitsOnly(displayPhone)}`}>
                    <Phone className="h-3.5 w-3.5" />
                    Ligar {displayPhone}
                  </a>
                </Button>
              ) : null}
              <Button asChild size="sm" variant="outline">
                <a href={mapsUrl} target="_blank" rel="noreferrer">
                  <Navigation className="h-3.5 w-3.5" />
                  Abrir no Maps
                </a>
              </Button>
            </div>
          ) : null}

          <div>
            <p className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> Endereço
            </p>
            <p className="font-medium text-cc-green">{request.address}</p>
            {request.address_reference ? (
              <p className="text-xs text-muted-foreground">Referência: {request.address_reference}</p>
            ) : null}
          </div>

          {request.access_instructions ? (
            <div className="rounded-lg border border-cc-sand/40 bg-cc-cream/40 p-3">
              <p className="text-xs font-medium text-cc-green">Instruções de acesso</p>
              <p className="text-sm text-foreground/80">{request.access_instructions}</p>
            </div>
          ) : null}

          {cooperativeName ? (
            <div>
              <p className="text-muted-foreground">Cooperativa</p>
              <p className="font-medium text-cc-green">{cooperativeName}</p>
              {isRequester && cooperativePhone ? (
                <a href={`tel:${digitsOnly(cooperativePhone)}`} className="text-xs text-cc-orange">
                  {cooperativePhone}
                </a>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Aguardando atribuição de cooperativa.</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-muted-foreground">Peso estimado</p>
              <p className="font-medium text-cc-green">
                {request.estimated_weight_kg ? `${request.estimated_weight_kg} kg` : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Peso confirmado</p>
              <p className="font-medium text-cc-green">
                {request.confirmed_weight_kg ? `${request.confirmed_weight_kg} kg` : "—"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-muted-foreground">Volumes/sacos</p>
              <p className="font-medium text-cc-green">{request.estimated_volumes ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Janela de horário</p>
              <p className="font-medium text-cc-green">{timeWindowLabel(request.preferred_time_window) ?? "—"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-muted-foreground">Data preferencial</p>
              <p className="font-medium text-cc-green">{formatDate(request.preferred_date)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Solicitada em</p>
              <p className="font-medium text-cc-green">{formatDate(request.requested_at)}</p>
            </div>
          </div>

          {request.dry_materials && request.dry_materials.length > 0 ? (
            <div>
              <p className="mb-1 text-muted-foreground">Materiais secos</p>
              <div className="flex flex-wrap gap-1.5">
                {request.dry_materials.map((material) => (
                  <Badge key={material} variant="outline">
                    {material}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          {request.notes ? (
            <div>
              <p className="text-muted-foreground">Observações</p>
              <p className="font-medium text-cc-green">{request.notes}</p>
            </div>
          ) : null}

          {requestPhotos.length > 0 ? (
            <div>
              <p className="mb-2 text-muted-foreground">Fotos enviadas pelo solicitante</p>
              <div className="flex flex-wrap gap-2">
                {requestPhotos.map((photo) => (
                  <div key={photo.id} className="relative h-24 w-24 overflow-hidden rounded-xl border border-border">
                    <Image src={photo.signedUrl} alt="Foto do material" fill className="object-cover" sizes="96px" unoptimized />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {request.execution_notes ? (
            <div>
              <p className="text-muted-foreground">Observações da execução</p>
              <p className="font-medium text-cc-green">{request.execution_notes}</p>
            </div>
          ) : null}

          {proofUrl ? (
            <div>
              <p className="mb-2 text-muted-foreground">Comprovante da coleta</p>
              <div className="relative h-48 w-full overflow-hidden rounded-xl border border-border">
                <Image src={proofUrl} alt="Comprovante da coleta" fill className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {isRequester && request.status === "requested" ? (
        <form action={cancelCollection}>
          <input type="hidden" name="id" value={request.id} />
          <Button type="submit" variant="outline" className="w-full text-destructive">
            Cancelar coleta
          </Button>
        </form>
      ) : null}

      {isAssignedCooperative && request.status === "requested" ? (
        <Card>
          <CardHeader>
            <CardTitle>Confirmar coleta</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={confirmCollection} className="space-y-4">
              <input type="hidden" name="id" value={request.id} />
              <div className="space-y-2">
                <Label htmlFor="confirmed_weight_kg">Peso confirmado (kg)</Label>
                <Input
                  id="confirmed_weight_kg"
                  name="confirmed_weight_kg"
                  type="number"
                  step="0.1"
                  min="0"
                  required
                  defaultValue={request.estimated_weight_kg ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="execution_notes">Observações da execução (opcional)</Label>
                <Textarea
                  id="execution_notes"
                  name="execution_notes"
                  rows={2}
                  placeholder="Ex: coleta parcial, sem acesso à área de gás, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo">Foto comprobatória</Label>
                <Input id="photo" name="photo" type="file" accept="image/*" />
              </div>
              <Button type="submit" className="w-full">
                Confirmar coleta
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
