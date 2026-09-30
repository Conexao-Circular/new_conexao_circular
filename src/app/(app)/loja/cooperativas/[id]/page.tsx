import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Leaf, MapPin, Package, Recycle, Scale, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CO2_ESTIMATE_LABEL, estimatedCo2AvoidedKg } from "@/lib/impact";
import { createClient } from "@/lib/supabase/server";
import { WASTE_LABELS } from "@/lib/labels";

function formatMonthYear(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function ImpactStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-background p-4 text-center">
      <span className="text-cc-green">{icon}</span>
      <p className="text-2xl font-semibold text-cc-green">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default async function CooperativaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (!profile || (profile.role !== "consumidor" && profile.role !== "produtor")) {
    redirect("/inicio");
  }

  const { data: cooperative } = await supabase
    .from("cooperatives")
    .select("id, name, type, status, service_area, collects_description, operation_description")
    .eq("id", id)
    .maybeSingle();

  if (!cooperative) {
    notFound();
  }

  // Agregado do que a operação realmente registra. A RLS de collection_requests
  // não deixa o consumidor ler as coletas de terceiros, então a soma vem de uma
  // RPC que devolve só contagens (migration 20260908150000).
  const { data: impactRows } = await supabase.rpc("get_cooperative_impact", {
    p_cooperative_id: cooperative.id,
  });
  const impact = impactRows?.[0] ?? null;
  const confirmedCollections = impact?.confirmed_collections ?? 0;
  const totalKg = impact?.total_kg ?? 0;
  const byWasteType = impact
    ? ([
        ["organic", impact.organic_kg],
        ["solid", impact.solid_kg],
        ["both", impact.mixed_kg],
      ] as const).filter(([, kg]) => kg > 0)
    : [];

  return (
    <div className="internal-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <div>
        <Link href="/coletas/nova" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar para solicitar coleta
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 font-heading text-xl text-cc-green">
            <Recycle className="h-5 w-5 text-cc-green" />
            {cooperative.name}
          </CardTitle>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="secondary">{WASTE_LABELS[cooperative.type] ?? cooperative.type}</Badge>
            {cooperative.status !== "active" ? <Badge variant="destructive">Inativa</Badge> : null}
          </div>
        </CardHeader>
        {cooperative.service_area ? (
          <CardContent className="flex items-center gap-1.5 text-sm text-foreground/80">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {cooperative.service_area}
          </CardContent>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Impacto desta cooperativa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {confirmedCollections === 0 ? (
            <p className="text-sm text-muted-foreground">
              Esta cooperativa ainda não tem coleta confirmada na plataforma. Os números aparecem aqui
              conforme as coletas forem concluídas e pesadas.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <ImpactStat
                  icon={<Package className="h-4 w-4" />}
                  value={String(confirmedCollections)}
                  label={confirmedCollections === 1 ? "coleta confirmada" : "coletas confirmadas"}
                />
                <ImpactStat
                  icon={<Scale className="h-4 w-4" />}
                  value={`${totalKg.toFixed(1)} kg`}
                  label="pesados na confirmação"
                />
                <ImpactStat
                  icon={<Users className="h-4 w-4" />}
                  value={String(impact?.producers_served ?? 0)}
                  label={(impact?.producers_served ?? 0) === 1 ? "gerador atendido" : "geradores atendidos"}
                />
                <ImpactStat
                  icon={<Leaf className="h-4 w-4" />}
                  value={`${estimatedCo2AvoidedKg(totalKg).toFixed(1)} kg`}
                  label="CO₂ estimado"
                />
              </div>

              {byWasteType.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-cc-green">Por tipo de resíduo</p>
                  {byWasteType.map(([type, kg]) => (
                    <div key={type} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{WASTE_LABELS[type] ?? type}</span>
                      <span className="font-medium text-cc-green">{kg.toFixed(1)} kg</span>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="space-y-1 text-xs text-muted-foreground">
                {impact?.first_collection_at ? (
                  <p>Atendendo a rede desde {formatMonthYear(impact.first_collection_at)}.</p>
                ) : null}
                {(impact?.unweighed_collections ?? 0) > 0 ? (
                  <p>
                    {impact?.unweighed_collections} destas coletas foram confirmadas sem pesagem, então o peso
                    acima cobre só parte delas.
                  </p>
                ) : null}
                <p>{CO2_ESTIMATE_LABEL}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {cooperative.collects_description || cooperative.operation_description ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Como funciona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {cooperative.collects_description ? (
              <div>
                <p className="font-medium text-cc-green">O que coletamos</p>
                <p className="whitespace-pre-line text-foreground/80">{cooperative.collects_description}</p>
              </div>
            ) : null}
            {cooperative.operation_description ? (
              <div>
                <p className="font-medium text-cc-green">Passo a passo</p>
                <p className="whitespace-pre-line text-foreground/80">{cooperative.operation_description}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Esta cooperativa ainda não descreveu sua operação.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
