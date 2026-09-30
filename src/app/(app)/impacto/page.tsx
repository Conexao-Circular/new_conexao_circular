import { redirect } from "next/navigation";
import { Leaf, Recycle, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CO2_ESTIMATE_LABEL, estimatedCo2AvoidedKg } from "@/lib/impact";
import { createClient } from "@/lib/supabase/server";

const WASTE_LABELS: Record<string, string> = {
  organic: "Orgânico",
  solid: "Seco",
  both: "Orgânico + Seco",
};

function StatCard({
  icon,
  title,
  value,
  unit,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  unit?: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        {icon}
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-cc-green">
          {value}
          {unit ? <span className="text-base font-normal text-muted-foreground"> {unit}</span> : null}
        </p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function WasteBreakdown({
  items,
}: {
  items: { waste_type: string; status: string; confirmed_weight_kg: number | null }[];
}) {
  const totals = items
    .filter((item) => item.status === "confirmed")
    .reduce<Record<string, number>>((acc, item) => {
      acc[item.waste_type] = (acc[item.waste_type] ?? 0) + (item.confirmed_weight_kg ?? 0);
      return acc;
    }, {});

  const entries = Object.entries(totals);

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma coleta confirmada ainda.</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map(([type, kg]) => (
        <div key={type} className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{WASTE_LABELS[type] ?? type}</span>
          <span className="font-medium text-cc-green">{kg.toFixed(1)} kg</span>
        </div>
      ))}
    </div>
  );
}

export default async function ImpactoPage() {
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

  if (profile.role === "consumidor" || profile.role === "produtor") {
    const { data: collections } = await supabase
      .from("collection_requests")
      .select("waste_type, status, confirmed_weight_kg")
      .eq("requester_id", user.id);

    const confirmed = (collections ?? []).filter((c) => c.status === "confirmed");
    const totalKg = confirmed.reduce((sum, c) => sum + (c.confirmed_weight_kg ?? 0), 0);
    const co2Avoided = estimatedCo2AvoidedKg(totalKg);

    return (
      <div className="internal-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
        <header>
          <h1 className="font-heading text-2xl font-semibold text-cc-green">Impacto</h1>
          <p className="text-sm text-muted-foreground">Seu impacto socioambiental na rede.</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            icon={<Recycle className="h-5 w-5 text-cc-green" />}
            title="Resíduos destinados"
            value={totalKg.toFixed(1)}
            unit="kg"
            description="total confirmado em coletas"
          />
          <StatCard
            icon={<Leaf className="h-5 w-5 text-cc-green" />}
            title="CO₂ evitado (estimativa)"
            value={co2Avoided.toFixed(1)}
            unit="kg"
            description={CO2_ESTIMATE_LABEL}
          />
          <StatCard
            icon={<Truck className="h-5 w-5 text-cc-green" />}
            title="Coletas confirmadas"
            value={String(confirmed.length)}
            description="coletas concluídas com sucesso"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Por tipo de resíduo</CardTitle>
          </CardHeader>
          <CardContent>
            <WasteBreakdown items={collections ?? []} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profile.role === "cooperativa") {
    const { data: cooperative } = await supabase
      .from("cooperatives")
      .select("id, name")
      .eq("profile_id", user.id)
      .maybeSingle();

    const { data: collections } = cooperative
      ? await supabase
          .from("collection_requests")
          .select("waste_type, status, confirmed_weight_kg")
          .eq("cooperative_id", cooperative.id)
      : { data: [] };

    const confirmed = (collections ?? []).filter((c) => c.status === "confirmed");
    const totalKg = confirmed.reduce((sum, c) => sum + (c.confirmed_weight_kg ?? 0), 0);
    const co2Avoided = estimatedCo2AvoidedKg(totalKg);

    return (
      <div className="internal-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
        <header>
          <h1 className="font-heading text-2xl font-semibold text-cc-green">Impacto</h1>
          <p className="text-sm text-muted-foreground">
            Impacto consolidado de {cooperative?.name ?? "sua cooperativa"}.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            icon={<Recycle className="h-5 w-5 text-cc-green" />}
            title="Resíduos processados"
            value={totalKg.toFixed(1)}
            unit="kg"
            description="total confirmado pela cooperativa"
          />
          <StatCard
            icon={<Leaf className="h-5 w-5 text-cc-green" />}
            title="CO₂ evitado (estimativa)"
            value={co2Avoided.toFixed(1)}
            unit="kg"
            description={CO2_ESTIMATE_LABEL}
          />
          <StatCard
            icon={<Truck className="h-5 w-5 text-cc-green" />}
            title="Coletas confirmadas"
            value={String(confirmed.length)}
            description="coletas concluídas com sucesso"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Por tipo de resíduo</CardTitle>
          </CardHeader>
          <CardContent>
            <WasteBreakdown items={collections ?? []} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: allCollections } = await supabase
    .from("collection_requests")
    .select("waste_type, status, confirmed_weight_kg");

  const confirmed = (allCollections ?? []).filter((c) => c.status === "confirmed");
  const totalKg = confirmed.reduce((sum, c) => sum + (c.confirmed_weight_kg ?? 0), 0);
  const co2Avoided = estimatedCo2AvoidedKg(totalKg);

  return (
    <div className="internal-page mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="font-heading text-2xl font-semibold text-cc-green">Impacto</h1>
        <p className="text-sm text-muted-foreground">Impacto consolidado da rede Conexão Circular.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={<Recycle className="h-5 w-5 text-cc-green" />}
          title="Resíduos destinados"
          value={totalKg.toFixed(1)}
          unit="kg"
          description="total confirmado na rede"
        />
        <StatCard
          icon={<Leaf className="h-5 w-5 text-cc-green" />}
          title="CO₂ evitado (estimativa)"
          value={co2Avoided.toFixed(1)}
          unit="kg"
          description={CO2_ESTIMATE_LABEL}
        />
        <StatCard
          icon={<Truck className="h-5 w-5 text-cc-green" />}
          title="Coletas confirmadas"
          value={String(confirmed.length)}
          description="coletas concluídas com sucesso"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Por tipo de resíduo</CardTitle>
        </CardHeader>
        <CardContent>
          <WasteBreakdown items={allCollections ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
