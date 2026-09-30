import Link from "next/link";
import { redirect } from "next/navigation";
import { Leaf, Plus, Recycle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CO2_ESTIMATE_LABEL, estimatedCo2AvoidedKg } from "@/lib/impact";
import { createClient } from "@/lib/supabase/server";
import { cancelCollectionRequest } from "./actions";

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
  return new Date(value).toLocaleDateString("pt-BR");
}

export default async function ColetasPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role === "cooperativa") {
    const { data: cooperative } = await supabase
      .from("cooperatives")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    const { data: requests } = cooperative
      ? await supabase
          .from("collection_requests")
          .select(
            "id, requester_id, waste_type, status, address, estimated_weight_kg, confirmed_weight_kg, preferred_date, requested_at",
          )
          .eq("cooperative_id", cooperative.id)
          .order("requested_at", { ascending: false })
      : { data: [] };

    const requesterIds = Array.from(new Set((requests ?? []).map((r) => r.requester_id)));
    const requesterNames = new Map<string, string>();

    if (requesterIds.length > 0) {
      const { data: requesters } = await supabase.rpc("get_profiles_basic", { p_ids: requesterIds });
      for (const requester of requesters ?? []) {
        requesterNames.set(requester.id, requester.name);
      }
    }

    const groups: { key: string; title: string; items: typeof requests }[] = [
      { key: "requested", title: "Pendentes", items: (requests ?? []).filter((r) => r.status === "requested") },
      { key: "confirmed", title: "Confirmadas", items: (requests ?? []).filter((r) => r.status === "confirmed") },
      { key: "canceled", title: "Canceladas", items: (requests ?? []).filter((r) => r.status === "canceled") },
    ];

    return (
      <div className="internal-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
        <header>
          <h1 className="font-heading text-2xl font-semibold text-cc-green">Coletas</h1>
          <p className="text-sm text-muted-foreground">Gerencie as solicitações atribuídas à sua cooperativa.</p>
        </header>

        {groups.map((group) => (
          <section key={group.key} className="space-y-3">
            <h2 className="font-heading text-lg font-semibold text-cc-green">
              {group.title} ({group.items?.length ?? 0})
            </h2>
            {group.items && group.items.length > 0 ? (
              <div className="space-y-3">
                {group.items.map((request) => (
                  <Link key={request.id} href={`/coletas/${request.id}`}>
                    <Card className="transition-colors hover:border-cc-orange">
                      <CardContent className="flex items-center justify-between gap-4 py-4">
                        <div>
                          <p className="font-medium text-cc-green">
                            {requesterNames.get(request.requester_id) ?? "Solicitante"}
                          </p>
                          <p className="text-sm text-muted-foreground">{WASTE_LABELS[request.waste_type]}</p>
                          <p className="text-sm text-muted-foreground">{request.address}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(request.requested_at)}</p>
                        </div>
                        <Badge variant={statusVariant(request.status)}>{STATUS_LABELS[request.status]}</Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma coleta nesta categoria.</p>
            )}
          </section>
        ))}
      </div>
    );
  }

  const { data: requests } = await supabase
    .from("collection_requests")
    .select(
      "id, waste_type, status, address, estimated_weight_kg, confirmed_weight_kg, preferred_date, requested_at",
    )
    .eq("requester_id", user.id)
    .order("requested_at", { ascending: false });

  if (profile.role === "produtor") {
    const confirmedKg = (requests ?? [])
      .filter((c) => c.status === "confirmed")
      .reduce((sum, c) => sum + (c.confirmed_weight_kg ?? 0), 0);
    const co2Avoided = estimatedCo2AvoidedKg(confirmedKg);
    const totalActive = (requests ?? []).filter((r) => r.status !== "canceled").length;

    return (
      <div className="internal-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
        <header>
          <h1 className="font-heading text-2xl font-semibold text-cc-green">Coleta de resíduos</h1>
          <p className="text-sm text-muted-foreground">Gestão de resíduos da sua empresa.</p>
        </header>

        {/* Hero CTA */}
        <div className="collection-hero relative overflow-hidden rounded-2xl px-6 py-8 text-white">
          <div className="relative z-10 flex flex-col gap-3">
            <Recycle className="h-8 w-8 opacity-75" />
            <div>
              <h2 className="font-heading text-xl font-semibold">Agende uma nova coleta</h2>
              <p className="mt-1 text-sm opacity-80">
                Escolha o tipo de resíduo, data e cooperativa parceira. Rápido e rastreável.
              </p>
            </div>
            <div className="pt-1">
              <Button asChild variant="secondary" size="sm">
                <Link href="/coletas/nova">Solicitar coleta</Link>
              </Button>
            </div>
          </div>
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/5" />
          <div className="absolute -bottom-3 right-10 h-16 w-16 rounded-full bg-white/5" />
        </div>

        {/* Stats */}
        <div className="collection-stats grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-background p-4 text-center">
            <p className="text-2xl font-semibold text-cc-green">{totalActive}</p>
            <p className="text-xs text-muted-foreground">Coletas solicitadas</p>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-background p-4 text-center">
            <p className="text-2xl font-semibold text-cc-green">{confirmedKg.toFixed(0)}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Recycle className="h-3 w-3" /> kg destinados
            </p>
          </div>
          <div
            title={CO2_ESTIMATE_LABEL}
            className="flex flex-col items-center gap-1 rounded-xl border border-border bg-background p-4 text-center"
          >
            <p className="text-2xl font-semibold text-cc-green">{co2Avoided.toFixed(0)}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Leaf className="h-3 w-3" /> kg CO₂ estimado
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{CO2_ESTIMATE_LABEL}</p>

        {/* History */}
        <section className="collection-history space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-cc-green">Histórico</h2>
            <Button asChild size="sm" variant="outline">
              <Link href="/coletas/nova">
                <Plus className="mr-1 h-4 w-4" />
                Nova coleta
              </Link>
            </Button>
          </div>

          {requests && requests.length > 0 ? (
            <div className="space-y-3">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base">{WASTE_LABELS[request.waste_type]}</CardTitle>
                    <Badge variant={statusVariant(request.status)}>{STATUS_LABELS[request.status]}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>{request.address}</p>
                    <p>Solicitada em {formatDate(request.requested_at)}</p>
                    {request.preferred_date ? <p>Data preferencial: {formatDate(request.preferred_date)}</p> : null}
                    {request.status === "confirmed" && request.confirmed_weight_kg ? (
                      <p className="font-medium text-cc-green">
                        Peso confirmado: {request.confirmed_weight_kg} kg
                      </p>
                    ) : request.estimated_weight_kg ? (
                      <p>Peso estimado: {request.estimated_weight_kg} kg</p>
                    ) : null}
                    <div className="flex items-center justify-between pt-2">
                      <Link href={`/coletas/${request.id}`} className="text-sm font-medium text-cc-orange">
                        Ver detalhes
                      </Link>
                      {request.status === "requested" ? (
                        <form action={cancelCollectionRequest}>
                          <input type="hidden" name="id" value={request.id} />
                          <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                            Cancelar
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <Recycle className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Nenhuma coleta solicitada ainda.</p>
                <p className="mb-4 text-xs text-muted-foreground">
                  Agende a primeira coleta da sua empresa.
                </p>
                <Button asChild>
                  <Link href="/coletas/nova">Solicitar coleta</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    );
  }

  // Consumidor view
  return (
    <div className="internal-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-cc-green">Minhas coletas</h1>
          <p className="text-sm text-muted-foreground">Acompanhe o status das suas solicitações.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/coletas/nova">
            <Plus className="mr-1 h-4 w-4" />
            Nova
          </Link>
        </Button>
      </header>

      {requests && requests.length > 0 ? (
        <div className="space-y-3">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">{WASTE_LABELS[request.waste_type]}</CardTitle>
                <Badge variant={statusVariant(request.status)}>{STATUS_LABELS[request.status]}</Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{request.address}</p>
                <p>Solicitada em {formatDate(request.requested_at)}</p>
                {request.preferred_date ? <p>Data preferencial: {formatDate(request.preferred_date)}</p> : null}
                {request.status === "confirmed" && request.confirmed_weight_kg ? (
                  <p>Peso confirmado: {request.confirmed_weight_kg} kg</p>
                ) : request.estimated_weight_kg ? (
                  <p>Peso estimado: {request.estimated_weight_kg} kg</p>
                ) : null}
                <div className="flex items-center justify-between pt-2">
                  <Link href={`/coletas/${request.id}`} className="text-sm font-medium text-cc-orange">
                    Ver detalhes
                  </Link>
                  {request.status === "requested" ? (
                    <form action={cancelCollectionRequest}>
                      <input type="hidden" name="id" value={request.id} />
                      <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                        Cancelar
                      </Button>
                    </form>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Você ainda não solicitou nenhuma coleta.
            <div className="mt-4">
              <Button asChild>
                <Link href="/coletas/nova">Solicitar coleta</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
